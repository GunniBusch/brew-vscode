# Homebrew for VS Code

A powerful Visual Studio Code extension for Homebrew maintainers and power users. Manage your formulae, casks, and taps directly from your editor.

## Features

### 🍺 Formulas & Casks View
A dedicated Side Bar view allows you to browse all installed Formulae, Casks, and Taps.
- **Refresh**: Keep your view up to date with the latest Homebrew state.
- **Context Menus**: Right-click on items to perform actions like audit, info, livecheck, and more.

### 🛠 Developer Tools
Built for Homebrew contributors.
- **Open Tap as Workspace**: Right-click any Tap to open its local repository in a new window. Perfect for editing and contributing.
- **Brew Edit**: Quickly open the source code of any formula or cask. Supports both installed and uninstalled items via a smart QuickPick.
- **Install (Build from Source)**: Install packages with the `--build-from-source` flag easily.
- **Create**: Run `brew create` to scaffold new formulae from a URL.
- **Test**: Run `brew test` on your formulae.
- **Audit & Livecheck**: Run `brew audit --strict --online` and `brew livecheck` directly from the context menu.
- **Dependency Tree**: Visualize dependencies with `brew deps --tree`.

### ⚡️ Intelligent Autocompletion
Context-aware autocompletion for Homebrew formula and cask names in your code.
- Triggers automatically when typing inside strings locally (e.g., `depends_on "wget"`) helping you find the right package name instantly.

### 🎨 Style Fixer
- **Brew Style Fix**: Automatically fix style violations in your current Ruby file using `brew style --fix`.

## Requirements

- **Homebrew**: Must be installed and accessible in your system's `PATH`.

## Commands

- `Homebrew: Refresh View`: Refresh the Side Bar list.
- `Homebrew: Install (Source)`: Install a formula/cask building from source.
- `Homebrew: Style Fix`: Fix style issues in the active file.
- `Homebrew: Audit`: Run strict online audit on a formula.
- `Homebrew: Info`: Show information about a formula.
- `Homebrew: Livecheck`: Check for newer versions.
- `Homebrew: Dependency Tree`: Show dependency tree.
- `Homebrew: Create`: Create a new formula.
- `Homebrew: Test`: Run tests for a formula.
- `Homebrew: Edit`: Open formula/cask source.
- `Homebrew: Open Tap as Workspace`: Open a tap's git repo in VS Code.

## Extension Settings

This extension currently uses your system's Homebrew configuration.
It forces `HOMEBREW_NO_INSTALL_FROM_API=1` internally to ensure developer commands interact with your local taps and formulae correctly.

## Release Notes

### 0.0.1
Initial release with support for:
- Browsing Formulae, Casks, and Taps.
- Editing installed and uninstalled formulae.
- Opening Taps as workspaces.
- Autocompletion for formula names.
- Core maintainer commands (audit, style, livecheck, etc.).

## License

This project is licensed under the BSD 2-Clause License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This extension is an independent open-source project and is not affiliated with, endorsed by, or associated with User Homebrew or the Homebrew Project. "Homebrew" is a trademark of its respective owners.
