import { db } from "./db";
import {
  actSchema,
  appSettingsSchema,
  arcSchema,
  assetSchema,
  characterRelationshipSchema,
  characterSchema,
  entityLinkSchema,
  entityMentionSchema,
  factionMembershipSchema,
  factionSchema,
  foreshadowingPairSchema,
  itemSchema,
  locationSchema,
  projectSchema,
  recentEditSchema,
  sceneArcTagSchema,
  sceneDraftSchema,
  sceneSchema,
  uiStateSchema,
  type Act,
  type AppSettings,
  type Arc,
  type AssetRecord,
  type Character,
  type CharacterRelationship,
  type EntityLink,
  type Faction,
  type FactionMembership,
  type ForeshadowingPair,
  type Item,
  type Location,
  type Project,
  type ProjectSnapshot,
  type RecentEdit,
  type Scene,
  type SceneDraft,
  type StoryEntity,
  type StoryEntityType,
  type UiStateRecord,
} from "./schema";
import { createAppSettings, createDefaultActs, createDefaultProject, createSampleProject } from "./defaults";
import { createId, nowIso } from "../lib/utils";
import { countDraftWords, extractMentionsFromContent, extractPlainText } from "./selectors";

export async function ensureAppSettings() {
  const existing = await db.appSettings.get("app");
  if (existing) {
    return existing;
  }

  const settings = createAppSettings();
  await db.appSettings.put(settings);
  return settings;
}

export async function saveAppSettings(updates: Partial<AppSettings>) {
  const current = await ensureAppSettings();
  const next = appSettingsSchema.parse({ ...current, ...updates });
  await db.appSettings.put(next);
  return next;
}

export async function createProject(name: string) {
  const project = projectSchema.parse(createDefaultProject(name));
  const acts = createDefaultActs(project.id).map((act) => actSchema.parse(act));

  await db.transaction("rw", db.projects, db.acts, async () => {
    await db.projects.add(project);
    await db.acts.bulkAdd(acts);
  });

  await saveAppSettings({ lastOpenedProjectId: project.id });
  return project;
}

export async function seedSampleProject() {
  const sample = createSampleProject();
  await db.transaction(
    "rw",
    [
      db.projects,
      db.acts,
      db.characters,
      db.locations,
      db.items,
      db.factions,
      db.characterRelationships,
      db.factionMemberships,
      db.entityLinks,
      db.scenes,
      db.sceneDrafts,
      db.arcs,
      db.sceneArcTags,
      db.foreshadowingPairs,
      db.entityMentions,
    ],
    async () => {
      await db.projects.put(projectSchema.parse(sample.project));
      await db.acts.bulkPut(sample.acts.map((act) => actSchema.parse(act)));
      await db.characters.bulkPut(sample.characters.map((entry) => characterSchema.parse(entry)));
      await db.locations.bulkPut(sample.locations.map((entry) => locationSchema.parse(entry)));
      await db.items.bulkPut(sample.items.map((entry) => itemSchema.parse(entry)));
      await db.factions.bulkPut(sample.factions.map((entry) => factionSchema.parse(entry)));
      await db.characterRelationships.bulkPut(
        sample.characterRelationships.map((entry) => characterRelationshipSchema.parse(entry)),
      );
      await db.factionMemberships.bulkPut(
        sample.factionMemberships.map((entry) => factionMembershipSchema.parse(entry)),
      );
      await db.entityLinks.bulkPut(sample.entityLinks.map((entry) => entityLinkSchema.parse(entry)));
      await db.scenes.bulkPut(sample.scenes.map((entry) => sceneSchema.parse(entry)));
      await db.sceneDrafts.bulkPut(sample.sceneDrafts.map((entry) => sceneDraftSchema.parse(entry)));
      await db.arcs.bulkPut(sample.arcs.map((entry) => arcSchema.parse(entry)));
      await db.sceneArcTags.bulkPut(sample.sceneArcTags.map((entry) => sceneArcTagSchema.parse(entry)));
      await db.foreshadowingPairs.bulkPut(
        sample.foreshadowingPairs.map((entry) => foreshadowingPairSchema.parse(entry)),
      );

      const mentions = sample.sceneDrafts.flatMap((draft) =>
        extractMentionsFromContent(draft.content).map((mention) =>
          entityMentionSchema.parse({
            id: createId("mention"),
            projectId: sample.project.id,
            sceneDraftId: draft.id,
            entityId: mention.entityId,
            entityType: mention.entityType,
            label: mention.label,
            createdAt: draft.createdAt,
            updatedAt: draft.updatedAt,
          }),
        ),
      );
      await db.entityMentions.bulkPut(mentions);
    },
  );

  await saveAppSettings({ lastOpenedProjectId: sample.project.id });
  return sample.project;
}

export async function duplicateProject(projectId: string) {
  const snapshot = await loadProjectSnapshot(projectId);
  if (!snapshot) {
    return undefined;
  }

  const idMap = new Map<string, string>();
  const rewriteId = (id: string) => {
    const existing = idMap.get(id);
    if (existing) {
      return existing;
    }
    const next = createId("copy");
    idMap.set(id, next);
    return next;
  };

  const now = nowIso();
  const duplicatedProject = projectSchema.parse({
    ...snapshot.project,
    id: createId("project"),
    name: `${snapshot.project.name} Copy`,
    createdAt: now,
    updatedAt: now,
  });

  const acts = snapshot.acts.map((act) =>
    actSchema.parse({
      ...act,
      id: rewriteId(act.id),
      projectId: duplicatedProject.id,
      createdAt: now,
      updatedAt: now,
    }),
  );

  const remapProjectEntity = <T extends StoryEntity>(entity: T): T =>
    ({
      ...entity,
      id: rewriteId(entity.id),
      projectId: duplicatedProject.id,
      primaryAssetId: entity.primaryAssetId ? rewriteId(entity.primaryAssetId) : undefined,
      galleryAssetIds: entity.galleryAssetIds.map(rewriteId),
      createdAt: now,
      updatedAt: now,
    }) as T;

  const assets = snapshot.assets.map((asset) =>
    assetSchema.parse({
      ...asset,
      id: rewriteId(asset.id),
      projectId: duplicatedProject.id,
      createdAt: now,
      updatedAt: now,
    }),
  );

  const characters = snapshot.characters.map((entry) => remapProjectEntity(entry));
  const locations = snapshot.locations.map((entry) => remapProjectEntity(entry));
  const items = snapshot.items.map((entry) =>
    itemSchema.parse({
      ...remapProjectEntity(entry),
      currentPossessorId: entry.currentPossessorId ? rewriteId(entry.currentPossessorId) : undefined,
    }),
  );
  const factions = snapshot.factions.map((entry) => remapProjectEntity(entry));

  const scenes = snapshot.scenes.map((scene) =>
    sceneSchema.parse({
      ...scene,
      id: rewriteId(scene.id),
      projectId: duplicatedProject.id,
      actId: rewriteId(scene.actId),
      povCharacterId: scene.povCharacterId ? rewriteId(scene.povCharacterId) : undefined,
      locationId: scene.locationId ? rewriteId(scene.locationId) : undefined,
      charactersPresent: scene.charactersPresent.map(rewriteId),
      itemsInvolved: scene.itemsInvolved.map(rewriteId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const sceneDrafts = snapshot.sceneDrafts.map((draft) =>
    sceneDraftSchema.parse({
      ...draft,
      id: rewriteId(draft.id),
      sceneId: rewriteId(draft.sceneId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const characterRelationships = snapshot.characterRelationships.map((entry) =>
    characterRelationshipSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      projectId: duplicatedProject.id,
      characterAId: rewriteId(entry.characterAId),
      characterBId: rewriteId(entry.characterBId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const factionMemberships = snapshot.factionMemberships.map((entry) =>
    factionMembershipSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      characterId: rewriteId(entry.characterId),
      factionId: rewriteId(entry.factionId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const entityLinks = snapshot.entityLinks.map((entry) =>
    entityLinkSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      projectId: duplicatedProject.id,
      sourceEntityId: rewriteId(entry.sourceEntityId),
      targetEntityId: rewriteId(entry.targetEntityId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const arcs = snapshot.arcs.map((entry) =>
    arcSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      projectId: duplicatedProject.id,
      linkedCharacterId: entry.linkedCharacterId ? rewriteId(entry.linkedCharacterId) : undefined,
      createdAt: now,
      updatedAt: now,
    }),
  );

  const sceneArcTags = snapshot.sceneArcTags.map((entry) =>
    sceneArcTagSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      sceneId: rewriteId(entry.sceneId),
      arcId: rewriteId(entry.arcId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  const foreshadowingPairs = snapshot.foreshadowingPairs.map((entry) =>
    foreshadowingPairSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      projectId: duplicatedProject.id,
      setupSceneId: entry.setupSceneId ? rewriteId(entry.setupSceneId) : undefined,
      payoffSceneId: entry.payoffSceneId ? rewriteId(entry.payoffSceneId) : undefined,
      createdAt: now,
      updatedAt: now,
    }),
  );

  const entityMentions = snapshot.entityMentions.map((entry) =>
    entityMentionSchema.parse({
      ...entry,
      id: rewriteId(entry.id),
      projectId: duplicatedProject.id,
      sceneDraftId: rewriteId(entry.sceneDraftId),
      entityId: rewriteId(entry.entityId),
      createdAt: now,
      updatedAt: now,
    }),
  );

  await db.transaction(
    "rw",
    [
      db.projects,
      db.acts,
      db.assets,
      db.characters,
      db.locations,
      db.items,
      db.factions,
      db.characterRelationships,
      db.factionMemberships,
      db.entityLinks,
      db.scenes,
      db.sceneDrafts,
      db.arcs,
      db.sceneArcTags,
      db.foreshadowingPairs,
      db.entityMentions,
    ],
    async () => {
      await db.projects.put(duplicatedProject);
      await db.acts.bulkPut(acts);
      await db.assets.bulkPut(assets);
      await db.characters.bulkPut(characters);
      await db.locations.bulkPut(locations);
      await db.items.bulkPut(items);
      await db.factions.bulkPut(factions);
      await db.characterRelationships.bulkPut(characterRelationships);
      await db.factionMemberships.bulkPut(factionMemberships);
      await db.entityLinks.bulkPut(entityLinks);
      await db.scenes.bulkPut(scenes);
      await db.sceneDrafts.bulkPut(sceneDrafts);
      await db.arcs.bulkPut(arcs);
      await db.sceneArcTags.bulkPut(sceneArcTags);
      await db.foreshadowingPairs.bulkPut(foreshadowingPairs);
      await db.entityMentions.bulkPut(entityMentions);
    },
  );

  return duplicatedProject;
}

export async function loadProjectSnapshot(projectId: string): Promise<ProjectSnapshot | undefined> {
  const project = await db.projects.get(projectId);
  if (!project) {
    return undefined;
  }

  const characters = await db.characters.where("projectId").equals(projectId).toArray();
  const scenes = await db.scenes.where("projectId").equals(projectId).toArray();
  const arcs = await db.arcs.where("projectId").equals(projectId).toArray();
  const factions = await db.factions.where("projectId").equals(projectId).toArray();

  const [
    assets,
    locations,
    items,
    characterRelationships,
    factionMemberships,
    entityLinks,
    acts,
    sceneArcTags,
    foreshadowingPairs,
    sceneDrafts,
    entityMentions,
    uiState,
    recentEdits,
  ] = await Promise.all([
    db.assets.where("projectId").equals(projectId).toArray(),
    db.locations.where("projectId").equals(projectId).toArray(),
    db.items.where("projectId").equals(projectId).toArray(),
    db.characterRelationships.where("projectId").equals(projectId).toArray(),
    db.factionMemberships.toArray(),
    db.entityLinks.where("projectId").equals(projectId).toArray(),
    db.acts.where("projectId").equals(projectId).toArray(),
    db.sceneArcTags.toArray(),
    db.foreshadowingPairs.where("projectId").equals(projectId).toArray(),
    db.sceneDrafts.toArray(),
    db.entityMentions.where("projectId").equals(projectId).toArray(),
    db.uiState.where("projectId").equals(projectId).toArray(),
    db.recentEdits.where("projectId").equals(projectId).reverse().sortBy("updatedAt"),
  ]);

  const sceneIdSet = new Set(scenes.map((scene) => scene.id));
  const arcIdSet = new Set(arcs.map((arc) => arc.id));
  const draftIdSet = new Set(sceneDrafts.filter((draft) => sceneIdSet.has(draft.sceneId)).map((draft) => draft.id));
  const factionIdSet = new Set(factions.map((faction) => faction.id));
  const characterIdSet = new Set(characters.map((character) => character.id));

  return {
    project,
    assets,
    characters,
    locations,
    items,
    factions,
    characterRelationships,
    factionMemberships: factionMemberships.filter(
      (membership) => factionIdSet.has(membership.factionId) && characterIdSet.has(membership.characterId),
    ),
    entityLinks,
    acts,
    scenes,
    arcs,
    sceneArcTags: sceneArcTags.filter((tag) => sceneIdSet.has(tag.sceneId) && arcIdSet.has(tag.arcId)),
    foreshadowingPairs,
    sceneDrafts: sceneDrafts.filter((draft) => sceneIdSet.has(draft.sceneId)),
    entityMentions: entityMentions.filter((mention) => draftIdSet.has(mention.sceneDraftId)),
    uiState,
    recentEdits: recentEdits.reverse().slice(-10).reverse(),
  };
}

async function touchProject(projectId: string) {
  const project = await db.projects.get(projectId);
  if (!project) {
    return;
  }

  await db.projects.put({ ...project, updatedAt: nowIso() });
}

export async function recordRecentEdit(projectId: string, entityType: string, entityId: string, title: string) {
  const now = nowIso();
  const edit: RecentEdit = recentEditSchema.parse({
    id: `${projectId}:${entityType}:${entityId}`,
    projectId,
    entityType,
    entityId,
    title,
    createdAt: now,
    updatedAt: now,
  });
  await db.recentEdits.put(edit);
  await touchProject(projectId);
}

export async function deleteProject(projectId: string) {
  const snapshot = await loadProjectSnapshot(projectId);
  if (!snapshot) {
    return;
  }

  await db.transaction(
    "rw",
    [
      db.projects,
      db.assets,
      db.characters,
      db.locations,
      db.items,
      db.factions,
      db.characterRelationships,
      db.factionMemberships,
      db.entityLinks,
      db.acts,
      db.scenes,
      db.arcs,
      db.sceneArcTags,
      db.foreshadowingPairs,
      db.sceneDrafts,
      db.entityMentions,
      db.recentEdits,
      db.uiState,
    ],
    async () => {
      await db.projects.delete(projectId);
      await db.assets.where("projectId").equals(projectId).delete();
      await db.characters.where("projectId").equals(projectId).delete();
      await db.locations.where("projectId").equals(projectId).delete();
      await db.items.where("projectId").equals(projectId).delete();
      await db.factions.where("projectId").equals(projectId).delete();
      await db.characterRelationships.where("projectId").equals(projectId).delete();
      await db.entityLinks.where("projectId").equals(projectId).delete();
      await db.acts.where("projectId").equals(projectId).delete();
      await db.scenes.where("projectId").equals(projectId).delete();
      await db.arcs.where("projectId").equals(projectId).delete();
      await db.foreshadowingPairs.where("projectId").equals(projectId).delete();
      await db.recentEdits.where("projectId").equals(projectId).delete();
      await db.uiState.where("projectId").equals(projectId).delete();

      await db.sceneDrafts.bulkDelete(snapshot.sceneDrafts.map((draft) => draft.id));
      await db.entityMentions.where("projectId").equals(projectId).delete();
      await db.sceneArcTags.bulkDelete(snapshot.sceneArcTags.map((tag) => tag.id));
      await db.factionMemberships.bulkDelete(snapshot.factionMemberships.map((membership) => membership.id));
    },
  );
}

export async function saveEntity<T extends StoryEntity>(
  entityType: StoryEntityType,
  entity: T,
): Promise<T> {
  const normalized = {
    ...entity,
    updatedAt: nowIso(),
  };

  switch (entityType) {
    case "character":
      await db.characters.put(characterSchema.parse(normalized as Character));
      break;
    case "location":
      await db.locations.put(locationSchema.parse(normalized as Location));
      break;
    case "item":
      await db.items.put(itemSchema.parse(normalized as Item));
      break;
    case "faction":
      await db.factions.put(factionSchema.parse(normalized as Faction));
      break;
  }

  await recordRecentEdit(entity.projectId, entityType, entity.id, entity.name || "Untitled");
  return normalized as T;
}

export async function deleteEntity(entityType: StoryEntityType, entityId: string, projectId: string) {
  switch (entityType) {
    case "character":
      await db.characters.delete(entityId);
      await db.characterRelationships
        .filter((relationship) => relationship.characterAId === entityId || relationship.characterBId === entityId)
        .delete();
      await db.factionMemberships.where("characterId").equals(entityId).delete();
      break;
    case "location":
      await db.locations.delete(entityId);
      break;
    case "item":
      await db.items.delete(entityId);
      break;
    case "faction":
      await db.factions.delete(entityId);
      await db.factionMemberships.where("factionId").equals(entityId).delete();
      break;
  }

  await db.entityLinks.filter((link) => link.sourceEntityId === entityId || link.targetEntityId === entityId).delete();
  await db.entityMentions.where("entityId").equals(entityId).delete();
  await touchProject(projectId);
}

export async function saveAct(act: Act) {
  const next = actSchema.parse({ ...act, updatedAt: nowIso() });
  await db.acts.put(next);
  await recordRecentEdit(next.projectId, "act", next.id, next.name);
  return next;
}

export async function deleteAct(actId: string, projectId: string) {
  const scenes = await db.scenes.where("actId").equals(actId).toArray();
  await db.acts.delete(actId);
  for (const scene of scenes) {
    await deleteScene(scene.id, projectId);
  }
  await touchProject(projectId);
}

export async function saveScene(scene: Scene) {
  const next = sceneSchema.parse({ ...scene, updatedAt: nowIso() });
  await db.scenes.put(next);
  await recordRecentEdit(next.projectId, "scene", next.id, next.title || "Untitled Scene");
  return next;
}

export async function deleteScene(sceneId: string, projectId: string) {
  const draft = await db.sceneDrafts.where("sceneId").equals(sceneId).first();
  await db.scenes.delete(sceneId);
  await db.sceneArcTags.where("sceneId").equals(sceneId).delete();

  if (draft) {
    await db.sceneDrafts.delete(draft.id);
    await db.entityMentions.where("sceneDraftId").equals(draft.id).delete();
  }

  await touchProject(projectId);
}

export async function saveArc(arc: Arc) {
  const next = arcSchema.parse({ ...arc, updatedAt: nowIso() });
  await db.arcs.put(next);
  await recordRecentEdit(next.projectId, "arc", next.id, next.name);
  return next;
}

export async function deleteArc(arcId: string, projectId: string) {
  await db.arcs.delete(arcId);
  await db.sceneArcTags.where("arcId").equals(arcId).delete();
  await touchProject(projectId);
}

export async function replaceSceneArcTags(sceneId: string, arcIds: string[]) {
  const existing = await db.sceneArcTags.where("sceneId").equals(sceneId).toArray();
  const existingByArcId = new Map(existing.map((tag) => [tag.arcId, tag]));
  const now = nowIso();
  const next = arcIds.map((arcId) =>
    sceneArcTagSchema.parse(
      existingByArcId.get(arcId) ?? {
        id: createId("scene_arc"),
        sceneId,
        arcId,
        createdAt: now,
        updatedAt: now,
      },
    ),
  );

  await db.transaction("rw", db.sceneArcTags, async () => {
    await db.sceneArcTags.where("sceneId").equals(sceneId).delete();
    await db.sceneArcTags.bulkPut(next);
  });
}

export async function saveForeshadowingPair(pair: ForeshadowingPair) {
  const next = foreshadowingPairSchema.parse({ ...pair, updatedAt: nowIso() });
  await db.foreshadowingPairs.put(next);
  await recordRecentEdit(next.projectId, "foreshadowing", next.id, next.label);
  return next;
}

export async function deleteForeshadowingPair(id: string, projectId: string) {
  await db.foreshadowingPairs.delete(id);
  await touchProject(projectId);
}

export async function saveCharacterRelationship(relationship: CharacterRelationship) {
  const next = characterRelationshipSchema.parse({ ...relationship, updatedAt: nowIso() });
  await db.characterRelationships.put(next);
  await touchProject(next.projectId);
  return next;
}

export async function deleteCharacterRelationship(id: string, projectId: string) {
  await db.characterRelationships.delete(id);
  await touchProject(projectId);
}

export async function saveFactionMembership(membership: FactionMembership) {
  const next = factionMembershipSchema.parse({ ...membership, updatedAt: nowIso() });
  await db.factionMemberships.put(next);
  return next;
}

export async function deleteFactionMembership(id: string, projectId: string) {
  await db.factionMemberships.delete(id);
  await touchProject(projectId);
}

export async function saveEntityLink(link: EntityLink) {
  const next = entityLinkSchema.parse({ ...link, updatedAt: nowIso() });
  await db.entityLinks.put(next);
  await touchProject(next.projectId);
  return next;
}

export async function deleteEntityLink(id: string, projectId: string) {
  await db.entityLinks.delete(id);
  await touchProject(projectId);
}

export async function saveAsset(asset: AssetRecord) {
  const next = assetSchema.parse({ ...asset, updatedAt: nowIso() });
  await db.assets.put(next);
  await touchProject(next.projectId);
  return next;
}

export async function createLocalAsset(projectId: string, file: File) {
  const now = nowIso();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const asset = assetSchema.parse({
    id: createId("asset"),
    projectId,
    kind: "local",
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    extension,
    blob: file,
    createdAt: now,
    updatedAt: now,
  });
  await db.assets.put(asset);
  await touchProject(projectId);
  return asset;
}

export async function createExternalAsset(projectId: string, sourceUrl: string, name: string) {
  const now = nowIso();
  const asset = assetSchema.parse({
    id: createId("asset"),
    projectId,
    kind: "external",
    sourceUrl,
    name,
    mimeType: "text/uri-list",
    createdAt: now,
    updatedAt: now,
  });
  await db.assets.put(asset);
  await touchProject(projectId);
  return asset;
}

export async function saveSceneDraft(draft: SceneDraft) {
  const plainText = extractPlainText(draft.content);
  const wordCount = countDraftWords(draft.content, plainText);
  const next = sceneDraftSchema.parse({
    ...draft,
    plainText,
    wordCount,
    updatedAt: nowIso(),
  });
  const scene = await db.scenes.get(draft.sceneId);

  await db.transaction("rw", db.sceneDrafts, db.entityMentions, db.scenes, async () => {
    await db.sceneDrafts.put(next);

    const mentions = extractMentionsFromContent(next.content).map((mention) =>
      entityMentionSchema.parse({
        id: createId("mention"),
        projectId: scene?.projectId ?? "",
        sceneDraftId: next.id,
        entityId: mention.entityId,
        entityType: mention.entityType,
        label: mention.label,
        createdAt: next.updatedAt,
        updatedAt: next.updatedAt,
      }),
    );

    await db.entityMentions.where("sceneDraftId").equals(next.id).delete();
    if (mentions.length > 0) {
      await db.entityMentions.bulkPut(mentions);
    }

    if (scene && next.wordCount > 0 && scene.status === "idea") {
      await db.scenes.put({ ...scene, status: "drafted", updatedAt: next.updatedAt });
    }
  });

  if (scene) {
    await recordRecentEdit(scene.projectId, "draft", draft.sceneId, scene.title || "Untitled Scene");
  }

  return next;
}

export async function saveUiState(entry: UiStateRecord) {
  const next = uiStateSchema.parse({ ...entry, updatedAt: nowIso() });
  await db.uiState.put(next);
  return next;
}
