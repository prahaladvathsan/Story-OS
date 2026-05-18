import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { FieldShell, Select, TextArea, TextInput } from "../components/shared/Field";
import { createEmptyArc } from "../data/defaults";
import { deleteArc, saveArc } from "../data/repository";
import { getArcCoverage, getOrderedScenes } from "../data/selectors";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";

export function BoardArcsPage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [newArcName, setNewArcName] = useState("");

  if (!snapshot) {
    return <EmptyState title="Loading arcs" description="Pulling narrative arcs and their scene tags." />;
  }

  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const coverage = getArcCoverage(snapshot);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
      <section className="space-y-4">
        {snapshot.arcs.length === 0 ? (
          <EmptyState title="No arcs yet" description="Create plot, character, relationship, or thematic arcs to track scene coverage." />
        ) : (
          coverage.map((entry) => (
            <div key={entry.arc.id} className="panel p-5">
              <div className="grid gap-4 xl:grid-cols-[0.45fr_0.55fr]">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: entry.arc.color }} />
                      <div className="font-display text-2xl font-bold">{entry.arc.name}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void deleteArc(entry.arc.id, projectId)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldShell label="Name">
                      <TextInput value={entry.arc.name} onChange={(event) => void saveArc({ ...entry.arc, name: event.target.value })} />
                    </FieldShell>
                    <FieldShell label="Type">
                      <Select value={entry.arc.arcType} onChange={(event) => void saveArc({ ...entry.arc, arcType: event.target.value as typeof entry.arc.arcType })}>
                        {["plot_a", "plot_b", "plot_c", "character_arc", "relationship_arc", "thematic_arc", "custom"].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </FieldShell>
                  </div>
                  <FieldShell label="Color">
                    <input type="color" value={entry.arc.color} onChange={(event) => void saveArc({ ...entry.arc, color: event.target.value })} className="h-12 w-24 rounded-xl border border-[color:var(--line)] bg-transparent" />
                  </FieldShell>
                  <FieldShell label="Description">
                    <TextArea value={entry.arc.description} onChange={(event) => void saveArc({ ...entry.arc, description: event.target.value })} />
                  </FieldShell>
                </div>

                <div className="rounded-3xl border border-[color:var(--line)] p-4">
                  <div className="text-sm font-semibold">Coverage</div>
                  <div className="mt-4 flex gap-2">
                    {orderedScenes.map((scene) => {
                      const included = entry.sceneIds.includes(scene.id);
                      return (
                        <div key={`${entry.arc.id}-${scene.id}`} className="group relative flex-1">
                          <div
                            className="h-3 rounded-full"
                            style={{ backgroundColor: included ? entry.arc.color : "rgba(0, 0, 0, 0.08)", opacity: included ? 1 : 0.2 }}
                          />
                          <div className="mt-2 text-[11px] text-[color:var(--muted)] line-clamp-2">{scene.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <aside className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">New Arc</div>
        <h2 className="mt-2 font-display text-3xl font-bold">Track a throughline</h2>
        <div className="mt-5 space-y-4">
          <FieldShell label="Arc Name">
            <TextInput value={newArcName} onChange={(event) => setNewArcName(event.target.value)} placeholder="A-Plot: Investigation" />
          </FieldShell>
          <Button
            className="w-full"
            onClick={async () => {
              const arc = createEmptyArc(projectId, snapshot.arcs.length);
              arc.name = newArcName.trim() || `Arc ${snapshot.arcs.length + 1}`;
              await saveArc(arc);
              setNewArcName("");
            }}
          >
            <Plus size={16} />
            Create Arc
          </Button>
        </div>
      </aside>
    </div>
  );
}
