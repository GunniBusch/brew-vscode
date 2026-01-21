import * as vscode from "vscode";
import { isBrewApiFetchEnabled, setBrewApiFetch } from "../utils/brewUtils";

export async function toggleApiFetch() {
	const currentlyEnabled = isBrewApiFetchEnabled();
	const newEnabled = !currentlyEnabled;

	setBrewApiFetch(newEnabled);

	await vscode.commands.executeCommand(
		"setContext",
		"brew-vscode.apiFetchEnabled",
		newEnabled,
	);

	if (newEnabled) {
		vscode.window.showInformationMessage(
			"Homebrew: JSON API Fetch ENABLED (HOMEBREW_NO_INSTALL_FROM_API unset)",
		);
	} else {
		vscode.window.showInformationMessage(
			"Homebrew: JSON API Fetch DISABLED (HOMEBREW_NO_INSTALL_FROM_API=1)",
		);
	}
}
