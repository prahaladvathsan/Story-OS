import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/shared/EmptyState";
import { useProjectSnapshot } from "../hooks/useProjectSnapshot";
import { RelationshipWeb } from "../features/wiki/RelationshipWeb";

export function RelationshipWebPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const snapshot = useProjectSnapshot(projectId);

  if (!snapshot) {
    return <EmptyState title="Loading graph" description="Building character relationships from the story graph." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Relationship Web</div>
        <h2 className="mt-2 font-display text-4xl font-bold">Character graph</h2>
      </div>
      <div className="panel p-4">
        <RelationshipWeb
          snapshot={snapshot}
          projectId={projectId}
          onEntityClick={(entityId) => navigate(`/project/${projectId}/wiki/${entityId}`)}
        />
      </div>
    </div>
  );
}
