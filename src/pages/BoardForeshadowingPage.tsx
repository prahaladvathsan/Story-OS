import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { FieldShell, Select, TextArea, TextInput } from "../components/shared/Field";
import { StatusBadge } from "../components/shared/StatusBadge";
import { createEmptyForeshadowingPair } from "../data/defaults";
import { deleteForeshadowingPair, saveForeshadowingPair } from "../data/repository";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";

export function BoardForeshadowingPage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [draftLabel, setDraftLabel] = useState("");

  if (!snapshot) {
    return <EmptyState title="Loading foreshadowing" description="Pulling setup-payoff pairs from the story graph." />;
  }

  const filteredPairs = snapshot.foreshadowingPairs;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
      <section className="space-y-4">
        {filteredPairs.length === 0 ? (
          <EmptyState title="No foreshadowing pairs yet" description="Create a setup-payoff pair to track unresolved plants and eventual payoffs." />
        ) : (
          filteredPairs.map((pair) => (
            <div key={pair.id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-2xl font-bold">{pair.label}</div>
                  <div className="mt-2">
                    <StatusBadge value={pair.status} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void deleteForeshadowingPair(pair.id, projectId)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <FieldShell label="Setup Scene">
                  <Select value={pair.setupSceneId ?? ""} onChange={(event) => void saveForeshadowingPair({ ...pair, setupSceneId: event.target.value || undefined })}>
                    <option value="">Unassigned</option>
                    {snapshot.scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.title}
                      </option>
                    ))}
                  </Select>
                </FieldShell>
                <FieldShell label="Payoff Scene">
                  <Select value={pair.payoffSceneId ?? ""} onChange={(event) => void saveForeshadowingPair({ ...pair, payoffSceneId: event.target.value || undefined })}>
                    <option value="">Unassigned</option>
                    {snapshot.scenes.map((scene) => (
                      <option key={scene.id} value={scene.id}>
                        {scene.title}
                      </option>
                    ))}
                  </Select>
                </FieldShell>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <FieldShell label="Setup Description">
                  <TextArea value={pair.setupDescription} onChange={(event) => void saveForeshadowingPair({ ...pair, setupDescription: event.target.value })} />
                </FieldShell>
                <FieldShell label="Payoff Description">
                  <TextArea value={pair.payoffDescription} onChange={(event) => void saveForeshadowingPair({ ...pair, payoffDescription: event.target.value })} />
                </FieldShell>
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.3fr_0.7fr]">
                <FieldShell label="Status">
                  <Select value={pair.status} onChange={(event) => void saveForeshadowingPair({ ...pair, status: event.target.value as typeof pair.status })}>
                    {["planted", "paid_off", "abandoned", "red_herring"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FieldShell>
                <FieldShell label="Notes">
                  <TextArea value={pair.notes} onChange={(event) => void saveForeshadowingPair({ ...pair, notes: event.target.value })} />
                </FieldShell>
              </div>
            </div>
          ))
        )}
      </section>

      <aside className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">New Pair</div>
        <h2 className="mt-2 font-display text-3xl font-bold">Track a plant</h2>
        <div className="mt-5 space-y-4">
          <FieldShell label="Label">
            <TextInput value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} placeholder="The locked room key" />
          </FieldShell>
          <Button
            className="w-full"
            onClick={async () => {
              const pair = createEmptyForeshadowingPair(projectId);
              pair.label = draftLabel.trim() || `Foreshadowing ${snapshot.foreshadowingPairs.length + 1}`;
              await saveForeshadowingPair(pair);
              setDraftLabel("");
            }}
          >
            <Plus size={16} />
            Create Pair
          </Button>
        </div>
      </aside>
    </div>
  );
}
