# Story OS

Story OS is a static-first, local-first writing workspace for outlining a story, drafting prose or screenplay, building a connected wiki of characters and places, and exporting backups — all from the browser.

The MVP is a Vite + React + TypeScript SPA that runs on GitHub Pages with `HashRouter`. All project data is stored in IndexedDB through Dexie. There is no backend, auth, cloud sync, or account system.

## Local Setup

Use Node.js 22, matching the GitHub Pages workflow.

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite. The app stores data in the current browser profile, so using another browser or clearing site storage will show a different local library.

Useful checks:

```powershell
npm run build
npm run test
```

On some Windows machines, antivirus or file locking can block npm/esbuild with `EPERM`. If that happens during local setup, this repository-local cache workaround can unblock development:

```powershell
npm ci --cache .\.npm-cache --ignore-scripts
```

Use normal `npm ci` for CI and GitHub Actions.

## GitHub Pages

The app is designed for GitHub Pages:

- Routing uses `HashRouter`, so deep links work without server rewrites.
- `vite.config.ts` derives the Vite `base` path from `GITHUB_REPOSITORY` in Actions.
- Set `VITE_BASE_PATH` only if you need to override the deployed base path manually.
- The workflow in `.github/workflows/deploy.yml` installs with `npm ci`, runs `npm run build`, uploads `dist`, and deploys to Pages.

To deploy, enable GitHub Pages for the repository and run the `Deploy Story OS` workflow, or push to `main`.

## Local-first Storage and Backups

Story OS stores projects in IndexedDB inside the current browser profile. This means:

- Data is not synced between browsers or devices.
- Clearing browser storage can delete projects.
- Private/incognito sessions may discard data.
- Browser profile corruption or device loss can lose work.

Export a `.storyos` backup from Project settings after meaningful writing sessions and before clearing browser storage. The Project page also supports JSON, Markdown, Fountain, Scene CSV, and Print/PDF exports.

## Information Architecture

Three top-level sections inside a project:

- **Write** (`/project/:projectId/write`) — the unified writing workspace. A three-pane layout:
  - **Left pane** toggles between *Outline* (acts → scenes tree with drag-to-reorder) and *Timeline* (story-order strip with color modes for status / POV / tone / arc).
  - **Center pane** toggles between *Single* (focused Tiptap editor for one scene) and *Manuscript* (editable continuous read-through of every scene in order, each block autosaves).
  - **Right pane** is the Inspector — scene metadata edits inline: POV, location, characters present, items, tone, story function, status, arc tags, foreshadowing hooks.
  - A compact Pulse strip at the top shows word count, scenes-drafted, and recent edits, with an expandable popover for full stats.
- **Wiki** (`/project/:projectId/wiki`) — a unified entity grid with filter chips for Character / Location / Item / Faction. Search by name, description, or tag. Sort by recent or by name. Click `+ New entry` and pick a type to create. Click any card to open the entity editor — which infers type from the record. Each entity page has a permanent Backlinks panel at the top of the right rail, unifying scene mentions, scene metadata references, character relationships, faction memberships, and cross-links.
- **Project** (`/project/:projectId/project`) — module toggles, plot-tool launchers (when arcs / foreshadowing modules are on), backup / restore / export, and the danger zone.

Global hotkeys persist across all three sections:

- `⌘K` / `Ctrl+K` — command palette: full-text search across entities, scenes, draft text, arcs, foreshadowing labels.
- `⌘⇧N` / `Ctrl+Shift+N` — quick capture: create an entity or scene without leaving the editor.

## Modules (opt-in features)

New projects start minimal: only Characters and Locations are visible, and the writing surface is the only place to be. Advanced features live as opt-in modules in **Project → Modules**:

- **Arcs** — plot, character, and thematic arcs. Adds arc tagging on scenes, arc-color modes in the Timeline strip, and an "Arcs" plotter workspace.
- **Foreshadowing** — track setup / payoff pairs across scenes. Adds the "Foreshadowing" plotter workspace.
- **Factions** — adds the Faction entity type and FactionMembership editing on character pages.
- **Items** — adds the Item entity type and item involvement on scenes.
- **Relationship graph** — adds a "View as graph" launcher on every wiki page; opens a modal with all entity types as nodes and edges from character relationships, faction memberships, item possession, location parentage, and generic cross-links.

The seeded sample project ("The Hollow Man") ships with all modules on so the demo showcases the full feature set. Legacy projects without a `modules` field default to all-on so nothing disappears.

## Linking

Two complementary mechanisms for cross-referencing entities:

- **`@mention` in the scene editor** — type `@` in any Tiptap scene editor. The suggestion list shows matching entities; if your query doesn't match anything, the list also offers "Create new character / location / item / faction *'your query'*" rows that create the entity and insert the mention in one step. Mentions are indexed automatically and appear in the target entity's Backlinks panel.
- **`[[wikilink]]` in plain-text fields** — type `[[Name]]` in any entity description, backstory, motivation, history, ideology, or scene summary / notes. Unfocus the field and the bracketed names render as clickable chips that link to the wiki entry. Unresolved names show amber as a hint.

## Authoring Flow

The main loop:

```
Project list → Write workspace (outline + draft + inspect) → Wiki for world details → Project for export
```

Day-to-day:

1. **Open a project**: lands on `/write`, with the first scene selected and the editor focused.
2. **Outline** scenes into acts (drag to reorder), or switch to **Timeline** to scan story flow with color modes.
3. **Single** mode focuses on one scene at a time; **Manuscript** mode is a continuous editable scroll of every scene.
4. As you write, use `@` to mention entities or `[[Name]]` in metadata fields to cross-link.
5. The **Inspector** on the right edits scene metadata (POV / location / characters / items / arcs / tone / status) inline — no page switch.
6. Pop over to **Wiki** to add or refine characters and places. Backlinks show automatically.
7. Export a `.storyos` backup from **Project** before clearing browser storage.

## Project Structure

```
src/
├── app/router.tsx              # HashRouter config
├── pages/                      # Top-level pages (WritePage, WikiListPage, EntityEditorPage, etc.)
├── features/
│   ├── write/                  # Write workspace components (Outline, Timeline, SceneEditor, ScrollEditor, PulseStrip)
│   ├── wiki/                   # RelationshipWeb (multi-entity graph)
│   ├── board/                  # SceneDetailPanel used by Write inspector
│   ├── draft/                  # Tiptap editor extensions + @mention suggestion
│   ├── bible/                  # entity type labels + guards
│   └── export/                 # Backup, JSON, Markdown, Fountain, CSV
├── components/
│   ├── layout/                 # AppLayout, ProjectLayout (top nav)
│   ├── modals/                 # CommandPalette, QuickCapture
│   └── shared/                 # Button, Field, LinkifiedText, Modal, EntityImage, etc.
├── data/
│   ├── schema.ts               # Zod schemas + TypeScript types (incl. ProjectModules)
│   ├── db.ts                   # Dexie database
│   ├── repository.ts           # CRUD helpers (saveScene, saveEntity, saveProject, ...)
│   ├── selectors.ts            # Derived data (groupScenesByAct, buildBacklinks, getActiveModules, ...)
│   └── defaults.ts             # createDefaultProject, createSampleProject, createEmptyEntity, ...
├── hooks/                      # useProjectSnapshot, useAutosave, useHotkeys, useAssetUrl
├── store/ui-store.ts           # Zustand: theme, active project, modal state
└── lib/utils.ts                # createId, nowIso, formatDateTime, etc.
```

Legacy URLs still resolve directly (`/draft/:sceneId`, `/board/kanban`, `/board/timeline`, `/board/arcs`, `/board/foreshadowing`, `/bible/relationships`, `/bible/:type/:id`) — they aren't linked from the new nav, but bookmarks continue to work. The Arc and Foreshadowing CRUD pages in particular are reached from the Project page when their modules are on.
