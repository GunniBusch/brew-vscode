---
description: Update CHANGELOG.md following Keep a Changelog standards, with support for releasing new versions.
---

1.  **Analyze Request**: Determine if the goal is to *add entries* to the current unreleased version or to *cut a new release version*.

2.  **Editing CHANGELOG.md**:
    *   **Standard**: Strictly follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).
    *   **Structure**:
        ```markdown
        ## [Unreleased]
        
        ### Added
        - New features.
        
        ### Changed
        - Changes in existing functionality.
        
        ### Fixed
        - Bug fixes.
        
        ## [1.0.0] - 2024-01-01
        ...
        ```

3.  **Scenario A: Adding Changes (Routine Work)**
    *   Locate the `## [Unreleased]` section at the top.
    *   If it does not exist, create it above the most recent version.
    *   Categorize the changes using standard subsections: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`.
    *   Append succinct, bulleted descriptions of the changes.

4.  **Scenario B: Cutting a New Release (Creating a Version)**
    *   **Constraint**: Only perform this if explicitly asked to "release", "bump version", or "cut version X.Y.Z".
    *   Locate the `## [Unreleased]` section.
    *   Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` (using today's date).
    *   Create a new empty `## [Unreleased]` section immediately above the new version.
    *   **Verify**: Ensure `package.json` version matches the new release version if applicable.

5.  **Execution**:
    *   Use `view_file` to read the current `CHANGELOG.md`.
    *   Use `replace_file_content` (or `write_to_file` if creating) to apply changes.
    *   Review the file to ensure no formatting headers were broken.
