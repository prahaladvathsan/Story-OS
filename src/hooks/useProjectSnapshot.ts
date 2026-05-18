import { useLiveQuery } from "dexie-react-hooks";
import { loadProjectSnapshot } from "../data/repository";

export function useProjectSnapshot(projectId?: string) {
  return useLiveQuery(async () => {
    if (!projectId) {
      return undefined;
    }
    return loadProjectSnapshot(projectId);
  }, [projectId]);
}

