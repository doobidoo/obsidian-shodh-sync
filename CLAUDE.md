# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Obsidian Shodh Sync** - An Obsidian plugin that syncs memories from a Shodh server into an Obsidian vault with hierarchical folder organization (Year/Month/ID.md).

- **Plugin ID**: `shodh-sync`
- **Main file**: `main.ts` (bundled to `main.js`)
- **Build system**: esbuild via `esbuild.config.mjs`
- **Target**: Obsidian API (desktop and mobile compatible)

---

## Development Commands

### Build & Development
```bash
npm run dev      # Development build with inline sourcemaps (watches for changes)
npm run build    # Production build (minified, no sourcemaps)
```

### Version Management
```bash
npm run version  # Bump version in manifest.json, versions.json, and rebuild
```

---

## Architecture

### Plugin Structure

**Single-file plugin** (`main.ts`):

1. **ShodhSync (Plugin class)**
   - `onload()`: Registers "Sync Shodh Memories" command
   - `syncMemories()`: Fetches memories from Shodh API via POST to `/api/recall`
   - `processMemories()`: Creates markdown files in vault with hierarchical paths

2. **ShodhSettingTab**
   - Configures: Shodh URL, API Key, User ID, Sync Folder
   - Settings persisted via Obsidian's `loadData()`/`saveData()`

### Data Flow

```
User triggers command
  → syncMemories() calls Shodh API (/api/recall)
  → processMemories() receives memories array
  → Creates files: {syncFolder}/{year}/{month}/{id}.md
  → YAML frontmatter: date, tags, type
  → File content: memory text
```

### API Integration

**Shodh API Endpoint**: `POST /api/recall`
- Headers: `X-API-Key`, `Content-Type: application/json`
- Body: `{user_id, query: '*', limit: 1000}`
- Response: `{memories: [{id, content, timestamp, tags, memory_type}]}`

### File Organization

Output structure:
```
{Sync Folder}/
  └── {Year}/
      └── {Month}/
          └── {memory_id}.md
```

Example: `Memories/2026/02/abc123.md` with YAML frontmatter containing date, tags, and memory type.

---

## Build System

**esbuild configuration** (`esbuild.config.mjs`):
- Entry: `main.ts`
- Output: `main.js` (CommonJS, Node 16 target)
- External: `obsidian` module (provided by Obsidian runtime)
- Minification: Controlled via `--minify` flag (production builds)
- Sourcemaps: Inline in dev, omitted in production

---

## Key Constraints

1. **File creation**: Plugin uses `app.vault.create()` - does NOT check for existing files (will error if file exists)
2. **No TypeScript config**: Relies on default TypeScript behavior via esbuild transpilation
3. **Mobile compatibility**: Plugin marked as `isDesktopOnly: false` - must avoid Node.js-only APIs
4. **API limits**: Fetches up to 1000 memories per sync (hardcoded limit)

---

## Testing the Plugin

1. Build: `npm run dev` or `npm run build`
2. Copy `main.js` and `manifest.json` to Obsidian vault: `.obsidian/plugins/shodh-sync/`
3. Enable plugin in Obsidian Settings → Community Plugins
4. Configure Shodh URL, API key, and user ID in plugin settings
5. Run "Sync Shodh Memories" from Command Palette

---

## Common Modifications

- **Change memory limit**: Edit line 45 in `main.ts` (`limit: 1000`)
- **Modify file path structure**: Edit `processMemories()` path construction (line 64)
- **Add new settings**: Extend `ShodhSyncSettings` interface and `ShodhSettingTab.display()`
- **Handle duplicate files**: Add existence check before `app.vault.create()` or use `app.vault.modify()`
