import * as crypto from "node:crypto";
import * as https from "node:https";
import * as vscode from "vscode";

// Cache structure: Map<URL, { sha: string, timestamp: number }>
// We can set a TTL if we want, but for now just persisting for the session is fine.
const checksumCache = new Map<string, { sha: string; timestamp: number }>();

// Event emitter to notify CodeLens provider when cache alters
export const onDidChangeChecksumCache = new vscode.EventEmitter<void>();

export class ChecksumCache {
	static get(url: string): string | undefined {
		return checksumCache.get(url)?.sha;
	}

	static set(url: string, sha: string) {
		checksumCache.set(url, { sha, timestamp: Date.now() });
		onDidChangeChecksumCache.fire();
	}

	static has(url: string): boolean {
		return checksumCache.has(url);
	}
}

/**
 * Scans the active document for URLs and verifies their checksums against the declared SHA256.
 * Populates the cache.
 */
export async function checkChecksums(silent: boolean = false): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	// Only run on Ruby strings/Homebrew files
	if (
		editor.document.languageId !== "ruby" &&
		!editor.document.fileName.endsWith(".rb")
	) {
		return;
	}

	const text = editor.document.getText();
	const lines = text.split("\n");
	const updates: Promise<void>[] = [];

	await vscode.window.withProgress(
		{
			location: silent
				? vscode.ProgressLocation.Window
				: vscode.ProgressLocation.Notification,
			title: "Checking Homebrew checksums...",
			cancellable: true,
		},
		async (progress, token) => {
			// Naive parsing: find all url "..." lines
			// In a real parser we'd map URL to SHA block, but here we just want to fetch all URLs found to populate cache.
			const urlRegex = /url\s+['"]([^'"]+)['"]/g;
			let match;
			while ((match = urlRegex.exec(text)) !== null) {
				const url = match[1];
				// Trigger background fetch for each URL found
				if (!ChecksumCache.has(url)) {
					updates.push(
						calculateSha256(url, token)
							.then((sha) => ChecksumCache.set(url, sha))
							.catch((err) => console.error(`Failed to fetch ${url}: ${err}`)),
					);
				}
			}

			if (updates.length > 0) {
				await Promise.all(updates);
				if (!silent) {
					vscode.window.setStatusBarMessage(
						`Checked ${updates.length} URLs`,
						3000,
					);
				}
			} else {
				if (!silent) {
					vscode.window.setStatusBarMessage("All URLs already cached", 3000);
				}
			}
		},
	);
}

/**
 * Updates the SHA256 checksum for a brew formula/cask.
 *
 * @param shaRange - The range of the SHA256 string to replace (excluding quotes if possible, or including them).
 *                   If not provided, we try to find one near the cursor.
 * @param url - The URL to download. If not provided, we try to find one near the cursor.
 */
export async function updateChecksum(
	shaRange?: vscode.Range,
	url?: string,
): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor found.");
		return;
	}

	const document = editor.document;
	let targetUrl = url;
	let targetRange = shaRange;

	// If no arguments, try to deduce from cursor position
	if (!targetUrl || !targetRange) {
		const selection = editor.selection;
		const lineIndex = selection.active.line;
		const text = document.getText();
		const lines = text.split("\n");

		// Simple heuristic: Search backwards from current line for 'url', search current line or nearby for 'sha256'
		// This is a basic fallback for menu invocation.
		// For now, let's rely on CodeLens passing arguments or basic same-block detection.
		// If triggered via command palette without args, we might need manual input or smart detection.

		if (!targetRange) {
			const lineText = lines[lineIndex];
			const shaMatch = lineText.match(/sha256\s+['"]([a-fA-F0-9]{64})['"]/);
			if (shaMatch) {
				const start = lineText.indexOf(shaMatch[1]);
				targetRange = new vscode.Range(lineIndex, start, lineIndex, start + 64);
			}
		}

		if (targetRange && !targetUrl) {
			// Search backwards for url
			for (let i = targetRange.start.line; i >= 0; i--) {
				const lineText = lines[i];
				// Match url "..." or inside resource
				const urlMatch = lineText.match(/url\s+['"]([^'"]+)['"]/);
				if (urlMatch) {
					targetUrl = urlMatch[1];
					break;
				}
			}
		}
	}

	if (!targetUrl) {
		vscode.window.showErrorMessage(
			"Could not find a URL to fetch. Please ensure you are inside a Formula or Resource block.",
		);
		return;
	}

	if (!targetRange) {
		vscode.window.showErrorMessage(
			"Could not find a sha256 field to update. Please ensure your cursor is on a line with sha256.",
		);
		return;
	}

	// CHECK CACHE FIRST
	const cachedSha = ChecksumCache.get(targetUrl!);
	if (cachedSha) {
		await editor.edit((editBuilder) => {
			editBuilder.replace(targetRange!, cachedSha);
		});
		vscode.window.setStatusBarMessage("SHA256 updated from cache", 3000);
		return;
	}

	// Fallback to fetch
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Downloading & Calculating SHA256...`,
			cancellable: true,
		},
		async (progress, token) => {
			try {
				const sha = await calculateSha256(targetUrl!, token);
				if (sha) {
					ChecksumCache.set(targetUrl!, sha);
					const finalSha = sha; // Check needed for TS narrowing if logic changes
					await editor.edit((editBuilder) => {
						editBuilder.replace(targetRange!, finalSha);
					});
					vscode.window.setStatusBarMessage(
						"SHA256 updated successfully",
						3000,
					);
				}
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Failed to update checksum: ${error.message}`,
				);
			}
		},
	);
}

export function calculateSha256(
	url: string,
	token?: vscode.CancellationToken,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash("sha256");
		const req = https.get(url, (res) => {
			if (res.statusCode !== 200) {
				reject(new Error(`Request failed with status code ${res.statusCode}`));
				res.resume(); // Consume response data to free up memory
				return;
			}

			res.on("data", (chunk) => {
				if (token?.isCancellationRequested) {
					req.destroy();
					reject(new Error("Cancelled"));
					return;
				}
				hash.update(chunk);
			});

			res.on("end", () => {
				resolve(hash.digest("hex"));
			});

			res.on("error", (err) => {
				reject(err);
			});
		});

		req.on("error", (err) => {
			reject(err);
		});
	});
}
