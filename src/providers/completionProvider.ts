import * as vscode from "vscode";
import { execBrew } from "../utils/brewUtils";

// Cache for formula names
let formulaCache: string[] = [];

/**
 * Fetches the list of all available formulae and casks.
 * Uses caching to avoid repeated calls.
 */
export function getBrewFormulae(): Promise<string[]> {
	return new Promise((resolve, reject) => {
		if (formulaCache.length > 0) {
			resolve(formulaCache);
			return;
		}

		execBrew("brew formulae")
			.then((stdout) => {
				const formulae = stdout
					.split("\n")
					.filter((line) => line.trim() !== "");

				// Also fetch casks
				return execBrew("brew casks").then((stdoutCask) => {
					const casks = stdoutCask
						.split("\n")
						.filter((line) => line.trim() !== "");
					formulaCache = [...formulae, ...casks];
					resolve(formulaCache);
				});
			})
			.catch(({ error, stderr }) => {
				console.error(`Error fetching formulae: ${stderr}`);
				// Resolve empty array to keep extension working even if brew fails
				resolve([]);
			});
	});
}

/**
 * Provides autocompletion for Homebrew formula and cask names.
 * Triggers only on specific Homebrew keywords: depends_on, conflicts_with, uses_from_macos.
 */
/**
 * Provides autocompletion for Homebrew formula and cask names.
 * Triggers only on specific Homebrew keywords: depends_on, conflicts_with, uses_from_macos.
 */
export class BrewFormulaNameProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const linePrefix = document
			.lineAt(position)
			.text.substr(0, position.character);

		// Trigger only for specific Homebrew keywords followed by a quote
		// Matches: depends_on "  or  conflicts_with "  or  uses_from_macos "
		const triggerRegex =
			/(depends_on|conflicts_with|uses_from_macos)\s+['"][^'"]*$/;

		if (!triggerRegex.test(linePrefix)) {
			return undefined;
		}

		// Ensure cache is populated (it should be started on activate, but just in case)
		if (formulaCache.length === 0) {
			getBrewFormulae(); // Trigger fetch if empty, but return generic empty for now
		}

		return formulaCache.map((name) => {
			const item = new vscode.CompletionItem(
				name,
				vscode.CompletionItemKind.Module,
			);
			item.detail = "Homebrew Formula/Cask";
			return item;
		});
	}
}

/**
 * Provides autocompletion for Homebrew DSL keywords (desc, homepage, url, etc.)
 */
export class BrewDSLCompletionProvider
	implements vscode.CompletionItemProvider
{
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const items: vscode.CompletionItem[] = [];

		// Simple Keywords
		const keywords = [
			{
				label: "desc",
				snippet: 'desc "${1:Description}"',
				detail: "Formula Description",
			},
			{
				label: "homepage",
				snippet: 'homepage "${1:https://example.com}"',
				detail: "Project Homepage",
			},
			{ label: "url", snippet: 'url "${1:URL}"', detail: "Source URL" },
			{
				label: "mirror",
				snippet: 'mirror "${1:URL}"',
				detail: "Mirror URL",
			},
			{
				label: "sha256",
				snippet: 'sha256 "${1:Hash}"',
				detail: "SHA256 Checksum",
			},
			{ label: "license", snippet: 'license "${1:MIT}"', detail: "License" },
			{
				label: "version",
				snippet: 'version "${1:1.0.0}"',
				detail: "Explicit Version",
			},
			{
				label: "revision",
				snippet: "revision ${1:1}",
				detail: "Formula Revision",
			},
		];

		// Dependency Keywords
		const depKeywords = [
			{
				label: "depends_on",
				snippet: 'depends_on "${1:formula}"',
				detail: "Runtime Dependency",
			},
			{
				label: "conflicts_with",
				snippet: 'conflicts_with "${1:formula}"',
				detail: "Conflict",
			},
			{
				label: "uses_from_macos",
				snippet: 'uses_from_macos "${1:tool}"',
				detail: "System Dependency",
			},
		];

		// Block Keywords
		const blocks = [
			{
				label: "def install",
				snippet: "def install\n\t${0}\nend",
				detail: "Install Method",
			},
			{
				label: "test do",
				snippet: "test do\n\t${0}\nend",
				detail: "Test Block",
			},
		];

		const createItem = (
			def: { label: string; snippet: string; detail: string },
			kind: vscode.CompletionItemKind,
		) => {
			const item = new vscode.CompletionItem(def.label, kind);
			item.insertText = new vscode.SnippetString(def.snippet);
			item.detail = def.detail;
			return item;
		};

		keywords.forEach((k) =>
			items.push(createItem(k, vscode.CompletionItemKind.Keyword)),
		);
		depKeywords.forEach((k) =>
			items.push(createItem(k, vscode.CompletionItemKind.Keyword)),
		);
		blocks.forEach((k) =>
			items.push(createItem(k, vscode.CompletionItemKind.Snippet)),
		);

		return items;
	}
}
