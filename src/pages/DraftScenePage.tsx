import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Search, WandSparkles } from "lucide-react";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { createEmptyDraft, createEmptyEntity } from "../data/defaults";
import { getActiveModules, getContinuityContext, getEntityByType, getOrderedScenes, searchProjectContent } from "../data/selectors";
import { saveEntity, saveSceneDraft } from "../data/repository";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { useAutosave } from "../hooks/useAutosave";
import { useHotkeys } from "../hooks/useHotkeys";
import { useUiStore } from "../store/ui-store";
import { createEditorExtensions, insertScreenplayType } from "../features/draft/extensions";
import type { SceneDraft, StoryEntity, StoryEntityType } from "../data/schema";
import { StatusBadge } from "../components/shared/StatusBadge";

type SidebarTab = "context" | "search";

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

export function DraftScenePage() {
  const navigate = useNavigate();
  const { projectId = "", sceneId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);
  const [draftState, setDraftState] = useState<SceneDraft | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("context");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedEntity, setFocusedEntity] = useState<{ entityType: StoryEntityType; entityId: string } | null>(null);
  const hydratedSceneId = useRef<string>();
  const orderedScenes = snapshot ? getOrderedScenes(snapshot.acts, snapshot.scenes) : [];
  const sceneIndex = orderedScenes.findIndex((scene) => scene.id === sceneId);
  const scene = orderedScenes[sceneIndex];
  const previousScene = sceneIndex > 0 ? orderedScenes[sceneIndex - 1] : undefined;
  const nextScene = sceneIndex >= 0 && sceneIndex < orderedScenes.length - 1 ? orderedScenes[sceneIndex + 1] : undefined;

  useEffect(() => {
    if (!scene || !snapshot) {
      return;
    }

    const existingDraft = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
    setDraftState(existingDraft ?? createEmptyDraft(scene.id, snapshot.project.settings.defaultManuscriptMode));
  }, [scene, snapshot]);

  const modules = snapshot ? getActiveModules(snapshot.project) : undefined;
  const enabledTypes = useMemo<StoryEntityType[]>(() => {
    const list: StoryEntityType[] = ["character", "location"];
    if (modules?.items) list.push("item");
    if (modules?.factions) list.push("faction");
    return list;
  }, [modules?.items, modules?.factions]);

  const mentionItems = useMemo(
    () =>
      snapshot
        ? [
            ...snapshot.characters.map((entity) => ({ id: entity.id, label: entity.name, entityType: "character" as const })),
            ...snapshot.locations.map((entity) => ({ id: entity.id, label: entity.name, entityType: "location" as const })),
            ...(modules?.items
              ? snapshot.items.map((entity) => ({ id: entity.id, label: entity.name, entityType: "item" as const }))
              : []),
            ...(modules?.factions
              ? snapshot.factions.map((entity) => ({ id: entity.id, label: entity.name, entityType: "faction" as const }))
              : []),
          ]
        : [],
    [snapshot, modules?.items, modules?.factions],
  );

  const handleCreateEntity = useCallback(
    async (entityType: StoryEntityType, name: string) => {
      const entity = createEmptyEntity(projectId, entityType) as StoryEntity;
      entity.name = name;
      const saved = await saveEntity(entityType, entity);
      return { id: saved.id, label: saved.name, entityType };
    },
    [projectId],
  );

  const editor = useEditor(
    {
      extensions: createEditorExtensions(mentionItems, handleCreateEntity, enabledTypes),
      content: draftState?.content ?? emptyEditorContent,
      autofocus: false,
      editorProps: {
        attributes: {
          class: "tiptap text-[15px] leading-7",
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        setDraftState((current) =>
          current
            ? {
                ...current,
                content: currentEditor.getJSON(),
              }
            : current,
        );
      },
    },
    [sceneId],
  );

  useEffect(() => {
    if (!editor || !draftState || hydratedSceneId.current === sceneId) {
      return;
    }

    editor.commands.setContent(draftState.content ?? emptyEditorContent, false);
    hydratedSceneId.current = sceneId;
  }, [draftState, editor, sceneId]);

  const autosaveStatus = useAutosave(
    draftState,
    async (value) => {
      if (value) {
        await saveSceneDraft(value);
      }
    },
    3000,
    Boolean(draftState),
  );

  useHotkeys([
    {
      key: "s",
      meta: true,
      handler: (event) => {
        event.preventDefault();
        if (draftState) {
          void saveSceneDraft(draftState);
        }
      },
    },
  ]);

  if (!snapshot) {
    return <EmptyState title="Loading draft" description="Pulling the scene draft and continuity context." />;
  }

  if (!scene || !draftState) {
    return <EmptyState title="Scene not found" description="Pick a scene from the board to open its draft." />;
  }

  const continuity = getContinuityContext(snapshot, scene.id);
  const quickViewEntity = focusedEntity
    ? getEntityByType(snapshot, focusedEntity.entityType, focusedEntity.entityId)
    : undefined;
  const searchResults =
    searchQuery.trim() && sidebarTab === "search" ? searchProjectContent(snapshot, searchQuery).slice(0, 10) : [];
  const foreshadowingPairs = snapshot.foreshadowingPairs.filter(
    (pair) => pair.setupSceneId === scene.id || pair.payoffSceneId === scene.id,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Draft</div>
            <h2 className="mt-2 font-display text-4xl font-bold">{scene.title || "Untitled Scene"}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={scene.status} />
              {scene.slugLine ? <span className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">{scene.slugLine}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {previousScene ? (
              <Link to={`/project/${projectId}/draft/${previousScene.id}`}>
                <Button variant="secondary" size="sm">
                  <ArrowLeft size={16} />
                  Previous
                </Button>
              </Link>
            ) : null}
            {nextScene ? (
              <Link to={`/project/${projectId}/draft/${nextScene.id}`}>
                <Button variant="secondary" size="sm">
                  Next
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => draftState && void saveSceneDraft(draftState)}>
              <Save size={16} />
              Save
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={draftState.manuscriptMode}
            onChange={(event) =>
              setDraftState({
                ...draftState,
                manuscriptMode: event.target.value as SceneDraft["manuscriptMode"],
              })
            }
            className="rounded-full border border-[color:var(--line)] bg-white/60 px-4 py-2 text-sm dark:bg-white/5"
          >
            <option value="prose">Prose mode</option>
            <option value="screenplay">Screenplay mode</option>
          </select>
          {draftState.manuscriptMode === "screenplay"
            ? screenplayButtons.map(([value, label]) => (
                <Button key={value} variant="secondary" size="sm" onClick={() => insertScreenplayType(editor, value)}>
                  {label}
                </Button>
              ))
            : null}
          <div className="ml-auto text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {autosaveStatus} • {draftState.wordCount} words
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-[color:var(--line)] bg-white/80 p-6 dark:bg-ink-900/60">
          <EditorContent editor={editor} />
        </div>
      </section>

      <aside className="panel p-5">
        <div className="flex gap-2">
          <Button variant={sidebarTab === "context" ? "primary" : "secondary"} size="sm" onClick={() => setSidebarTab("context")}>
            Context
          </Button>
          <Button variant={sidebarTab === "search" ? "primary" : "secondary"} size="sm" onClick={() => setSidebarTab("search")}>
            Search
          </Button>
        </div>

        {sidebarTab === "context" ? (
          <div className="mt-5 space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Scene Metadata</div>
              <div className="mt-3 space-y-2 text-sm">
                <div>POV: {snapshot.characters.find((character) => character.id === scene.povCharacterId)?.name ?? "Not set"}</div>
                <div>Location: {snapshot.locations.find((location) => location.id === scene.locationId)?.name ?? "Not set"}</div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Characters Present</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {continuity?.charactersPresent.map((character) => (
                  <button key={character.id} type="button" className="rounded-full bg-black/5 px-3 py-1 text-sm dark:bg-white/10" onClick={() => setFocusedEntity({ entityType: "character", entityId: character.id })}>
                    {character.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Items in Play</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {continuity?.itemsInPlay.length ? (
                  continuity.itemsInPlay.map((item) => (
                    <button key={item.id} type="button" className="rounded-full bg-black/5 px-3 py-1 text-sm dark:bg-white/10" onClick={() => setFocusedEntity({ entityType: "item", entityId: item.id })}>
                      {item.name}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-[color:var(--muted)]">No tagged items.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Active Arcs</div>
              <div className="mt-3 space-y-2">
                {continuity?.activeArcs.length ? (
                  continuity.activeArcs.map((arc) => (
                    <div key={arc.id} className="flex items-center gap-2 text-sm">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: arc.color }} />
                      {arc.name}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[color:var(--muted)]">No arc tags on this scene.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Recent Context</div>
              <div className="mt-3 rounded-2xl border border-[color:var(--line)] p-4 text-sm">
                {continuity?.previousScene ? (
                  <>
                    <div className="font-semibold">{continuity.previousScene.title}</div>
                    <div className="mt-2 text-[color:var(--muted)]">{continuity.previousScene.summary || "No summary yet."}</div>
                  </>
                ) : (
                  <div className="text-[color:var(--muted)]">This is the first scene in the story order.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Foreshadowing Reminder</div>
              <div className="mt-3 space-y-2">
                {foreshadowingPairs.length ? (
                  foreshadowingPairs.map((pair) => (
                    <div key={pair.id} className="rounded-2xl border border-[color:var(--line)] p-4 text-sm">
                      <div className="font-semibold">{pair.label}</div>
                      <div className="mt-1 text-[color:var(--muted)]">
                        {pair.setupSceneId === scene.id ? pair.setupDescription : pair.payoffDescription}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[color:var(--muted)]">No setup or payoff markers on this scene.</div>
                )}
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => openQuickCapture("character")}>
              <WandSparkles size={16} />
              Quick Capture
            </Button>

            {quickViewEntity ? (
              <div className="rounded-3xl border border-[color:var(--line)] p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Quick View</div>
                <div className="mt-2 font-display text-2xl font-bold">{quickViewEntity.name}</div>
                <div className="mt-3 text-sm text-[color:var(--muted)]">
                  {quickViewEntity.description || quickViewEntity.notes}
                </div>
                <div className="mt-4">
                  <Link to={`/project/${projectId}/bible/${focusedEntity?.entityType}/${quickViewEntity.id}`}>
                    <Button size="sm">Open in Bible</Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={16} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search entities and manuscript..."
                className="w-full rounded-2xl border border-[color:var(--line)] bg-white/70 py-3 pl-10 pr-4 text-sm outline-none dark:bg-white/5"
              />
            </div>
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">
                  {searchQuery.trim() ? "No results for that search yet." : "Start typing to search the current project."}
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => navigate(result.route)}
                    className="w-full rounded-2xl border border-[color:var(--line)] px-4 py-3 text-left"
                  >
                    <div className="font-semibold">{result.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{result.kind}</div>
                    <div className="mt-2 text-sm text-[color:var(--muted)] line-clamp-2">{result.text}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
