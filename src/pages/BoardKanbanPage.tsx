import { useMemo } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { StatusBadge } from "../components/shared/StatusBadge";
import { createDefaultActs, createEmptyDraft, createEmptyScene } from "../data/defaults";
import { deleteAct, deleteScene, saveAct, saveScene } from "../data/repository";
import { groupScenesByAct, getSceneArcs } from "../data/selectors";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { SceneDetailPanel } from "../features/board/SceneDetailPanel";

function SortableSceneCard({
  sceneId,
  title,
  summary,
  status,
  arcColors,
  onSelect,
}: {
  sceneId: string;
  title: string;
  summary: string;
  status: string;
  arcColors: string[];
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sceneId });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="w-full rounded-2xl border border-[color:var(--line)] bg-white/70 p-4 text-left shadow-sm transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold">{title || "Untitled Scene"}</div>
        <StatusBadge value={status} />
      </div>
      <div className="mt-2 text-sm text-[color:var(--muted)] line-clamp-3">{summary || "Add a one-line scene summary."}</div>
      <div className="mt-3 flex gap-1">
        {arcColors.map((color) => (
          <span key={`${sceneId}-${color}`} className="h-2 w-6 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </button>
  );
}

function ActDropZone({
  actId,
  children,
}: {
  actId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `act-drop-${actId}` });

  return (
    <div ref={setNodeRef} className={`min-h-[160px] rounded-2xl ${isOver ? "bg-sea-100/40 dark:bg-sea-900/20" : ""}`}>
      {children}
    </div>
  );
}

export function BoardKanbanPage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSceneId = searchParams.get("scene") ?? undefined;
  const sensors = useSensors(useSensor(PointerSensor));

  if (!snapshot) {
    return <EmptyState title="Loading board" description="Pulling scenes and acts from the story graph." />;
  }

  const grouped = groupScenesByAct(snapshot.acts, snapshot.scenes);

  const handleAddAct = async () => {
    const act = createDefaultActs(projectId)[0];
    act.name = `Act ${snapshot.acts.length + 1}`;
    act.sortOrder = snapshot.acts.length;
    await saveAct(act);
  };

  const handleAddScene = async (actId: string) => {
    const count = snapshot.scenes.filter((scene) => scene.actId === actId).length;
    const scene = createEmptyScene(projectId, actId, count);
    scene.title = `Scene ${snapshot.scenes.length + 1}`;
    await saveScene(scene);
    setSearchParams({ scene: scene.id });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeSceneId = event.active.id as string;
    const activeScene = snapshot.scenes.find((scene) => scene.id === activeSceneId);
    if (!activeScene || !event.over) {
      return;
    }

    const overId = event.over.id as string;
    const overScene = snapshot.scenes.find((scene) => scene.id === overId);
    const targetActId = overId.startsWith("act-drop-") ? overId.replace("act-drop-", "") : overScene?.actId ?? activeScene.actId;
    const targetScenes = snapshot.scenes
      .filter((scene) => scene.actId === targetActId && scene.id !== activeScene.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    const targetIndex = overScene ? targetScenes.findIndex((scene) => scene.id === overScene.id) : targetScenes.length;
    const reorderedTargetScenes = targetScenes.slice();
    reorderedTargetScenes.splice(targetIndex, 0, { ...activeScene, actId: targetActId });

    const sourceActId = activeScene.actId;
    const sourceScenes = snapshot.scenes
      .filter((scene) => scene.actId === sourceActId && scene.id !== activeScene.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    await Promise.all(
      reorderedTargetScenes.map((scene, index) =>
        saveScene({ ...scene, actId: targetActId, sortOrder: index }),
      ),
    );

    if (sourceActId !== targetActId) {
      await Promise.all(sourceScenes.map((scene, index) => saveScene({ ...scene, sortOrder: index })));
    }
  };

  const unresolvedForeshadowing = snapshot.foreshadowingPairs.filter(
    (pair) => pair.status === "planted" && !pair.payoffSceneId,
  ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Board</div>
            <h2 className="mt-2 font-display text-4xl font-bold">Kanban Outline</h2>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              {unresolvedForeshadowing} unresolved foreshadowing pair{unresolvedForeshadowing === 1 ? "" : "s"}
            </div>
          </div>
          <Button onClick={handleAddAct}>
            <Plus size={16} />
            Add Act
          </Button>
        </div>

        {grouped.length === 0 ? (
          <EmptyState title="No acts yet" description="Add an act to start structuring your scenes." />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto pb-4">
              {grouped.map(({ act, scenes }, actIndex) => (
                <div key={act.id} className="panel min-h-[520px] w-[320px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-full">
                      <input
                        value={act.name}
                        onChange={(event) => void saveAct({ ...act, name: event.target.value })}
                        className="w-full bg-transparent text-lg font-semibold outline-none"
                      />
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {scenes.length} scenes
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (scenes.length === 0) {
                          void deleteAct(act.id, projectId);
                        }
                      }}
                      disabled={scenes.length > 0}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <ActDropZone actId={act.id}>
                      <SortableContext items={scenes.map((scene) => scene.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {scenes.map((scene) => (
                            <SortableSceneCard
                              key={scene.id}
                              sceneId={scene.id}
                              title={scene.title}
                              summary={scene.summary}
                              status={scene.status}
                              arcColors={getSceneArcs(snapshot.arcs, snapshot.sceneArcTags, scene.id).map((arc) => arc.color)}
                              onSelect={() => setSearchParams({ scene: scene.id })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </ActDropZone>
                  </div>
                  <div className="mt-4">
                    <Button variant="secondary" className="w-full" onClick={() => void handleAddScene(act.id)}>
                      <Plus size={16} />
                      Add Scene
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DndContext>
        )}
      </section>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <SceneDetailPanel
          snapshot={snapshot}
          sceneId={selectedSceneId}
          onClose={() => setSearchParams({})}
        />
      </aside>
    </div>
  );
}
