import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { getBrewFormulae } from "../providers/completionProvider";
import { execBrew } from "../utils/brewUtils";

interface WorkspaceFolder {
	path: string;
	name?: string;
}

interface CodeWorkspace {
	folders: WorkspaceFolder[];
	settings?: { [key: string]: any };
}

export async function openFocusedWorkspace() {
	// 1. Select Formulae
	const items = await getBrewFormulae();
	const selectedNames = await vscode.window.showQuickPick(items, {
		placeHolder: "Select formulae to include in the workspace",
		canPickMany: true,
	});

	if (!selectedNames || selectedNames.length === 0) {
		return;
	}

	// 2. Resolve Paths
	const workspaceFolders: WorkspaceFolder[] = [];

	// We can query multiple at once with brew info --json=v2
	const query = selectedNames.join(" ");

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: "Resolving formula paths...",
			cancellable: false,
		},
		async (progress) => {
			try {
				const stdout = await execBrew(`brew info --json=v2 ${query}`);
				const info = JSON.parse(stdout);

				const processedPaths = new Set<string>();

				// Helper to add folder
				const addFolder = (sourcePath: string | undefined, name: string) => {
					if (!sourcePath) {
						return;
					}
					const dir = path.dirname(sourcePath);
					if (!processedPaths.has(dir)) {
						// Make the name descriptive: "wget (Formula/w)"
						// sourcePath usually ends in .../Formula/w/wget.rb or .../Casks/w/wget.rb
						// Let's just use the formula name as the workspace folder name for clarity
						workspaceFolders.push({
							path: dir,
							name: `${name} (${path.basename(dir)})`,
						});
						processedPaths.add(dir);
					}
				};

				if (info.formulae) {
					for (const f of info.formulae) {
						// Try to get robust path. info output varies by tap presence.
						// ruby_source_path is often relative to the Tap root.
						// We need absolute path. 'path' usually provides it.
						let absPath = f.path;
						if (!absPath && f.ruby_source_path) {
							// If only relative path is usually provided, we might need another way.
							// But usually 'path' property exists in v2 if installed/tapped.
						}
						if (absPath) {
							addFolder(absPath, f.name);
						}
					}
				}

				if (info.casks) {
					for (const c of info.casks) {
						// Casks usually have sourcefile_path
						const absPath = c.sourcefile_path;
						if (absPath) {
							addFolder(absPath, c.token);
						}
					}
				}

				if (workspaceFolders.length === 0) {
					vscode.window.showErrorMessage(
						"Could not resolve paths for selected formulae. Are they tapped?",
					);
					return;
				}

				// 3. Create .code-workspace file
				const workspaceFileContent: CodeWorkspace = {
					folders: workspaceFolders,
					settings: {
						"files.exclude": {
							"**/.git": true,
							"**/.DS_Store": true,
						},
					},
				};

				const tmpDir = os.tmpdir();
				const timestamp = new Date().getTime();
				const workspacePath = path.join(
					tmpDir,
					`homebrew-focused-${timestamp}.code-workspace`,
				);

				fs.writeFileSync(
					workspacePath,
					JSON.stringify(workspaceFileContent, null, 4),
				);

				// 4. Open Workspace
				const uri = vscode.Uri.file(workspacePath);
				await vscode.commands.executeCommand("vscode.openFolder", uri, true); // Force new window
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Failed to create workspace: ${error.message || error}`,
				);
			}
		},
	);
}
