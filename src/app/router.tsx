import { createHashRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProjectLayout } from "../components/layout/ProjectLayout";
import { ProjectsPage } from "../pages/ProjectsPage";
import { WritePage } from "../pages/WritePage";
import { WikiListPage } from "../pages/WikiListPage";
import { EntityEditorPage } from "../pages/EntityEditorPage";
import { RelationshipWebPage } from "../pages/RelationshipWebPage";
import { BoardKanbanPage } from "../pages/BoardKanbanPage";
import { BoardTimelinePage } from "../pages/BoardTimelinePage";
import { BoardArcsPage } from "../pages/BoardArcsPage";
import { BoardForeshadowingPage } from "../pages/BoardForeshadowingPage";
import { DraftScenePage } from "../pages/DraftScenePage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ProjectsPage />,
      },
      {
        path: "project/:projectId",
        element: <ProjectLayout />,
        children: [
          { index: true, element: <WritePage /> },
          { path: "write", element: <WritePage /> },
          { path: "wiki", element: <WikiListPage /> },
          { path: "wiki/:entityId", element: <EntityEditorPage /> },
          { path: "project", element: <SettingsPage /> },
          { path: "settings", element: <SettingsPage /> },
          // Legacy direct-URL access for features not yet migrated into the new IA.
          { path: "bible/relationships", element: <RelationshipWebPage /> },
          { path: "bible/:entityType/:entityId", element: <EntityEditorPage /> },
          { path: "board/kanban", element: <BoardKanbanPage /> },
          { path: "board/timeline", element: <BoardTimelinePage /> },
          { path: "board/arcs", element: <BoardArcsPage /> },
          { path: "board/foreshadowing", element: <BoardForeshadowingPage /> },
          { path: "draft/:sceneId", element: <DraftScenePage /> },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
