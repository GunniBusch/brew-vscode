import { ExecOptions, exec } from "child_process";
import * as vscode from "vscode";

// Environment configuration for Homebrew
// We force HOMEBREW_NO_INSTALL_FROM_API to ensure we interact with local taps/formulae
export const brewEnv = { ...process.env, HOMEBREW_NO_INSTALL_FROM_API: "1" };

/**
 * Executes a Homebrew command.
 * @param command The command to run (e.g., 'brew info json=v2 <formula>')
 * @param options parsing options or specific exec options
 * @returns Promise resolving to stdout
 */
export function execBrew(
	command: string,
	options: ExecOptions = {},
): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, { env: brewEnv, ...options }, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing ${command}: ${stderr}`);
				reject({ error, stderr });
				return;
			}
			resolve(typeof stdout === "string" ? stdout : stdout.toString());
		});
	});
}

/**
 * Helper to run a command and display output in the designated OutputChannel.
 */
export function runBrewCommandToOutput(
	command: string,
	loadingMessage: string,
	outputChannel: vscode.OutputChannel,
): void {
	outputChannel.clear();
	outputChannel.show();
	outputChannel.appendLine(loadingMessage + "...");

	execBrew(command)
		.then((stdout) => {
			outputChannel.appendLine(stdout);
		})
		.catch(({ error, stderr }) => {
			outputChannel.appendLine(`Error: ${error.message}`);
			outputChannel.appendLine(stderr);
		});
}

/**
 * Tries to get the current formula name from the active editor.
 */
export function getCurrentFormulaName(
	editor: vscode.TextEditor | undefined,
): string | undefined {
	if (editor) {
		const path = require("path");
		return path.basename(
			editor.document.fileName,
			path.extname(editor.document.fileName),
		);
	}
	return undefined;
}
