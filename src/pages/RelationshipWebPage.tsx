import { useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { getRelationshipMap } from "../data/selectors";
import { saveUiState } from "../data/repository";
import { createId, nowIso } from "../lib/utils";

type PositionMap = Record<string, { x: number; y: number }>;

export function RelationshipWebPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [factionFilter, setFactionFilter] = useState("all");

  const graphState = snapshot?.uiState.find((entry) => entry.scope === "relationship-web");
  const savedPositions = (graphState?.data.positions as PositionMap | undefined) ?? {};
  const membershipsByCharacter = new Map(
    (snapshot?.factionMemberships ?? []).map((membership) => [membership.characterId, membership.factionId]),
  );
  const relationshipMap =
    snapshot
      ? getRelationshipMap(snapshot.characterRelationships, snapshot.characters).filter(
          ({ relationship }) =>
            (relationshipFilter === "all" || relationship.relationshipType === relationshipFilter) &&
            (factionFilter === "all" ||
              membershipsByCharacter.get(relationship.characterAId) === factionFilter ||
              membershipsByCharacter.get(relationship.characterBId) === factionFilter),
        )
      : [];

  const nodes: Node[] =
    snapshot?.characters
      .filter((character) => {
        if (factionFilter === "all") {
          return true;
        }
        return membershipsByCharacter.get(character.id) === factionFilter;
      })
      .map((character, index) => {
        const factionId = membershipsByCharacter.get(character.id);
        const faction = snapshot.factions.find((entry) => entry.id === factionId);
        const position = savedPositions[character.id] ?? {
          x: 120 + (index % 4) * 220,
          y: 100 + Math.floor(index / 4) * 180,
        };
        return {
          id: character.id,
          data: {
            label: (
              <div className="rounded-2xl border border-[color:var(--line)] bg-white/90 px-4 py-3 text-left shadow-card dark:bg-ink-900/90">
                <div className="font-semibold">{character.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {faction?.name ?? "Unaffiliated"}
                </div>
              </div>
            ),
          },
          style: {
            background: faction ? "rgba(45, 120, 143, 0.08)" : "rgba(125, 107, 52, 0.06)",
            borderRadius: 20,
            border: "none",
            width: 210,
          },
          position,
        };
      }) ?? [];

  if (!snapshot) {
    return <EmptyState title="Loading graph" description="Building character relationships from the story graph." />;
  }

  const visibleNodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = relationshipMap
    .filter(({ relationship }) => visibleNodeIds.has(relationship.characterAId) && visibleNodeIds.has(relationship.characterBId))
    .map(({ relationship }) => ({
      id: relationship.id,
      source: relationship.characterAId,
      target: relationship.characterBId,
      label: relationship.relationshipType === "custom" ? relationship.customTypeLabel : relationship.relationshipType,
      style: {
        stroke:
          relationship.sentiment === "positive"
            ? "#477335"
            : relationship.sentiment === "negative"
              ? "#d86511"
              : "#2d788f",
        strokeWidth: 2.5,
      },
      labelStyle: {
        fill: "var(--text)",
        fontSize: 12,
      },
    }));

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

  return (
    <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
      <section className="panel p-6">
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Relationship Web</div>
        <h2 className="mt-2 font-display text-4xl font-bold">Character Graph</h2>
        <div className="mt-4 space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold">Relationship type</span>
            <select value={relationshipFilter} onChange={(event) => setRelationshipFilter(event.target.value)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 dark:bg-white/5">
              <option value="all">All types</option>
              {Array.from(new Set(snapshot.characterRelationships.map((relationship) => relationship.relationshipType))).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold">Faction filter</span>
            <select value={factionFilter} onChange={(event) => setFactionFilter(event.target.value)} className="rounded-2xl border border-[color:var(--line)] bg-white/60 px-4 py-3 dark:bg-white/5">
              <option value="all">All factions</option>
              {snapshot.factions.map((faction) => (
                <option key={faction.id} value={faction.id}>
                  {faction.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-[color:var(--line)] p-4 text-sm text-[color:var(--muted)]">
            Drag nodes to pin a preferred layout. Positions are stored locally per project.
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden p-2">
        {nodes.length === 0 ? (
          <EmptyState title="No visible graph" description="Create a few characters and relationships first, or clear the current filters." />
        ) : (
          <div className="h-[72vh]">
            <ReactFlow
              fitView
              nodes={nodes}
              edges={edges}
              onNodeDragStop={handleNodeDragStop}
              onNodeClick={(_, node) => navigate(`/project/${projectId}/bible/character/${node.id}`)}
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </section>
    </div>
  );
}
