import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ProjectSnapshot } from "../../data/schema";
import { getDashboardStats } from "../../data/selectors";
import { formatDateTime } from "../../lib/utils";
import { StatusBadge } from "../../components/shared/StatusBadge";

type Props = {
  snapshot: ProjectSnapshot;
};

export function WritePulseStrip({ snapshot }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stats = getDashboardStats(snapshot);
  const latestEdit = snapshot.recentEdits[0];

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-full border border-[color:var(--line)] bg-white/50 px-4 py-2 text-left text-sm transition hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span>
          <span className="text-[color:var(--muted)]">Words </span>
          <span className="font-semibold">{stats.totalWordCount.toLocaleString()}</span>
        </span>
        <span>
          <span className="text-[color:var(--muted)]">Scenes </span>
          <span className="font-semibold">{stats.draftedSceneCount}/{stats.sceneCount}</span>
          <span className="text-[color:var(--muted)]"> drafted</span>
        </span>
        {latestEdit ? (
          <span className="hidden md:inline">
            <span className="text-[color:var(--muted)]">Last </span>
            <span className="font-semibold">{latestEdit.title}</span>
          </span>
        ) : null}
        <span className="ml-auto text-[color:var(--muted)]">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded ? (
        <div className="panel grid gap-4 p-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Status mix</div>
            <div className="mt-2 space-y-1.5">
              {Object.entries(stats.scenesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <StatusBadge value={status} />
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Entities</div>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Characters</span><span className="font-semibold">{stats.entityCounts.characters}</span></div>
              <div className="flex justify-between"><span>Locations</span><span className="font-semibold">{stats.entityCounts.locations}</span></div>
              <div className="flex justify-between"><span>Items</span><span className="font-semibold">{stats.entityCounts.items}</span></div>
              <div className="flex justify-between"><span>Factions</span><span className="font-semibold">{stats.entityCounts.factions}</span></div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Recent edits</div>
            <div className="mt-2 space-y-1.5 text-sm">
              {snapshot.recentEdits.length === 0 ? (
                <div className="text-[color:var(--muted)]">No edits yet.</div>
              ) : (
                snapshot.recentEdits.slice(0, 4).map((edit) => (
                  <div key={edit.id} className="truncate">
                    <span className="font-semibold">{edit.title}</span>
                    <span className="text-[color:var(--muted)]"> · {formatDateTime(edit.updatedAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
