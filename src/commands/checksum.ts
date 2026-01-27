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
export async function checkChecksums(
	silent: boolean = false,
	diagnosticCollection?: vscode.DiagnosticCollection,
): Promise<void> {
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

	const document = editor.document;
	const text = document.getText();
	const lines = text.split("\n");
	const updates: Promise<void>[] = [];
	const diagnostics: vscode.Diagnostic[] = [];

	// Clear previous diagnostics for this file if collection is provided
	if (diagnosticCollection) {
		diagnosticCollection.delete(document.uri);
	}

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
				const urlIndex = match.index;
				const urlLine = document.positionAt(urlIndex).line;

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

			// Post-check: Iterate again to find mismatches and add diagnostics
			// We need to re-scan or use the cache state now that everything is fetched.
			// Rewind regex or re-create
			const shaRegex = /sha256\s+['"]([^'"]*)['"]/g;
			let shaMatch;
			while ((shaMatch = shaRegex.exec(text)) !== null) {
				const currentSha = shaMatch[1];
				const shaIndex = shaMatch.index;
				const shaPos = document.positionAt(shaIndex);
				const shaLineIdx = shaPos.line;

				// Find associated URL
				let associatedUrl: string | undefined;
				for (let i = shaLineIdx; i >= Math.max(0, shaLineIdx - 10); i--) {
					const lineText = lines[i];
					const urlMatch = lineText.match(/url\s+['"]([^'"]+)['"]/);
					if (urlMatch) {
						associatedUrl = urlMatch[1];
						break;
					}
				}

				if (associatedUrl) {
					const cachedSha = ChecksumCache.get(associatedUrl);
					if (cachedSha && cachedSha !== currentSha) {
						// Mismatch! Add diagnostic
						const start = shaMatch[0].indexOf(currentSha);
						// Accessing match[0] directly validation
						const matchStr = shaMatch[0];
						const quoteMatch = matchStr.match(/['"]/);
						if (quoteMatch && quoteMatch.index !== undefined) {
							const matchShaStart = quoteMatch.index + 1;
							const matchShaEnd = matchShaStart + currentSha.length;
							const range = new vscode.Range(
								document.positionAt(shaMatch.index + matchShaStart),
								document.positionAt(shaMatch.index + matchShaEnd),
							);

							const diagnostic = new vscode.Diagnostic(
								range,
								"Checksum mismatch!",
								vscode.DiagnosticSeverity.Warning,
							);
							diagnostic.source = "Homebrew Helper";
							diagnostic.code = "homebrew-checksum-mismatch";
							diagnostics.push(diagnostic);
						}
					}
				}
			}

			if (diagnosticCollection) {
				diagnosticCollection.set(document.uri, diagnostics);
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
	insertMode: boolean = false,
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
	if (!targetUrl || (!targetRange && !insertMode)) {
		const selection = editor.selection;
		const lineIndex = selection.active.line;
		const text = document.getText();
		const lines = text.split("\n");

		// Simple heuristic: Search backwards from current line for 'url', search current line or nearby for 'sha256'

		if (!targetRange && !insertMode) {
			const lineText = lines[lineIndex];
			const shaMatch = lineText.match(/sha256\s+['"]([^'"]*)['"]/);
			if (shaMatch) {
				const start = lineText.indexOf(shaMatch[1]);
				targetRange = new vscode.Range(
					lineIndex,
					start,
					lineIndex,
					start + shaMatch[1].length,
				);
			}
		}

		if ((targetRange || insertMode) && !targetUrl) {
			// Search backwards for url
			const startLine = targetRange ? targetRange.start.line : lineIndex;
			for (let i = startLine; i >= 0; i--) {
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

	if (!targetRange && !insertMode) {
		vscode.window.showErrorMessage("Could not find sha256 to update.");
		return;
	}

	// CHECK CACHE FIRST
	const cachedSha = ChecksumCache.get(targetUrl!);
	const applySha = async (sha: string) => {
		if (insertMode) {
			// Insert mode: targetRange is likely the URL range (or passed as such). We want to insert after it.
			// If we passed the URL range as shaRange in insert mode, use it.
			let insertLine = 0;
			if (targetRange) {
				insertLine = targetRange.end.line;
			} else {
				// Try to find url line
				// This fallback might be weak, but CodeLens passes the range.
			}

			if (targetRange) {
				const line = document.lineAt(targetRange.end.line);
				const currentIndent = line.text.match(/^\s*/)?.[0] || "";
				// Insert on next line
				await editor.edit((editBuilder) => {
					editBuilder.insert(
						new vscode.Position(targetRange!.end.line + 1, 0),
						`${currentIndent}sha256 "${sha}"\n`,
					);
				});
				vscode.window.setStatusBarMessage("SHA256 inserted", 3000);
			}
		} else {
			// Replace mode
			await editor.edit((editBuilder) => {
				editBuilder.replace(targetRange!, sha);
			});
			vscode.window.setStatusBarMessage("SHA256 updated", 3000);
		}
	};

	if (cachedSha) {
		await applySha(cachedSha);
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
					await applySha(sha);
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
