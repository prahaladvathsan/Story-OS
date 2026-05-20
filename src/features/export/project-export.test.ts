import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../data/db";
import { createSampleProject } from "../../data/defaults";
import { loadProjectSnapshot } from "../../data/repository";
import type { ProjectSnapshot } from "../../data/schema";
import { createProjectBackup, importProjectBackup } from "./project-export";

function createSnapshot(): ProjectSnapshot {
  const sample = createSampleProject();

  return {
    ...sample,
    assets: [],
    entityMentions: [],
    uiState: [],
    recentEdits: [],
  };
}

describe("project backup export/import", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("round-trips a project snapshot through a .storyos backup", async () => {
    const snapshot = createSnapshot();
    const backup = await createProjectBackup(snapshot);
    const file = new File([backup], "sample.storyos", { type: "application/zip" });

    const importedProjectId = await importProjectBackup(file);
    const restored = await loadProjectSnapshot(importedProjectId);

    expect(restored?.project.name).toBe(snapshot.project.name);
    expect(restored?.characters.map((character) => character.name).sort()).toEqual(
      snapshot.characters.map((character) => character.name).sort(),
    );
    expect(restored?.scenes.map((scene) => scene.title)).toEqual(snapshot.scenes.map((scene) => scene.title));
    expect(restored?.sceneDrafts).toHaveLength(snapshot.sceneDrafts.length);
    expect(restored?.arcs).toHaveLength(snapshot.arcs.length);
    expect(restored?.foreshadowingPairs).toHaveLength(snapshot.foreshadowingPairs.length);
  });
});
