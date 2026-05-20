import { describe, expect, it } from "vitest";
import { createSampleProject } from "./defaults";
import type { ProjectSnapshot } from "./schema";
import {
  buildBacklinks,
  countDraftWords,
  detectArcGaps,
  extractMentionsFromContent,
  extractPlainText,
  getArcCoverage,
  getOrderedScenes,
  groupScenesByAct,
} from "./selectors";

function createSnapshot(): ProjectSnapshot {
  const sample = createSampleProject();

  return {
    ...sample,
    assets: [],
    entityMentions: sample.sceneDrafts.flatMap((draft) =>
      extractMentionsFromContent(draft.content).map((mention, index) => ({
        id: `mention-${index}`,
        projectId: sample.project.id,
        sceneDraftId: draft.id,
        entityType: mention.entityType,
        entityId: mention.entityId,
        label: mention.label,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      })),
    ),
    uiState: [],
    recentEdits: [],
  };
}

describe("story selectors", () => {
  it("orders and groups scenes by act order and scene sort order", () => {
    const snapshot = createSnapshot();
    const shuffledScenes = [snapshot.scenes[2], snapshot.scenes[0], snapshot.scenes[3], snapshot.scenes[1]];

    expect(getOrderedScenes(snapshot.acts, shuffledScenes).map((scene) => scene.title)).toEqual([
      "Joe Gets the Case",
      "Jazz Club Interrogation",
      "Warehouse Stakeout",
      "Final Showdown",
    ]);

    expect(groupScenesByAct(snapshot.acts, shuffledScenes).map((group) => group.scenes.length)).toEqual([2, 1, 1]);
  });

  it("extracts plain text, counts words, and preserves entity mentions", () => {
    const snapshot = createSnapshot();
    const draft = snapshot.sceneDrafts[0];

    expect(extractPlainText(draft.content)).toContain("Detective Joe Mercer studies the case file");
    expect(countDraftWords(draft.content)).toBeGreaterThan(10);
    expect(extractMentionsFromContent(draft.content)).toEqual([
      {
        entityId: snapshot.characters[0].id,
        entityType: "character",
        label: "Detective Joe Mercer",
      },
    ]);
  });

  it("builds backlinks from scene metadata, draft mentions, relationships, and entity links", () => {
    const snapshot = createSnapshot();
    const joe = snapshot.characters[0];
    const org = snapshot.factions[0];

    expect(buildBacklinks(snapshot, "character", joe.id).map((link) => link.sourceType)).toEqual(
      expect.arrayContaining(["scene", "draft", "relationship"]),
    );
    expect(buildBacklinks(snapshot, "faction", org.id).map((link) => link.sourceType)).toContain("entity_link");
  });

  it("reports arc coverage and detects long arc gaps", () => {
    const snapshot = createSnapshot();
    const coverage = getArcCoverage(snapshot);
    const investigation = coverage.find((entry) => entry.arc.name.includes("Murder Investigation"));

    expect(investigation?.sceneIds).toHaveLength(2);
    expect(detectArcGaps(snapshot, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          arcId: snapshot.arcs[1].id,
          startSceneId: snapshot.scenes[0].id,
          endSceneId: snapshot.scenes[3].id,
          count: 4,
        }),
      ]),
    );
  });
});
