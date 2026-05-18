import Dexie, { type Table } from "dexie";
import type {
  Act,
  AppSettings,
  Arc,
  AssetRecord,
  Character,
  CharacterRelationship,
  EntityLink,
  EntityMention,
  Faction,
  FactionMembership,
  ForeshadowingPair,
  Item,
  Location,
  Project,
  RecentEdit,
  Scene,
  SceneArcTag,
  SceneDraft,
  UiStateRecord,
} from "./schema";

export class StoryOsDb extends Dexie {
  projects!: Table<Project, string>;
  assets!: Table<AssetRecord, string>;
  characters!: Table<Character, string>;
  locations!: Table<Location, string>;
  items!: Table<Item, string>;
  factions!: Table<Faction, string>;
  characterRelationships!: Table<CharacterRelationship, string>;
  factionMemberships!: Table<FactionMembership, string>;
  entityLinks!: Table<EntityLink, string>;
  acts!: Table<Act, string>;
  scenes!: Table<Scene, string>;
  arcs!: Table<Arc, string>;
  sceneArcTags!: Table<SceneArcTag, string>;
  foreshadowingPairs!: Table<ForeshadowingPair, string>;
  sceneDrafts!: Table<SceneDraft, string>;
  entityMentions!: Table<EntityMention, string>;
  uiState!: Table<UiStateRecord, string>;
  recentEdits!: Table<RecentEdit, string>;
  appSettings!: Table<AppSettings, "app">;

  constructor() {
    super("story-os");

    this.version(1).stores({
      projects: "id, name, updatedAt",
      assets: "id, projectId, updatedAt, kind",
      characters: "id, projectId, updatedAt, sortOrder, name",
      locations: "id, projectId, updatedAt, sortOrder, name",
      items: "id, projectId, updatedAt, sortOrder, name",
      factions: "id, projectId, updatedAt, sortOrder, name",
      characterRelationships: "id, projectId, characterAId, characterBId, updatedAt",
      factionMemberships: "id, characterId, factionId, updatedAt",
      entityLinks: "id, projectId, sourceEntityId, targetEntityId, updatedAt",
      acts: "id, projectId, sortOrder, updatedAt",
      scenes: "id, projectId, actId, sortOrder, status, updatedAt",
      arcs: "id, projectId, arcType, updatedAt",
      sceneArcTags: "id, sceneId, arcId, updatedAt",
      foreshadowingPairs: "id, projectId, status, updatedAt",
      sceneDrafts: "id, sceneId, updatedAt",
      entityMentions: "id, projectId, sceneDraftId, entityId, updatedAt",
      uiState: "id, projectId, scope, updatedAt",
      recentEdits: "id, projectId, updatedAt",
      appSettings: "id",
    });
  }
}

export const db = new StoryOsDb();
