# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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