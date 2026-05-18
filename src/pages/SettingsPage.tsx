import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileJson, FileText, Trash2, Upload } from "lucide-react";
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
import { deleteProject } from "../data/repository";

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

  return (
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
              const importedProjectId = await importProjectBackup(file);
              setMessage("Backup imported locally.");
              navigate(`/project/${importedProjectId}`);
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
  );
}
