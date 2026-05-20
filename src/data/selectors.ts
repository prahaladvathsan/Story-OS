import MiniSearch from "minisearch";
import type { JSONContent } from "@tiptap/core";
import type {
  Act,
  Arc,
  AssetRecord,
  Character,
  CharacterRelationship,
  Faction,
  FactionMembership,
  ForeshadowingPair,
  ProjectSnapshot,
  Scene,
  SceneArcTag,
  SceneDraft,
  StoryEntity,
  StoryEntityType,
} from "./schema";
import { countWords, dedupe, toTitleCase } from "../lib/utils";

export type SearchDocument = {
  id: string;
  kind: string;
  title: string;
  text: string;
  route: string;
};

export type SearchResult = SearchDocument & {
  score: number;
};

export type Backlink = {
  id: string;
  sourceType: "scene" | "draft" | "relationship" | "membership" | "entity_link";
  title: string;
  context: string;
  route: string;
};

export function sortByOrder<T extends { sortOrder: number; updatedAt: string }>(records: T[]) {
  return [...records].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function getOrderedActs(acts: Act[]) {
  return sortByOrder(acts);
}

export function getOrderedScenes(acts: Act[], scenes: Scene[]) {
  const actOrder = new Map(getOrderedActs(acts).map((act, index) => [act.id, index]));
  return [...scenes].sort(
    (left, right) =>
      (actOrder.get(left.actId) ?? 0) - (actOrder.get(right.actId) ?? 0) ||
      left.sortOrder - right.sortOrder,
  );
}

export function groupScenesByAct(acts: Act[], scenes: Scene[]) {
  const orderedActs = getOrderedActs(acts);
  return orderedActs.map((act) => ({
    act,
    scenes: scenes
      .filter((scene) => scene.actId === act.id)
      .sort((left, right) => left.sortOrder - right.sortOrder),
  }));
}

export function getEntityCollection(snapshot: ProjectSnapshot, entityType: StoryEntityType) {
  switch (entityType) {
    case "character":
      return snapshot.characters;
    case "location":
      return snapshot.locations;
    case "item":
      return snapshot.items;
    case "faction":
      return snapshot.factions;
  }
}

export function getEntityByType(
  snapshot: Pick<ProjectSnapshot, "characters" | "locations" | "items" | "factions">,
  entityType: StoryEntityType,
  entityId: string,
) {
  return getEntityCollection(snapshot as ProjectSnapshot, entityType).find((entity) => entity.id === entityId);
}

export function extractPlainText(content: JSONContent | null | undefined): string {
  if (!content) {
    return "";
  }

  const parts: string[] = [];

  const visit = (node: JSONContent | undefined) => {
    if (!node) {
      return;
    }

    if (typeof node.text === "string") {
      parts.push(node.text);
    }

    if (node.type === "mention" && typeof node.attrs?.label === "string") {
      parts.push(node.attrs.label);
    }

    node.content?.forEach(visit);

    if (node.type === "paragraph" || node.type === "heading") {
      parts.push("\n");
    }
  };

  visit(content);
  return parts.join(" ").replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
}

export function extractMentionsFromContent(content: JSONContent | null | undefined) {
  const mentions: Array<{ entityId: string; entityType: StoryEntityType; label: string }> = [];

  if (!content) {
    return mentions;
  }

  const visit = (node: JSONContent | undefined) => {
    if (!node) {
      return;
    }

    if (
      node.type === "mention" &&
      typeof node.attrs?.id === "string" &&
      typeof node.attrs?.entityType === "string" &&
      typeof node.attrs?.label === "string"
    ) {
      mentions.push({
        entityId: node.attrs.id,
        entityType: node.attrs.entityType as StoryEntityType,
        label: node.attrs.label,
      });
    }

    node.content?.forEach(visit);
  };

  visit(content);
  return mentions;
}

export function countDraftWords(content: JSONContent | null | undefined, plainText?: string) {
  return countWords(plainText ?? extractPlainText(content));
}

export function getSceneDraftBySceneId(sceneDrafts: SceneDraft[], sceneId: string) {
  return sceneDrafts.find((draft) => draft.sceneId === sceneId);
}

export function getSceneArcIds(sceneArcTags: SceneArcTag[], sceneId: string) {
  return sceneArcTags.filter((tag) => tag.sceneId === sceneId).map((tag) => tag.arcId);
}

export function getSceneArcs(arcs: Arc[], sceneArcTags: SceneArcTag[], sceneId: string) {
  const sceneArcIds = new Set(getSceneArcIds(sceneArcTags, sceneId));
  return arcs.filter((arc) => sceneArcIds.has(arc.id));
}

export function getTotalWordCount(sceneDrafts: SceneDraft[]) {
  return sceneDrafts.reduce((sum, draft) => sum + draft.wordCount, 0);
}

export function getDashboardStats(snapshot: ProjectSnapshot) {
  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const scenesByStatus = snapshot.scenes.reduce<Record<string, number>>((accumulator, scene) => {
    accumulator[scene.status] = (accumulator[scene.status] ?? 0) + 1;
    return accumulator;
  }, {});

  const unresolvedForeshadowing = snapshot.foreshadowingPairs.filter(
    (pair) => pair.status === "planted" && !pair.payoffSceneId,
  );

  const draftedSceneIds = new Set(snapshot.sceneDrafts.map((draft) => draft.sceneId));

  return {
    totalWordCount: getTotalWordCount(snapshot.sceneDrafts),
    sceneCount: snapshot.scenes.length,
    draftedSceneCount: orderedScenes.filter((scene) => draftedSceneIds.has(scene.id)).length,
    entityCounts: {
      characters: snapshot.characters.length,
      locations: snapshot.locations.length,
      items: snapshot.items.length,
      factions: snapshot.factions.length,
    },
    scenesByStatus,
    unresolvedForeshadowing,
  };
}

export function buildBacklinks(
  snapshot: ProjectSnapshot,
  entityType: StoryEntityType,
  entityId: string,
): Backlink[] {
  const backlinks: Backlink[] = [];

  for (const scene of snapshot.scenes) {
    const referencesScene =
      scene.locationId === entityId ||
      scene.povCharacterId === entityId ||
      scene.charactersPresent.includes(entityId) ||
      scene.itemsInvolved.includes(entityId);

    if (referencesScene) {
      backlinks.push({
        id: `scene-${scene.id}`,
        sourceType: "scene",
        title: scene.title || "Untitled Scene",
        context: scene.summary || "Referenced in scene metadata.",
        route: `/project/${snapshot.project.id}/board/kanban?scene=${scene.id}`,
      });
    }
  }

  for (const mention of snapshot.entityMentions.filter((record) => record.entityId === entityId)) {
    const draft = snapshot.sceneDrafts.find((record) => record.id === mention.sceneDraftId);
    const scene = draft ? snapshot.scenes.find((record) => record.id === draft.sceneId) : undefined;
    if (!draft || !scene) {
      continue;
    }

    backlinks.push({
      id: `draft-${mention.id}`,
      sourceType: "draft",
      title: scene.title || "Untitled Scene",
      context: `Mentioned inline as ${mention.label}.`,
      route: `/project/${snapshot.project.id}/draft/${scene.id}`,
    });
  }

  if (entityType === "character") {
    for (const relationship of snapshot.characterRelationships) {
      if (relationship.characterAId === entityId || relationship.characterBId === entityId) {
        const otherCharacterId =
          relationship.characterAId === entityId ? relationship.characterBId : relationship.characterAId;
        const otherCharacter = snapshot.characters.find((character) => character.id === otherCharacterId);
        backlinks.push({
          id: `relationship-${relationship.id}`,
          sourceType: "relationship",
          title: otherCharacter?.name ?? "Relationship",
          context: relationship.description || toTitleCase(relationship.relationshipType),
          route: `/project/${snapshot.project.id}/bible/character/${entityId}`,
        });
      }
    }

    for (const membership of snapshot.factionMemberships.filter((record) => record.characterId === entityId)) {
      const faction = snapshot.factions.find((record) => record.id === membership.factionId);
      backlinks.push({
        id: `membership-${membership.id}`,
        sourceType: "membership",
        title: faction?.name ?? "Faction Membership",
        context: membership.role || "Member",
        route: `/project/${snapshot.project.id}/bible/character/${entityId}`,
      });
    }
  }

  for (const link of snapshot.entityLinks) {
    if (link.sourceEntityId === entityId || link.targetEntityId === entityId) {
      backlinks.push({
        id: `link-${link.id}`,
        sourceType: "entity_link",
        title: link.label,
        context: link.notes || "Cross-linked entity",
        route: `/project/${snapshot.project.id}/bible/${entityType}/${entityId}`,
      });
    }
  }

  return backlinks;
}

export function getContinuityContext(snapshot: ProjectSnapshot, sceneId: string) {
  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const sceneIndex = orderedScenes.findIndex((scene) => scene.id === sceneId);
  const scene = orderedScenes[sceneIndex];

  if (!scene) {
    return undefined;
  }

  const previousScene = sceneIndex > 0 ? orderedScenes[sceneIndex - 1] : undefined;
  const charactersPresent = snapshot.characters.filter((character) =>
    scene.charactersPresent.includes(character.id),
  );
  const location = scene.locationId
    ? snapshot.locations.find((entry) => entry.id === scene.locationId)
    : undefined;
  const taggedItems = snapshot.items.filter((item) => scene.itemsInvolved.includes(item.id));
  const carriedItems = snapshot.items.filter(
    (item) =>
      item.currentPossessorId &&
      scene.charactersPresent.includes(item.currentPossessorId) &&
      !scene.itemsInvolved.includes(item.id),
  );
  const activeArcs = getSceneArcs(snapshot.arcs, snapshot.sceneArcTags, scene.id);

  return {
    scene,
    previousScene,
    charactersPresent,
    location,
    itemsInPlay: [...taggedItems, ...carriedItems],
    activeArcs,
  };
}

export function getArcCoverage(snapshot: ProjectSnapshot) {
  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);

  return snapshot.arcs.map((arc) => ({
    arc,
    sceneIds: orderedScenes
      .filter((scene) =>
        snapshot.sceneArcTags.some((tag) => tag.arcId === arc.id && tag.sceneId === scene.id),
      )
      .map((scene) => scene.id),
    totalScenes: orderedScenes.length,
  }));
}

export function detectArcGaps(snapshot: ProjectSnapshot, minimumGap = 3) {
  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);

  return snapshot.arcs.flatMap((arc) => {
    const taggedSceneIds = new Set(
      snapshot.sceneArcTags.filter((tag) => tag.arcId === arc.id).map((tag) => tag.sceneId),
    );

    let gapStart: number | null = null;
    const gaps: Array<{ arcId: string; startSceneId: string; endSceneId: string; count: number }> = [];

    orderedScenes.forEach((scene, index) => {
      const isTagged = taggedSceneIds.has(scene.id);
      if (!isTagged && gapStart === null) {
        gapStart = index;
      }

      if ((isTagged || index === orderedScenes.length - 1) && gapStart !== null) {
        const endIndex = isTagged ? index - 1 : index;
        const count = endIndex - gapStart + 1;
        if (count >= minimumGap) {
          gaps.push({
            arcId: arc.id,
            startSceneId: orderedScenes[gapStart].id,
            endSceneId: orderedScenes[endIndex].id,
            count,
          });
        }
        gapStart = null;
      }
    });

    return gaps;
  });
}

export function buildSearchDocuments(snapshot: ProjectSnapshot): SearchDocument[] {
  const documents: SearchDocument[] = [];

  const pushEntityDocs = <T extends StoryEntity>(entities: T[], entityType: StoryEntityType) => {
    for (const entity of entities) {
      documents.push({
        id: `${entityType}-${entity.id}`,
        kind: entityType,
        title: entity.name,
        text: [
          entity.name,
          entity.notes,
          entity.tags.join(" "),
          entity.customFields.map((field) => `${field.key} ${field.value}`).join(" "),
          "description" in entity ? entity.description : "",
        ]
          .filter(Boolean)
          .join(" "),
        route: `/project/${snapshot.project.id}/bible/${entityType}/${entity.id}`,
      });
    }
  };

  pushEntityDocs(snapshot.characters, "character");
  pushEntityDocs(snapshot.locations, "location");
  pushEntityDocs(snapshot.items, "item");
  pushEntityDocs(snapshot.factions, "faction");

  for (const scene of snapshot.scenes) {
    const draft = getSceneDraftBySceneId(snapshot.sceneDrafts, scene.id);
    documents.push({
      id: `scene-${scene.id}`,
      kind: "scene",
      title: scene.title,
      text: [scene.summary, scene.notes, draft?.plainText].filter(Boolean).join(" "),
      route: `/project/${snapshot.project.id}/draft/${scene.id}`,
    });
  }

  for (const arc of snapshot.arcs) {
    documents.push({
      id: `arc-${arc.id}`,
      kind: "arc",
      title: arc.name,
      text: [arc.description, arc.notes, arc.arcType].filter(Boolean).join(" "),
      route: `/project/${snapshot.project.id}/board/arcs`,
    });
  }

  for (const pair of snapshot.foreshadowingPairs) {
    documents.push({
      id: `foreshadow-${pair.id}`,
      kind: "foreshadowing",
      title: pair.label,
      text: [pair.setupDescription, pair.payoffDescription, pair.notes].filter(Boolean).join(" "),
      route: `/project/${snapshot.project.id}/board/foreshadowing`,
    });
  }

  return documents;
}

export function searchProjectContent(snapshot: ProjectSnapshot, query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const documents = buildSearchDocuments(snapshot);
  const index = new MiniSearch<SearchDocument>({
    idField: "id",
    fields: ["title", "text", "kind"],
    storeFields: ["kind", "title", "text", "route"],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
    },
  });

  index.addAll(documents);

  return index.search(query).map((result) => ({
    id: result.id,
    kind: result.kind,
    title: result.title,
    text: result.text,
    route: result.route,
    score: result.score,
  }));
}

export function getTagSuggestions(entities: StoryEntity[]) {
  return dedupe(
    entities
      .flatMap((entity) => entity.tags)
      .map((tag) => tag.trim())
      .filter(Boolean),
  ).sort((left, right) => left.localeCompare(right));
}

export function getTraitSuggestions(characters: Character[]) {
  return dedupe(
    characters
      .flatMap((character) => character.personalityTraits)
      .map((trait) => trait.trim())
      .filter(Boolean),
  ).sort((left, right) => left.localeCompare(right));
}

export function getRelationshipMap(
  relationships: CharacterRelationship[],
  characters: Character[],
) {
  const characterMap = new Map(characters.map((character) => [character.id, character]));
  return relationships.map((relationship) => ({
    relationship,
    from: characterMap.get(relationship.characterAId),
    to: characterMap.get(relationship.characterBId),
  }));
}

export function summarizeForeshadowing(pair: ForeshadowingPair, scenes: Scene[]) {
  const setupScene = pair.setupSceneId ? scenes.find((scene) => scene.id === pair.setupSceneId) : undefined;
  const payoffScene = pair.payoffSceneId ? scenes.find((scene) => scene.id === pair.payoffSceneId) : undefined;
  return {
    pair,
    setupScene,
    payoffScene,
  };
}

export function getEntityAsset(entity: StoryEntity, assets: AssetRecord[]) {
  return entity.primaryAssetId ? assets.find((asset) => asset.id === entity.primaryAssetId) : undefined;
}

export function getMembershipsForCharacter(
  memberships: FactionMembership[],
  factions: Faction[],
  characterId: string,
) {
  return memberships
    .filter((membership) => membership.characterId === characterId)
    .map((membership) => ({
      membership,
      faction: factions.find((faction) => faction.id === membership.factionId),
    }));
}

export function getLinksForEntity(entityLinks: ProjectSnapshot["entityLinks"], entityId: string) {
  return entityLinks.filter((link) => link.sourceEntityId === entityId || link.targetEntityId === entityId);
}
