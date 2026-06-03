import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ProjectSnapshot, StoryEntityType } from "../../data/schema";
import { entityLabels } from "../../features/bible/config";

type LinkifiedTextProps = {
  value: string;
  onChange: (value: string) => void;
  snapshot: ProjectSnapshot;
  placeholder?: string;
  rows?: number;
  className?: string;
};

type Segment =
  | { kind: "text"; text: string }
  | { kind: "link"; name: string; entityId?: string; entityType?: StoryEntityType };

const WIKILINK = /\[\[([^\[\]]+?)\]\]/g;

function parseSegments(
  value: string,
  resolver: (name: string) => { id: string; entityType: StoryEntityType } | undefined,
): Segment[] {
  if (!value) return [];
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of value.matchAll(WIKILINK)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      segments.push({ kind: "text", text: value.slice(cursor, index) });
    }
    const name = match[1].trim();
    const resolved = resolver(name);
    segments.push({
      kind: "link",
      name,
      entityId: resolved?.id,
      entityType: resolved?.entityType,
    });
    cursor = index + match[0].length;
  }
  if (cursor < value.length) {
    segments.push({ kind: "text", text: value.slice(cursor) });
  }
  return segments;
}

export function LinkifiedText({
  value,
  onChange,
  snapshot,
  placeholder = "Click to edit. Use [[Name]] to link a wiki entry.",
  rows = 4,
  className = "",
}: LinkifiedTextProps) {
  const { projectId = "" } = useParams();
  const [editing, setEditing] = useState(false);

  const resolver = useMemo(() => {
    const map = new Map<string, { id: string; entityType: StoryEntityType }>();
    const entries: Array<[StoryEntityType, { id: string; name: string }[]]> = [
      ["character", snapshot.characters],
      ["location", snapshot.locations],
      ["item", snapshot.items],
      ["faction", snapshot.factions],
    ];
    for (const [entityType, list] of entries) {
      for (const entity of list) {
        if (entity.name) map.set(entity.name.toLowerCase(), { id: entity.id, entityType });
      }
    }
    return (name: string) => map.get(name.toLowerCase());
  }, [snapshot.characters, snapshot.locations, snapshot.items, snapshot.factions]);

  const segments = useMemo(() => parseSegments(value, resolver), [value, resolver]);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        rows={rows}
        placeholder={placeholder}
        className={`min-h-[120px] w-full rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm leading-6 text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-sea-400 focus:bg-white dark:bg-white/5 ${className}`}
      />
    );
  }

  return (
    <div
      tabIndex={0}
      role="textbox"
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
      className={`min-h-[120px] cursor-text whitespace-pre-wrap rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm leading-6 text-[color:var(--text)] outline-none transition hover:bg-white focus:border-sea-400 dark:bg-white/5 dark:hover:bg-white/10 ${className}`}
    >
      {value ? (
        segments.map((segment, index) =>
          segment.kind === "text" ? (
            <span key={index}>{segment.text}</span>
          ) : segment.entityId ? (
            <Link
              key={index}
              to={`/project/${projectId}/wiki/${segment.entityId}`}
              onClick={(event) => event.stopPropagation()}
              className="mx-0.5 rounded-md bg-ink-900/10 px-1.5 py-0.5 text-[color:var(--text)] no-underline hover:bg-ink-900/20 dark:bg-ink-50/15 dark:hover:bg-ink-50/25"
              title={segment.entityType ? entityLabels[segment.entityType] : undefined}
            >
              {segment.name}
            </Link>
          ) : (
            <span
              key={index}
              className="mx-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-900 dark:text-amber-200"
              title="No matching wiki entry"
            >
              {segment.name}
            </span>
          ),
        )
      ) : (
        <span className="text-[color:var(--muted)]">{placeholder}</span>
      )}
    </div>
  );
}
