import * as vscode from 'vscode';
import { getBrewFormulae } from '../providers/completionProvider';
import { brewEnv } from '../utils/brewUtils';

export async function installFromSource() {
    const items = await getBrewFormulae();
    
    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select formula or cask to install (build from source)',
        canPickMany: false
    });

    if (selection) {
        const terminal = vscode.window.createTerminal({
            name: `Brew Install: ${selection}`,
            env: brewEnv
        });
        terminal.show();
        terminal.sendText(`brew install --build-from-source ${selection}`);
    }
}
