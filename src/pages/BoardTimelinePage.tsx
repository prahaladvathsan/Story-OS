import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { detectArcGaps, getOrderedActs, getOrderedScenes, getSceneArcs } from "../data/selectors";
import { SceneDetailPanel } from "../features/board/SceneDetailPanel";
import { StatusBadge } from "../components/shared/StatusBadge";

type ColorMode = "arc" | "pov" | "tone" | "status";

export function BoardTimelinePage() {
  const { projectId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSceneId = searchParams.get("scene") ?? undefined;
  const [colorMode, setColorMode] = useState<ColorMode>("arc");
  const snapshot = useProjectSnapshot(projectId);

  if (!snapshot) {
    return <EmptyState title="Loading timeline" description="Ordering scenes across the story graph." />;
  }

  const acts = getOrderedActs(snapshot.acts);
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const gaps = detectArcGaps(snapshot);

  const colorForScene = (sceneId: string) => {
    const scene = snapshot.scenes.find((entry) => entry.id === sceneId);
    if (!scene) {
      return "#d7ccb0";
    }

    switch (colorMode) {
      case "pov": {
        const pov = snapshot.characters.find((character) => character.id === scene.povCharacterId);
        return pov ? "#d86511" : "#9a864c";
      }
      case "tone":
        return scene.emotionalTone === "tense"
          ? "#d86511"
          : scene.emotionalTone === "mysterious"
            ? "#2d788f"
            : scene.emotionalTone === "chaotic"
              ? "#7c340d"
              : "#9a864c";
      case "status":
        return scene.status === "final"
          ? "#477335"
          : scene.status === "drafted"
            ? "#2d788f"
            : scene.status === "outlined"
              ? "#9a864c"
              : "#d7ccb0";
      case "arc":
      default:
        return getSceneArcs(snapshot.arcs, snapshot.sceneArcTags, sceneId)[0]?.color ?? "#d7ccb0";
    }
  };

  const scenesByAct = acts.map((act) => ({
    act,
    scenes: scenes.filter((scene) => scene.actId === act.id),
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-6 overflow-hidden">
        <div className="panel p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Board</div>
              <h2 className="mt-2 font-display text-4xl font-bold">Timeline View</h2>
              <div className="mt-2 text-sm text-[color:var(--muted)]">Scan pacing, arc gaps, and scene runs in story order.</div>
            </div>
            <select value={colorMode} onChange={(event) => setColorMode(event.target.value as ColorMode)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm dark:bg-white/5">
              <option value="arc">Color by arc</option>
              <option value="pov">Color by POV</option>
              <option value="tone">Color by emotional tone</option>
              <option value="status">Color by status</option>
            </select>
          </div>
        </div>

        <div className="panel overflow-auto p-6">
          <div className="flex min-w-max gap-6">
            {scenesByAct.map(({ act, scenes: actScenes }) => (
              <div key={act.id} className="min-w-[280px] space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Act</div>
                  <div className="mt-2 font-display text-2xl font-bold">{act.name}</div>
                </div>
                <div className="space-y-4">
                  {actScenes.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setSearchParams({ scene: scene.id })}
                      className="w-full rounded-2xl border border-[color:var(--line)] bg-white/60 p-4 text-left dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold">{scene.title || "Untitled Scene"}</div>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorForScene(scene.id) }} />
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--muted)] line-clamp-3">{scene.summary || "No summary yet."}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge value={scene.status} />
                        {scene.emotionalTone ? <span className="rounded-full bg-black/5 px-2 py-1 text-xs dark:bg-white/10">{scene.emotionalTone}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Gap Detection</div>
          <h3 className="mt-2 font-display text-3xl font-bold">Arc Vanish Alerts</h3>
          <div className="mt-4 space-y-3">
            {gaps.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">No arc disappears for three or more consecutive scenes right now.</div>
            ) : (
              gaps.map((gap) => {
                const arc = snapshot.arcs.find((entry) => entry.id === gap.arcId);
                const startScene = snapshot.scenes.find((entry) => entry.id === gap.startSceneId);
                const endScene = snapshot.scenes.find((entry) => entry.id === gap.endSceneId);
                return (
                  <div key={`${gap.arcId}-${gap.startSceneId}`} className="rounded-2xl border border-[color:var(--line)] p-4">
                    <div className="font-semibold">{arc?.name}</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">
                      Missing for {gap.count} scenes, from {startScene?.title ?? "unknown"} through {endScene?.title ?? "unknown"}.
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <SceneDetailPanel snapshot={snapshot} sceneId={selectedSceneId} onClose={() => setSearchParams({})} />
      </aside>
    </div>
  );
}
