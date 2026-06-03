import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Save } from "lucide-react";
import { EmptyState } from "../../components/shared/EmptyState";
import { Button } from "../../components/shared/Button";
import { createEmptyDraft, createEmptyEntity } from "../../data/defaults";
import { saveEntity, saveSceneDraft } from "../../data/repository";
import { getActiveModules } from "../../data/selectors";
import { useAutosave } from "../../hooks/useAutosave";
import { createEditorExtensions, insertScreenplayType } from "../draft/extensions";
import type { ProjectSnapshot, SceneDraft, StoryEntity, StoryEntityType } from "../../data/schema";

const screenplayButtons = [
  ["scene-heading", "Scene"],
  ["action", "Action"],
  ["character", "Character"],
  ["dialogue", "Dialogue"],
  ["parenthetical", "Paren"],
  ["transition", "Transition"],
] as const;

const emptyEditorContent = {
  type: "doc",
  content: [{ type: "paragraph", attrs: { screenplayType: "action" } }],
};

type Props = {
  snapshot: ProjectSnapshot;
  sceneId?: string;
};

export function WriteSceneEditor({ snapshot, sceneId }: Props) {
  const scene = sceneId ? snapshot.scenes.find((entry) => entry.id === sceneId) : undefined;
  const initialDraft = useMemo(() => {
    if (!scene) return null;
    const existing = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
    return existing ?? createEmptyDraft(scene.id, snapshot.project.settings.defaultManuscriptMode);
  }, [scene, snapshot.sceneDrafts, snapshot.project.settings.defaultManuscriptMode]);

  const [draftState, setDraftState] = useState<SceneDraft | null>(initialDraft);
  const draftStateRef = useRef(draftState);
  useEffect(() => {
    draftStateRef.current = draftState;
  }, [draftState]);

  // Flush unsaved edits when component unmounts (scene switch or mode change).
  useEffect(() => {
    return () => {
      const current = draftStateRef.current;
      if (current) void saveSceneDraft(current);
    };
  }, []);

  const modules = getActiveModules(snapshot.project);
  const enabledTypes = useMemo<StoryEntityType[]>(() => {
    const list: StoryEntityType[] = ["character", "location"];
    if (modules.items) list.push("item");
    if (modules.factions) list.push("faction");
    return list;
  }, [modules.items, modules.factions]);

  const mentionItems = useMemo(
    () => [
      ...snapshot.characters.map((entity) => ({ id: entity.id, label: entity.name, entityType: "character" as const })),
      ...snapshot.locations.map((entity) => ({ id: entity.id, label: entity.name, entityType: "location" as const })),
      ...(modules.items
        ? snapshot.items.map((entity) => ({ id: entity.id, label: entity.name, entityType: "item" as const }))
        : []),
      ...(modules.factions
        ? snapshot.factions.map((entity) => ({ id: entity.id, label: entity.name, entityType: "faction" as const }))
        : []),
    ],
    [snapshot.characters, snapshot.locations, snapshot.items, snapshot.factions, modules.items, modules.factions],
  );

  const projectId = snapshot.project.id;
  const handleCreateEntity = useCallback(
    async (entityType: StoryEntityType, name: string) => {
      const entity = createEmptyEntity(projectId, entityType) as StoryEntity;
      entity.name = name;
      const saved = await saveEntity(entityType, entity);
      return { id: saved.id, label: saved.name, entityType };
    },
    [projectId],
  );

  const editor = useEditor({
    extensions: createEditorExtensions(mentionItems, handleCreateEntity, enabledTypes),
    content: draftState?.content ?? emptyEditorContent,
    autofocus: "end",
    editorProps: {
      attributes: { class: "tiptap text-[15px] leading-7" },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setDraftState((current) =>
        current ? { ...current, content: currentEditor.getJSON() } : current,
      );
    },
  });

  const autosaveStatus = useAutosave(
    draftState,
    async (value) => {
      if (value) await saveSceneDraft(value);
    },
    1500,
    Boolean(draftState),
  );

  if (!sceneId) {
    return (
      <EmptyState
        title="Pick a scene to start writing"
        description="Select a scene from the outline on the left, or add a new act and scene."
      />
    );
  }

  if (!scene || !draftState) {
    return (
      <EmptyState
        title="Scene not found"
        description="That scene may have been deleted. Pick another from the outline."
      />
    );
  }

  const isScreenplay = draftState.manuscriptMode === "screenplay";

  return (
    <section className="panel flex min-h-[60vh] flex-col p-6">
      <div className="flex flex-col gap-3 border-b border-[color:var(--line)] pb-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Scene</div>
          <h2 className="mt-1 truncate font-display text-2xl font-bold">
            {scene.title || "Untitled scene"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draftState.manuscriptMode}
            onChange={(event) =>
              setDraftState({
                ...draftState,
                manuscriptMode: event.target.value as SceneDraft["manuscriptMode"],
              })
            }
            className="rounded-full border border-[color:var(--line)] bg-white/60 px-3 py-1.5 text-xs dark:bg-white/5"
          >
            <option value="prose">Prose</option>
            <option value="screenplay">Screenplay</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => draftState && void saveSceneDraft(draftState)}>
            <Save size={14} /> Save
          </Button>
          <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {autosaveStatus} · {draftState.wordCount} words
          </span>
        </div>
      </div>

      {isScreenplay ? (
        <div className="mt-4 flex flex-wrap gap-1">
          {screenplayButtons.map(([value, label]) => (
            <Button
              key={value}
              variant="secondary"
              size="sm"
              onClick={() => insertScreenplayType(editor, value)}
            >
              {label}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex-1 rounded-2xl border border-[color:var(--line)] bg-white/80 p-6 dark:bg-ink-900/60">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
