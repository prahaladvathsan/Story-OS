import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import { Plus } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { createEmptyDraft, createEmptyEntity, createEmptyScene } from "../../data/defaults";
import { getActiveModules, getOrderedActs, getOrderedScenes } from "../../data/selectors";
import { saveEntity, saveScene, saveSceneDraft } from "../../data/repository";
import { useAutosave } from "../../hooks/useAutosave";
import { createEditorExtensions, type CreateEntityCallback } from "../draft/extensions";
import type { ProjectSnapshot, Scene, SceneDraft, StoryEntity, StoryEntityType } from "../../data/schema";

type MentionItem = { id: string; label: string; entityType: StoryEntityType };

const emptyEditorContent = {
  type: "doc",
  content: [{ type: "paragraph", attrs: { screenplayType: "action" } }],
};

type Props = {
  snapshot: ProjectSnapshot;
  focusedSceneId?: string;
  onFocusScene: (sceneId: string) => void;
};

export function WriteScrollEditor({ snapshot, focusedSceneId, onFocusScene }: Props) {
  const { projectId = "" } = useParams();
  const acts = getOrderedActs(snapshot.acts);
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledTo = useRef<string | undefined>(undefined);

  const modules = getActiveModules(snapshot.project);
  const enabledTypes = useMemo<StoryEntityType[]>(() => {
    const list: StoryEntityType[] = ["character", "location"];
    if (modules.items) list.push("item");
    if (modules.factions) list.push("faction");
    return list;
  }, [modules.items, modules.factions]);

  const mentionItems: MentionItem[] = useMemo(
    () => [
      ...snapshot.characters.map((e) => ({ id: e.id, label: e.name, entityType: "character" as const })),
      ...snapshot.locations.map((e) => ({ id: e.id, label: e.name, entityType: "location" as const })),
      ...(modules.items
        ? snapshot.items.map((e) => ({ id: e.id, label: e.name, entityType: "item" as const }))
        : []),
      ...(modules.factions
        ? snapshot.factions.map((e) => ({ id: e.id, label: e.name, entityType: "faction" as const }))
        : []),
    ],
    [snapshot.characters, snapshot.locations, snapshot.items, snapshot.factions, modules.items, modules.factions],
  );

  const handleCreateEntity: CreateEntityCallback = useCallback(
    async (entityType, name) => {
      const entity = createEmptyEntity(projectId, entityType) as StoryEntity;
      entity.name = name;
      const saved = await saveEntity(entityType, entity);
      return { id: saved.id, label: saved.name, entityType };
    },
    [projectId],
  );

  useEffect(() => {
    if (focusedSceneId && focusedSceneId !== lastScrolledTo.current && focusedRef.current) {
      focusedRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
      lastScrolledTo.current = focusedSceneId;
    }
  }, [focusedSceneId]);

  const handleAddScene = async (actId: string) => {
    const count = snapshot.scenes.filter((s) => s.actId === actId).length;
    const scene = createEmptyScene(projectId, actId, count);
    scene.title = `Scene ${snapshot.scenes.length + 1}`;
    await saveScene(scene);
    await saveSceneDraft(createEmptyDraft(scene.id, snapshot.project.settings.defaultManuscriptMode));
    onFocusScene(scene.id);
  };

  if (scenes.length === 0) {
    return (
      <EmptyState
        title="Nothing to read yet"
        description="Add an act and a scene from the outline to start drafting."
      />
    );
  }

  return (
    <article className="panel space-y-8 p-6">
      <header className="border-b border-[color:var(--line)] pb-4">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Manuscript</div>
        <h2 className="mt-1 font-display text-3xl font-bold">{snapshot.project.name}</h2>
        <div className="mt-2 text-sm text-[color:var(--muted)]">
          Read top-to-bottom. Click into any block to edit. Edits autosave per scene.
        </div>
      </header>

      {acts.map((act) => {
        const actScenes = scenes.filter((s) => s.actId === act.id);
        if (actScenes.length === 0) return null;
        return (
          <section key={act.id} className="space-y-5">
            <h3 className="font-display text-2xl font-bold">{act.name}</h3>
            {actScenes.map((scene) => (
              <ScrollScene
                key={scene.id}
                ref={scene.id === focusedSceneId ? focusedRef : null}
                scene={scene}
                snapshot={snapshot}
                mentionItems={mentionItems}
                enabledTypes={enabledTypes}
                onCreateEntity={handleCreateEntity}
                isFocused={scene.id === focusedSceneId}
                onFocus={() => onFocusScene(scene.id)}
              />
            ))}
            <Button variant="ghost" size="sm" onClick={() => void handleAddScene(act.id)}>
              <Plus size={14} /> Add scene to {act.name}
            </Button>
          </section>
        );
      })}
    </article>
  );
}

type ScrollSceneProps = {
  scene: Scene;
  snapshot: ProjectSnapshot;
  mentionItems: MentionItem[];
  enabledTypes: StoryEntityType[];
  onCreateEntity: CreateEntityCallback;
  isFocused: boolean;
  onFocus: () => void;
};

const ScrollScene = forwardRef<HTMLDivElement, ScrollSceneProps>(function ScrollScene(
  { scene, snapshot, mentionItems, enabledTypes, onCreateEntity, isFocused, onFocus },
  ref,
) {
  const [draftState, setDraftState] = useState<SceneDraft | null>(() => {
    const existing = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
    return existing ?? createEmptyDraft(scene.id, snapshot.project.settings.defaultManuscriptMode);
  });
  const draftStateRef = useRef(draftState);
  useEffect(() => {
    draftStateRef.current = draftState;
  }, [draftState]);

  useEffect(() => {
    return () => {
      const current = draftStateRef.current;
      if (current) void saveSceneDraft(current);
    };
  }, []);

  const editor = useEditor({
    extensions: createEditorExtensions(mentionItems, onCreateEntity, enabledTypes),
    content: draftState?.content ?? emptyEditorContent,
    autofocus: false,
    editorProps: { attributes: { class: "tiptap text-[15px] leading-7" } },
    onFocus: () => onFocus(),
    onUpdate: ({ editor: currentEditor }) => {
      setDraftState((current) =>
        current ? { ...current, content: currentEditor.getJSON() } : current,
      );
    },
  });

  useAutosave(
    draftState,
    async (value) => {
      if (value) await saveSceneDraft(value);
    },
    2000,
    Boolean(draftState),
  );

  return (
    <div
      ref={ref}
      className={`scroll-mt-4 rounded-2xl border p-4 transition ${
        isFocused
          ? "border-ink-900/40 bg-white/80 dark:border-ink-50/40 dark:bg-ink-900/60"
          : "border-[color:var(--line)] bg-white/40 dark:bg-white/5"
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {scene.title || "Untitled scene"}
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {draftState?.wordCount ?? 0} words
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
