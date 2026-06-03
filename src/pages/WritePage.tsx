import { useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BookOpenText, Clock, List, PenLine } from "lucide-react";
import { EmptyState } from "../components/shared/EmptyState";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { SceneDetailPanel } from "../features/board/SceneDetailPanel";
import { WriteOutline } from "../features/write/WriteOutline";
import { WriteTimeline } from "../features/write/WriteTimeline";
import { WriteSceneEditor } from "../features/write/WriteSceneEditor";
import { WriteScrollEditor } from "../features/write/WriteScrollEditor";
import { WritePulseStrip } from "../features/write/WritePulseStrip";
import { getOrderedScenes } from "../data/selectors";

type WriteMode = "single" | "scroll";
type LeftPane = "outline" | "timeline";

function isWriteMode(value: string | null): value is WriteMode {
  return value === "single" || value === "scroll";
}

function isLeftPane(value: string | null): value is LeftPane {
  return value === "outline" || value === "timeline";
}

export function WritePage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [searchParams, setSearchParams] = useSearchParams();
  const sceneFromUrl = searchParams.get("scene") ?? undefined;
  const modeParam = searchParams.get("mode");
  const mode: WriteMode = isWriteMode(modeParam) ? modeParam : "single";
  const leftParam = searchParams.get("left");
  const leftPane: LeftPane = isLeftPane(leftParam) ? leftParam : "outline";

  const updateParams = useCallback(
    (next: { scene?: string; mode?: WriteMode; left?: LeftPane }, replace = false) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next.scene !== undefined) {
            if (next.scene) params.set("scene", next.scene);
            else params.delete("scene");
          }
          if (next.mode !== undefined) {
            params.set("mode", next.mode);
          }
          if (next.left !== undefined) {
            params.set("left", next.left);
          }
          return params;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!snapshot || sceneFromUrl) return;
    const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
    if (scenes.length > 0) {
      updateParams({ scene: scenes[0].id }, true);
    }
  }, [snapshot, sceneFromUrl, updateParams]);

  if (!snapshot) {
    return (
      <EmptyState
        title="Loading workspace"
        description="Gathering acts, scenes, and entities from this project."
      />
    );
  }

  const handleSelectScene = (sceneId: string) => updateParams({ scene: sceneId });
  const handleSetMode = (next: WriteMode) => updateParams({ mode: next });
  const handleSetLeft = (next: LeftPane) => updateParams({ left: next });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <WritePulseStrip snapshot={snapshot} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <div className="flex gap-1 rounded-full border border-[color:var(--line)] bg-white/40 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => handleSetLeft("outline")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                leftPane === "outline"
                  ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                  : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
              }`}
            >
              <List size={14} />
              Outline
            </button>
            <button
              type="button"
              onClick={() => handleSetLeft("timeline")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                leftPane === "timeline"
                  ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                  : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
              }`}
            >
              <Clock size={14} />
              Timeline
            </button>
          </div>
          <div className="flex gap-1 rounded-full border border-[color:var(--line)] bg-white/40 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => handleSetMode("single")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                mode === "single"
                  ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                  : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
              }`}
            >
              <PenLine size={14} />
              Single
            </button>
            <button
              type="button"
              onClick={() => handleSetMode("scroll")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                mode === "scroll"
                  ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                  : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
              }`}
            >
              <BookOpenText size={14} />
              Manuscript
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_400px]">
        {leftPane === "timeline" ? (
          <WriteTimeline
            snapshot={snapshot}
            selectedSceneId={sceneFromUrl}
            onSelectScene={handleSelectScene}
          />
        ) : (
          <WriteOutline
            snapshot={snapshot}
            selectedSceneId={sceneFromUrl}
            onSelectScene={handleSelectScene}
          />
        )}

        <div className="min-w-0">
          {mode === "scroll" ? (
            <WriteScrollEditor
              snapshot={snapshot}
              focusedSceneId={sceneFromUrl}
              onFocusScene={handleSelectScene}
            />
          ) : (
            <WriteSceneEditor key={sceneFromUrl ?? "empty"} snapshot={snapshot} sceneId={sceneFromUrl} />
          )}
        </div>

        <div className="xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto xl:sticky xl:top-4">
          <SceneDetailPanel snapshot={snapshot} sceneId={sceneFromUrl} />
        </div>
      </div>
    </div>
  );
}
