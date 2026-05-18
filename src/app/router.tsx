import { createHashRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProjectLayout } from "../components/layout/ProjectLayout";
import { ProjectsPage } from "../pages/ProjectsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { BibleListPage } from "../pages/BibleListPage";
import { EntityEditorPage } from "../pages/EntityEditorPage";
import { RelationshipWebPage } from "../pages/RelationshipWebPage";
import { BoardKanbanPage } from "../pages/BoardKanbanPage";
import { BoardTimelinePage } from "../pages/BoardTimelinePage";
import { BoardArcsPage } from "../pages/BoardArcsPage";
import { BoardForeshadowingPage } from "../pages/BoardForeshadowingPage";
import { DraftManuscriptPage } from "../pages/DraftManuscriptPage";
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
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "bible/relationships",
            element: <RelationshipWebPage />,
          },
          {
            path: "bible/:entityType",
            element: <BibleListPage />,
          },
          {
            path: "bible/:entityType/:entityId",
            element: <EntityEditorPage />,
          },
          {
            path: "board/kanban",
            element: <BoardKanbanPage />,
          },
          {
            path: "board/timeline",
            element: <BoardTimelinePage />,
          },
          {
            path: "board/arcs",
            element: <BoardArcsPage />,
          },
          {
            path: "board/foreshadowing",
            element: <BoardForeshadowingPage />,
          },
          {
            path: "draft",
            element: <DraftManuscriptPage />,
          },
          {
            path: "draft/:sceneId",
            element: <DraftScenePage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
