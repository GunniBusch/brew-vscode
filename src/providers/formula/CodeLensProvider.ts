import * as vscode from "vscode";

export class CodeLensProvider implements vscode.CodeLensProvider {
	private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
	readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

	constructor() {
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

		const lenses: vscode.CodeLens[] = [];
		const text = document.getText();

		// Regex definitions
		const formulaRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s*<\s*Formula/g;
		const installRegex = /def\s+install\b/g;
		const testRegex = /(?:test\s+do|def\s+test)\b/g;

		let match;

		// Check for Formula - Add Audit
		if (config.get<boolean>("audit.enabled", true)) {
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
		}

		// Check for install definition
		if (config.get<boolean>("install.enabled", true)) {
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
		}

		// Check for test definition
		if (config.get<boolean>("test.enabled", true)) {
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
		}

		return lenses;
	}
}
