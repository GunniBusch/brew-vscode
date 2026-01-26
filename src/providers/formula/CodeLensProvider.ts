import * as vscode from "vscode";

export class CodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		const lenses: vscode.CodeLens[] = [];
		const text = document.getText();

		// Regex definitions
		const formulaRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s*<\s*Formula/g;
		const installRegex = /def\s+install\b/g;
		const testRegex = /(?:test\s+do|def\s+test)\b/g;

		let match;

		// Check for Formula - Add Audit
		while ((match = formulaRegex.exec(text)) !== null) {
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

		// Check for install definition
		while ((match = installRegex.exec(text)) !== null) {
			const range = new vscode.Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length),
			);
			lenses.push(
				new vscode.CodeLens(range, {
					title: "$(package) Install",
					command: "homebrew.installSource",
					tooltip: "Install building from source",
				}),
			);
		}

		// Check for test definition
		while ((match = testRegex.exec(text)) !== null) {
			const range = new vscode.Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length),
			);
			lenses.push(
				new vscode.CodeLens(range, {
					title: "$(beaker) Test",
					command: "homebrew.test",
					tooltip: "Run brew test",
				}),
			);
		}

		return lenses;
	}
}
