import Paragraph from "@tiptap/extension-paragraph";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import type { StoryEntityType } from "../../data/schema";

export const ScreenplayParagraph = Paragraph.extend({
  addAttributes() {
    return {
      screenplayType: {
        default: "action",
        parseHTML: (element) => element.getAttribute("data-screenplay-type") ?? "action",
        renderHTML: (attributes) => ({
          "data-screenplay-type": attributes.screenplayType,
        }),
      },
    };
  },
});

type MentionItem = {
  id: string;
  label: string;
  entityType: StoryEntityType;
};

type SuggestionProps = {
  command: (payload: { id: string; label: string; entityType: StoryEntityType }) => void;
  clientRect?: () => DOMRect | null;
  editor: Editor;
  items: MentionItem[];
  event?: KeyboardEvent;
};

function createMentionSuggestion(itemsSource: MentionItem[]) {
  let container: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentItems: MentionItem[] = [];

  const position = (rect?: DOMRect | null) => {
    if (!container || !rect) {
      return;
    }

    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.top = `${rect.bottom + window.scrollY + 8}px`;
  };

  const renderList = (props: SuggestionProps) => {
    if (!container) {
      return;
    }

    currentItems = props.items;
    container.innerHTML = "";
    container.className =
      "z-[80] flex max-h-64 w-80 flex-col overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2 shadow-card backdrop-blur";

    if (currentItems.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No entity matches.";
      empty.className = "px-3 py-2 text-sm text-[color:var(--muted)]";
      container.appendChild(empty);
      return;
    }

    currentItems.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `rounded-xl px-3 py-2 text-left text-sm ${index === selectedIndex ? "bg-black/5 dark:bg-white/10" : ""}`;
      button.innerHTML = `<div style="font-weight:600">${item.label}</div><div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.65">${item.entityType}</div>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        props.command(item);
      });
      container?.appendChild(button);
    });
  };

  return {
    items: ({ query }: { query: string }) =>
      itemsSource
        .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8),
    render: () => ({
      onStart: (props: SuggestionProps) => {
        selectedIndex = 0;
        container = document.createElement("div");
        document.body.appendChild(container);
        position(props.clientRect?.());
        renderList(props);
      },
      onUpdate: (props: SuggestionProps) => {
        selectedIndex = 0;
        position(props.clientRect?.());
        renderList(props);
      },
      onKeyDown: (props: { event: KeyboardEvent; command: SuggestionProps["command"] }) => {
        if (!container) {
          return false;
        }

        if (props.event.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % Math.max(currentItems.length, 1);
          return true;
        }

        if (props.event.key === "ArrowUp") {
          selectedIndex = (selectedIndex - 1 + currentItems.length) % Math.max(currentItems.length, 1);
          return true;
        }

        if (props.event.key === "Enter") {
          const item = currentItems[selectedIndex];
          if (item) {
            props.command(item);
            return true;
          }
        }

        if (props.event.key === "Escape") {
          container.remove();
          container = null;
          return true;
        }

        return false;
      },
      onExit: () => {
        container?.remove();
        container = null;
      },
    }),
  };
}

export function createEditorExtensions(items: MentionItem[]) {
  return [
    ScreenplayParagraph,
    StarterKit.configure({
      paragraph: false,
    }),
    Placeholder.configure({
      placeholder: "Draft the scene, or type @ to mention story entities.",
    }),
    Mention.configure({
      HTMLAttributes: {
        class: "mention-chip",
      },
      suggestion: createMentionSuggestion(items) as never,
      renderText: ({ node }) => `@${node.attrs.label ?? "entity"}`,
    }),
  ];
}

export function insertScreenplayType(editor: Editor | null, type: string) {
  if (!editor) {
    return;
  }
  editor.chain().focus().updateAttributes("paragraph", { screenplayType: type }).run();
}

