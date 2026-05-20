# Story OS

Story OS is a static-first, local-first writing workspace for building a story bible, outlining scenes, drafting manuscript pages, and exporting backups from the browser.

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

Export a `.storyos` backup from Settings after meaningful writing sessions and before clearing browser storage. Settings also supports JSON, Markdown, Fountain, Scene CSV, and Print/PDF exports.

## MVP Flow

The main authoring loop is:

Project -> Bible -> Board -> Draft -> Manuscript -> Export/Backup

Current MVP areas:

- Projects list/create/open/duplicate/delete.
- Bible editors for characters, locations, items, and factions.
- Character relationships, faction memberships, cross-links, and backlinks.
- Relationship graph with locally saved node positions.
- Board kanban, timeline, arc coverage/gap detection, and foreshadowing tracker.
- TipTap scene Draft with autosave, screenplay/prose mode, and entity mentions.
- Manuscript view assembled in story order.
- Settings export/import flows.
