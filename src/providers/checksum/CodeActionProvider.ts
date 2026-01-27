import * as vscode from "vscode";
import { URL_REGEX } from "../../utils/regex";

export class ChecksumCodeActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix,
	];

	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken,
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		return context.diagnostics
			.filter((diagnostic) => diagnostic.code === "homebrew-checksum-mismatch")
			.map((diagnostic) => this.createFix(document, range, diagnostic));
	}

	private createFix(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		diagnostic: vscode.Diagnostic,
	): vscode.CodeAction {
		// We need to find the URL associated with this checksum to pass to the command
		// The diagnostic range covers the sha256 value.
		// We can search backwards from the diagnostic range to find the URL, similar to CodeLens logic.
		// OR, since updateChecksum command is smart enough to find the URL if we pass the range/cursor,
		// we can just pass the range.

		// Let's rely on updateChecksum's internal logic to find url from range if possible,
		// but we need to pass the URL to be safe/robust.
		// Re-parsing here might be redundant but safe.

		const text = document.getText();
		const lines = text.split("\n");
		const shaLineIdx = diagnostic.range.start.line;
		let associatedUrl: string | undefined;

		for (let i = shaLineIdx; i >= Math.max(0, shaLineIdx - 10); i--) {
			const lineText = lines[i];
			const urlMatch = lineText.match(URL_REGEX);
			if (urlMatch) {
				associatedUrl = urlMatch[1];
				break;
			}
		}

		const fix = new vscode.CodeAction(
			"Update Checksum",
			vscode.CodeActionKind.QuickFix,
		);
		fix.diagnostics = [diagnostic];
		fix.isPreferred = true;

		// The updateChecksum command expects (range, url, insertMode)
		// We pass diagnostic.range as the range to replace.
		fix.command = {
			command: "homebrew.updateChecksum",
			title: "Update Checksum",
			arguments: [diagnostic.range, associatedUrl, false],
		};
		return fix;
	}
}
