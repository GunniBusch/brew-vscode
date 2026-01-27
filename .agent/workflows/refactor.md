---
description: Comprehensive refactoring to simplify and clean up code
---

# Refactor and Simplify Code

This workflow is designed to aggressively refactor, simplify, and optimize code. The goal is to eliminate complexity, especially unnecessary complexity often introduced by LLMs or legacy patterns.

## Principles to Follow

1.  **Simplification over Consistency**: Do not feel bound by existing patterns if they are complex, verbose, or unclear. Replace them with cleaner, more idiomatic solutions.
2.  **Aggressive Cleanup**: Remove "syntactically correct but semantically nonsense" code.
3.  **Optimize Logic**:
    - Flatten deep nesting.
    - Simplify complex `if/else` checks.
    - Break down huge functions and files into smaller, logical units.
4.  **Modernize Style**: Apply modern best practices and clean code principles.
5.  **Remove LLM Artifacts**: Look for and remove redundant comments, hallucinated-style logic, or overly defensive coding that isn't necessary.

## Instructions

Analyze the target code and apply the following transformations where applicable:

-   **Logic Simplification**: converting nested `if`s to guard clauses.
-   **Dead Code Removal**: deleting unused variables, functions, and imports.
-   **Readability Improvements**: renaming variables for clarity, formatting code.
-   **Performance Optimization**: identifying and fixing inefficient loops or data structures.

You have permission to change as much as needed to achieve a clean, maintainable, and simple result. Do not ask for permission for each individual change; treat this as a directive to overhaul the code for quality.