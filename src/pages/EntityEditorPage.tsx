import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, Upload } from "lucide-react";
import { EntityImage } from "../components/shared/EntityImage";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { FieldShell, Select, TextArea, TextInput } from "../components/shared/Field";
import { TagEditor } from "../components/shared/TagEditor";
import { KeyValueEditor } from "../components/shared/KeyValueEditor";
import {
  buildBacklinks,
  getEntityByType,
  getEntityCollection,
  getLinksForEntity,
  getMembershipsForCharacter,
  getTagSuggestions,
  getTraitSuggestions,
} from "../data/selectors";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import type {
  Character,
  CharacterRelationship,
  EntityLink,
  FactionMembership,
  StoryEntity,
  StoryEntityType,
} from "../data/schema";
import { entityLabels, isEntityType } from "../features/bible/config";
import { useAutosave } from "../hooks/useAutosave";
import {
  createExternalAsset,
  createLocalAsset,
  deleteCharacterRelationship,
  deleteEntityLink,
  deleteFactionMembership,
  saveCharacterRelationship,
  saveEntity,
  saveEntityLink,
  saveFactionMembership,
} from "../data/repository";
import { createId, nowIso } from "../lib/utils";

function createEmptyRelationship(projectId: string, characterId: string): CharacterRelationship {
  const now = nowIso();
  return {
    id: createId("relationship"),
    projectId,
    characterAId: characterId,
    characterBId: "",
    relationshipType: "friendship",
    customTypeLabel: "",
    directionality: "mutual",
    description: "",
    sentiment: "neutral",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function createEmptyMembership(characterId: string): FactionMembership {
  const now = nowIso();
  return {
    id: createId("membership"),
    characterId,
    factionId: "",
    role: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function createEmptyEntityLink(projectId: string, entityType: StoryEntityType, entityId: string): EntityLink {
  const now = nowIso();
  return {
    id: createId("link"),
    projectId,
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    targetEntityType: "character",
    targetEntityId: "",
    label: "linked to",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function EntityEditorPage() {
  const { projectId = "", entityType = "character", entityId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const validEntityType = isEntityType(entityType) ? entityType : undefined;
  const [draftEntity, setDraftEntity] = useState<StoryEntity | null>(null);
  const [externalImageUrl, setExternalImageUrl] = useState("");
  const [relationshipDraft, setRelationshipDraft] = useState<CharacterRelationship | null>(null);
  const [membershipDraft, setMembershipDraft] = useState<FactionMembership | null>(null);
  const [linkDraft, setLinkDraft] = useState<EntityLink | null>(null);
  const entity = snapshot && validEntityType ? getEntityByType(snapshot, validEntityType, entityId) : undefined;

  useEffect(() => {
    if (entity && validEntityType) {
      setDraftEntity(entity);
      if (validEntityType === "character") {
        setRelationshipDraft(createEmptyRelationship(projectId, entity.id));
        setMembershipDraft(createEmptyMembership(entity.id));
      }
      setLinkDraft(createEmptyEntityLink(projectId, validEntityType, entity.id));
    }
  }, [entity, projectId, validEntityType]);

  const autosaveStatus = useAutosave(
    draftEntity,
    async (value) => {
      if (value && value.name.trim() && validEntityType) {
        await saveEntity(validEntityType, value as StoryEntity);
      }
    },
    900,
    Boolean(draftEntity),
  );

  const backlinks = useMemo(
    () => (snapshot && validEntityType ? buildBacklinks(snapshot, validEntityType, entityId) : []),
    [entityId, snapshot, validEntityType],
  );
  const tagSuggestions = useMemo(
    () => (snapshot ? getTagSuggestions(getEntityCollectionForSuggestions(snapshot)) : []),
    [snapshot],
  );
  const traitSuggestions = useMemo(() => (snapshot ? getTraitSuggestions(snapshot.characters) : []), [snapshot]);

  if (!validEntityType) {
    return <EmptyState title="Unknown entity type" description="Pick a valid Bible section from the navigation." />;
  }

  if (!snapshot) {
    return <EmptyState title="Loading entity" description="Pulling this card from the story graph." />;
  }

  if (!entity || !draftEntity) {
    return <EmptyState title="Entity not found" description="This card no longer exists in the project." />;
  }

  const memberships =
    entityType === "character"
      ? getMembershipsForCharacter(snapshot.factionMemberships, snapshot.factions, entity.id)
      : [];
  const links = getLinksForEntity(snapshot.entityLinks, entity.id);
  const characterRelationships =
    entityType === "character"
      ? snapshot.characterRelationships.filter(
          (relationship) => relationship.characterAId === entity.id || relationship.characterBId === entity.id,
        )
      : [];

  const updateEntity = <T extends keyof StoryEntity>(key: T, value: StoryEntity[T]) => {
    setDraftEntity((current) => (current ? ({ ...current, [key]: value, updatedAt: nowIso() } as StoryEntity) : current));
  };

  const handleUploadPrimary = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    const asset = await createLocalAsset(projectId, file);
    updateEntity("primaryAssetId", asset.id);
  };

  const handleAttachExternal = async () => {
    if (!externalImageUrl.trim()) {
      return;
    }
    const asset = await createExternalAsset(projectId, externalImageUrl.trim(), `${draftEntity.name} reference`);
    updateEntity("primaryAssetId", asset.id);
    setExternalImageUrl("");
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
        <div className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                {entityLabels[validEntityType]} Editor
              </div>
              <h2 className="mt-2 font-display text-4xl font-bold">{draftEntity.name || `Untitled ${entityLabels[validEntityType]}`}</h2>
            </div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{autosaveStatus}</div>
          </div>

          <div className="mt-6 space-y-4">
            <EntityImage assetId={draftEntity.primaryAssetId} alt={draftEntity.name} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold">
                <Upload size={16} />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleUploadPrimary(event.target.files)} />
              </label>
            </div>
            <div className="flex gap-2">
              <TextInput value={externalImageUrl} onChange={(event) => setExternalImageUrl(event.target.value)} placeholder="Paste image URL" />
              <Button variant="secondary" onClick={handleAttachExternal}>
                Attach
              </Button>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldShell label="Name">
              <TextInput value={draftEntity.name} onChange={(event) => updateEntity("name", event.target.value)} />
            </FieldShell>
            {"status" in draftEntity ? (
              <FieldShell label="Status">
                <Select
                  value={draftEntity.status}
                  onChange={(event) => updateEntity("status", event.target.value as StoryEntity["status"])}
                >
                        {validEntityType === "character"
                    ? ["alive", "dead", "missing", "unknown", "transformed"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))
                    : ["intact", "broken", "lost", "hidden", "destroyed", "unknown"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                </Select>
              </FieldShell>
            ) : null}
          </div>

          {"description" in draftEntity ? (
            <div className="mt-4">
              <FieldShell label="Description">
                <TextArea value={draftEntity.description} onChange={(event) => updateEntity("description", event.target.value)} />
              </FieldShell>
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            <TagEditor label="Tags" values={draftEntity.tags} suggestions={tagSuggestions} onChange={(values) => updateEntity("tags", values)} />

            {"aliases" in draftEntity ? (
              <TagEditor label="Aliases" values={draftEntity.aliases} onChange={(values) => updateEntity("aliases", values)} />
            ) : null}

            {"personalityTraits" in draftEntity ? (
              <TagEditor
                label="Personality Traits"
                values={draftEntity.personalityTraits}
                suggestions={traitSuggestions}
                onChange={(values) => updateEntity("personalityTraits", values)}
              />
            ) : null}

            <KeyValueEditor label="Custom Fields" values={draftEntity.customFields} onChange={(values) => updateEntity("customFields", values)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.6fr_0.4fr]">
        <div className="panel p-6">
          <h3 className="font-display text-3xl font-bold">Story Details</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {"backstory" in draftEntity ? (
              <>
                <FieldShell label="Backstory">
                  <TextArea value={draftEntity.backstory} onChange={(event) => updateEntity("backstory", event.target.value)} />
                </FieldShell>
                <FieldShell label="Motivation">
                  <TextArea value={draftEntity.motivation} onChange={(event) => updateEntity("motivation", event.target.value)} />
                </FieldShell>
                <FieldShell label="Internal Need">
                  <TextArea value={draftEntity.internalNeed} onChange={(event) => updateEntity("internalNeed", event.target.value)} />
                </FieldShell>
                <FieldShell label="Voice Notes">
                  <TextArea value={draftEntity.voiceNotes} onChange={(event) => updateEntity("voiceNotes", event.target.value)} />
                </FieldShell>
                <FieldShell label="Flaws">
                  <TextArea value={draftEntity.flaws} onChange={(event) => updateEntity("flaws", event.target.value)} />
                </FieldShell>
                <FieldShell label="Fears">
                  <TextArea value={draftEntity.fears} onChange={(event) => updateEntity("fears", event.target.value)} />
                </FieldShell>
                <FieldShell label="Secrets">
                  <TextArea value={draftEntity.secrets} onChange={(event) => updateEntity("secrets", event.target.value)} />
                </FieldShell>
              </>
            ) : null}

            {"sensoryDetails" in draftEntity ? (
              <>
                <FieldShell label="Sensory Details">
                  <TextArea value={draftEntity.sensoryDetails} onChange={(event) => updateEntity("sensoryDetails", event.target.value)} />
                </FieldShell>
                <FieldShell label="History">
                  <TextArea value={draftEntity.history} onChange={(event) => updateEntity("history", event.target.value)} />
                </FieldShell>
                <FieldShell label="Environmental Rules">
                  <TextArea value={draftEntity.environmentalRules} onChange={(event) => updateEntity("environmentalRules", event.target.value)} />
                </FieldShell>
                <FieldShell label="Parent Location">
                  <Select
                    value={draftEntity.parentLocationId ?? ""}
                    onChange={(event) => updateEntity("parentLocationId", event.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {snapshot.locations
                      .filter((location) => location.id !== draftEntity.id)
                      .map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                  </Select>
                </FieldShell>
              </>
            ) : null}

            {"origin" in draftEntity ? (
              <>
                <FieldShell label="Origin">
                  <TextArea value={draftEntity.origin} onChange={(event) => updateEntity("origin", event.target.value)} />
                </FieldShell>
                <FieldShell label="Properties">
                  <TextArea value={draftEntity.properties} onChange={(event) => updateEntity("properties", event.target.value)} />
                </FieldShell>
                <FieldShell label="Significance">
                  <Select
                    value={draftEntity.significance}
                    onChange={(event) => updateEntity("significance", event.target.value as StoryEntity["significance"])}
                  >
                    {["macguffin", "chekhovs_gun", "symbolic", "quest_item", "weapon", "key", "other"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FieldShell>
                <FieldShell label="Current Possessor">
                  <Select
                    value={draftEntity.currentPossessorId ?? ""}
                    onChange={(event) => updateEntity("currentPossessorId", event.target.value || undefined)}
                  >
                    <option value="">Nobody assigned</option>
                    {snapshot.characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </Select>
                </FieldShell>
              </>
            ) : null}

            {"ideology" in draftEntity ? (
              <>
                <FieldShell label="Ideology">
                  <TextArea value={draftEntity.ideology} onChange={(event) => updateEntity("ideology", event.target.value)} />
                </FieldShell>
                <FieldShell label="Goals">
                  <TextArea value={draftEntity.goals} onChange={(event) => updateEntity("goals", event.target.value)} />
                </FieldShell>
                <FieldShell label="Resources">
                  <TextArea value={draftEntity.resources} onChange={(event) => updateEntity("resources", event.target.value)} />
                </FieldShell>
              </>
            ) : null}
          </div>

          <div className="mt-6">
            <FieldShell label="Notes">
              <TextArea value={draftEntity.notes} onChange={(event) => updateEntity("notes", event.target.value)} />
            </FieldShell>
          </div>
        </div>

        <div className="space-y-6">
          {validEntityType === "character" && relationshipDraft ? (
            <div className="panel p-6">
              <h3 className="font-display text-3xl font-bold">Relationships</h3>
              <div className="mt-4 space-y-3">
                {characterRelationships.length === 0 ? (
                  <div className="text-sm text-[color:var(--muted)]">No character relationships yet.</div>
                ) : (
                  characterRelationships.map((relationship) => {
                    const otherId =
                      relationship.characterAId === entity.id ? relationship.characterBId : relationship.characterAId;
                    const other = snapshot.characters.find((character) => character.id === otherId);
                    return (
                      <div key={relationship.id} className="rounded-2xl border border-[color:var(--line)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{other?.name ?? "Unknown character"}</div>
                            <div className="mt-1 text-sm text-[color:var(--muted)]">{relationship.description || relationship.relationshipType}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => void deleteCharacterRelationship(relationship.id, projectId)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-5 grid gap-3">
                <Select value={relationshipDraft.characterBId} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, characterBId: event.target.value })}>
                  <option value="">Pick another character</option>
                  {snapshot.characters
                    .filter((character) => character.id !== entity.id)
                    .map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                </Select>
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={relationshipDraft.relationshipType} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, relationshipType: event.target.value as CharacterRelationship["relationshipType"] })}>
                    {["family", "romantic", "rivalry", "mentor_mentee", "employer_employee", "alliance", "betrayal", "friendship", "custom"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                  <Select value={relationshipDraft.directionality} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, directionality: event.target.value as CharacterRelationship["directionality"] })}>
                    {["mutual", "a_to_b", "b_to_a"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>
                <TextArea value={relationshipDraft.description} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, description: event.target.value })} placeholder="What is the shape of this relationship?" />
                <Button
                  onClick={async () => {
                    if (!relationshipDraft.characterBId) {
                      return;
                    }
                    await saveCharacterRelationship(relationshipDraft);
                    setRelationshipDraft(createEmptyRelationship(projectId, entity.id));
                  }}
                >
                  <Plus size={16} />
                  Add Relationship
                </Button>
              </div>
            </div>
          ) : null}

          {validEntityType === "character" && membershipDraft ? (
            <div className="panel p-6">
              <h3 className="font-display text-3xl font-bold">Faction Memberships</h3>
              <div className="mt-4 space-y-3">
                {memberships.length === 0 ? (
                  <div className="text-sm text-[color:var(--muted)]">No faction memberships yet.</div>
                ) : (
                  memberships.map(({ membership, faction }) => (
                    <div key={membership.id} className="rounded-2xl border border-[color:var(--line)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{faction?.name ?? "Unknown faction"}</div>
                          <div className="mt-1 text-sm text-[color:var(--muted)]">{membership.role || "Member"}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => void deleteFactionMembership(membership.id, projectId)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-5 grid gap-3">
                <Select value={membershipDraft.factionId} onChange={(event) => setMembershipDraft({ ...membershipDraft, factionId: event.target.value })}>
                  <option value="">Pick a faction</option>
                  {snapshot.factions.map((faction) => (
                    <option key={faction.id} value={faction.id}>
                      {faction.name}
                    </option>
                  ))}
                </Select>
                <TextInput value={membershipDraft.role} onChange={(event) => setMembershipDraft({ ...membershipDraft, role: event.target.value })} placeholder="Role in faction" />
                <Button
                  onClick={async () => {
                    if (!membershipDraft.factionId) {
                      return;
                    }
                    await saveFactionMembership(membershipDraft);
                    setMembershipDraft(createEmptyMembership(entity.id));
                  }}
                >
                  <Plus size={16} />
                  Add Membership
                </Button>
              </div>
            </div>
          ) : null}

          {linkDraft ? (
            <div className="panel p-6">
              <h3 className="font-display text-3xl font-bold">Cross-links</h3>
              <div className="mt-4 space-y-3">
                {links.length === 0 ? (
                  <div className="text-sm text-[color:var(--muted)]">No generic links yet.</div>
                ) : (
                  links.map((link) => {
                    const target = getEntityByType(snapshot, link.targetEntityType, link.targetEntityId);
                    return (
                      <div key={link.id} className="rounded-2xl border border-[color:var(--line)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{link.label}</div>
                            <div className="mt-1 text-sm text-[color:var(--muted)]">{target?.name ?? "Unknown target"}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => void deleteEntityLink(link.id, projectId)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-5 grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={linkDraft.targetEntityType} onChange={(event) => setLinkDraft({ ...linkDraft, targetEntityType: event.target.value as StoryEntityType, targetEntityId: "" })}>
                    {(["character", "location", "item", "faction"] as StoryEntityType[]).map((option) => (
                      <option key={option} value={option}>
                        {entityLabels[option]}
                      </option>
                    ))}
                  </Select>
                  <Select value={linkDraft.targetEntityId} onChange={(event) => setLinkDraft({ ...linkDraft, targetEntityId: event.target.value })}>
                    <option value="">Choose target</option>
                    {getEntityCollection(snapshot, linkDraft.targetEntityType).map((typedRecord) => (
                      <option key={typedRecord.id} value={typedRecord.id}>
                        {typedRecord.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <TextInput value={linkDraft.label} onChange={(event) => setLinkDraft({ ...linkDraft, label: event.target.value })} placeholder="headquarters, hidden at, mentored by..." />
                <Button
                  onClick={async () => {
                    if (!linkDraft.targetEntityId) {
                      return;
                    }
                    await saveEntityLink(linkDraft);
                    setLinkDraft(createEmptyEntityLink(projectId, validEntityType, entity.id));
                  }}
                >
                  <Plus size={16} />
                  Add Link
                </Button>
              </div>
            </div>
          ) : null}

          <div className="panel p-6">
            <h3 className="font-display text-3xl font-bold">Backlinks</h3>
            <div className="mt-4 space-y-3">
              {backlinks.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">No backlinks yet. Once scenes and draft mentions point here, they will show up automatically.</div>
              ) : (
                backlinks.map((backlink) => (
                  <Link key={backlink.id} to={backlink.route} className="block rounded-2xl border border-[color:var(--line)] p-4 transition hover:bg-white/40 dark:hover:bg-white/5">
                    <div className="font-semibold">{backlink.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{backlink.sourceType}</div>
                    <div className="mt-2 text-sm text-[color:var(--muted)]">{backlink.context}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getEntityCollectionForSuggestions(snapshot: {
  characters: StoryEntity[];
  locations: StoryEntity[];
  items: StoryEntity[];
  factions: StoryEntity[];
}) {
  return [...snapshot.characters, ...snapshot.locations, ...snapshot.items, ...snapshot.factions];
}
