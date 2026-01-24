import * as vscode from "vscode";
import { getCurrentFormulaName } from "../utils/brewUtils";

export class BrewCodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(
		document: vscode.TextDocument,
		token: vscode.CancellationToken,
	): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		const lenses: vscode.CodeLens[] = [];
		const text = document.getText();

		// Regex to find class definition: class Name < Formula
		// or Cask definition: cask "name" do
		const formulaRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s*<\s*Formula/g;
		const caskRegex = /cask\s+['"]([^'"]+)['"]\s+do/g;

		let match;

		// Check for Formula
		while ((match = formulaRegex.exec(text)) !== null) {
			const range = new vscode.Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length),
			);
			lenses.push(...this.createLenses(range));
		}

		// Check for Cask
		while ((match = caskRegex.exec(text)) !== null) {
			const range = new vscode.Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length),
			);
			lenses.push(...this.createLenses(range));
		}

		return lenses;
	}

	private createLenses(range: vscode.Range): vscode.CodeLens[] {
		return [
			new vscode.CodeLens(range, {
				title: "$(check) Audit",
				command: "homebrew.audit",
				tooltip: "Run brew audit",
			}),
			new vscode.CodeLens(range, {
				title: "$(beaker) Test",
				command: "homebrew.test",
				tooltip: "Run brew test",
			}),
			new vscode.CodeLens(range, {
				title: "$(package)",
				command: "homebrew.installSource",
				tooltip: "Install building from source",
			}),
		];
	}
}
