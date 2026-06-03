import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { EntityImage } from "../components/shared/EntityImage";
import { StatusBadge } from "../components/shared/StatusBadge";
import { createEmptyEntity } from "../data/defaults";
import { saveEntity } from "../data/repository";
import { getActiveModules, getEntityCollection, getTagSuggestions } from "../data/selectors";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import type { StoryEntity, StoryEntityType } from "../data/schema";
import { entityLabels } from "../features/bible/config";

type TypeFilter = StoryEntityType | "all";
type SortMode = "recent" | "name";

const allTypes: StoryEntityType[] = ["character", "location", "item", "faction"];

type EntityCardData = { entity: StoryEntity; entityType: StoryEntityType };

export function WikiListPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showTypePicker, setShowTypePicker] = useState(false);

  const allEntries = useMemo<EntityCardData[]>(() => {
    if (!snapshot) return [];
    return allTypes.flatMap((entityType) =>
      getEntityCollection(snapshot, entityType).map((entity) => ({ entity, entityType })),
    );
  }, [snapshot]);

  const tagSuggestions = useMemo(
    () => getTagSuggestions(allEntries.map((entry) => entry.entity)),
    [allEntries],
  );

  if (!snapshot) {
    return (
      <EmptyState title="Loading wiki" description="Pulling characters, locations, items, and factions from the story graph." />
    );
  }

  const modules = getActiveModules(snapshot.project);
  const visibleTypes: StoryEntityType[] = ["character", "location"];
  if (modules.items) visibleTypes.push("item");
  if (modules.factions) visibleTypes.push("faction");

  const filtered = allEntries
    .filter((entry) => visibleTypes.includes(entry.entityType))
    .filter((entry) => (typeFilter === "all" ? true : entry.entityType === typeFilter))
    .filter((entry) => (tagFilter ? entry.entity.tags.includes(tagFilter) : true))
    .filter((entry) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        entry.entity.name.toLowerCase().includes(q) ||
        ("description" in entry.entity && (entry.entity as { description?: string }).description?.toLowerCase().includes(q)) ||
        entry.entity.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .sort((left, right) => {
      if (sortMode === "name") return left.entity.name.localeCompare(right.entity.name);
      return right.entity.updatedAt.localeCompare(left.entity.updatedAt);
    });

  const counts = allTypes.reduce<Record<StoryEntityType, number>>(
    (acc, type) => {
      acc[type] = allEntries.filter((entry) => entry.entityType === type).length;
      return acc;
    },
    { character: 0, location: 0, item: 0, faction: 0 },
  );

  const handleCreate = async (entityType: StoryEntityType) => {
    setShowTypePicker(false);
    const entity = createEmptyEntity(projectId, entityType) as StoryEntity;
    entity.name = `Untitled ${entityLabels[entityType]}`;
    entity.sortOrder = counts[entityType];
    const saved = await saveEntity(entityType, entity);
    navigate(`/project/${projectId}/wiki/${saved.id}`);
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Wiki</div>
            <h2 className="mt-2 font-display text-4xl font-bold">Story bible</h2>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Every character, place, item, and faction. Filter by type, search, or follow the backlinks from any scene.
            </div>
          </div>
          <div className="relative">
            <Button onClick={() => setShowTypePicker((value) => !value)}>
              <Plus size={16} />
              New entry
            </Button>
            {showTypePicker ? (
              <div className="absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2 shadow-card">
                {visibleTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => void handleCreate(type)}
                    className="rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {entityLabels[type]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            All <span className="opacity-60">· {visibleTypes.reduce((sum, t) => sum + counts[t], 0)}</span>
          </Chip>
          {visibleTypes.map((type) => (
            <Chip key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
              {entityLabels[type]}s <span className="opacity-60">· {counts[type]}</span>
            </Chip>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, description, or tag"
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white/60 py-2.5 pl-9 pr-3 text-sm outline-none dark:bg-white/5"
            />
          </div>
          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-3 py-2.5 text-sm dark:bg-white/5"
          >
            <option value="">All tags</option>
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-3 py-2.5 text-sm dark:bg-white/5"
          >
            <option value="recent">Most recent</option>
            <option value="name">By name</option>
          </select>
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title={search.trim() || tagFilter ? "No matches" : "Nothing here yet"}
          description={
            search.trim() || tagFilter
              ? "Try clearing filters or changing your search."
              : "Add a character, location, item, or faction to start building the world."
          }
          action={
            !search.trim() && !tagFilter ? (
              <Button onClick={() => setShowTypePicker(true)}>
                <Plus size={16} /> New entry
              </Button>
            ) : null
          }
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(({ entity, entityType }) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => navigate(`/project/${projectId}/wiki/${entity.id}`)}
              className="panel p-4 text-left transition hover:-translate-y-1"
            >
              <EntityImage assetId={entity.primaryAssetId} alt={entity.name} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-2xl font-bold truncate">{entity.name || "Untitled"}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {entityLabels[entityType]}
                  </div>
                </div>
                {"status" in entity ? <StatusBadge value={entity.status} /> : null}
              </div>
              {entity.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entity.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] dark:bg-ink-900/60">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] line-clamp-3">
                {("description" in entity ? (entity as { description?: string }).description : undefined) ||
                  entity.notes ||
                  "Open this card to start defining it."}
              </p>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
          : "border border-[color:var(--line)] bg-white/40 text-[color:var(--text)] hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
