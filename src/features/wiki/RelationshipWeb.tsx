import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import { EmptyState } from "../../components/shared/EmptyState";
import { saveUiState } from "../../data/repository";
import { getActiveModules, getRelationshipMap } from "../../data/selectors";
import { createId, nowIso } from "../../lib/utils";
import type { ProjectSnapshot, StoryEntityType } from "../../data/schema";
import { entityLabels } from "../bible/config";

type PositionMap = Record<string, { x: number; y: number }>;

type Props = {
  snapshot: ProjectSnapshot;
  projectId: string;
  focusedEntityId?: string;
  onEntityClick?: (entityId: string, entityType: StoryEntityType) => void;
  heightClassName?: string;
};

const typeStyles: Record<StoryEntityType, { bg: string; chip: string }> = {
  character: { bg: "rgba(45, 120, 143, 0.08)", chip: "bg-sea-100/40 dark:bg-sea-900/30" },
  location: { bg: "rgba(125, 107, 52, 0.08)", chip: "bg-amber-100/40 dark:bg-amber-900/30" },
  item: { bg: "rgba(216, 101, 17, 0.08)", chip: "bg-ember-100/40 dark:bg-ember-900/30" },
  faction: { bg: "rgba(124, 52, 13, 0.08)", chip: "bg-rose-100/40 dark:bg-rose-900/30" },
};

export function RelationshipWeb({
  snapshot,
  projectId,
  focusedEntityId,
  onEntityClick,
  heightClassName = "h-[72vh]",
}: Props) {
  const modules = getActiveModules(snapshot.project);
  const allTypes: StoryEntityType[] = useMemo(() => {
    const list: StoryEntityType[] = ["character", "location"];
    if (modules.items) list.push("item");
    if (modules.factions) list.push("faction");
    return list;
  }, [modules.items, modules.factions]);

  const [visibleTypes, setVisibleTypes] = useState<Set<StoryEntityType>>(new Set(allTypes));
  const [relationshipFilter, setRelationshipFilter] = useState("all");

  const toggleType = (type: StoryEntityType) => {
    setVisibleTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const graphState = snapshot.uiState.find((entry) => entry.scope === "relationship-web");
  const savedPositions = (graphState?.data.positions as PositionMap | undefined) ?? {};

  const entityRecords = useMemo(() => {
    type Record = { id: string; name: string; entityType: StoryEntityType };
    const records: Record[] = [];
    if (visibleTypes.has("character")) {
      records.push(
        ...snapshot.characters.map((entity) => ({ id: entity.id, name: entity.name, entityType: "character" as const })),
      );
    }
    if (visibleTypes.has("location")) {
      records.push(
        ...snapshot.locations.map((entity) => ({ id: entity.id, name: entity.name, entityType: "location" as const })),
      );
    }
    if (visibleTypes.has("item") && modules.items) {
      records.push(
        ...snapshot.items.map((entity) => ({ id: entity.id, name: entity.name, entityType: "item" as const })),
      );
    }
    if (visibleTypes.has("faction") && modules.factions) {
      records.push(
        ...snapshot.factions.map((entity) => ({ id: entity.id, name: entity.name, entityType: "faction" as const })),
      );
    }
    return records;
  }, [snapshot.characters, snapshot.locations, snapshot.items, snapshot.factions, visibleTypes, modules.items, modules.factions]);

  const nodes: Node[] = useMemo(
    () =>
      entityRecords.map((entry, index) => {
        const position = savedPositions[entry.id] ?? {
          x: 120 + (index % 5) * 220,
          y: 100 + Math.floor(index / 5) * 170,
        };
        const isFocused = entry.id === focusedEntityId;
        return {
          id: entry.id,
          data: {
            label: (
              <div
                className={`rounded-2xl border px-4 py-3 text-left shadow-card ${
                  isFocused
                    ? "border-ink-900/40 bg-white dark:border-ink-50/40 dark:bg-ink-900"
                    : "border-[color:var(--line)] bg-white/90 dark:bg-ink-900/90"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {entityLabels[entry.entityType]}
                </div>
                <div className="mt-0.5 font-semibold">{entry.name || "Untitled"}</div>
              </div>
            ),
          },
          style: {
            background: typeStyles[entry.entityType].bg,
            borderRadius: 20,
            border: "none",
            width: 210,
          },
          position,
        };
      }),
    [entityRecords, savedPositions, focusedEntityId],
  );

  const visibleNodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = [];

    // Character ↔ Character (existing)
    const relMap = getRelationshipMap(snapshot.characterRelationships, snapshot.characters);
    for (const { relationship } of relMap) {
      if (relationshipFilter !== "all" && relationship.relationshipType !== relationshipFilter) continue;
      if (!visibleNodeIds.has(relationship.characterAId) || !visibleNodeIds.has(relationship.characterBId)) continue;
      result.push({
        id: relationship.id,
        source: relationship.characterAId,
        target: relationship.characterBId,
        label:
          relationship.relationshipType === "custom"
            ? relationship.customTypeLabel
            : relationship.relationshipType,
        style: {
          stroke:
            relationship.sentiment === "positive"
              ? "#477335"
              : relationship.sentiment === "negative"
                ? "#d86511"
                : "#2d788f",
          strokeWidth: 2.5,
        },
        labelStyle: { fill: "var(--text)", fontSize: 12 },
      });
    }

    // Character → Faction (membership)
    if (modules.factions) {
      for (const membership of snapshot.factionMemberships) {
        if (!visibleNodeIds.has(membership.characterId) || !visibleNodeIds.has(membership.factionId)) continue;
        result.push({
          id: `membership-${membership.id}`,
          source: membership.characterId,
          target: membership.factionId,
          label: membership.role || "member",
          style: { stroke: "#7c340d", strokeWidth: 1.5, strokeDasharray: "5,4" },
          labelStyle: { fill: "var(--text)", fontSize: 11 },
        });
      }
    }

    // Item → Character (possessor)
    if (modules.items) {
      for (const item of snapshot.items) {
        if (!item.currentPossessorId) continue;
        if (!visibleNodeIds.has(item.id) || !visibleNodeIds.has(item.currentPossessorId)) continue;
        result.push({
          id: `possessor-${item.id}`,
          source: item.id,
          target: item.currentPossessorId,
          label: "carried by",
          style: { stroke: "#d86511", strokeWidth: 1.5, strokeDasharray: "3,3" },
          labelStyle: { fill: "var(--text)", fontSize: 11 },
        });
      }
    }

    // Location → Location (parent)
    for (const location of snapshot.locations) {
      if (!location.parentLocationId) continue;
      if (!visibleNodeIds.has(location.id) || !visibleNodeIds.has(location.parentLocationId)) continue;
      result.push({
        id: `parent-${location.id}`,
        source: location.id,
        target: location.parentLocationId,
        label: "inside",
        style: { stroke: "#9a864c", strokeWidth: 1.5, strokeDasharray: "2,4" },
        labelStyle: { fill: "var(--text)", fontSize: 11 },
      });
    }

    // EntityLink (generic)
    for (const link of snapshot.entityLinks) {
      if (!visibleNodeIds.has(link.sourceEntityId) || !visibleNodeIds.has(link.targetEntityId)) continue;
      result.push({
        id: `link-${link.id}`,
        source: link.sourceEntityId,
        target: link.targetEntityId,
        label: link.label,
        style: { stroke: "#4b6275", strokeWidth: 1.5, strokeDasharray: "6,3" },
        labelStyle: { fill: "var(--text)", fontSize: 11 },
      });
    }

    return result;
  }, [
    snapshot.characterRelationships,
    snapshot.characters,
    snapshot.factionMemberships,
    snapshot.items,
    snapshot.locations,
    snapshot.entityLinks,
    relationshipFilter,
    modules.factions,
    modules.items,
    visibleNodeIds,
  ]);

  const handleNodeDragStop: OnNodeDrag = async (_, node) => {
    const nextPositions: PositionMap = {
      ...savedPositions,
      [node.id]: node.position,
    };

    await saveUiState({
      id: graphState?.id ?? createId("ui"),
      projectId,
      scope: "relationship-web",
      data: { positions: nextPositions },
      createdAt: graphState?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    });
  };

  const entityById = useMemo(() => {
    const map = new Map<string, StoryEntityType>();
    for (const entry of entityRecords) map.set(entry.id, entry.entityType);
    return map;
  }, [entityRecords]);

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Show types</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTypes.map((type) => {
              const active = visibleTypes.has(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900"
                      : "border border-[color:var(--line)] text-[color:var(--muted)] hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  {entityLabels[type]}s
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Relationship type</span>
          <select
            value={relationshipFilter}
            onChange={(event) => setRelationshipFilter(event.target.value)}
            className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-3 py-2.5 text-sm dark:bg-white/5"
          >
            <option value="all">All types</option>
            {Array.from(
              new Set(snapshot.characterRelationships.map((relationship) => relationship.relationshipType)),
            ).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl border border-[color:var(--line)] p-3 text-xs leading-5 text-[color:var(--muted)]">
          Solid edges = character relationships (color = sentiment).
          Dashed = memberships, possessions, parents, and cross-links.
          Drag nodes to pin a layout.
        </div>
      </aside>

      <div className="rounded-2xl border border-[color:var(--line)] bg-white/40 p-1 dark:bg-white/5">
        {nodes.length === 0 ? (
          <EmptyState
            title="No visible graph"
            description="Toggle on at least one entity type, or add entities first."
          />
        ) : (
          <div className={heightClassName}>
            <ReactFlow
              fitView
              nodes={nodes}
              edges={edges}
              onNodeDragStop={handleNodeDragStop}
              onNodeClick={(_, node) => {
                const type = entityById.get(node.id);
                if (type && onEntityClick) onEntityClick(node.id, type);
              }}
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}
