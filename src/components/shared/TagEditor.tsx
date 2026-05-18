import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { TextInput } from "./Field";

type TagEditorProps = {
  label: string;
  values: string[];
  suggestions?: string[];
  onChange: (values: string[]) => void;
};

export function TagEditor({ label, values, suggestions = [], onChange }: TagEditorProps) {
  const [draft, setDraft] = useState("");
  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(draft.toLowerCase()) && !values.includes(suggestion),
      ),
    [draft, suggestions, values],
  );

  const addValue = (value: string) => {
    const normalized = value.trim();
    if (!normalized || values.includes(normalized)) {
      return;
    }
    onChange([...values, normalized]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 dark:bg-ink-900/50 dark:text-ink-100"
          >
            {value}
            <button type="button" onClick={() => onChange(values.filter((entry) => entry !== value))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput
          value={draft}
          placeholder={`Add ${label.toLowerCase()}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addValue(draft);
            }
          }}
        />
        <Button variant="secondary" onClick={() => addValue(draft)}>
          Add
        </Button>
      </div>
      {filteredSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addValue(suggestion)}
              className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

