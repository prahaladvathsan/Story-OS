import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchProjectContent } from "../../data/selectors";
import { useProjectSnapshot } from "../../hooks/useProjectSnapshot";
import { useUiStore } from "../../store/ui-store";
import { Modal } from "../shared/Modal";
import { TextInput } from "../shared/Field";

export function CommandPaletteModal() {
  const navigate = useNavigate();
  const activeProjectId = useUiStore((state) => state.activeProjectId);
  const commandPaletteOpen = useUiStore((state) => state.commandPaletteOpen);
  const closeCommandPalette = useUiStore((state) => state.closeCommandPalette);
  const snapshot = useProjectSnapshot(activeProjectId);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!snapshot || !query.trim()) {
      return [];
    }

    return searchProjectContent(snapshot, query).slice(0, 12);
  }, [query, snapshot]);

  return (
    <Modal
      open={commandPaletteOpen}
      onClose={() => {
        setQuery("");
        closeCommandPalette();
      }}
      title="Search Story Graph"
      description="Find entities, scenes, manuscript mentions, arcs, and foreshadowing from anywhere."
      widthClassName="max-w-3xl"
    >
      {!activeProjectId ? (
        <div className="text-sm text-[color:var(--muted)]">Open a project to search it.</div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={18} />
            <TextInput
              autoFocus
              className="pl-11"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search characters, scenes, manuscript text, arcs..."
            />
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-auto">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--line)] p-4 text-sm text-[color:var(--muted)]">
                {query.trim() ? "No results yet. Try another keyword or phrase." : "Start typing to search the project."}
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => {
                    closeCommandPalette();
                    setQuery("");
                    navigate(result.route);
                  }}
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white/40 px-4 py-3 text-left transition hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{result.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {result.kind}
                      </div>
                    </div>
                    <div className="max-w-xl text-sm text-[color:var(--muted)] line-clamp-2">{result.text}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

