import { useParams } from "react-router-dom";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/shared/Button";
import type { ProjectSnapshot, Scene } from "../../data/schema";
import { createDefaultActs, createEmptyDraft, createEmptyScene } from "../../data/defaults";
import { deleteAct, saveAct, saveScene, saveSceneDraft } from "../../data/repository";
import { groupScenesByAct } from "../../data/selectors";

type Props = {
  snapshot: ProjectSnapshot;
  selectedSceneId?: string;
  onSelectScene: (sceneId: string) => void;
};

const statusColor: Record<string, string> = {
  idea: "bg-[color:var(--muted)] opacity-40",
  outlined: "bg-amber-400",
  drafted: "bg-sky-500",
  revised: "bg-violet-500",
  final: "bg-emerald-500",
};

export function WriteOutline({ snapshot, selectedSceneId, onSelectScene }: Props) {
  const { projectId = "" } = useParams();
  const grouped = groupScenesByAct(snapshot.acts, snapshot.scenes);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
    await saveSceneDraft(createEmptyDraft(scene.id, snapshot.project.settings.defaultManuscriptMode));
    onSelectScene(scene.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeSceneId = event.active.id as string;
    const activeScene = snapshot.scenes.find((scene) => scene.id === activeSceneId);
    if (!activeScene || !event.over) return;

    const overId = event.over.id as string;
    const overScene = snapshot.scenes.find((scene) => scene.id === overId);
    const targetActId = overId.startsWith("act-drop-")
      ? overId.replace("act-drop-", "")
      : overScene?.actId ?? activeScene.actId;
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
      reorderedTargetScenes.map((scene, index) => saveScene({ ...scene, actId: targetActId, sortOrder: index })),
    );

    if (sourceActId !== targetActId) {
      await Promise.all(sourceScenes.map((scene, index) => saveScene({ ...scene, sortOrder: index })));
    }
  };

  return (
    <aside className="panel flex flex-col gap-3 p-4 xl:max-h-[calc(100vh-12rem)] xl:sticky xl:top-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Outline</div>
          <div className="mt-1 text-sm font-semibold">
            {snapshot.scenes.length} scene{snapshot.scenes.length === 1 ? "" : "s"}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleAddAct} title="Add act">
          <Plus size={14} /> Act
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-4 text-sm text-[color:var(--muted)]">
            Add an act to start outlining.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            {grouped.map(({ act, scenes }) => (
              <div
                key={act.id}
                className="rounded-2xl border border-[color:var(--line)] bg-white/40 p-3 dark:bg-white/5"
              >
                <div className="flex items-start gap-2">
                  <input
                    value={act.name}
                    onChange={(event) => void saveAct({ ...act, name: event.target.value })}
                    className="w-full min-w-0 bg-transparent text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-1 text-[color:var(--muted)] hover:text-red-500 disabled:opacity-30"
                    onClick={() => {
                      if (scenes.length === 0) {
                        void deleteAct(act.id, projectId);
                      }
                    }}
                    disabled={scenes.length > 0}
                    title={scenes.length > 0 ? "Move or delete scenes first" : "Delete empty act"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="mt-2 space-y-1">
                  <ActDropZone actId={act.id}>
                    <SortableContext items={scenes.map((scene) => scene.id)} strategy={verticalListSortingStrategy}>
                      {scenes.map((scene) => (
                        <SortableSceneRow
                          key={scene.id}
                          scene={scene}
                          selected={selectedSceneId === scene.id}
                          onSelect={() => onSelectScene(scene.id)}
                        />
                      ))}
                    </SortableContext>
                  </ActDropZone>
                  <button
                    type="button"
                    onClick={() => void handleAddScene(act.id)}
                    className="flex w-full items-center gap-1 rounded-xl px-2.5 py-1.5 text-left text-xs text-[color:var(--muted)] hover:bg-white/60 dark:hover:bg-white/10"
                  >
                    <Plus size={12} /> Scene
                  </button>
                </div>
              </div>
            ))}
          </DndContext>
        )}
      </div>
    </aside>
  );
}

function ActDropZone({ actId, children }: { actId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `act-drop-${actId}` });
  return (
    <div ref={setNodeRef} className={`min-h-[24px] rounded-xl ${isOver ? "bg-sea-100/40 dark:bg-sea-900/20" : ""}`}>
      {children}
    </div>
  );
}

function SortableSceneRow({
  scene,
  selected,
  onSelect,
}: {
  scene: Scene;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-1 rounded-xl px-1.5 py-1.5 text-sm transition ${
        isDragging ? "opacity-50" : ""
      } ${
        selected
          ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
          : "hover:bg-white/60 dark:hover:bg-white/10"
      }`}
    >
      <button
        type="button"
        className={`shrink-0 cursor-grab opacity-0 transition group-hover:opacity-60 ${
          selected ? "text-ink-50 dark:text-ink-900" : "text-[color:var(--muted)]"
        }`}
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={12} />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{scene.title || "Untitled scene"}</span>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${statusColor[scene.status] ?? statusColor.idea}`}
          title={scene.status}
        />
      </button>
    </div>
  );
}
