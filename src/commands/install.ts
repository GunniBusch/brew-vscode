import * as vscode from "vscode";
import { getBrewFormulae } from "../providers/completionProvider";
import { brewEnv, getCurrentFormulaName } from "../utils/brewUtils";

export async function installFromSource(node?: any) {
	// If called from CodeLens or Editor Title, node might be undefined or a Uri.
	// Try to get formula from active editor first if node is not a TreeItem.
	let preSelect =
		node && node.label
			? node.label
			: getCurrentFormulaName(vscode.window.activeTextEditor);

	const strItems = await getBrewFormulae();
	const items: vscode.QuickPickItem[] = strItems.map((label) => ({
		label,
		picked: label === preSelect,
	}));

	const selection = await vscode.window.showQuickPick(items, {
		placeHolder: "Select formula or cask to install (build from source)",
		canPickMany: false,
	});

	if (selection) {
		const terminal = vscode.window.createTerminal({
			name: `Brew Install: ${selection.label}`,
			env: brewEnv,
		});
		terminal.show();
		terminal.sendText(`brew install --build-from-source ${selection.label}`);
	}
}
