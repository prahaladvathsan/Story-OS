import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { Button } from "../components/shared/Button";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { extractPlainText, getOrderedActs, getOrderedScenes } from "../data/selectors";

export function DraftManuscriptPage() {
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);

  if (!snapshot) {
    return <EmptyState title="Loading manuscript" description="Concatenating scene drafts in story order." />;
  }

  const acts = getOrderedActs(snapshot.acts);
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const totalWordCount = snapshot.sceneDrafts.reduce((sum, draft) => sum + draft.wordCount, 0);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Draft</div>
            <h2 className="mt-2 font-display text-4xl font-bold">Full Manuscript</h2>
            <div className="mt-2 text-sm text-[color:var(--muted)]">{totalWordCount} words across {scenes.length} scenes</div>
          </div>
          <Button onClick={() => window.print()}>Print / PDF</Button>
        </div>
      </section>

      <article className="panel-strong p-10">
        {acts.map((act) => (
          <section key={act.id} className="mb-12">
            <h3 className="font-display text-4xl font-bold">{act.name}</h3>
            <div className="mt-8 space-y-10">
              {scenes
                .filter((scene) => scene.actId === act.id)
                .map((scene) => {
                  const draft = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
                  return (
                    <div key={scene.id}>
                      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] pb-3">
                        <div>
                          <div className="font-display text-2xl font-bold">{scene.title || "Untitled Scene"}</div>
                          <div className="mt-1 text-sm text-[color:var(--muted)]">{scene.summary || "No summary yet."}</div>
                        </div>
                        <Link to={`/project/${projectId}/draft/${scene.id}`}>
                          <Button variant="secondary" size="sm">
                            Open
                          </Button>
                        </Link>
                      </div>
                      <div className="prose prose-stone mt-6 max-w-none whitespace-pre-wrap text-[color:var(--text)] dark:prose-invert">
                        {draft?.plainText || extractPlainText(draft?.content) || "This scene has not been drafted yet."}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
