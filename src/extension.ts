import * as vscode from "vscode";
import * as developCommands from "./commands/develop";
import * as infoCommands from "./commands/info";
import * as installCommands from "./commands/install";
import * as maintenanceCommands from "./commands/maintenance";
import * as workspaceCommands from "./commands/workspace";

import {
	BrewDSLCompletionProvider,
	BrewFormulaNameProvider,
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

		// Development
		vscode.commands.registerCommand("homebrew.create", developCommands.create),
		vscode.commands.registerCommand("homebrew.test", developCommands.test),
		vscode.commands.registerCommand("homebrew.edit", developCommands.edit),
	);

	// Autocompletion Providers
	context.subscriptions.push(
		// 1. Formula Name Completion (Triggers on keywords like depends_on)
		vscode.languages.registerCompletionItemProvider(
			["ruby", "shellscript", "plaintext"],
			new BrewFormulaNameProvider(),
			'"',
			"'", // Trigger characters
		),
		// 2. DSL Keyword Completion (Triggers generally)
		vscode.languages.registerCompletionItemProvider(
			["ruby"],
			new BrewDSLCompletionProvider(),
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
