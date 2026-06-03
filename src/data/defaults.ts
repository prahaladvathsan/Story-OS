import { createId, nowIso } from "../lib/utils";
import type {
  Act,
  AppSettings,
  Arc,
  Character,
  CharacterRelationship,
  EntityLink,
  Faction,
  FactionMembership,
  ForeshadowingPair,
  Item,
  Location,
  Project,
  Scene,
  SceneDraft,
  SceneArcTag,
  StoryEntityType,
} from "./schema";

export function createDefaultProject(name = "Untitled Story"): Project {
  const now = nowIso();
  return {
    id: createId("project"),
    name,
    description: "",
    genre: "",
    format: "screenplay",
    createdAt: now,
    updatedAt: now,
    settings: {
      theme: "light",
      defaultManuscriptMode: "prose",
      modules: {
        arcs: false,
        foreshadowing: false,
        factions: false,
        items: false,
        relationshipGraph: false,
      },
    },
  };
}

export function createDefaultActs(projectId: string): Act[] {
  const now = nowIso();
  return ["Act 1", "Act 2", "Act 3"].map((name, index) => ({
    id: createId("act"),
    projectId,
    name,
    notes: "",
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
  }));
}

export function createEmptyEntity(projectId: string, entityType: StoryEntityType) {
  const now = nowIso();
  const base = {
    id: createId(entityType),
    projectId,
    name: "",
    primaryAssetId: undefined,
    galleryAssetIds: [],
    tags: [],
    customFields: [],
    notes: "",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };

  switch (entityType) {
    case "character":
      return {
        ...base,
        aliases: [],
        description: "",
        personalityTraits: [],
        backstory: "",
        motivation: "",
        internalNeed: "",
        flaws: "",
        fears: "",
        secrets: "",
        status: "alive" as const,
        voiceNotes: "",
      } satisfies Character;
    case "location":
      return {
        ...base,
        description: "",
        sensoryDetails: "",
        history: "",
        environmentalRules: "",
        parentLocationId: undefined,
      } satisfies Location;
    case "item":
      return {
        ...base,
        description: "",
        origin: "",
        properties: "",
        significance: "other" as const,
        status: "intact" as const,
        currentPossessorId: undefined,
      } satisfies Item;
    case "faction":
      return {
        ...base,
        description: "",
        ideology: "",
        goals: "",
        resources: "",
      } satisfies Faction;
  }
}

export function createEmptyScene(projectId: string, actId: string, sortOrder: number): Scene {
  const now = nowIso();
  return {
    id: createId("scene"),
    projectId,
    actId,
    title: "",
    slugLine: "",
    summary: "",
    povCharacterId: undefined,
    locationId: undefined,
    charactersPresent: [],
    itemsInvolved: [],
    emotionalTone: undefined,
    storyFunction: undefined,
    status: "idea",
    sortOrder,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyDraft(sceneId: string, manuscriptMode: "prose" | "screenplay" = "prose"): SceneDraft {
  const now = nowIso();
  return {
    id: createId("draft"),
    sceneId,
    content: null,
    plainText: "",
    wordCount: 0,
    manuscriptMode,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyArc(projectId: string, sortOrder = 0): Arc {
  const now = nowIso();
  const palette = ["#2d788f", "#d86511", "#477335", "#7c340d", "#4697b0", "#9a864c"];
  return {
    id: createId("arc"),
    projectId,
    name: "",
    arcType: "plot_a",
    description: "",
    linkedCharacterId: undefined,
    color: palette[sortOrder % palette.length],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyForeshadowingPair(projectId: string): ForeshadowingPair {
  const now = nowIso();
  return {
    id: createId("foreshadow"),
    projectId,
    label: "",
    setupDescription: "",
    setupSceneId: undefined,
    payoffDescription: "",
    payoffSceneId: undefined,
    status: "planted",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function createAppSettings(): AppSettings {
  return {
    id: "app",
    theme: "light",
    onboardingDismissed: false,
    lastOpenedProjectId: undefined,
    lastBackupAt: undefined,
  };
}

export type SampleProjectBundle = {
  project: Project;
  acts: Act[];
  characters: Character[];
  locations: Location[];
  items: Item[];
  factions: Faction[];
  characterRelationships: CharacterRelationship[];
  factionMemberships: FactionMembership[];
  entityLinks: EntityLink[];
  scenes: Scene[];
  sceneDrafts: SceneDraft[];
  arcs: Arc[];
  sceneArcTags: SceneArcTag[];
  foreshadowingPairs: ForeshadowingPair[];
};

export function createSampleProject(): SampleProjectBundle {
  const project = createDefaultProject("The Hollow Man");
  project.genre = "noir thriller";
  project.format = "screenplay";
  project.description = "A moody noir sample project seeded for Story OS exploration.";
  project.settings.defaultManuscriptMode = "screenplay";
  project.settings.modules = {
    arcs: true,
    foreshadowing: true,
    factions: true,
    items: true,
    relationshipGraph: true,
  };

  const acts = createDefaultActs(project.id);
  const now = nowIso();

  const joe: Character = {
    ...(createEmptyEntity(project.id, "character") as Character),
    name: "Detective Joe Mercer",
    description: "A worn detective with an eye for rot beneath the city gloss.",
    motivation: "Find the truth behind Danny's death.",
    flaws: "Alcoholism and a hero complex.",
    fears: "Becoming like his father.",
    tags: ["protagonist"],
    personalityTraits: ["stubborn", "observant", "self-destructive"],
  };

  const vera: Character = {
    ...(createEmptyEntity(project.id, "character") as Character),
    name: "Vera Vale",
    description: "A jazz singer with perfect poise and carefully rationed honesty.",
    motivation: "Protect the family secret.",
    internalNeed: "Trust someone before the truth destroys her.",
    tags: ["femme fatale"],
  };

  const malloy: Character = {
    ...(createEmptyEntity(project.id, "character") as Character),
    name: "Sgt. Malloy",
    description: "A police sergeant who learned how to survive by selling pieces of himself.",
    motivation: "Keep Kane happy and his badge intact.",
    tags: ["antagonist"],
  };

  const kane: Character = {
    ...(createEmptyEntity(project.id, "character") as Character),
    name: "Marcus Kane",
    description: "Crime boss with civic polish and surgical violence.",
    motivation: "Bury every loose end.",
    tags: ["crime boss"],
  };

  const danny: Character = {
    ...(createEmptyEntity(project.id, "character") as Character),
    name: "Danny Cross",
    description: "Joe's old friend, dead before the film begins but alive in motive.",
    status: "dead",
    tags: ["victim"],
  };

  const office: Location = {
    ...(createEmptyEntity(project.id, "location") as Location),
    name: "Joe's Office",
    description: "Peeling walls, stale coffee, and the sound of rain needling the window frame.",
  };

  const club: Location = {
    ...(createEmptyEntity(project.id, "location") as Location),
    name: "Blue Moon Jazz Club",
    description: "Low light, lacquered booths, and a bandstand wrapped in cigarette haze.",
  };

  const warehouse: Location = {
    ...(createEmptyEntity(project.id, "location") as Location),
    name: "Waterfront Warehouse",
    description: "Crates, tarps, and enough darkness to hide a decade of sins.",
  };

  const locket: Item = {
    ...(createEmptyEntity(project.id, "item") as Item),
    name: "Danny's Locket",
    significance: "macguffin",
    description: "An old locket containing a photograph that should not exist.",
  };

  const report: Item = {
    ...(createEmptyEntity(project.id, "item") as Item),
    name: "Forged Police Report",
    significance: "chekhovs_gun",
    description: "A file that proves the department bent around Kane long before Joe noticed.",
  };

  const org: Faction = {
    ...(createEmptyEntity(project.id, "faction") as Faction),
    name: "Kane Organization",
    ideology: "Control through leverage, fear, and selective generosity.",
    goals: "Lock down the docks and neutralize witnesses.",
  };

  const characters = [joe, vera, malloy, kane, danny];
  const locations = [office, club, warehouse];
  const items = [locket, report];
  const factions = [org];

  const characterRelationships: CharacterRelationship[] = [
    {
      id: createId("rel"),
      projectId: project.id,
      characterAId: joe.id,
      characterBId: vera.id,
      relationshipType: "romantic",
      customTypeLabel: "",
      directionality: "mutual",
      description: "Mutual attraction covered by distrust.",
      sentiment: "complicated",
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("rel"),
      projectId: project.id,
      characterAId: malloy.id,
      characterBId: kane.id,
      relationshipType: "employer_employee",
      customTypeLabel: "",
      directionality: "a_to_b",
      description: "Malloy serves Kane.",
      sentiment: "negative",
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const factionMemberships: FactionMembership[] = [
    {
      id: createId("membership"),
      characterId: kane.id,
      factionId: org.id,
      role: "leader",
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("membership"),
      characterId: malloy.id,
      factionId: org.id,
      role: "inside man",
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const entityLinks: EntityLink[] = [
    {
      id: createId("link"),
      projectId: project.id,
      sourceEntityType: "faction",
      sourceEntityId: org.id,
      targetEntityType: "location",
      targetEntityId: warehouse.id,
      label: "operates from",
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const scenes: Scene[] = [
    {
      ...createEmptyScene(project.id, acts[0].id, 0),
      title: "Joe Gets the Case",
      summary: "A grieving sister hires Joe to prove Danny's death was not an accident.",
      locationId: office.id,
      charactersPresent: [joe.id],
      status: "drafted",
      emotionalTone: "mysterious",
      storyFunction: "setup",
    },
    {
      ...createEmptyScene(project.id, acts[0].id, 1),
      title: "Jazz Club Interrogation",
      summary: "Joe questions Vera after her final set and realizes she's lying for someone.",
      locationId: club.id,
      charactersPresent: [joe.id, vera.id],
      status: "outlined",
      emotionalTone: "intimate",
      storyFunction: "reveal",
    },
    {
      ...createEmptyScene(project.id, acts[1].id, 0),
      title: "Warehouse Stakeout",
      summary: "Joe and the city watch from across the docks as Kane's men move a crate after midnight.",
      locationId: warehouse.id,
      charactersPresent: [joe.id, malloy.id, kane.id],
      itemsInvolved: [report.id],
      status: "idea",
      emotionalTone: "tense",
      storyFunction: "escalation",
    },
    {
      ...createEmptyScene(project.id, acts[2].id, 0),
      title: "Final Showdown",
      summary: "The locket forces the truth into the open and Joe has to decide what justice costs.",
      locationId: warehouse.id,
      charactersPresent: [joe.id, vera.id, kane.id],
      itemsInvolved: [locket.id, report.id],
      status: "idea",
      emotionalTone: "chaotic",
      storyFunction: "climax",
    },
  ];

  const sceneDrafts: SceneDraft[] = [
    {
      ...createEmptyDraft(scenes[0].id, "screenplay"),
      plainText:
        "INT. JOE'S OFFICE - NIGHT. Rain needles the window. Joe studies the case file while the city hums outside.",
      wordCount: 18,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { screenplayType: "scene-heading" },
            content: [{ type: "text", text: "INT. JOE'S OFFICE - NIGHT" }],
          },
          {
            type: "paragraph",
            attrs: { screenplayType: "action" },
            content: [
              { type: "text", text: "Rain needles the window. " },
              { type: "mention", attrs: { id: joe.id, label: joe.name, entityType: "character" } },
              { type: "text", text: " studies the case file while the city hums outside." },
            ],
          },
        ],
      },
    },
  ];

  const arcs: Arc[] = [
    {
      ...createEmptyArc(project.id, 0),
      name: "A-Plot: Murder Investigation",
      arcType: "plot_a",
      color: "#2d788f",
    },
    {
      ...createEmptyArc(project.id, 1),
      name: "B-Plot: Joe's Alcoholism",
      arcType: "character_arc",
      linkedCharacterId: joe.id,
      color: "#d86511",
    },
    {
      ...createEmptyArc(project.id, 2),
      name: "C-Plot: Joe & Vera",
      arcType: "relationship_arc",
      color: "#9a864c",
    },
  ];

  const sceneArcTags: SceneArcTag[] = [
    {
      id: createId("scene_arc"),
      sceneId: scenes[0].id,
      arcId: arcs[0].id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("scene_arc"),
      sceneId: scenes[1].id,
      arcId: arcs[2].id,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("scene_arc"),
      sceneId: scenes[2].id,
      arcId: arcs[0].id,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const foreshadowingPairs: ForeshadowingPair[] = [
    {
      ...createEmptyForeshadowingPair(project.id),
      label: "Danny's Locket",
      setupDescription: "The locket appears as Joe's first real clue.",
      setupSceneId: scenes[1].id,
      payoffDescription: "The hidden photo inside the locket identifies Kane's connection.",
      payoffSceneId: scenes[3].id,
      status: "planted",
    },
  ];

  return {
    project,
    acts,
    characters,
    locations,
    items,
    factions,
    characterRelationships,
    factionMemberships,
    entityLinks,
    scenes,
    sceneDrafts,
    arcs,
    sceneArcTags,
    foreshadowingPairs,
  };
}
