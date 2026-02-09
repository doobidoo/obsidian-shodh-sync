# AGENTS.md

This file provides specialized guidance for AI agents working on the Obsidian Shodh Sync plugin.

---

## Agent Roles & Responsibilities

### Development Agent
**Focus**: Code implementation, bug fixes, feature additions

**Key Knowledge:**
- Plugin uses single-file architecture (`main.ts`)
- Obsidian API patterns: `Plugin`, `PluginSettingTab`, `Notice`, `requestUrl`
- Build with esbuild, no TypeScript config needed
- Always test in Obsidian after changes (reload with Cmd+R)

**Common Tasks:**
- Implement new sync features (filtering, incremental sync)
- Fix bugs (check Obsidian Developer Console for errors)
- Add UI components (settings, ribbon icons, commands)
- Handle API changes from Shodh backend

**Critical Rules:**
- Never commit `data.json` (contains API keys)
- Always handle errors gracefully (try-catch in loops)
- Test with mobile compatibility in mind (no Node.js APIs)
- Preserve user settings between updates

---

### API Integration Agent
**Focus**: Shodh API communication, data transformation

**Shodh API Endpoints:**
1. **GET /api/memories** - Pagination-friendly (recommended)
   - Supports `limit` (max 100) and `offset` parameters
   - Returns `{memories: [], count: number, total: number}`
   - Used for full vault sync

2. **POST /api/recall** - Semantic search (limit 20)
   - Used for filtered/semantic queries
   - Limited to 20 results per request

**Authentication:**
- Header: `Authorization: Bearer {apiKey}`
- API key stored in plugin settings (`data.json`)

**Data Format:**
```typescript
interface Memory {
  id: string;                    // UUID
  content: string;               // Memory text
  created_at: string;            // ISO 8601 timestamp
  tags: string[] | string;       // Array or JSON string!
  memory_type: string;           // "Observation", "Learning", etc.
  content_hash: string;
  quality_score: number;
  // ... other fields
}
```

**Important Gotchas:**
- `tags` can be array OR JSON string - always parse/verify
- Use `created_at` not `timestamp` for dates
- Some memories have structured content (KW summaries)
- Consolidated memories have tags: `["weekly-summary", "consolidated"]`

---

### File Management Agent
**Focus**: Vault organization, filename generation, file operations

**Current Structure:**
```
{Sync Folder}/
  └── {Year}/         # e.g., "2026"
      └── {Month}/    # e.g., "02"
          └── {date}_{title}_{shortId}.md
```

**Filename Generation Logic:**
1. Extract first line or 50 chars from content as title
2. Sanitize: remove special chars, replace spaces with hyphens
3. Add date prefix (YYYY-MM-DD) for chronological sorting
4. Append 8-char ID for uniqueness
5. Example: `2026-01-25_aber-ihr-werdet-den-heiligen-geist_35b866b7.md`

**Frontmatter Format:**
```yaml
---
date: 2026-02-09
tags: [tag1, tag2, tag3]
type: Learning
id: 35b866b7-9f4a-494a-8dc0-c696a801f281
---
```

**File Operations:**
- Always check folder exists before creating files
- Use `app.vault.adapter.exists()` to check existence
- Update existing files with `app.vault.adapter.write()`
- Create new files with `app.vault.create()`
- Handle errors per-file (don't abort entire sync)

**Future Improvements:**
- Incremental sync (track last sync timestamp)
- Conflict resolution (local edits vs. remote updates)
- Bidirectional sync (push local changes to Shodh)
- Folder structure customization (flat vs. hierarchical)

---

### Debugging Agent
**Focus**: Error investigation, performance optimization

**Common Issues & Solutions:**

1. **"c.join is not a function"**
   - Cause: `tags` is string not array
   - Fix: Parse JSON and verify array type

2. **"Sync failed: 401"**
   - Cause: Wrong auth header format
   - Fix: Use `Authorization: Bearer {key}` not `X-API-Key`

3. **Only 20 memories synced**
   - Cause: Using `/api/recall` endpoint
   - Fix: Use `/api/memories` with pagination

4. **File creation fails silently**
   - Cause: Missing folder or invalid filename chars
   - Fix: Create folders first, sanitize filenames

5. **Memory limit errors**
   - Cause: Syncing 500+ memories at once
   - Fix: Process in batches, show progress notifications

**Debugging Tools:**
- Obsidian Developer Console (Cmd+Opt+I)
- Console.log statements (preserved in minified build)
- Network tab (check API requests/responses)
- Vault file structure inspection

**Performance Tips:**
- Batch file operations where possible
- Use progress notifications for user feedback
- Cache folder existence checks
- Consider worker threads for large syncs (future)

---

### Documentation Agent
**Focus**: README updates, changelog maintenance, user guides

**Key Documentation:**
- `README.md`: User-facing installation and usage
- `CLAUDE.md`: Developer context for Claude Code
- `AGENTS.md`: This file - specialized agent guidance
- `CHANGELOG.md`: Version history and changes

**When Updating Docs:**
- Keep README simple and user-focused
- Update CLAUDE.md with architectural changes
- Add recent fixes section for significant changes
- Maintain example snippets for common tasks

**Version Numbering:**
- 0.x.x: Beta/development
- 1.0.0: First stable release
- Follow semantic versioning (MAJOR.MINOR.PATCH)

---

## Session Handoff Protocol

When handing off to another agent or session:

1. **State Check:**
   - What was the last successful build?
   - Any uncommitted changes?
   - Open issues or bugs?

2. **Context Summary:**
   - What feature/fix was being worked on?
   - Current blockers or decisions needed?
   - Test results from last run?

3. **Next Steps:**
   - Immediate tasks to complete
   - Future feature ideas
   - Technical debt to address

---

## Project Milestones

### ✅ Completed (v0.1.0)
- Initial plugin structure
- Full vault sync with pagination
- Meaningful filename generation
- Robust error handling
- Security (secrets in .gitignore)

### 🚧 In Progress
- Investigating 13 failed memory syncs
- Consider incremental sync implementation

### 📋 Planned (v0.2.0)
- Ribbon icon for quick sync
- Settings: auto-sync on startup
- Settings: sync interval configuration
- Incremental sync (only new/updated memories)
- Sync status indicator

### 🔮 Future Ideas (v1.0.0+)
- Bidirectional sync (push edits to Shodh)
- Conflict resolution UI
- Custom folder structures
- Tag-based filtering
- Search integration with Obsidian search
- Graph view integration

---

## Testing Checklist

Before committing changes:

- [ ] Code builds without errors (`npm run build`)
- [ ] No TypeScript errors in IDE
- [ ] Tested in Obsidian (reload and run sync)
- [ ] Checked Developer Console for errors
- [ ] Verified file creation/updates work
- [ ] Confirmed no secrets in git (`git status`)
- [ ] Updated CLAUDE.md if architecture changed
- [ ] Added entry to Recent Fixes section if significant

---

## Contact & Resources

- **Shodh API Repository**: `doobidoo/shodh-cloudflare`
- **MCP Bridge**: `~/Documents/GitHub/shodh-cloudflare/mcp-bridge/`
- **Obsidian Plugin Docs**: https://docs.obsidian.md/Plugins/Getting+started/
- **User**: Henry (doobidoo)
