import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, Download, FileJson, FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import {
  downloadFountain,
  downloadMarkdown,
  downloadProjectBackup,
  downloadProjectJson,
  downloadSceneCsv,
  importProjectBackup,
} from "../features/export/project-export";
import { deleteProject, saveProject } from "../data/repository";
import { getActiveModules } from "../data/selectors";
import type { ProjectModules } from "../data/schema";

const moduleLabels: Record<keyof ProjectModules, { label: string; description: string }> = {
  arcs: {
    label: "Arcs",
    description: "Plot, character, and thematic arcs. Tag scenes with arc colors and see coverage.",
  },
  foreshadowing: {
    label: "Foreshadowing tracker",
    description: "Pair setup and payoff scenes. For plotters tracking long-range narrative threads.",
  },
  factions: {
    label: "Factions",
    description: "Groups, organizations, or houses. Adds the Factions entity type and membership tracking.",
  },
  items: {
    label: "Items",
    description: "Macguffins, weapons, symbols, and other named objects. Adds the Items entity type.",
  },
  relationshipGraph: {
    label: "Relationship graph",
    description: "Visual character-relationship map. Adds a \"View as graph\" launcher on character pages.",
  },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!snapshot) {
    return <EmptyState title="Loading settings" description="Pulling together export and backup controls." />;
  }

  const modules = getActiveModules(snapshot.project);

  const toggleModule = async (key: keyof ProjectModules) => {
    const nextModules: ProjectModules = { ...modules, [key]: !modules[key] };
    await saveProject({
      ...snapshot.project,
      settings: { ...snapshot.project.settings, modules: nextModules },
    });
  };

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Modules</div>
        <h2 className="mt-2 font-display text-3xl font-bold">Power features</h2>
        <div className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Off by default in new projects. Toggle on when you want them. Data isn't deleted when a module is off — its UI just hides.
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(Object.keys(moduleLabels) as Array<keyof ProjectModules>).map((key) => {
            const meta = moduleLabels[key];
            const on = modules[key];
            return (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-white/40 p-4 transition hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => void toggleModule(key)}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="text-sm font-semibold">{meta.label}</div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{meta.description}</div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {modules.arcs || modules.foreshadowing ? (
        <section className="panel p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Plot tools</div>
          <h2 className="mt-2 font-display text-3xl font-bold">Plotter workspaces</h2>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Advanced views for arc tracking and foreshadowing planning. Surfaced because their modules are enabled.
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {modules.arcs ? (
              <Link
                to={`/project/${projectId}/board/arcs`}
                className="flex items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-white/40 p-4 transition hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Activity className="mt-1 shrink-0" size={20} />
                <div>
                  <div className="text-sm font-semibold">Arcs</div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                    Create plot, character, and thematic arcs. Tag scenes and inspect coverage.
                  </div>
                </div>
              </Link>
            ) : null}
            {modules.foreshadowing ? (
              <Link
                to={`/project/${projectId}/board/foreshadowing`}
                className="flex items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-white/40 p-4 transition hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Sparkles className="mt-1 shrink-0" size={20} />
                <div>
                  <div className="text-sm font-semibold">Foreshadowing</div>
                  <div className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                    Plant setup-payoff pairs. Track unresolved threads and red herrings.
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Persistence</div>
        <h2 className="mt-2 font-display text-3xl font-bold">Local-first data handling</h2>
        <div className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          Story OS on GitHub Pages stores data in IndexedDB inside this browser profile. Protect your work by exporting a backup after meaningful sessions and before clearing browser storage.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void downloadProjectBackup(snapshot)}>
            <Download size={16} />
            Export `.storyos` Backup
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Import Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".storyos,application/zip,application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              try {
                const importedProjectId = await importProjectBackup(file);
                setMessage("Backup imported locally.");
                navigate(`/project/${importedProjectId}`);
              } catch (error) {
                console.error(error);
                setMessage(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
              } finally {
                event.currentTarget.value = "";
              }
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => downloadProjectJson(snapshot)}>
            <FileJson size={16} />
            Export JSON
          </Button>
          <Button variant="secondary" onClick={() => downloadMarkdown(snapshot)}>
            <FileText size={16} />
            Export Markdown
          </Button>
          <Button variant="secondary" onClick={() => downloadFountain(snapshot)}>
            <FileText size={16} />
            Export Fountain
          </Button>
          <Button variant="secondary" onClick={() => downloadSceneCsv(snapshot)}>
            <FileText size={16} />
            Export Scene CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FileText size={16} />
            Print / PDF
          </Button>
        </div>
        {message ? <div className="mt-4 text-sm text-[color:var(--muted)]">{message}</div> : null}
      </section>

      <section className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Project Snapshot</div>
        <h2 className="mt-2 font-display text-3xl font-bold">Current graph size</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
            <span>Characters</span>
            <strong>{snapshot.characters.length}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
            <span>Locations</span>
            <strong>{snapshot.locations.length}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
            <span>Scenes</span>
            <strong>{snapshot.scenes.length}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
            <span>Scene Drafts</span>
            <strong>{snapshot.sceneDrafts.length}</strong>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
            <span>Assets</span>
            <strong>{snapshot.assets.length}</strong>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="font-semibold text-red-700 dark:text-red-300">Danger zone</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            Delete this local project after exporting a backup. This removes it from IndexedDB in the current browser profile.
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                await deleteProject(projectId);
                navigate("/");
              }}
            >
              <Trash2 size={16} />
              {confirmDelete ? "Confirm Delete" : "Delete Project"}
            </Button>
            {confirmDelete ? (
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
