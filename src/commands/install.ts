import * as vscode from "vscode";
import { getBrewFormulae } from "../providers/completionProvider";
import { brewEnv, getCurrentFormulaName } from "../utils/brewUtils";

export async function installFromSource(node?: any) {
	// If called from Tree View, node is the TreeItem (has label)
	// If called from Editor Title, node is the Uri of the file
	// If called from Command Palette, node is undefined

	let formulaToInstall: string | undefined;

	if (node && node.label) {
		// Tree View
		formulaToInstall = node.label;
	} else if (node instanceof vscode.Uri) {
		// Editor Title
		const path = require("path");
		formulaToInstall = path.basename(node.fsPath, path.extname(node.fsPath));
	} else {
		// Command Palette or other - try active editor
		formulaToInstall = getCurrentFormulaName(vscode.window.activeTextEditor);
	}

	// If we have a formula and we are NOT in the "pick generic" mode (implied by Command Palette without context),
	// we might want to just run it.
	// However, usually Command Palette with no args -> show picker.
	// But Editor Button -> immediate action.
	// To distinguish matches from context vs matches from "Active Editor but triggered via Palette",
	// usually we can assumes if an argument was passed (Uri) it's explicit.
	// If node was undefined but we found a formula, maybe we still show picker with pre-select?
	// The USER REQUEST is "button to compile ...". Buttons usually act immediately.

	// Strategy:
	// 1. If invoked with Uri (Button) or TreeItem (Context Menu) -> Immediate Action.
	// 2. If invoked with undefined (Palette) -> Show Picker (pre-select active).

	if (node) {
		// Immediate execution for context actions
		if (formulaToInstall) {
			runInstall(formulaToInstall);
			return;
		}
	}

	// Fallback to picker
	const strItems = await getBrewFormulae();
	const items: vscode.QuickPickItem[] = strItems.map((label) => ({
		label,
		picked: label === formulaToInstall,
	}));

	const selection = await vscode.window.showQuickPick(items, {
		placeHolder: "Select formula or cask to install (build from source)",
		canPickMany: false,
	});

	if (selection) {
		runInstall(selection.label);
	}
}

function runInstall(formula: string) {
	const terminal = vscode.window.createTerminal({
		name: `Brew Install: ${formula}`,
		env: brewEnv,
	});
	terminal.show();
	terminal.sendText(`brew install --build-from-source ${formula}`);
}
