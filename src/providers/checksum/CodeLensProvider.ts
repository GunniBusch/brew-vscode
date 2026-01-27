import * as vscode from "vscode";
import {
	ChecksumCache,
	onDidChangeChecksumCache,
} from "../../commands/checksum";

export class CodeLensProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
	readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

	constructor() {
		// Refresh specific lenses when cache updates
		onDidChangeChecksumCache.event(() => {
			this._onDidChangeCodeLenses.fire();
		});

		// Also refresh when config changes
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("homebrew.codeLens")) {
				this._onDidChangeCodeLenses.fire();
			}
		});
	}

	provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		const config = vscode.workspace.getConfiguration("homebrew.codeLens");
		if (!config.get<boolean>("enabled", true)) {
			return [];
		}
		if (!config.get<boolean>("updateChecksum.enabled", true)) {
			return [];
		}

		const lenses: vscode.CodeLens[] = [];
		const text = document.getText();
		const lines = text.split("\n");

		// Regex definitions
		const shaRegex = /sha256\s+['"]([a-fA-F0-9]{64})['"]/g;

		// Track URLs that have an associated SHA to avoid double-adding or missing ones
		const urlsWithSha = new Set<string>();

		let match;
		while ((match = shaRegex.exec(text)) !== null) {
			const shaIndex = match.index;
			const currentSha = match[1];
			const shaPos = document.positionAt(shaIndex);
			const shaLineIdx = shaPos.line;

			// Find associated URL by searching backwards
			let associatedUrl: string | undefined;
			// Look up to 10 lines back
			for (let i = shaLineIdx; i >= Math.max(0, shaLineIdx - 10); i--) {
				const lineText = lines[i];
				const urlMatch = lineText.match(/url\s+['"]([^'"]+)['"]/);
				if (urlMatch) {
					associatedUrl = urlMatch[1];
					urlsWithSha.add(associatedUrl);
					break;
				}
			}

			if (associatedUrl) {
				const cachedSha = ChecksumCache.get(associatedUrl);
				if (cachedSha && cachedSha !== currentSha) {
					// Mismatch found! Show Update Lens
					// FIX: Range must start at match.index + offset to the actual hash string
					const matchFullLength = match[0].length;
					const matchShaStart = match[0].indexOf(currentSha);
					const matchShaEnd = matchShaStart + currentSha.length;

					// Create range covering ONLY the hash string
					const range = new vscode.Range(
						document.positionAt(match.index + matchShaStart),
						document.positionAt(match.index + matchShaEnd),
					);

					lenses.push(
						new vscode.CodeLens(range, {
							title: "$(sync) Update Checksum",
							command: "homebrew.updateChecksum",
							arguments: [range, associatedUrl, false],
							tooltip: `New SHA available: ${cachedSha.substring(0, 7)}...`,
						}),
					);
				}
			}
		}

		// Check for URLs that MISS a checksum
		const urlRegex = /url\s+['"]([^'"]+)['"]/g;
		while ((match = urlRegex.exec(text)) !== null) {
			const url = match[1];
			if (!urlsWithSha.has(url)) {
				// This URL has no SHA block (detected so far).
				// Check if we have it in cache
				const cachedSha = ChecksumCache.get(url);
				if (cachedSha) {
					const range = new vscode.Range(
						document.positionAt(match.index),
						document.positionAt(match.index + match[0].length),
					);
					lenses.push(
						new vscode.CodeLens(range, {
							title: "$(plus) Add Checksum",
							command: "homebrew.updateChecksum",
							arguments: [range, url, true], // true = insert mode
							tooltip: `Add SHA: ${cachedSha.substring(0, 7)}...`,
						}),
					);
				}
			}
		}

		return lenses;
	}
}
