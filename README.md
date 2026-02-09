# Obsidian Shodh Sync

Sync your Shodh memories into Obsidian vault hierarchically.

**🔗 Related Project**: [SHODH on Cloudflare](https://github.com/doobidoo/shodh-cloudflare) - The backend API that powers this plugin

## Install

1. Obsidian → Settings → Community Plugins → Browse.
2. Search 'Shodh Sync' or GitHub URL: `doobidoo/obsidian-shodh-sync`.
3. Enable.

## Setup

Settings:
- **Shodh URL**: `http://localhost:3030` (or Cloudflare).
- **API Key**: From Shodh (df2db195...).
- **User ID**: 'henry'.
- **Sync Folder**: 'Memories' → Creates `Memories/2026/02/memory.md`.

## Usage

Command Palette: 'Sync Shodh Memories' → Pulls all, MD files with YAML.

Hierarchie: Year/Month/ID.md (tags in frontmatter).

## API

Uses Shodh API endpoints:
- `GET /api/memories` - List all memories with pagination
- Authentication via `Authorization: Bearer {apiKey}` header

For API details, see [shodh-cloudflare](https://github.com/doobidoo/shodh-cloudflare).

## Dev

`pnpm i` → `pnpm build`.

