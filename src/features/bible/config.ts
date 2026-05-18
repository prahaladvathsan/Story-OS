import type { StoryEntityType } from "../../data/schema";

export const entityLabels: Record<StoryEntityType, string> = {
  character: "Character",
  location: "Location",
  item: "Item",
  faction: "Faction",
};

export function isEntityType(value: string): value is StoryEntityType {
  return value === "character" || value === "location" || value === "item" || value === "faction";
}
