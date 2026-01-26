import * as vscode from "vscode";

export class CodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		const lenses: vscode.CodeLens[] = [];
		const text = document.getText();

		// Regex definitions
		const caskRegex = /cask\s+['"]([^'"]+)['"]\s+do/g;

		let match;

		// Check for Cask - Add Audit
		while ((match = caskRegex.exec(text)) !== null) {
			const range = new vscode.Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length),
			);
			lenses.push(
				new vscode.CodeLens(range, {
					title: "$(check) Audit",
					command: "homebrew.audit",
					tooltip: "Run brew audit",
				}),
			);
		}

		return lenses;
	}
}
