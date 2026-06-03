import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectSnapshot, Scene } from "../../data/schema";
import { getActiveModules } from "../../data/selectors";
import { replaceSceneArcTags, saveScene } from "../../data/repository";
import { Button } from "../../components/shared/Button";
import { FieldShell, Select, TextArea, TextInput } from "../../components/shared/Field";
import { LinkifiedText } from "../../components/shared/LinkifiedText";
import { useAutosave } from "../../hooks/useAutosave";
import { StatusBadge } from "../../components/shared/StatusBadge";

type SceneDetailPanelProps = {
  snapshot: ProjectSnapshot;
  sceneId?: string;
  onClose?: () => void;
};

export function SceneDetailPanel({ snapshot, sceneId, onClose }: SceneDetailPanelProps) {
  const scene = snapshot.scenes.find((entry) => entry.id === sceneId);
  const [draft, setDraft] = useState<Scene | null>(scene ?? null);
  const [selectedArcIds, setSelectedArcIds] = useState<string[]>([]);

  useEffect(() => {
    setDraft(scene ?? null);
    if (scene) {
      setSelectedArcIds(snapshot.sceneArcTags.filter((tag) => tag.sceneId === scene.id).map((tag) => tag.arcId));
    }
  }, [scene, snapshot.sceneArcTags]);

  const autosaveStatus = useAutosave(
    draft,
    async (value) => {
      if (value && value.title.trim()) {
        await saveScene(value);
      }
    },
    800,
    Boolean(draft),
  );

  const foreshadowing = useMemo(
    () =>
      snapshot.foreshadowingPairs.filter((pair) => pair.setupSceneId === sceneId || pair.payoffSceneId === sceneId),
    [sceneId, snapshot.foreshadowingPairs],
  );

  if (!draft) {
    return (
      <div className="panel p-6">
        <div className="text-sm text-[color:var(--muted)]">Select a scene to inspect its metadata and jump into the draft.</div>
      </div>
    );
  }

  const modules = getActiveModules(snapshot.project);

  const toggleArrayValue = (items: string[], value: string) =>
    items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

  const toggleArcTag = (arcId: string) => {
    const nextArcIds = toggleArrayValue(selectedArcIds, arcId);
    setSelectedArcIds(nextArcIds);
    void replaceSceneArcTags(draft.id, nextArcIds);
  };

  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Scene Detail</div>
          <h3 className="mt-2 font-display text-3xl font-bold">{draft.title || "Untitled Scene"}</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{autosaveStatus}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge value={draft.status} />
        <Link to={`/project/${snapshot.project.id}/draft/${draft.id}`}>
          <Button size="sm">Open in Draft</Button>
        </Link>
        {onClose ? (
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        <FieldShell label="Title">
          <TextInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </FieldShell>
        <FieldShell label="Slug Line">
          <TextInput value={draft.slugLine} onChange={(event) => setDraft({ ...draft, slugLine: event.target.value })} />
        </FieldShell>
        <FieldShell label="Summary" hint="Use [[Name]] to link a wiki entry.">
          <LinkifiedText
            value={draft.summary}
            onChange={(value) => setDraft({ ...draft, summary: value })}
            snapshot={snapshot}
          />
        </FieldShell>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldShell label="POV Character">
            <Select value={draft.povCharacterId ?? ""} onChange={(event) => setDraft({ ...draft, povCharacterId: event.target.value || undefined })}>
              <option value="">None</option>
              {snapshot.characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell label="Location">
            <Select value={draft.locationId ?? ""} onChange={(event) => setDraft({ ...draft, locationId: event.target.value || undefined })}>
              <option value="">None</option>
              {snapshot.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </FieldShell>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Emotional Tone">
            <Select value={draft.emotionalTone ?? ""} onChange={(event) => setDraft({ ...draft, emotionalTone: (event.target.value || undefined) as Scene["emotionalTone"] })}>
              <option value="">None</option>
              {["tense", "comedic", "intimate", "triumphant", "melancholic", "chaotic", "mysterious", "peaceful"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FieldShell>
          <FieldShell label="Story Function">
            <Select value={draft.storyFunction ?? ""} onChange={(event) => setDraft({ ...draft, storyFunction: (event.target.value || undefined) as Scene["storyFunction"] })}>
              <option value="">None</option>
              {["setup", "escalation", "climax", "resolution", "breather", "twist", "reveal", "transition"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FieldShell>
        </div>

        <FieldShell label="Status">
          <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Scene["status"] })}>
            {["idea", "outlined", "drafted", "revised", "final"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FieldShell>

        <div className={`grid gap-4 ${modules.items ? "md:grid-cols-2" : ""}`}>
          <div className="rounded-2xl border border-[color:var(--line)] p-4">
            <div className="text-sm font-semibold">Characters Present</div>
            <div className="mt-3 grid gap-2">
              {snapshot.characters.map((character) => (
                <label key={character.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.charactersPresent.includes(character.id)}
                    onChange={() => setDraft({ ...draft, charactersPresent: toggleArrayValue(draft.charactersPresent, character.id) })}
                  />
                  {character.name}
                </label>
              ))}
            </div>
          </div>
          {modules.items ? (
            <div className="rounded-2xl border border-[color:var(--line)] p-4">
              <div className="text-sm font-semibold">Items Involved</div>
              <div className="mt-3 grid gap-2">
                {snapshot.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.itemsInvolved.includes(item.id)}
                      onChange={() => setDraft({ ...draft, itemsInvolved: toggleArrayValue(draft.itemsInvolved, item.id) })}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {modules.arcs ? (
          <div className="rounded-2xl border border-[color:var(--line)] p-4">
            <div className="text-sm font-semibold">Arc Tags</div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {snapshot.arcs.map((arc) => (
                <label key={arc.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedArcIds.includes(arc.id)}
                    onChange={() => toggleArcTag(arc.id)}
                  />
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: arc.color }} />
                  {arc.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <FieldShell label="Notes" hint="Use [[Name]] to link a wiki entry.">
          <LinkifiedText
            value={draft.notes}
            onChange={(value) => setDraft({ ...draft, notes: value })}
            snapshot={snapshot}
          />
        </FieldShell>

        {foreshadowing.length > 0 ? (
          <div className="rounded-2xl border border-[color:var(--line)] p-4">
            <div className="text-sm font-semibold">Foreshadowing hooks</div>
            <div className="mt-3 space-y-2">
              {foreshadowing.map((pair) => (
                <div key={pair.id} className="rounded-2xl bg-white/40 px-3 py-2 text-sm dark:bg-white/5">
                  <div className="font-semibold">{pair.label}</div>
                  <div className="text-[color:var(--muted)]">
                    {pair.setupSceneId === sceneId ? "Setup" : "Payoff"} • {pair.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
