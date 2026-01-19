import * as vscode from "vscode";
import { getBrewFormulae } from "../providers/completionProvider";
import { brewEnv, execBrew, getCurrentFormulaName } from "../utils/brewUtils";

export async function create() {
	const url = await vscode.window.showInputBox({
		prompt: "Enter URL to create formula from",
	});
	if (url) {
		const terminal = vscode.window.createTerminal({
			name: `Brew Create`,
			env: brewEnv,
		});
		terminal.show();
		terminal.sendText(`brew create ${url}`);
	}
}

export async function test() {
	let formula = getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		formula = await vscode.window.showInputBox({
			prompt: "Enter formula to test",
		});
	}
	if (formula) {
		const terminal = vscode.window.createTerminal({
			name: `Brew Test: ${formula}`,
			env: brewEnv,
		});
		terminal.show();
		terminal.sendText(`brew test ${formula}`);
	}
}

export async function edit(node?: any) {
	let formula = node
		? node.label
		: getCurrentFormulaName(vscode.window.activeTextEditor);
	if (!formula) {
		const items = await getBrewFormulae();
		formula = await vscode.window.showQuickPick(items, {
			placeHolder: "Select formula or cask to edit",
			canPickMany: false,
		});
	}
	if (formula) {
		// Use brew ruby to get the source path as it returns the absolute path reliably
		const rubyScript = `puts Formula['${formula}'].path`;
		execBrew(`brew ruby -e "${rubyScript}"`)
			.then(async (stdout) => {
				const filePath = stdout.trim();
				if (filePath) {
					try {
						const doc = await vscode.workspace.openTextDocument(filePath);
						await vscode.window.showTextDocument(doc);
					} catch (e: any) {
						vscode.window.showErrorMessage(`Error opening file: ${e.message}`);
					}
				}
			})
			.catch(({ stderr }) => {
				// Try Cask if formula fails
				const rubyExpectedCask = `puts Cask::CaskLoader.load('${formula}').sourcefile_path`;
				execBrew(`brew ruby -e "${rubyExpectedCask}"`)
					.then(async (outCask) => {
						const filePath = outCask.trim();
						if (filePath) {
							try {
								const doc = await vscode.workspace.openTextDocument(filePath);
								await vscode.window.showTextDocument(doc);
							} catch (e: any) {
								vscode.window.showErrorMessage(
									`Error opening file: ${e.message}`,
								);
							}
						}
					})
					.catch(({ stderr: stdCask }) => {
						vscode.window.showErrorMessage(
							`Could not find source for ${formula}: ${stderr} ${stdCask}`,
						);
					});
			});
	}
}
