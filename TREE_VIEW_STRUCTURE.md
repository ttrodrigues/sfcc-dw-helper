# Tree View Structure

This document describes the new tree view structure for SFCC DW Helper extension.

## Before (v0.0.38)
```
SFCC DW Helper (Single Webview)
├── [Bracket Tab] (Selected)
│   ├── Hostname input field
│   ├── Code Version input field
│   ├── Username input field
│   ├── Password input field
│   ├── Open Business Manager button
│   └── Open StoreFront button
└── [Settings Tab]
    ├── New Code Version button
    ├── Delete Code Version button
    ├── [Compiler buttons] (if configured)
    ├── Clean Project / Upload All button
    ├── Enable Upload button
    ├── Disable Upload button
    └── Extension Settings button
```

## After (v0.0.39)
```
SFCC DW Helper (Activity Bar Icon)
├── Connection Settings (Tree View)
│   ├── Hostname: dev01-example.demandware.net (click to edit)
│   ├── Code Version: version1 (click to edit/select from environment)
│   ├── Username: test-user (click to edit)
│   └── Password: •••••••• (click to edit)
│
├── Prophet Commands (Tree View)
│   ├── Clean Project / Upload All (click to execute)
│   ├── Enable Upload (click to execute)
│   └── Disable Upload (click to execute)
│
├── Environment (Tree View)
│   ├── Open Business Manager (click to open in browser)
│   ├── Open StoreFront (click to open in browser)
│   ├── New Code Version (click to create)
│   └── Delete Code Version (click to delete)
│
└── Compiler (Tree View)
    ├── [Build Dev] (if configured - click to execute)
    └── [Build Prod] (if configured - click to execute)
```

## Benefits

1. **Native VSCode Integration**: Uses VSCode's native tree view API instead of custom webview
2. **Better Organization**: Related features grouped into logical sections
3. **Collapsible Sections**: Each tree view can be collapsed/expanded independently
4. **No Tab Switching**: All features visible at once (when expanded)
5. **Consistent UI**: Matches VSCode's design patterns (similar to SCM, Debug, etc.)
6. **Better Performance**: No webview overhead, faster rendering
7. **Maintainability**: Simpler codebase, no Svelte/rollup dependencies for UI

## User Interaction

- Click on any item in "Connection Settings" to edit that field
- History suggestions are shown for hostname and code version
- OCAPI integration still works for fetching/activating code versions
- All Prophet commands execute with a single click
- Status bar shows connection status as before
