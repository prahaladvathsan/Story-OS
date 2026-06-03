import { useState } from "react";
import type { ProjectSnapshot } from "../../data/schema";
import { detectArcGaps, getActiveModules, getOrderedActs, getOrderedScenes, getSceneArcs } from "../../data/selectors";

type Props = {
  snapshot: ProjectSnapshot;
  selectedSceneId?: string;
  onSelectScene: (sceneId: string) => void;
};

type ColorMode = "status" | "pov" | "tone" | "arc";

const statusFallback: Record<string, string> = {
  idea: "#d7ccb0",
  outlined: "#9a864c",
  drafted: "#2d788f",
  revised: "#7c340d",
  final: "#477335",
};

const toneColors: Record<string, string> = {
  tense: "#d86511",
  mysterious: "#2d788f",
  chaotic: "#7c340d",
  intimate: "#9a864c",
  triumphant: "#477335",
  melancholic: "#4b6275",
  comedic: "#c9a431",
  peaceful: "#6b8e6a",
};

export function WriteTimeline({ snapshot, selectedSceneId, onSelectScene }: Props) {
  const modules = getActiveModules(snapshot.project);
  const availableModes: ColorMode[] = ["status", "pov", "tone"];
  if (modules.arcs) availableModes.push("arc");
  const [colorMode, setColorMode] = useState<ColorMode>("status");
  const acts = getOrderedActs(snapshot.acts);
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const arcGaps = modules.arcs ? detectArcGaps(snapshot) : [];

  const colorForScene = (sceneId: string) => {
    const scene = snapshot.scenes.find((entry) => entry.id === sceneId);
    if (!scene) return "#d7ccb0";

    switch (colorMode) {
      case "pov": {
        if (!scene.povCharacterId) return "#9a864c";
        // Stable hash → hue
        let hash = 0;
        for (let index = 0; index < scene.povCharacterId.length; index += 1) {
          hash = (hash * 31 + scene.povCharacterId.charCodeAt(index)) >>> 0;
        }
        return `hsl(${hash % 360}, 55%, 55%)`;
      }
      case "tone":
        return scene.emotionalTone ? toneColors[scene.emotionalTone] ?? "#9a864c" : "#d7ccb0";
      case "arc":
        return getSceneArcs(snapshot.arcs, snapshot.sceneArcTags, sceneId)[0]?.color ?? "#d7ccb0";
      case "status":
      default:
        return statusFallback[scene.status] ?? "#d7ccb0";
    }
  };

  const characterById = new Map(snapshot.characters.map((c) => [c.id, c]));

  return (
    <aside className="panel flex flex-col gap-3 p-4 xl:max-h-[calc(100vh-12rem)] xl:sticky xl:top-4">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Timeline</div>
        <div className="mt-1 text-sm font-semibold">{scenes.length} scenes in order</div>
      </div>

      <select
        value={colorMode}
        onChange={(event) => setColorMode(event.target.value as ColorMode)}
        className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-3 py-2 text-xs dark:bg-white/5"
      >
        {availableModes.map((mode) => (
          <option key={mode} value={mode}>
            Color by {mode}
          </option>
        ))}
      </select>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {scenes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-4 text-sm text-[color:var(--muted)]">
            No scenes yet. Switch to Outline to add one.
          </div>
        ) : (
          acts.map((act) => {
            const actScenes = scenes.filter((scene) => scene.actId === act.id);
            if (actScenes.length === 0) return null;
            return (
              <div key={act.id} className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">{act.name}</div>
                {actScenes.map((scene) => {
                  const pov = scene.povCharacterId ? characterById.get(scene.povCharacterId) : undefined;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => onSelectScene(scene.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border-l-4 px-2.5 py-2 text-left text-sm transition ${
                        selectedSceneId === scene.id
                          ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                          : "hover:bg-white/60 dark:hover:bg-white/10"
                      }`}
                      style={{ borderLeftColor: colorForScene(scene.id) }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{scene.title || "Untitled scene"}</div>
                        {colorMode === "pov" && pov ? (
                          <div className="truncate text-[10px] uppercase tracking-[0.18em] opacity-70">{pov.name}</div>
                        ) : null}
                        {colorMode === "tone" && scene.emotionalTone ? (
                          <div className="truncate text-[10px] uppercase tracking-[0.18em] opacity-70">{scene.emotionalTone}</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {arcGaps.length > 0 && colorMode === "arc" ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5">
          <div className="font-semibold">{arcGaps.length} arc gap{arcGaps.length === 1 ? "" : "s"} detected</div>
          <div className="mt-1 text-[color:var(--muted)]">An arc disappears for 3+ scenes in a row.</div>
        </div>
      ) : null}
    </aside>
  );
}
