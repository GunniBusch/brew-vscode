import * as path from "path";
import * as vscode from "vscode";
import { execBrew } from "../utils/brewUtils";

export class BrewProvider implements vscode.TreeDataProvider<BrewItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<
		BrewItem | undefined | void
	> = new vscode.EventEmitter<BrewItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<BrewItem | undefined | void> =
		this._onDidChangeTreeData.event;

	constructor() {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: BrewItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: BrewItem): Thenable<BrewItem[]> {
		if (!element) {
			// Root elements
			return Promise.resolve([
				new BrewItem(
					"Formulae",
					vscode.TreeItemCollapsibleState.Collapsed,
					"formulae_root",
				),
				new BrewItem(
					"Casks",
					vscode.TreeItemCollapsibleState.Collapsed,
					"casks_root",
				),
				new BrewItem(
					"Taps",
					vscode.TreeItemCollapsibleState.Collapsed,
					"taps_root",
				),
			]);
		}

		if (element.contextValue === "formulae_root") {
			return this.getFormulae();
		} else if (element.contextValue === "casks_root") {
			return this.getCasks();
		} else if (element.contextValue === "taps_root") {
			return this.getTaps();
		}

		return Promise.resolve([]);
	}

	private getFormulae(): Promise<BrewItem[]> {
		return new Promise((resolve) => {
			execBrew("brew list --formula")
				.then((stdout) => {
					const lines = stdout.split("\n").filter((line) => line.trim() !== "");
					resolve(
						lines.map(
							(name) =>
								new BrewItem(
									name,
									vscode.TreeItemCollapsibleState.None,
									"formula",
								),
						),
					);
				})
				.catch(({ stderr }) => {
					resolve([
						new BrewItem(
							`Error: ${stderr}`,
							vscode.TreeItemCollapsibleState.None,
							"error",
						),
					]);
				});
		});
	}

	private getCasks(): Promise<BrewItem[]> {
		return new Promise((resolve) => {
			execBrew("brew list --cask")
				.then((stdout) => {
					const lines = stdout.split("\n").filter((line) => line.trim() !== "");
					resolve(
						lines.map(
							(name) =>
								new BrewItem(
									name,
									vscode.TreeItemCollapsibleState.None,
									"cask",
								),
						),
					);
				})
				.catch(({ stderr }) => {
					resolve([
						new BrewItem(
							`Error: ${stderr}`,
							vscode.TreeItemCollapsibleState.None,
							"error",
						),
					]);
				});
		});
	}

	private getTaps(): Promise<BrewItem[]> {
		return new Promise((resolve) => {
			execBrew("brew tap")
				.then((stdout) => {
					const lines = stdout.split("\n").filter((line) => line.trim() !== "");
					resolve(
						lines.map(
							(name) =>
								new BrewItem(name, vscode.TreeItemCollapsibleState.None, "tap"),
						),
					);
				})
				.catch(({ stderr }) => {
					resolve([
						new BrewItem(
							`Error: ${stderr}`,
							vscode.TreeItemCollapsibleState.None,
							"error",
						),
					]);
				});
		});
	}
}

export class BrewItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly contextValue: string,
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}`;
		this.description = "";
	}
}
