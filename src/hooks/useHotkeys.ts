import { useEffect } from "react";

type HotkeyHandler = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  handler: (event: KeyboardEvent) => void;
};

export function useHotkeys(hotkeys: HotkeyHandler[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      for (const hotkey of hotkeys) {
        const metaRequired = hotkey.meta ?? false;
        const shiftRequired = hotkey.shift ?? false;
        const metaPressed = event.metaKey || event.ctrlKey;
        if (
          key === hotkey.key.toLowerCase() &&
          metaPressed === metaRequired &&
          event.shiftKey === shiftRequired
        ) {
          hotkey.handler(event);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys]);
}
