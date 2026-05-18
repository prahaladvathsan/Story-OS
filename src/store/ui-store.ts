import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoryEntityType } from "../data/schema";

type QuickCaptureType = StoryEntityType | "scene";

type UiStore = {
  theme: "light" | "dark";
  activeProjectId?: string;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  quickCaptureType: QuickCaptureType;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openQuickCapture: (type?: QuickCaptureType) => void;
  closeQuickCapture: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setActiveProject: (projectId?: string) => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      theme: "light",
      activeProjectId: undefined,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      quickCaptureType: "character",
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      openQuickCapture: (type = "character") =>
        set({
          quickCaptureOpen: true,
          quickCaptureType: type,
        }),
      closeQuickCapture: () => set({ quickCaptureOpen: false }),
      setTheme: (theme) => set({ theme }),
      setActiveProject: (activeProjectId) => set({ activeProjectId }),
    }),
    {
      name: "story-os-ui",
      partialize: (state) => ({
        theme: state.theme,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);

