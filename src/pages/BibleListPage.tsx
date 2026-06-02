import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, List, LayoutGrid, Plus, Tag, Trash2 } from "lucide-react";
import { EntityImage } from "../components/shared/EntityImage";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { TextInput } from "../components/shared/Field";
import { StatusBadge } from "../components/shared/StatusBadge";
import { createEmptyEntity } from "../data/defaults";
import { deleteEntity, saveEntity } from "../data/repository";
import { getEntityCollection, getTagSuggestions } from "../data/selectors";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import type { StoryEntity, StoryEntityType } from "../data/schema";
import { entityLabels, isEntityType } from "../features/bible/config";

type SortMode = "custom" | "name" | "updated";

function SortableRow({
  entity,
  selected,
  onToggle,
  onOpen,
}: {
  entity: StoryEntity;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entity.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl border border-[color:var(--line)] bg-white/50 px-3 py-3 dark:bg-white/5"
    >
      <input type="checkbox" checked={selected} onChange={onToggle} />
      <button type="button" className="cursor-grab text-[color:var(--muted)]" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button type="button" onClick={onOpen} className="flex items-center gap-3 text-left">
        <EntityImage assetId={entity.primaryAssetId} alt={entity.name} className="h-14 w-20" />
        <div>
          <div className="font-semibold">{entity.name || "Untitled"}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {entity.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-ink-100 px-2 py-1 text-[11px] dark:bg-ink-900/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
      <div className="justify-self-end">
        {"status" in entity ? <StatusBadge value={entity.status} /> : null}
      </div>
    </div>
  );
}

export function BibleListPage() {
  const navigate = useNavigate();
  const { projectId = "", entityType = "character" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkTag, setBulkTag] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));
  const statusOptions = useMemo(() => {
    if (entityType === "character") {
      return ["all", "alive", "dead", "missing", "unknown", "transformed"];
    }
    if (entityType === "item") {
      return ["all", "intact", "broken", "lost", "hidden", "destroyed", "unknown"];
    }
    return ["all"];
  }, [entityType]);

  if (!isEntityType(entityType)) {
    return <EmptyState title="Unknown entity type" description="Pick a valid Bible section from the navigation." />;
  }

  if (!snapshot) {
    return <EmptyState title="Loading Bible" description="Pulling entity cards from the story graph." />;
  }

  const allEntities = getEntityCollection(snapshot, entityType);
  const tagSuggestions = getTagSuggestions(allEntities);
  const filteredEntities = allEntities
    .filter((entity) => !tagFilter || entity.tags.includes(tagFilter))
    .filter((entity) => {
      if (statusFilter === "all" || !("status" in entity)) {
        return true;
      }
      return entity.status === statusFilter;
    })
    .slice()
    .sort((left, right) => {
      switch (sortMode) {
        case "name":
          return left.name.localeCompare(right.name);
        case "updated":
          return right.updatedAt.localeCompare(left.updatedAt);
        case "custom":
        default:
          return left.sortOrder - right.sortOrder;
      }
    });

  const canDrag = view === "list" && sortMode === "custom" && !tagFilter && statusFilter === "all";

  const handleCreate = async () => {
    const entity = createEmptyEntity(projectId, entityType);
    entity.name = `Untitled ${entityLabels[entityType]}`;
    entity.sortOrder = allEntities.length;
    const saved = await saveEntity(entityType, entity);
    navigate(`/project/${projectId}/bible/${entityType}/${saved.id}`);
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedIds.map((id) => deleteEntity(entityType, id, projectId)));
    setSelectedIds([]);
  };

  const handleBulkTag = async () => {
    const normalizedTag = bulkTag.trim();
    if (!normalizedTag) {
      return;
    }

    await Promise.all(
      allEntities
        .filter((entity) => selectedIds.includes(entity.id))
        .map((entity) =>
          saveEntity(entityType, {
            ...entity,
            tags: Array.from(new Set([...entity.tags, normalizedTag])),
          } as StoryEntity),
        ),
    );
    setBulkTag("");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canDrag || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = filteredEntities.findIndex((entity) => entity.id === event.active.id);
    const newIndex = filteredEntities.findIndex((entity) => entity.id === event.over?.id);
    const reordered = arrayMove(filteredEntities, oldIndex, newIndex);

    await Promise.all(
      reordered.map((entity, index) =>
        saveEntity(entityType, {
          ...entity,
          sortOrder: index,
        } as StoryEntity),
      ),
    );
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Bible</div>
            <h2 className="mt-2 font-display text-4xl font-bold">{entityLabels[entityType]}s</h2>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              One source of truth for the story world, with backlinks into scenes and draft mentions.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={view === "grid" ? "primary" : "secondary"} onClick={() => setView("grid")}>
              <LayoutGrid size={16} />
              Grid
            </Button>
            <Button variant={view === "list" ? "primary" : "secondary"} onClick={() => setView("list")}>
              <List size={16} />
              List
            </Button>
            <Button onClick={handleCreate}>
              <Plus size={16} />
              New {entityLabels[entityType]}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[0.2fr_0.2fr_0.2fr_1fr]">
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm dark:bg-white/5">
            <option value="custom">Sort: custom</option>
            <option value="name">Sort: name</option>
            <option value="updated">Sort: updated</option>
          </select>
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm dark:bg-white/5">
            <option value="">Filter by tag</option>
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm dark:bg-white/5">
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Filter by status" : option}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <TextInput value={bulkTag} onChange={(event) => setBulkTag(event.target.value)} placeholder="Bulk tag selected cards" />
            <Button variant="secondary" onClick={handleBulkTag} disabled={selectedIds.length === 0}>
              <Tag size={16} />
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {canDrag ? (
          <div className="mt-3 text-xs text-[color:var(--muted)]">Drag cards in list view to change custom order.</div>
        ) : null}
      </section>

      {filteredEntities.length === 0 ? (
        <EmptyState
          title={`No ${entityLabels[entityType].toLowerCase()}s yet`}
          description={`Create your first ${entityLabels[entityType].toLowerCase()} or adjust the current filters.`}
          action={<Button onClick={handleCreate}>Create {entityLabels[entityType]}</Button>}
        />
      ) : view === "grid" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => navigate(`/project/${projectId}/bible/${entityType}/${entity.id}`)}
              className="panel p-4 text-left transition hover:-translate-y-1"
            >
              <EntityImage assetId={entity.primaryAssetId} alt={entity.name} />
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-2xl font-bold">{entity.name || "Untitled"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entity.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-ink-100 px-2 py-1 text-[11px] dark:bg-ink-900/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entity.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked ? [...current, entity.id] : current.filter((id) => id !== entity.id),
                    )
                  }
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
              {"status" in entity ? <div className="mt-3"><StatusBadge value={entity.status} /></div> : null}
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] line-clamp-3">
                {entity.description || entity.notes || "Open this card to start defining it."}
              </p>
            </button>
          ))}
        </section>
      ) : (
        <section className="panel p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredEntities.map((entity) => entity.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {filteredEntities.map((entity) => (
                  <SortableRow
                    key={entity.id}
                    entity={entity}
                    selected={selectedIds.includes(entity.id)}
                    onToggle={() =>
                      setSelectedIds((current) =>
                        current.includes(entity.id) ? current.filter((id) => id !== entity.id) : [...current, entity.id],
                      )
                    }
                    onOpen={() => navigate(`/project/${projectId}/bible/${entityType}/${entity.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}
    </div>
  );
}
