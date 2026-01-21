import * as vscode from "vscode";
import * as developCommands from "./commands/develop";
import * as infoCommands from "./commands/info";
import * as installCommands from "./commands/install";
import * as maintenanceCommands from "./commands/maintenance";
import * as workspaceCommands from "./commands/workspace";
import * as configCommands from "./commands/config";
import {
	BrewCompletionProvider,
	getBrewFormulae,
} from "./providers/completionProvider";
import { BrewProvider } from "./providers/treeProvider";
import { BrewCodeLensProvider } from "./providers/codeLensProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log("Homebrew Helper is now active!");

	// Pre-fetch formulae in background
	getBrewFormulae();

	// Tree View Provider
	const brewProvider = new BrewProvider();
	vscode.window.registerTreeDataProvider("homebrewView", brewProvider);

	// Output Channel for command results (shared)
	const outputChannel = vscode.window.createOutputChannel("Homebrew");

	// Register Commands
	context.subscriptions.push(
		// View Refresh
		vscode.commands.registerCommand("homebrew.refresh", () =>
			brewProvider.refresh(),
		),

		// Maintenance
		vscode.commands.registerCommand(
			"homebrew.styleFix",
			maintenanceCommands.styleFix,
		),
		vscode.commands.registerCommand("homebrew.audit", (node) =>
			maintenanceCommands.audit(outputChannel, node),
		),
		vscode.commands.registerCommand("homebrew.livecheck", (node) =>
			maintenanceCommands.livecheck(outputChannel, node),
		),

		// Install
		vscode.commands.registerCommand("homebrew.installSource", (node) =>
			installCommands.installFromSource(node),
		),

		// Workspace
		vscode.commands.registerCommand(
			"homebrew.openFocusedWorkspace",
			workspaceCommands.openFocusedWorkspace,
		),

		// Info & Taps
		vscode.commands.registerCommand("homebrew.info", (node) =>
			infoCommands.info(outputChannel, node),
		),
		vscode.commands.registerCommand("homebrew.depsTree", (node) =>
			infoCommands.depsTree(outputChannel, node),
		),
		vscode.commands.registerCommand("homebrew.openTap", infoCommands.openTap),

		// Config
		vscode.commands.registerCommand(
			"homebrew.toggleApiFetch",
			configCommands.toggleApiFetch,
		),

		// Development
		vscode.commands.registerCommand("homebrew.create", developCommands.create),
		vscode.commands.registerCommand("homebrew.test", developCommands.test),
		vscode.commands.registerCommand("homebrew.edit", developCommands.edit),
	);

	// Initialize Context Keys
	vscode.commands.executeCommand(
		"setContext",
		"brew-vscode.apiFetchEnabled",
		false, // Default logic in brewUtils is HOMEBREW_NO_INSTALL_FROM_API="1" (Disabled)
	);

	// Autocompletion Provider
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			["ruby", "shellscript", "plaintext"],
			new BrewCompletionProvider(),
			'"',
			"'", // Trigger characters
		),
	);

	// CodeLens Provider
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
			{ language: "ruby", scheme: "file" },
			new BrewCodeLensProvider(),
		),
	);
}

export function deactivate() {}
