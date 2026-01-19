import * as vscode from "vscode";
import {
	brewEnv,
	execBrew,
	getCurrentFormulaName,
	runBrewCommandToOutput,
} from "../utils/brewUtils";

export function styleFix() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active file found.");
		return;
	}

	const filePath = editor.document.fileName;
	execBrew(`brew style --fix "${filePath}"`)
		.then(() => {
			vscode.window.showInformationMessage(
				"Homebrew style fixed successfully!",
			);
		})
		.catch(({ stderr }) => {
			vscode.window.showErrorMessage(`Error fixing style: ${stderr}`);
		});
}

export async function audit(outputChannel: vscode.OutputChannel, node?: any) {
	let formula = node
		? node.label
		: getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		formula = await vscode.window.showInputBox({
			prompt: "Enter formula to audit",
		});
	}
	if (formula) {
		runBrewCommandToOutput(
			`brew audit --strict --online ${formula}`,
			`Auditing ${formula}`,
			outputChannel,
		);
	}
}

export async function livecheck(
	outputChannel: vscode.OutputChannel,
	node?: any,
) {
	let formula = node
		? node.label
		: getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		formula = await vscode.window.showInputBox({
			prompt: "Enter formula to livecheck",
		});
	}
	if (formula) {
		runBrewCommandToOutput(
			`brew livecheck ${formula}`,
			`Running livecheck for ${formula}`,
			outputChannel,
		);
	}
}
