import { useEffect, useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<unknown>,
  delay = 900,
  enabled = true,
) {
  const firstRun = useRef(true);
  const [status, setStatus] = useState<SaveState>("idle");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setStatus("saving");
    const timeoutId = window.setTimeout(async () => {
      try {
        await onSave(value);
        setStatus("saved");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, enabled, onSave, value]);

  return status;
}

