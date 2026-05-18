import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

export const entityTypes = ["character", "location", "item", "faction"] as const;
export const projectFormats = [
  "screenplay",
  "novel",
  "tv_pilot",
  "tv_episode",
  "short_story",
  "other",
] as const;
export const relationshipTypes = [
  "family",
  "romantic",
  "rivalry",
  "mentor_mentee",
  "employer_employee",
  "alliance",
  "betrayal",
  "friendship",
  "custom",
] as const;
export const relationshipDirections = ["mutual", "a_to_b", "b_to_a"] as const;
export const sentiments = ["positive", "negative", "neutral", "complicated"] as const;
export const characterStatuses = ["alive", "dead", "missing", "unknown", "transformed"] as const;
export const itemStatuses = ["intact", "broken", "lost", "hidden", "destroyed", "unknown"] as const;
export const itemSignificance = [
  "macguffin",
  "chekhovs_gun",
  "symbolic",
  "quest_item",
  "weapon",
  "key",
  "other",
] as const;
export const sceneStatuses = ["idea", "outlined", "drafted", "revised", "final"] as const;
export const emotionalTones = [
  "tense",
  "comedic",
  "intimate",
  "triumphant",
  "melancholic",
  "chaotic",
  "mysterious",
  "peaceful",
] as const;
export const storyFunctions = [
  "setup",
  "escalation",
  "climax",
  "resolution",
  "breather",
  "twist",
  "reveal",
  "transition",
] as const;
export const arcTypes = [
  "plot_a",
  "plot_b",
  "plot_c",
  "character_arc",
  "relationship_arc",
  "thematic_arc",
  "custom",
] as const;
export const foreshadowStatuses = ["planted", "paid_off", "abandoned", "red_herring"] as const;
export const manuscriptModes = ["prose", "screenplay"] as const;
export const assetKinds = ["local", "external"] as const;
export const themeModes = ["light", "dark"] as const;
export const sceneElementTypes = [
  "scene-heading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
] as const;

const baseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const projectScopedSchema = baseSchema.extend({
  projectId: z.string(),
});

export const customFieldSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const assetSchema = projectScopedSchema.extend({
  kind: z.enum(assetKinds),
  name: z.string(),
  mimeType: z.string(),
  extension: z.string().optional(),
  sourceUrl: z.string().optional(),
  blob: z.any().optional(),
});

const coreEntitySchema = projectScopedSchema.extend({
  name: z.string().min(1),
  primaryAssetId: z.string().optional(),
  galleryAssetIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  customFields: z.array(customFieldSchema).default([]),
  notes: z.string().default(""),
  sortOrder: z.number().default(0),
});

export const projectSettingsSchema = z.object({
  theme: z.enum(themeModes).default("light"),
  defaultManuscriptMode: z.enum(manuscriptModes).default("prose"),
  targetWordCount: z.number().optional(),
});

export const projectSchema = baseSchema.extend({
  name: z.string().min(1),
  description: z.string().default(""),
  genre: z.string().default(""),
  format: z.enum(projectFormats).default("screenplay"),
  settings: projectSettingsSchema,
});

export const characterSchema = coreEntitySchema.extend({
  aliases: z.array(z.string()).default([]),
  description: z.string().default(""),
  personalityTraits: z.array(z.string()).default([]),
  backstory: z.string().default(""),
  motivation: z.string().default(""),
  internalNeed: z.string().default(""),
  flaws: z.string().default(""),
  fears: z.string().default(""),
  secrets: z.string().default(""),
  status: z.enum(characterStatuses).default("alive"),
  voiceNotes: z.string().default(""),
});

export const locationSchema = coreEntitySchema.extend({
  description: z.string().default(""),
  sensoryDetails: z.string().default(""),
  history: z.string().default(""),
  environmentalRules: z.string().default(""),
  parentLocationId: z.string().optional(),
});

export const itemSchema = coreEntitySchema.extend({
  description: z.string().default(""),
  origin: z.string().default(""),
  properties: z.string().default(""),
  significance: z.enum(itemSignificance).default("other"),
  status: z.enum(itemStatuses).default("intact"),
  currentPossessorId: z.string().optional(),
});

export const factionSchema = coreEntitySchema.extend({
  description: z.string().default(""),
  ideology: z.string().default(""),
  goals: z.string().default(""),
  resources: z.string().default(""),
});

export const characterRelationshipSchema = projectScopedSchema.extend({
  characterAId: z.string(),
  characterBId: z.string(),
  relationshipType: z.enum(relationshipTypes).default("friendship"),
  customTypeLabel: z.string().default(""),
  directionality: z.enum(relationshipDirections).default("mutual"),
  description: z.string().default(""),
  sentiment: z.enum(sentiments).default("neutral"),
  notes: z.string().default(""),
});

export const factionMembershipSchema = baseSchema.extend({
  characterId: z.string(),
  factionId: z.string(),
  role: z.string().default(""),
  notes: z.string().default(""),
});

export const entityLinkSchema = projectScopedSchema.extend({
  sourceEntityType: z.enum(entityTypes),
  sourceEntityId: z.string(),
  targetEntityType: z.enum(entityTypes),
  targetEntityId: z.string(),
  label: z.string().default("linked to"),
  notes: z.string().default(""),
});

export const actSchema = projectScopedSchema.extend({
  name: z.string().min(1),
  sortOrder: z.number().default(0),
  notes: z.string().default(""),
});

export const sceneSchema = projectScopedSchema.extend({
  actId: z.string(),
  title: z.string().min(1),
  slugLine: z.string().default(""),
  summary: z.string().default(""),
  povCharacterId: z.string().optional(),
  locationId: z.string().optional(),
  charactersPresent: z.array(z.string()).default([]),
  itemsInvolved: z.array(z.string()).default([]),
  emotionalTone: z.enum(emotionalTones).optional(),
  storyFunction: z.enum(storyFunctions).optional(),
  status: z.enum(sceneStatuses).default("idea"),
  sortOrder: z.number().default(0),
  notes: z.string().default(""),
});

export const arcSchema = projectScopedSchema.extend({
  name: z.string().min(1),
  arcType: z.enum(arcTypes).default("plot_a"),
  description: z.string().default(""),
  linkedCharacterId: z.string().optional(),
  color: z.string().default("#2d788f"),
  notes: z.string().default(""),
});

export const sceneArcTagSchema = baseSchema.extend({
  sceneId: z.string(),
  arcId: z.string(),
});

export const foreshadowingPairSchema = projectScopedSchema.extend({
  label: z.string().min(1),
  setupDescription: z.string().default(""),
  setupSceneId: z.string().optional(),
  payoffDescription: z.string().default(""),
  payoffSceneId: z.string().optional(),
  status: z.enum(foreshadowStatuses).default("planted"),
  notes: z.string().default(""),
});

export const sceneDraftSchema = baseSchema.extend({
  sceneId: z.string(),
  content: z.custom<JSONContent | null>(() => true).nullable(),
  plainText: z.string().default(""),
  wordCount: z.number().default(0),
  manuscriptMode: z.enum(manuscriptModes).default("prose"),
});

export const entityMentionSchema = baseSchema.extend({
  projectId: z.string(),
  sceneDraftId: z.string(),
  entityType: z.enum(entityTypes),
  entityId: z.string(),
  label: z.string(),
});

export const uiStateSchema = baseSchema.extend({
  projectId: z.string().optional(),
  scope: z.string(),
  data: z.record(z.any()),
});

export const recentEditSchema = baseSchema.extend({
  projectId: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  title: z.string(),
});

export const appSettingsSchema = z.object({
  id: z.literal("app"),
  theme: z.enum(themeModes).default("light"),
  onboardingDismissed: z.boolean().default(false),
  lastOpenedProjectId: z.string().optional(),
  lastBackupAt: z.string().optional(),
});

export type StoryEntityType = (typeof entityTypes)[number];
export type Project = z.infer<typeof projectSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Faction = z.infer<typeof factionSchema>;
export type CharacterRelationship = z.infer<typeof characterRelationshipSchema>;
export type FactionMembership = z.infer<typeof factionMembershipSchema>;
export type EntityLink = z.infer<typeof entityLinkSchema>;
export type Act = z.infer<typeof actSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Arc = z.infer<typeof arcSchema>;
export type SceneArcTag = z.infer<typeof sceneArcTagSchema>;
export type ForeshadowingPair = z.infer<typeof foreshadowingPairSchema>;
export type SceneDraft = z.infer<typeof sceneDraftSchema>;
export type EntityMention = z.infer<typeof entityMentionSchema>;
export type AssetRecord = z.infer<typeof assetSchema>;
export type UiStateRecord = z.infer<typeof uiStateSchema>;
export type RecentEdit = z.infer<typeof recentEditSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;

export type StoryEntity = Character | Location | Item | Faction;

export type ProjectSnapshot = {
  project: Project;
  assets: AssetRecord[];
  characters: Character[];
  locations: Location[];
  items: Item[];
  factions: Faction[];
  characterRelationships: CharacterRelationship[];
  factionMemberships: FactionMembership[];
  entityLinks: EntityLink[];
  acts: Act[];
  scenes: Scene[];
  arcs: Arc[];
  sceneArcTags: SceneArcTag[];
  foreshadowingPairs: ForeshadowingPair[];
  sceneDrafts: SceneDraft[];
  entityMentions: EntityMention[];
  uiState: UiStateRecord[];
  recentEdits: RecentEdit[];
};
