import { Plus, Trash2 } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./Button";
import { TextInput } from "./Field";

type KeyValuePair = {
  key: string;
  value: string;
};

type KeyValueEditorProps = {
  label: string;
  values: KeyValuePair[];
  onChange: (values: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
};

export function KeyValueEditor({
  label,
  values,
  onChange,
  keyPlaceholder = "Field label",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const updateValue = (index: number, patch: Partial<KeyValuePair>) => {
    onChange(values.map((value, currentIndex) => (currentIndex === index ? { ...value, ...patch } : value)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <Button variant="secondary" size="sm" onClick={() => onChange([...values, { key: "", value: "" }])}>
          <Plus size={14} />
          Add field
        </Button>
      </div>
      <div className="space-y-3">
        {values.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] px-4 py-3 text-sm text-[color:var(--muted)]">
            No custom fields yet.
          </div>
        ) : (
          values.map((value, index) => (
            <div key={`${value.key}-${index}`} className="grid gap-3 md:grid-cols-[0.35fr_0.55fr_0.1fr]">
              <TextInput
                value={value.key}
                placeholder={keyPlaceholder}
                onChange={(event) => updateValue(index, { key: event.target.value })}
              />
              <TextInput
                value={value.value}
                placeholder={valuePlaceholder}
                onChange={(event) => updateValue(index, { value: event.target.value })}
              />
              <Button variant="ghost" onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

