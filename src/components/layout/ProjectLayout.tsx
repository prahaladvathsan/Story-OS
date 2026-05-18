import { Moon, Search, SunMedium, WandSparkles } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../data/db";
import { useUiStore } from "../../store/ui-store";
import { Button } from "../shared/Button";

const projectNav = [
  { to: "", label: "Dashboard", end: true },
  { to: "bible/character", label: "Bible" },
  { to: "board/kanban", label: "Board" },
  { to: "draft", label: "Draft" },
  { to: "settings", label: "Settings" },
];

const subNavGroups = [
  {
    prefix: "/bible",
    items: [
      ["character", "Characters"],
      ["location", "Locations"],
      ["item", "Items"],
      ["faction", "Factions"],
      ["relationships", "Relationships"],
    ],
  },
  {
    prefix: "/board",
    items: [
      ["kanban", "Kanban"],
      ["timeline", "Timeline"],
      ["arcs", "Arcs"],
      ["foreshadowing", "Foreshadowing"],
    ],
  },
];

export function ProjectLayout() {
  const { projectId = "" } = useParams();
  const project = useLiveQuery(async () => db.projects.get(projectId), [projectId]);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const setActiveProject = useUiStore((state) => state.setActiveProject);
  const openCommandPalette = useUiStore((state) => state.openCommandPalette);
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);

  useEffect(() => {
    setActiveProject(projectId);
    return () => setActiveProject(undefined);
  }, [projectId, setActiveProject]);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col gap-4">
        <header className="panel-strong no-print flex flex-col gap-4 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">Story OS</div>
              <h1 className="mt-2 font-display text-3xl font-bold">{project?.name ?? "Loading project..."}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => openCommandPalette()}>
                <Search size={16} />
                Search
              </Button>
              <Button variant="secondary" onClick={() => openQuickCapture("character")}>
                <WandSparkles size={16} />
                Quick Capture
              </Button>
              <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <SunMedium size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {projectNav.map((item) => (
              <NavLink
                key={item.to || "dashboard"}
                end={item.end}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-ink-900 text-ink-50 dark:bg-ink-50 dark:text-ink-900" : "hover:bg-white/60 dark:hover:bg-white/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {subNavGroups.map((group) => (
              <div key={group.prefix} className="flex flex-wrap gap-2">
                {group.items.map(([slug, label]) => (
                  <NavLink
                    key={slug}
                    to={`${group.prefix.slice(1)}/${slug}`}
                    className={({ isActive }) => (isActive ? "text-[color:var(--text)]" : "")}
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </header>

        <div className="no-print rounded-3xl border border-[color:var(--line)] bg-ember-100/40 px-4 py-3 text-sm text-[color:var(--muted)] dark:bg-ember-900/20">
          Story OS is local-first in this MVP. Your project lives in this browser profile until you export a `.storyos` backup.
        </div>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
