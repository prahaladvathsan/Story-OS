import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CopyPlus, FolderOpen, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../data/db";
import { createProject, deleteProject, duplicateProject, seedSampleProject } from "../data/repository";
import { formatDateTime } from "../lib/utils";
import { Button } from "../components/shared/Button";
import { EmptyState } from "../components/shared/EmptyState";
import { FieldShell, TextInput } from "../components/shared/Field";

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useLiveQuery(async () => db.projects.orderBy("updatedAt").reverse().toArray(), []);
  const [projectName, setProjectName] = useState("");

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    const project = await createProject(projectName.trim());
    setProjectName("");
    navigate(`/project/${project.id}`);
  };

  const handleSeedProject = async () => {
    const project = await seedSampleProject();
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-8 px-4 py-6 md:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel-strong overflow-hidden p-8">
          <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">Static-first Story Graph</div>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-tight">
            Build your world, structure your plot, and draft scenes without leaving the same graph.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
            Story OS on GitHub Pages keeps the entire MVP local-first. Your Bible, Board, Draft, search index,
            backlinks, and exports all live in the browser until you back them up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={handleSeedProject}>
              <Sparkles size={16} />
              Open Sample Project
            </Button>
            <Button variant="secondary" onClick={() => document.getElementById("new-project-name")?.focus()}>
              Start Blank
            </Button>
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-display text-3xl font-bold">Create New Project</h2>
          <div className="mt-6 space-y-4">
            <FieldShell label="Project Name" hint="Single-project writing flow, but you can keep multiple projects locally.">
              <TextInput
                id="new-project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="The Hollow Man"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreateProject();
                  }
                }}
              />
            </FieldShell>
            <div className="text-sm text-[color:var(--muted)]">
              This MVP does not use accounts or cloud sync. Export a `.storyos` backup from Settings to protect your work.
            </div>
            <Button className="w-full" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Projects</div>
            <h2 className="mt-2 font-display text-3xl font-bold">Your Local Library</h2>
          </div>
        </div>

        {!projects || projects.length === 0 ? (
          <EmptyState
            title="No stories yet"
            description="Create a blank project or seed the noir sample project to see the Bible, Board, Draft, and backup flow already wired together."
            action={
              <div className="flex gap-3">
                <Button onClick={handleSeedProject}>Load Sample</Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{project.format}</div>
                    <div className="mt-2 font-display text-2xl font-bold">{project.name}</div>
                    <div className="mt-2 text-sm text-[color:var(--muted)]">{project.genre || "No genre yet"}</div>
                    <div className="mt-3 text-xs text-[color:var(--muted)]">Updated {formatDateTime(project.updatedAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void duplicateProject(project.id)}>
                      <CopyPlus size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void deleteProject(project.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">{project.description || "No description yet."}</p>
                <div className="mt-5">
                  <Button onClick={() => navigate(`/project/${project.id}`)}>
                    <FolderOpen size={16} />
                    Open Project
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

