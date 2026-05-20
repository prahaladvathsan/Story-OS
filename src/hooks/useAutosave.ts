import { useEffect, useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<unknown>,
  delay = 900,
  enabled = true,
) {
  const firstRun = useRef(true);
  const onSaveRef = useRef(onSave);
  const [status, setStatus] = useState<SaveState>("idle");

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) {
      firstRun.current = true;
      return;
    }

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setStatus("saving");
    const timeoutId = window.setTimeout(async () => {
      try {
        await onSaveRef.current(value);
        setStatus("saved");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, enabled, value]);

  return status;
}
