import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmptyDraft, createEmptyEntity, createEmptyScene } from "../../data/defaults";
import { useProjectSnapshot } from "../../hooks/useProjectSnapshot";
import { useUiStore } from "../../store/ui-store";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { FieldShell, Select, TextArea, TextInput } from "../shared/Field";
import { createId, nowIso } from "../../lib/utils";
import { saveEntity, saveScene, saveSceneDraft } from "../../data/repository";

export function QuickCaptureModal() {
  const navigate = useNavigate();
  const activeProjectId = useUiStore((state) => state.activeProjectId);
  const quickCaptureOpen = useUiStore((state) => state.quickCaptureOpen);
  const quickCaptureType = useUiStore((state) => state.quickCaptureType);
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);
  const closeQuickCapture = useUiStore((state) => state.closeQuickCapture);
  const snapshot = useProjectSnapshot(activeProjectId);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const orderedActs = useMemo(
    () => (snapshot?.acts ?? []).slice().sort((left, right) => left.sortOrder - right.sortOrder),
    [snapshot?.acts],
  );

  const reset = () => {
    setName("");
    setNotes("");
  };

  const handleClose = () => {
    reset();
    closeQuickCapture();
  };

  const handleCreate = async () => {
    if (!activeProjectId || !name.trim()) {
      return;
    }

    if (quickCaptureType === "scene") {
      const act = orderedActs[orderedActs.length - 1];
      if (!act) {
        return;
      }

      const existingSceneCount = snapshot?.scenes.filter((scene) => scene.actId === act.id).length ?? 0;
      const scene = {
        ...createEmptyScene(activeProjectId, act.id, existingSceneCount),
        title: name.trim(),
        notes: notes.trim(),
        updatedAt: nowIso(),
      };
      await saveScene(scene);
      await saveSceneDraft(createEmptyDraft(scene.id, snapshot?.project.settings.defaultManuscriptMode ?? "prose"));
      handleClose();
      navigate(`/project/${activeProjectId}/draft/${scene.id}`);
      return;
    }

    const entity = createEmptyEntity(activeProjectId, quickCaptureType);
    entity.name = name.trim();
    entity.notes = notes.trim();
    entity.updatedAt = nowIso();
    await saveEntity(quickCaptureType, entity);
    handleClose();
    navigate(`/project/${activeProjectId}/bible/${quickCaptureType}/${entity.id}`);
  };

  return (
    <Modal
      open={quickCaptureOpen}
      onClose={handleClose}
      title="Quick Capture"
      description="Create a lightweight node in the story graph without breaking your flow."
    >
      {!activeProjectId ? (
        <div className="text-sm text-[color:var(--muted)]">Open a project to use quick capture.</div>
      ) : (
        <div className="space-y-4">
          <FieldShell label="Create">
            <Select value={quickCaptureType} onChange={(event) => openQuickCapture(event.target.value as typeof quickCaptureType)}>
              <option value="character">Character</option>
              <option value="location">Location</option>
              <option value="item">Item</option>
              <option value="faction">Faction</option>
              <option value="scene">Scene</option>
            </Select>
          </FieldShell>
          <FieldShell label="Name">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Detective Joe" />
          </FieldShell>
          <FieldShell label="Notes">
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Any loose idea, clue, or context." />
          </FieldShell>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

