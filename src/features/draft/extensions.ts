import Paragraph from "@tiptap/extension-paragraph";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import type { StoryEntityType } from "../../data/schema";
import { entityLabels } from "../bible/config";

const allEntityTypes: StoryEntityType[] = ["character", "location", "item", "faction"];

export type CreateEntityCallback = (
  entityType: StoryEntityType,
  name: string,
) => Promise<{ id: string; label: string; entityType: StoryEntityType } | undefined>;

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
  isCreate?: boolean;
};

type SuggestionProps = {
  command: (payload: { id: string; label: string; entityType: StoryEntityType }) => void;
  clientRect?: () => DOMRect | null;
  editor: Editor;
  items: MentionItem[];
  event?: KeyboardEvent;
};

function createMentionSuggestion(
  itemsSource: MentionItem[],
  onCreateEntity?: CreateEntityCallback,
  enabledCreateTypes: StoryEntityType[] = allEntityTypes,
) {
  let container: HTMLDivElement | null = null;
  let selectedIndex = 0;
  let currentItems: MentionItem[] = [];
  let currentQuery = "";

  const position = (rect?: DOMRect | null) => {
    if (!container || !rect) {
      return;
    }

    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.top = `${rect.bottom + window.scrollY + 8}px`;
  };

  const runItem = async (item: MentionItem, command: SuggestionProps["command"]) => {
    if (item.isCreate && onCreateEntity) {
      const name = currentQuery.trim();
      if (!name) return;
      try {
        const created = await onCreateEntity(item.entityType, name);
        if (created) command(created);
      } catch (error) {
        console.error("Failed to create entity from mention:", error);
      }
      return;
    }
    command(item);
  };

  const renderList = (props: SuggestionProps) => {
    if (!container) {
      return;
    }

    currentItems = props.items;
    container.innerHTML = "";
    container.className =
      "z-[80] flex max-h-72 w-80 flex-col overflow-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2 shadow-card backdrop-blur";

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
      const baseClasses = "rounded-xl px-3 py-2 text-left text-sm";
      const activeClass = index === selectedIndex ? "bg-black/5 dark:bg-white/10" : "";
      const createClass = item.isCreate
        ? "border-t border-[color:var(--line)] mt-1 pt-2 italic text-[color:var(--muted)]"
        : "";
      button.className = `${baseClasses} ${activeClass} ${createClass}`.trim();
      const subtitle = item.isCreate ? "create new" : item.entityType;
      button.innerHTML = `<div style="font-weight:600">${item.label}</div><div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.65">${subtitle}</div>`;
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        void runItem(item, props.command);
      });
      container?.appendChild(button);
    });
  };

  return {
    items: ({ query }: { query: string }) => {
      currentQuery = query;
      const filtered = itemsSource
        .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
      if (onCreateEntity && query.trim()) {
        const createOptions: MentionItem[] = enabledCreateTypes.map((entityType) => ({
          id: `__create_${entityType}__`,
          label: `Create ${entityLabels[entityType].toLowerCase()} "${query.trim()}"`,
          entityType,
          isCreate: true,
        }));
        return [...filtered, ...createOptions];
      }
      return filtered;
    },
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
          renderListSelectionOnly();
          return true;
        }

        if (props.event.key === "ArrowUp") {
          selectedIndex = (selectedIndex - 1 + currentItems.length) % Math.max(currentItems.length, 1);
          renderListSelectionOnly();
          return true;
        }

        if (props.event.key === "Enter") {
          const item = currentItems[selectedIndex];
          if (item) {
            void runItem(item, props.command);
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

  function renderListSelectionOnly() {
    if (!container) return;
    Array.from(container.children).forEach((child, index) => {
      const element = child as HTMLElement;
      if (element.tagName === "BUTTON") {
        element.classList.toggle("bg-black/5", index === selectedIndex);
        element.classList.toggle("dark:bg-white/10", index === selectedIndex);
      }
    });
  }
}

export function createEditorExtensions(
  items: MentionItem[],
  onCreateEntity?: CreateEntityCallback,
  enabledCreateTypes?: StoryEntityType[],
) {
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
      suggestion: createMentionSuggestion(items, onCreateEntity, enabledCreateTypes) as never,
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

