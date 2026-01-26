# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Command Icons**: Added `$(package)` icon to "Install from Source" and `$(info)` icon to "Info" commands in the Command Palette and menus.

### Changed
- **CodeLens Refactoring**: Split monolithic `CodeLensProvider` into specialized `FormulaCodeLensProvider` and `CaskCodeLensProvider` for better maintainability.
- **CodeLens Placement**: Improved placement of inline actions:
    - "Install" now appears above `def install`.
    - "Test" now appears above `test do` / `def test`.
- **Install Action**: Restored text label to "Install" CodeLens (now `$(package) Install`) for better visibility.

## [0.1.1] - 2026-01-24

### Added
- **Intelligent DSL Autocompletion**: Added rich snippet support for Homebrew DSL keywords (`desc`, `homepage`, `url`, `depends_on`, `def install`, etc.) in Ruby files.
- **Formula Name Completion**: Enhanced completion for formula names within `depends_on "..."` strings.
- **Compile Button**: Added "Compile (Source)" `$(package)` button to the editor toolbar for immediate build-from-source.
- **Refined CodeLens**: Updated "Install (Source)" CodeLens to be a precise, icon-only button `$(package)` to reduce visual clutter.

### Removed
- **API Fetch Toggle**: Removed the experimental API Fetch Toggle. The extension now enforces `HOMEBREW_NO_INSTALL_FROM_API=1` by default for all operations to ensure local formula development workflow.

### Fixed
- **Ruby LSP Compatibility**: Fixed an issue where `ruby-lsp` would crash due to missing `test-prof` and other development dependencies in the Homebrew environment (resolved via environment configuration).


## [0.1.0] - 2026-01-21

### Added
- "Focused Workspace" command (`Homebrew: Open Focused Workspace...`) to open a VS Code workspace containing only selected formulae.
- "Open Tap as Workspace" command to open local tap directories.
- Dedicated Side Bar View for browsing Formulae, Casks, and Taps.
- Editor Toolbar buttons for Ruby files: `Fix Style`, `Audit`, `Test`.
- CodeLens support for Ruby files - inline `Audit`, `Test`, and `Install (Source)` actions above Formula/Cask definitions.
- Intelligent Autocompletion for formula names in strings.
- License and Disclaimer aligning with Homebrew guidelines.

### Changed
- Major codebase refactoring for modularity and maintainability.