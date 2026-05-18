import { useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { MetricCard } from "../components/shared/MetricCard";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { formatDateTime } from "../lib/utils";
import { getArcCoverage, getDashboardStats, getOrderedScenes } from "../data/selectors";
import { StatusBadge } from "../components/shared/StatusBadge";

export function DashboardPage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);

  if (!snapshot) {
    return <EmptyState title="Loading project" description="Gathering the story graph for this dashboard." />;
  }

  const stats = getDashboardStats(snapshot);
  const arcCoverage = getArcCoverage(snapshot);
  const orderedScenes = getOrderedScenes(snapshot.acts, snapshot.scenes);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Word Count" value={stats.totalWordCount.toLocaleString()} hint="Across all drafted scenes" />
        <MetricCard label="Scenes" value={stats.sceneCount} hint={`${stats.draftedSceneCount} drafted`} />
        <MetricCard
          label="Entities"
          value={Object.values(stats.entityCounts).reduce((sum, count) => sum + count, 0)}
          hint={`${stats.entityCounts.characters} characters, ${stats.entityCounts.locations} locations`}
        />
        <MetricCard
          label="Foreshadowing"
          value={stats.unresolvedForeshadowing.length}
          hint="Planted but still missing a payoff scene"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Story Health</div>
          <h2 className="mt-2 font-display text-3xl font-bold">Project Summary</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--line)] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Format / Genre</div>
              <div className="mt-2 text-lg font-semibold">{snapshot.project.format.replaceAll("_", " ")}</div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">{snapshot.project.genre || "No genre set"}</div>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Last Updated</div>
              <div className="mt-2 text-lg font-semibold">{formatDateTime(snapshot.project.updatedAt)}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {Object.entries(stats.scenesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-2xl border border-[color:var(--line)] px-4 py-3">
                <StatusBadge value={status} />
                <div className="text-sm font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Arc Health</div>
            <h2 className="mt-2 font-display text-3xl font-bold">Coverage</h2>
            <div className="mt-5 space-y-4">
              {arcCoverage.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Create arcs to visualize how they run through your scenes.</div>
              ) : (
                arcCoverage.map((entry) => (
                  <div key={entry.arc.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold">{entry.arc.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">{entry.sceneIds.length} tagged scenes</div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {orderedScenes.map((scene) => (
                        <span
                          key={`${entry.arc.id}-${scene.id}`}
                          className="h-2 flex-1 rounded-full"
                          style={{
                            backgroundColor: entry.sceneIds.includes(scene.id) ? entry.arc.color : "rgba(0,0,0,0.08)",
                            opacity: entry.sceneIds.includes(scene.id) ? 1 : 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Recent Edits</div>
            <h2 className="mt-2 font-display text-3xl font-bold">Activity</h2>
            <div className="mt-4 space-y-3">
              {snapshot.recentEdits.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Edits will show up here once you start shaping the graph.</div>
              ) : (
                snapshot.recentEdits.map((edit) => (
                  <div key={edit.id} className="rounded-2xl border border-[color:var(--line)] px-4 py-3">
                    <div className="font-semibold">{edit.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {edit.entityType} • {formatDateTime(edit.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
