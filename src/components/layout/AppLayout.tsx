import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { CommandPaletteModal } from "../modals/CommandPaletteModal";
import { QuickCaptureModal } from "../modals/QuickCaptureModal";
import { useUiStore } from "../../store/ui-store";
import { useHotkeys } from "../../hooks/useHotkeys";

export function AppLayout() {
  const theme = useUiStore((state) => state.theme);
  const closeCommandPalette = useUiStore((state) => state.closeCommandPalette);
  const commandPaletteOpen = useUiStore((state) => state.commandPaletteOpen);
  const quickCaptureOpen = useUiStore((state) => state.quickCaptureOpen);
  const closeQuickCapture = useUiStore((state) => state.closeQuickCapture);
  const openCommandPalette = useUiStore((state) => state.openCommandPalette);
  const openQuickCapture = useUiStore((state) => state.openQuickCapture);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useHotkeys([
    {
      key: "k",
      meta: true,
      handler: (event) => {
        event.preventDefault();
        openCommandPalette();
      },
    },
    {
      key: "n",
      meta: true,
      shift: true,
      handler: (event) => {
        event.preventDefault();
        openQuickCapture("character");
      },
    },
    {
      key: "escape",
      handler: () => {
        if (commandPaletteOpen) {
          closeCommandPalette();
        }
        if (quickCaptureOpen) {
          closeQuickCapture();
        }
      },
    },
  ]);

  return (
    <>
      <Outlet />
      <CommandPaletteModal />
      <QuickCaptureModal />
    </>
  );
}

