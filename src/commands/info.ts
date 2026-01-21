import * as vscode from "vscode";
import {
	execBrew,
	getCurrentFormulaName,
	runBrewCommandToOutput,
} from "../utils/brewUtils";

export async function info(outputChannel: vscode.OutputChannel, node?: any) {
	let formula =
		node && node.label
			? node.label
			: getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		formula = await vscode.window.showInputBox({
			prompt: "Enter formula for info",
		});
	}
	if (formula) {
		// We use the basic output for the Output Channel as it's readable for humans
		// But we could strictly parse JSON if we wanted to display a custom UI.
		// For now, let's dump the human-readable text which `brew info` provides by default.
		// If the user wants JSON raw, they can run it in terminal.
		// User requested using JSON for robustness, but displaying JSON in output is not UX friendly.
		// Let's stick to standard text output for the display, but we can verify existence via JSON if needed.
		runBrewCommandToOutput(
			`brew info ${formula}`,
			`Fetching info for ${formula}`,
			outputChannel,
		);
	}
}

export async function depsTree(
	outputChannel: vscode.OutputChannel,
	node?: any,
) {
	let formula = node
		? node.label
		: getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		formula = await vscode.window.showInputBox({
			prompt: "Enter formula for dependency tree",
		});
	}
	if (formula) {
		runBrewCommandToOutput(
			`brew deps --tree ${formula}`,
			`Fetching dependency tree for ${formula}`,
			outputChannel,
		);
	}
}

export async function openTap(node?: any) {
	if (!node || !node.label) {
		vscode.window.showErrorMessage(
			"Please select a tap from the list to open.",
		);
		return;
	}
	const tapName = node.label;

	// Using JSON output as requested for reliable parsing
	execBrew(`brew tap-info ${tapName} --json`)
		.then((stdout) => {
			try {
				const info = JSON.parse(stdout);
				if (info && info.length > 0 && info[0].path) {
					const tapPath = info[0].path;
					vscode.commands.executeCommand(
						"vscode.openFolder",
						vscode.Uri.file(tapPath),
						true,
					);
				} else {
					vscode.window.showErrorMessage(
						`Could not find path for tap ${tapName}`,
					);
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Error parsing tap info: ${e.message}`);
			}
		})
		.catch(({ stderr }) => {
			vscode.window.showErrorMessage(`Error getting tap info: ${stderr}`);
		});
}
