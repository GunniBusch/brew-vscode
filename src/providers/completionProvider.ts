import * as vscode from 'vscode';
import { execBrew } from '../utils/brewUtils';

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

        execBrew('brew formulae')
            .then(stdout => {
                const formulae = stdout.split('\n').filter(line => line.trim() !== '');
                
                // Also fetch casks
                return execBrew('brew casks').then(stdoutCask => {
                    const casks = stdoutCask.split('\n').filter(line => line.trim() !== '');
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
export class BrewCompletionProvider implements vscode.CompletionItemProvider {
    
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        
        // Trigger only for specific Homebrew keywords followed by a quote
        // Matches: depends_on "  or  conflicts_with "  or  uses_from_macos "
        const triggerRegex = /(depends_on|conflicts_with|uses_from_macos)\s+['"][^'"]*$/;

        if (!triggerRegex.test(linePrefix)) {
            return undefined;
        }
        
        // Ensure cache is populated (it should be started on activate, but just in case)
        if (formulaCache.length === 0) {
             getBrewFormulae(); // Trigger fetch if empty, but return generic empty for now
        }

        return formulaCache.map(name => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module);
            item.detail = "Homebrew Formula/Cask";
            return item;
        });
    }
}
