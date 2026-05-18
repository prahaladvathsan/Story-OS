> **Version:** 1.0  
> **Last Updated:** 2026-04-16  
> **Status:** MVP Scope Finalized  
> **Target Platform:** Web (React SPA), Desktop-first, Responsive

---

## Table of Contents

1. [Product Overview](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#1-product-overview)
2. [Target User & Job-to-be-Done](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#2-target-user--job-to-be-done)
3. [Core Architecture](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#3-core-architecture)
4. [Data Model / Schema](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#4-data-model--schema)
5. [Feature Specification — Bible (World-Building Space)](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#5-feature-specification--bible-world-building-space)
6. [Feature Specification — Board (Story Structure Space)](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#6-feature-specification--board-story-structure-space)
7. [Feature Specification — Draft (Writing Space)](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#7-feature-specification--draft-writing-space)
8. [Feature Specification — Connective Tissue](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#8-feature-specification--connective-tissue)
9. [Feature Specification — Project Management & UX](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#9-feature-specification--project-management--ux)
10. [Export](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#10-export)
11. [Non-Functional Requirements](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#11-non-functional-requirements)
12. [Out of Scope (MVP)](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#12-out-of-scope-mvp)
13. [Future Roadmap (V2–V4)](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#13-future-roadmap-v2v4)
14. [Appendix A: User Journey Walkthrough](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#appendix-a-user-journey-walkthrough)
15. [Appendix B: Entity Relationship Diagram](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#appendix-b-entity-relationship-diagram)
16. [Appendix C: Glossary](https://claude.ai/chat/3cfd5075-48e1-4ca4-8e46-61c9bba239d7#appendix-c-glossary)

---

## 1. Product Overview

### 1.1 One-Liner

A structured, interconnected workspace where screenwriters and fiction writers build their story world, structure their plot, and write their draft — all in one place, with everything linked to everything.

### 1.2 Problem Statement

Writers today fragment their story across 5+ tools: Notion for world-building notes, Google Docs for drafts, spreadsheets for character tracking, Miro/whiteboards for structure, and their own memory for continuity. This fragmentation causes:

- **Context loss**: switching tools breaks creative flow
- **Inconsistency**: details contradict across documents
- **Duplication**: the same character info lives in 3 places, updated in none
- **No structural visibility**: impossible to see story shape, arc distribution, or pacing at a glance

### 1.3 Solution

Three interconnected spaces — **Bible** (world-building), **Board** (story structure), **Draft** (writing) — sharing a single underlying **Story Graph** where every entity (character, location, item, faction, scene) is a node with typed relationships and cross-links.

### 1.4 Key Differentiator

Everything links to everything. Create a character → tag them in scenes → reference them in your draft → see backlinks on their profile → view their arc on the board. One source of truth, multiple lenses.

---

## 2. Target User & Job-to-be-Done

### 2.1 Primary Persona (MVP)

**Solo screenwriter or fiction writer** working on a single project (feature film, TV pilot, novel, or short story). Technically comfortable (uses digital tools daily), but not a developer. Values creative flow over feature count.

### 2.2 JTBD

> "Help me go from messy idea to structured, consistent story — without losing creative flow or fragmenting my world across 6 tools."

### 2.3 User Workflow Stages

|Stage|User Mode|Story OS Space|
|---|---|---|
|Spark|"I have an idea"|Quick Capture (global)|
|Noodle|"I'm building the world"|Bible|
|Structure|"I'm organizing the plot"|Board|
|Write|"I'm drafting scenes"|Draft|
|Track|"Wait, is this consistent?"|Continuity Sidebar + Backlinks|
|Revise|"I'm restructuring"|Board (drag-and-drop) + Bible (update entities)|

---

## 3. Core Architecture

### 3.1 Three Spaces Model

```
┌─────────────────────────────────────────────────────┐
│                    STORY OS                          │
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │  BIBLE  │◄──►│  BOARD  │◄──►│  DRAFT  │        │
│  │ (World) │    │(Structure)   │(Writing) │        │
│  └────┬────┘    └────┬────┘    └────┬────┘        │
│       │              │              │               │
│       └──────────────┼──────────────┘               │
│                      │                              │
│              ┌───────▼───────┐                      │
│              │  STORY GRAPH  │                      │
│              │ (Data Layer)  │                      │
│              └───────────────┘                      │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  CONNECTIVE TISSUE                            │  │
│  │  Global Search │ Backlinks │ Continuity       │  │
│  │  Sidebar │ Quick Capture │ Dashboard          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Design Principles

1. **Graph-first**: every piece of data is a node or edge. UI is a view layer on the graph
2. **Link, don't duplicate**: entity data lives in one place, referenced everywhere
3. **Progressive structure**: the app works with 1 character and 0 scenes. Structure is opt-in, never forced
4. **Creative flow > completeness**: empty fields are fine. No required fields except name. Writers hate forms
5. **Escape hatches**: every entity has a free-form Notes field. If the schema doesn't fit, the user can dump text

---

## 4. Data Model / Schema

### 4.1 Core Entities

#### 4.1.1 Project

```
Project {
  id: UUID
  name: String (required)
  description: Text
  genre: String (optional — free text)
  format: Enum [screenplay, novel, tv_pilot, tv_episode, short_story, other]
  created_at: Timestamp
  updated_at: Timestamp
  settings: ProjectSettings
}

ProjectSettings {
  theme: Enum [light, dark, custom]
  default_manuscript_mode: Enum [prose, screenplay]
}
```

#### 4.1.2 Character

```
Character {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required)
  aliases: String[] (optional)
  image_url: String (optional — uploaded file reference)
  image_gallery: String[] (optional — additional reference images)
  description: Text (physical appearance, general description)
  personality_traits: String[] (tags — e.g., "stubborn", "loyal", "sarcastic")
  backstory: Text
  motivation: Text (what do they want?)
  internal_need: Text (what do they actually need?)
  flaws: Text
  fears: Text
  secrets: Text
  status: Enum [alive, dead, missing, unknown, transformed]
  voice_notes: Text (speech patterns, vocabulary level, verbal tics, catchphrases)
  custom_fields: JSON (user-defined key-value pairs)
  notes: Text (free-form)
  tags: String[] (user-defined labels — e.g., "protagonist", "mentor")
  created_at: Timestamp
  updated_at: Timestamp
  sort_order: Integer
}
```

#### 4.1.3 Location

```
Location {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required)
  image_url: String (optional)
  image_gallery: String[]
  description: Text
  sensory_details: Text (sight, sound, smell, feel — free-form prompt)
  history: Text
  environmental_rules: Text (e.g., "magic doesn't work here", "always foggy")
  parent_location_id: UUID (FK → Location, optional — for hierarchy: city → building → room)
  tags: String[] (e.g., "safe haven", "danger zone", "sacred")
  custom_fields: JSON
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
  sort_order: Integer
}
```

#### 4.1.4 Item

```
Item {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required)
  image_url: String (optional)
  description: Text
  origin: Text (where did it come from?)
  properties: Text (powers, abilities, limitations)
  significance: Enum [macguffin, chekhovs_gun, symbolic, quest_item, weapon, key, other]
  status: Enum [intact, broken, lost, hidden, destroyed, unknown]
  current_possessor_id: UUID (FK → Character, optional)
  custom_fields: JSON
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
  sort_order: Integer
}
```

#### 4.1.5 Faction

```
Faction {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required)
  image_url: String (optional — insignia, symbol, flag)
  description: Text
  ideology: Text
  goals: Text
  resources: Text
  tags: String[]
  custom_fields: JSON
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
  sort_order: Integer
}
```

### 4.2 Relationship / Edge Entities

#### 4.2.1 CharacterRelationship

```
CharacterRelationship {
  id: UUID
  project_id: UUID (FK → Project)
  character_a_id: UUID (FK → Character)
  character_b_id: UUID (FK → Character)
  relationship_type: Enum [family, romantic, rivalry, mentor_mentee, 
                           employer_employee, alliance, betrayal, friendship, custom]
  custom_type_label: String (if type = custom)
  directionality: Enum [mutual, a_to_b, b_to_a]
  // e.g., "A trusts B" (a_to_b) vs "A and B are siblings" (mutual)
  description: Text (free-form notes on this relationship)
  sentiment: Enum [positive, negative, neutral, complicated]
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### 4.2.2 FactionMembership

```
FactionMembership {
  id: UUID
  character_id: UUID (FK → Character)
  faction_id: UUID (FK → Faction)
  role: String (e.g., "leader", "spy", "defector", "lieutenant")
  notes: Text
}
```

#### 4.2.3 EntityLink (Generic cross-link)

Used for any entity-to-entity connection not covered above (e.g., Item → Location where it's hidden, Faction → Location headquarters).

```
EntityLink {
  id: UUID
  project_id: UUID (FK → Project)
  source_entity_type: Enum [character, location, item, faction]
  source_entity_id: UUID
  target_entity_type: Enum [character, location, item, faction]
  target_entity_id: UUID
  label: String (e.g., "headquarters", "hidden at", "created by")
  notes: Text
}
```

### 4.3 Story Structure Entities

#### 4.3.1 Act

```
Act {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required — e.g., "Act 1", "Act 2A", "Act 2B", "Act 3")
  sort_order: Integer
  notes: Text
}
```

#### 4.3.2 Scene

```
Scene {
  id: UUID
  project_id: UUID (FK → Project)
  act_id: UUID (FK → Act)
  title: String (required)
  slug_line: String (optional — e.g., "INT. DETECTIVE'S OFFICE - NIGHT")
  summary: Text (1-3 sentence description)
  pov_character_id: UUID (FK → Character, optional)
  location_id: UUID (FK → Location, optional)
  characters_present: UUID[] (FK → Character[])
  items_involved: UUID[] (FK → Item[])
  emotional_tone: Enum [tense, comedic, intimate, triumphant, 
                         melancholic, chaotic, mysterious, peaceful]
  story_function: Enum [setup, escalation, climax, resolution, 
                         breather, twist, reveal, transition]
  status: Enum [idea, outlined, drafted, revised, final]
  sort_order: Integer (within Act)
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### 4.3.3 Arc

```
Arc {
  id: UUID
  project_id: UUID (FK → Project)
  name: String (required — e.g., "A-Plot: Murder Investigation")
  arc_type: Enum [plot_a, plot_b, plot_c, character_arc, 
                   relationship_arc, thematic_arc, custom]
  description: Text
  linked_character_id: UUID (FK → Character, optional — for character arcs)
  color: String (hex color for visual display)
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### 4.3.4 SceneArcTag

Links scenes to arcs (many-to-many).

```
SceneArcTag {
  id: UUID
  scene_id: UUID (FK → Scene)
  arc_id: UUID (FK → Arc)
}
```

#### 4.3.5 ForeshadowingPair

```
ForeshadowingPair {
  id: UUID
  project_id: UUID (FK → Project)
  label: String (required — e.g., "The locked room")
  setup_description: Text (what's planted)
  setup_scene_id: UUID (FK → Scene, optional)
  payoff_description: Text (how it pays off)
  payoff_scene_id: UUID (FK → Scene, optional)
  status: Enum [planted, paid_off, abandoned, red_herring]
  notes: Text
  created_at: Timestamp
  updated_at: Timestamp
}
```

### 4.4 Manuscript Entities

#### 4.4.1 SceneDraft

```
SceneDraft {
  id: UUID
  scene_id: UUID (FK → Scene — one-to-one)
  content: RichText (JSON — e.g., ProseMirror/TipTap document format)
  // Contains inline entity mentions as custom marks/nodes
  word_count: Integer (computed)
  manuscript_mode: Enum [prose, screenplay]
  updated_at: Timestamp
}
```

#### 4.4.2 EntityMention (Inline References)

Stored as marks/decorations within the RichText content but also indexed separately for backlink generation.

```
EntityMention {
  id: UUID
  scene_draft_id: UUID (FK → SceneDraft)
  entity_type: Enum [character, location, item, faction]
  entity_id: UUID
  // Position data stored within RichText content itself
}
```

---

## 5. Feature Specification — Bible (World-Building Space)

### 5.1 Overview

The Bible is where users create and manage their story world entities: Characters, Locations, Items, Factions, and the relationships between them.

### 5.2 Entity List View

**Route:** `/project/:id/bible/:entityType`

- Left sidebar navigation: Characters | Locations | Items | Factions
- Main area: card grid or list view (toggle)
- Each card shows: image thumbnail (if set), name, tags, status (for Characters/Items)
- Sort by: name (alpha), created date, custom order (drag-and-drop)
- Filter by: tags, status
- "New [Entity]" button → opens entity editor
- Bulk actions: delete, tag

### 5.3 Entity Editor

**Route:** `/project/:id/bible/:entityType/:entityId`

- Full-page editor for a single entity
- Layout: image upload area (top or left), structured fields, free-form notes at bottom
- All fields except `name` are optional
- Fields render as described in Section 4 data model
- `personality_traits` and `tags`: tag input with autocomplete from existing tags in the project
- `custom_fields`: user can add key-value pairs (key = label, value = text). "Add custom field" button
- **Relationship section** (Characters only):
    - "Add Relationship" → pick another character, pick type, set directionality, add notes
    - List of existing relationships with inline edit
- **Faction Membership section** (Characters only):
    - "Add to Faction" → pick faction, set role
- **Cross-links section** (all entity types):
    - "Link to..." → pick any other entity, set label
    - Shows existing links with labels
- **Backlinks section** (read-only, auto-generated):
    - "Referenced in:" list of scenes (from `characters_present`, `items_involved`, `location_id` on Scene) and manuscript mentions (from EntityMention)
    - Each backlink is clickable → navigates to that scene's Board card or Draft

### 5.4 Relationship Web

**Route:** `/project/:id/bible/relationships`

- Force-directed graph visualization
- Nodes = Characters (show avatar + name)
- Edges = CharacterRelationships (colored by type, labeled)
- Faction nodes as clusters/groups (characters grouped by faction membership)
- Interactions:
    - Click node → opens character editor in sidebar or navigates to character page
    - Click edge → shows relationship details in tooltip/popup
    - Zoom, pan, drag nodes to reposition
    - Filter toggles: show/hide by relationship type, by faction
- Layout options: auto (force-directed), manual (drag to pin)

### 5.5 Entity Image Upload

- Supported formats: JPG, PNG, WebP, GIF
- Max file size: 10MB per image
- Image gallery: primary image + additional reference images
- Images stored in cloud storage (S3/equivalent), referenced by URL
- Optional: paste image URL instead of upload

---

## 6. Feature Specification — Board (Story Structure Space)

### 6.1 Overview

The Board is where users structure their plot. The atomic unit is the **Scene Card**. Scenes are organized into **Acts**. Users track **Arcs** across scenes and manage **Foreshadowing Pairs**.

### 6.2 Kanban View

**Route:** `/project/:id/board/kanban`

- Columns = Acts (user-created, drag-to-reorder columns)
- Cards = Scenes (drag-to-reorder within column, drag across columns to reassign act)
- Default: 3 columns (Act 1, Act 2, Act 3). User can add/remove/rename columns
- Card display:
    - Title (bold)
    - Summary (truncated to 2 lines)
    - POV character avatar (small circle, if set)
    - Location name (small text)
    - Colored dots for tagged arcs (using arc color)
    - Emotional tone icon/tag
    - Status badge (idea | outlined | drafted | revised | final)
- Card actions: click to open Scene Detail Panel, right-click context menu (duplicate, delete, move to act)
- "Add Scene" button at bottom of each column → creates new scene card in that act
- Column header shows scene count

### 6.3 Timeline View

**Route:** `/project/:id/board/timeline`

- Horizontal left-to-right sequence of all scenes across all acts
- Act dividers as vertical markers
- Each scene rendered as a block/chip
- Color-coding toggle:
    - By arc (each scene gets colored dots/stripes for its tagged arcs)
    - By POV character
    - By emotional tone
    - By status
- Hover on scene → tooltip with title, summary, characters present
- Click scene → opens Scene Detail Panel
- Visual gap detection: if an arc disappears for 3+ consecutive scenes, subtle visual indicator (dashed line / gap marker)

### 6.4 Scene Detail Panel

Triggered by clicking any scene card (opens as right sidebar panel or modal — design decision).

- All Scene fields as per Section 4.3.2
- Title: inline editable
- Summary: multi-line text field
- POV Character: dropdown (populated from project Characters)
- Location: dropdown (populated from project Locations)
- Characters Present: multi-select (populated from project Characters, shows avatars)
- Items Involved: multi-select (populated from project Items)
- Emotional Tone: single-select from fixed palette (with icon/color for each)
- Story Function: single-select from fixed palette
- Arc Tags: multi-select (populated from project Arcs, shows arc color)
- Status: single-select
- Notes: free-form text area
- **"Open in Draft"** button → navigates to Draft editor for this scene
- Foreshadowing indicators: if this scene is a setup or payoff for any ForeshadowingPair, show a small badge/link

### 6.5 Arc Manager

**Route:** `/project/:id/board/arcs`

- List of all arcs with: name, type, linked character (if character arc), color swatch
- Create / edit / delete arcs
- For each arc: list of tagged scenes (ordered by story sequence) with clickable links
- **Arc distribution view**: mini horizontal bar showing which scenes each arc appears in (scenes as dots on a line) — makes it visually obvious if an arc vanishes for a stretch

### 6.6 Foreshadowing Tracker

**Route:** `/project/:id/board/foreshadowing`

- List of all ForeshadowingPairs
- Columns: Label | Setup (scene link or "unassigned") | Payoff (scene link or "unassigned") | Status
- Status color coding: planted (yellow), paid_off (green), abandoned (red), red_herring (gray)
- Create / edit / delete pairs
- Filter by status
- **Alert badge**: count of "planted but not paid off" pairs shown on Board nav item

---

## 7. Feature Specification — Draft (Writing Space)

### 7.1 Overview

The Draft is a scene-level writing editor. Each Scene has one SceneDraft. Scenes concatenate in story order to form the full manuscript.

### 7.2 Scene Writing View

**Route:** `/project/:id/draft/:sceneId`

- **Layout**: two-panel
    - Left (70%): Rich text editor (the writing area)
    - Right (30%): Bible Sidebar (collapsible)

#### 7.2.1 Editor

- Rich text editing powered by TipTap or ProseMirror (open-source, extensible)
- **Prose mode**: standard formatting — headings, bold, italic, blockquote, horizontal rule, paragraph
- **Screenplay mode**: auto-formatting for:
    - Scene heading (ALL CAPS, left-aligned)
    - Action (standard paragraph)
    - Character name (centered, ALL CAPS before dialogue)
    - Dialogue (centered, narrower margins)
    - Parenthetical (centered, in parentheses)
    - Transition (right-aligned, ALL CAPS — e.g., "CUT TO:")
    - User selects element type via dropdown, keyboard shortcut, or Tab-cycling
- Mode toggle: switch between prose and screenplay for any scene
- **Entity mentions**: type `@` → autocomplete dropdown of all Characters, Locations, Items, Factions in the project. Selecting one inserts a styled inline mention (clickable → opens entity in Bible Sidebar). Mentions are stored as EntityMention records for backlink indexing
- Word count: displayed in footer (per scene)
- Autosave: every 3 seconds after last keystroke, with "Saved" indicator
- Scene status auto-updates to "drafted" when content is first written
- **Scene navigation**: previous/next scene buttons in header (follows story order)

#### 7.2.2 Bible Sidebar

- Shows contextual info for the current scene:
    - **Scene metadata**: POV character, location, characters present, items involved (pulled from Scene entity)
    - **Entity quick-view**: click any entity name → shows entity card inline in sidebar (name, image, key fields, notes). Editable in-place
    - **Foreshadowing reminder**: if this scene is tagged as setup/payoff for any pair, show the pair details
- **Search tab**: search all entities from sidebar without leaving the editor
- **Quick capture**: "Add Entity" button in sidebar → create a new character/location/item/faction without leaving the Draft

### 7.3 Full Manuscript View

**Route:** `/project/:id/draft`

- Read-only concatenated view of all scene drafts in story order
- Act dividers as section headers
- Scene titles as sub-headers
- Word count total in footer
- Click any scene section → navigates to that scene's writing view
- Print-friendly layout option

---

## 8. Feature Specification — Connective Tissue

These features span all three spaces and are the core differentiator.

### 8.1 Global Search

- Accessible from top navigation bar (always visible) or keyboard shortcut `Cmd/Ctrl + K`
- Searches across:
    - Entity names and descriptions (Characters, Locations, Items, Factions)
    - Scene titles and summaries
    - Manuscript text (full-text search of SceneDraft content)
    - Arc names
    - Foreshadowing pair labels
- Results grouped by type with icons
- Click result → navigates to that entity/scene/draft

### 8.2 Backlinks (Auto-Generated)

- Every entity page shows a "Referenced In" section
- Sources of backlinks:
    - Scene cards: `characters_present`, `items_involved`, `location_id`, `pov_character_id`
    - Manuscript: EntityMention records (inline `@` mentions in draft text)
    - Relationships: CharacterRelationship, FactionMembership, EntityLink
- Each backlink is clickable and shows: source type (scene / draft / relationship), scene title, brief context
- Backlinks update automatically when scenes are edited or entity mentions are added/removed

### 8.3 Continuity Sidebar

- Available in Draft writing view (part of Bible Sidebar)
- For the current scene, computes and displays:
    - **Characters present** (from scene card metadata)
    - **Location** (from scene card)
    - **Items in play** (items whose `current_possessor_id` matches any character present, plus explicitly tagged items)
    - **Active arcs** (arcs tagged to this scene)
    - **Recent context**: summary of previous scene (title + summary) for narrative continuity
- All entries are clickable → opens entity detail in sidebar

### 8.4 Quick Capture

- Global hotkey: `Cmd/Ctrl + Shift + N`
- Opens a lightweight modal from any page
- Options: "New Character" | "New Location" | "New Item" | "New Faction" | "New Scene"
- Minimal form: name (required) + notes (optional) → creates entity immediately
- User can flesh out details later via Bible

### 8.5 Dashboard

**Route:** `/project/:id` (project home)

- **Project summary**: name, format, genre, word count total, scene count
- **Quick stats**:
    - Entities: X characters, Y locations, Z items, W factions
    - Scenes by status: idea (N) | outlined (N) | drafted (N) | revised (N) | final (N)
    - Total word count / target word count (if set)
- **Unresolved foreshadowing**: count + list of "planted but not paid off" pairs
- **Recently edited**: last 10 edited entities and scenes with timestamps
- **Arc health**: mini visualization showing each arc and its scene coverage (simple dot-on-line, same as Arc Manager view)
- Quick navigation links to Bible, Board, Draft

---

## 9. Feature Specification — Project Management & UX

### 9.1 Project CRUD

- Create new project: name (required), format, genre
- Project list view (for users with multiple projects — even if MVP focuses on single-project usage, support multiple)
- Delete project (with confirmation)
- Duplicate project (for "what-if" experimentation)

### 9.2 Navigation

- Top bar: Project name (clickable → dashboard) | Bible | Board | Draft | Search
- Bible sub-nav: Characters | Locations | Items | Factions | Relationships
- Board sub-nav: Kanban | Timeline | Arcs | Foreshadowing
- Draft sub-nav: Full Manuscript | Per-scene (via Board click-through)
- Breadcrumbs for nested navigation (e.g., Bible > Characters > "Detective Joe")

### 9.3 Theming

- Light mode and dark mode toggle
- Persistent preference per user

### 9.4 Keyboard Shortcuts

|Shortcut|Action|
|---|---|
|`Cmd/Ctrl + K`|Global search|
|`Cmd/Ctrl + Shift + N`|Quick capture|
|`Cmd/Ctrl + S`|Force save (backup — autosave is primary)|
|`Cmd/Ctrl + B/I/U`|Bold / Italic / Underline (in editor)|
|`Tab`|Cycle screenplay element type (in screenplay mode)|
|`Esc`|Close sidebar / modal|

### 9.5 Autosave & Data Persistence

- All changes autosaved to backend within 3 seconds of last keystroke
- Visual save indicator ("Saving..." → "Saved")
- Offline handling: queue changes locally, sync on reconnect (best-effort for MVP — full offline mode is V2)

### 9.6 Undo / Redo

- Standard undo/redo in the text editor (per session)
- Entity field changes: undo via browser-level undo in form fields (no custom undo stack for MVP)

---

## 10. Export

### 10.1 Manuscript Export

|Format|Details|
|---|---|
|PDF|Formatted manuscript. Screenplay mode: industry-standard layout. Prose mode: standard book manuscript format|
|DOCX|Word-compatible export with basic formatting|
|Markdown|Plain .md with scene/chapter headers|
|Fountain|.fountain format for screenplay (industry standard for plain-text screenwriting)|

Export scope: full manuscript or selected acts/scenes.

### 10.2 Story Bible Export

|Format|Details|
|---|---|
|PDF|Formatted reference document: all entities grouped by type, with images, descriptions, relationships|
|JSON|Machine-readable export of the full Story Graph (all entities, relationships, scenes, arcs) — for developer use, API integration, or migration|

### 10.3 Board Export

|Format|Details|
|---|---|
|PDF|Visual kanban layout or timeline as a printable PDF|
|CSV|Scene list with all metadata columns|

---

## 11. Non-Functional Requirements

### 11.1 Performance

- Page load: < 2 seconds for any view
- Editor keystroke latency: < 50ms
- Search results: < 500ms
- Autosave round-trip: < 1 second
- Support projects with up to 200 entities and 100 scenes without degradation

### 11.2 Tech Stack (Recommended)

|Layer|Technology|Rationale|
|---|---|---|
|Frontend|React + TypeScript|Component ecosystem, TypeScript for schema safety|
|Editor|TipTap (ProseMirror-based)|Extensible, supports custom nodes (entity mentions), screenplay formatting via extensions|
|State Management|Zustand or Jotai|Lightweight, fits graph-style data|
|Styling|Tailwind CSS|Rapid iteration, utility-first|
|Graph Visualization|React Flow or D3.js|Relationship web, arc visualizations|
|Board (Kanban)|dnd-kit or react-beautiful-dnd|Drag-and-drop scene cards|
|Backend|Node.js (Express/Fastify) or Python (FastAPI)|REST or GraphQL API|
|Database|PostgreSQL|Relational with JSON support for custom_fields, RichText storage|
|Auth|Clerk, Supabase Auth, or Auth0|Out-of-the-box auth for MVP|
|File Storage|S3 / Cloudflare R2|Entity images|
|Hosting|Vercel (frontend) + Railway/Render (backend) or Supabase (all-in-one)|Fast deployment for MVP|

### 11.3 Security

- User authentication required (email + password, OAuth with Google)
- All data scoped to user (no cross-user data access in MVP)
- HTTPS everywhere
- Image uploads validated for type and size

### 11.4 Accessibility

- Keyboard navigation for all major actions
- Semantic HTML
- Minimum WCAG 2.1 AA contrast ratios
- Screen reader labels on interactive elements

---

## 12. Out of Scope (MVP)

The following are explicitly **NOT** in the MVP. See Section 13 for when they enter the roadmap.

|Feature|Reason for exclusion|
|---|---|
|AI integration (any)|Separate value prop. Nail the structure tool first|
|Real-time collaboration / multi-user|Solo writer is the MVP persona|
|Interactive map creation / pins|Upload-image-to-location is sufficient|
|Species, Cultures, Languages, Magic Systems, Religions as separate entity types|Notes + Factions covers 80%. Add as "genre packs" later|
|Visual storyboarding (frame-by-frame)|Different workflow, different user|
|Mood boards|Nice-to-have, not core loop|
|Pacing / dialogue analytics|Requires significant drafted content|
|Structure templates (Hero's Journey, Save the Cat)|Let users structure organically first|
|Production export (call sheets, shot lists)|Different user (producer)|
|Multi-project shared universe linking|Single project first|
|Temporal entity states (entity status at Scene X vs. Scene Y)|Current status is sufficient|
|Writers' room / episode assignment|Team feature|
|Import from Final Draft / Scrivener / Celtx|Build export first; import is harder|
|Mobile editing|Mobile = read-only reference at best|
|Version control / manuscript diff|Forward progress matters more than diffing|
|Branching paths / decision trees|Game design feature|
|Revision coloring (production draft colors)|Production feature|
|Community / template sharing|Needs user base first|

---

## 13. Future Roadmap (V2–V4)

### V2 — AI Layer + Enhanced Visuals (Target: 3–6 months post-MVP)

#### V2.1 AI Consistency Engine

- **Passive continuity scanner**: analyzes draft text against Bible entities and flags contradictions
    - Example: "You described Character A as left-handed in Scene 3, but they draw a sword with their right hand in Scene 19"
    - Example: "Character B can't be in Paris in this scene — your timeline places them in Tokyo"
- **Implementation**: on-demand scan (button click) or background job after draft save. Uses LLM with structured graph context injection (not text blob — passes entity attributes, relationships, scene metadata as structured data)
- **Output**: list of potential issues with severity (warning / error), linked to the relevant scenes and entities

#### V2.2 AI Draft Assist

- **Scene drafting**: given a scene card (summary, characters, location, tone, arc tags) + relevant Bible context, generate a first-draft scene
- **Dialogue assist**: generate dialogue for a specific character using their voice profile (voice_notes field)
- **Description expansion**: take a scene summary and expand into a detailed beat breakdown
- **BYOK model**: user provides their own API key (OpenAI, Anthropic, etc.) — avoids fixed cost for the platform

#### V2.3 AI What-If Branching

- Fork the story at any scene
- AI explores alternate paths while respecting Bible constraints
- Side-by-side comparison of branches
- User can merge preferred branch back into canonical story

#### V2.4 Interactive Maps

- Upload map image → add interactive pins linked to Location entities
- Character journey overlay: trace a character's movement across the map by scene sequence
- Region markup with color coding
- Nested maps (click a city → opens city map)
- Integration with Inkarnate / Wonderdraft for map creation

#### V2.5 Temporal Entity States

- Every entity attribute gains a "from scene / to scene" dimension
- Toggle "state at Scene X" in the Continuity Sidebar
- See: who's alive, who's where, who has what item, faction alliances — all at a specific story point
- Timeline scrubber on the Board

#### V2.6 Structure Templates

- Pre-built outline templates: 3-Act, 5-Act, Hero's Journey, Save the Cat, Dan Harmon's Story Circle, Kishōtenketsu, Blake Snyder Beat Sheet
- Apply template → auto-creates Acts and placeholder Scene cards with function labels
- Character archetype templates (Mentor, Trickster, Herald, Shadow, etc.)

#### V2.7 Import

- Import from: Final Draft (.fdx), Fountain (.fountain), Word (.docx), Celtx
- Bulk entity import from CSV/JSON
- Scrivener project import (best-effort parsing)

#### V2.8 Mobile App (Read + Light Edit)

- View Bible entities
- Browse Board
- Quick capture new entities / scene ideas
- Light text editing on drafts
- Native iOS + Android (React Native or Flutter)

---

### V3 — Collaboration + Analytics (Target: 6–12 months post-MVP)

#### V3.1 Real-Time Collaboration

- Multi-user editing on manuscript (CRDT-based — Yjs or Automerge)
- Multi-user editing on Bible entities (OT or last-write-wins with conflict resolution)
- User presence indicators (cursors, "X is editing Scene 12")
- User roles: Owner, Writer, Editor, Viewer

#### V3.2 Writers' Room Features

- Assign scenes/chapters/episodes to specific writers
- Shared canonical Bible with per-writer sandboxes
- Bible change proposals with approval workflow
- Activity feed (who changed what, when)

#### V3.3 Comments & Review

- Comments on any entity (character, scene, arc, relationship — not just text)
- Threaded replies
- @mention collaborators
- Comment resolution (mark as resolved)
- Review assignments ("Please review Act 2 arcs")

#### V3.4 Analytics Dashboard

- **Character screen time**: scenes per character, dialogue word count per character, character interaction matrix (which characters share scenes)
- **Pacing analysis**: scene length distribution, action-to-dialogue ratio, emotional tone sequence (detect 5 "tense" scenes in a row)
- **Arc coverage**: visual confirmation that all arcs are progressing, no disappearing subplots
- **Chekhov's Gun audit**: planted-but-unpaid items/details, with "days since planted" urgency
- **Theme distribution**: tag scenes with themes, see heatmap of theme coverage

#### V3.5 Version Control

- Named snapshots of the full project state (Bible + Board + Draft)
- Diff view: compare any two snapshots
- Restore to any snapshot
- Bible-specific version history: if you change a character's backstory, see what it was before

#### V3.6 Genre Expansion Packs

- **Fantasy Pack**: Species, Magic Systems, Cultures, Languages, Religions as first-class entity types with tailored fields
- **Sci-Fi Pack**: Technology, Star Systems, Species, Political Systems
- **Mystery/Thriller Pack**: Clues, Suspects, Red Herrings, Evidence tracker
- **Romance Pack**: Relationship progression tracker, "beats" specific to romance arcs
- Packs add entity types and specialized Board views to the project

---

### V4 — Platform & Production (Target: 12–18 months post-MVP)

#### V4.1 Visual Storyboarding

- Frame-by-frame storyboard canvas linked to scenes
- Upload/draw per frame
- Frame metadata: shot type, camera movement, duration
- AI-generated storyboard frames from scene descriptions (image generation integration)
- Storyboard ↔ scene linking (click frame → jump to scene)

#### V4.2 Mood Boards

- Per-scene or per-act mood boards
- Image, color palette, reference link, text snippet uploads
- Linked to locations, characters, tonal goals

#### V4.3 Production Export Pipeline

- Scene breakdown sheets (auto-generated from scene metadata: characters, locations, items, props)
- Call sheets
- Shot lists (from storyboard)
- Budget estimation hooks

#### V4.4 Story Branching (Interactive Fiction / Games)

- Decision tree visualization
- Branch nodes with conditions
- Convergence points
- Branch-specific entity states
- Dialogue tree editor
- Export to game engine formats (Ink, Twine, Yarn Spinner)

#### V4.5 API & Integrations

- Public REST/GraphQL API for the Story Graph
- Webhook events (entity created, scene drafted, etc.)
- Integrations: Notion, Trello, Google Docs sync, Midjourney/DALL-E for character art, Inkarnate for maps

#### V4.6 Community & Marketplace

- Public template library (structure templates, character archetypes, genre-specific setups)
- Community sharing: publish Bible as a public "world" page
- Template marketplace (free + paid)

#### V4.7 Multi-Project Shared Universe

- Link entities across projects (same character appears in Book 1 and Book 2)
- Series Bible: canonical entity data shared across projects, with per-project overrides
- Cross-project timeline

---

## Appendix A: User Journey Walkthrough

### Scenario: Sarah writes a noir thriller screenplay

**Day 1 — Spark & Noodle (Bible)**

1. Sarah creates a new project: "The Hollow Man", format = screenplay, genre = "noir thriller"
2. Opens Bible > Characters
3. Creates 5 characters with Quick Capture: Detective Joe, Vera (femme fatale), Sgt. Malloy (corrupt cop), The Victim (Danny), Marcus Kane (crime boss)
4. Adds images she found on Pinterest to each character card
5. Fills in key fields: Joe's motivation ("find the truth"), flaw ("alcoholism"), fear ("becoming like his father")
6. Adds relationships: Joe ↔ Vera (romantic tension), Malloy → Kane (works for, directionality: a_to_b), Joe ↔ Danny (old friends)
7. Creates a Faction: "Kane Organization" — adds Kane (leader), Malloy (spy in police), and 2 placeholder characters
8. Creates 4 Locations: Joe's office, Blue Moon Jazz Club, Police Precinct, Waterfront Warehouse
9. Creates 2 Items: Danny's locket (significance: macguffin), forged police report (significance: chekhovs_gun)
10. Views Relationship Web → sees the power dynamics shape. Notices Vera isn't connected to Kane yet — adds a hidden relationship (family, directionality: mutual, sentiment: complicated)

**Day 2 — Structure (Board)**

1. Opens Board > Kanban
2. Creates 3 Acts (default)
3. Rapid-fires 15 scene cards with title + 1-line summary:
    - Act 1: "Joe gets the case", "Jazz club interrogation", "Vera appears", "Danny's apartment", "First clue — the locket"
    - Act 2: "Following Malloy", "Warehouse stakeout", "Vera's confession", "Joe hits rock bottom", "The forged report surfaces", "Confrontation with Kane"
    - Act 3: "The trap", "Double cross", "Final showdown", "Resolution"
4. Tags each scene: picks location, characters present, POV (all Joe except "Vera's confession" = Vera POV)
5. Creates 3 Arcs: A-plot (murder investigation, blue), B-plot (Joe's alcoholism, red), C-plot (Joe & Vera romance, pink)
6. Tags scenes with arcs. Notices B-plot (alcoholism) vanishes after Scene 7. Adds a new scene: "Joe at the bar" in mid-Act 2
7. Opens Foreshadowing Tracker:
    - Creates pair: "Danny's locket" — setup: Scene 5, payoff: TBD
    - Creates pair: "Forged police report" — setup: Scene 10, payoff: TBD
8. Switches to Timeline View → sees the color pattern. A-plot (blue) is steady. B-plot (red) has a gap in late Act 2. Adjusts

**Day 3+ — Write (Draft)**

1. Opens Scene 1 ("Joe gets the case") from the Board → Draft editor opens
2. Toggles to Screenplay mode
3. Types scene heading: `INT. JOE'S OFFICE - NIGHT` (auto-formatted)
4. Writes action lines, types `@Joe` → autocomplete inserts Detective Joe mention (hover = shows his description, flaw, motivation in tooltip)
5. Bible Sidebar shows: Location = Joe's Office, Characters = Joe + Client (new walk-in), Active arcs = A-plot
6. Finishes Scene 1 → status auto-updates to "drafted". Word count: 342
7. Clicks "Next Scene" → Scene 2 opens. Foreshadowing reminder: "Danny's locket should be planted in this scene"
8. Writes Scene 2, references `@Locket` inline

**Day 10 — Revise**

1. Opens Board > Kanban → drags "Warehouse stakeout" before "Following Malloy" — reorder is instant
2. Opens Character "Sgt. Malloy" → Backlinks section shows: appears in Scenes 6, 9, 14. Clicks through Scene 9 — realizes Malloy shouldn't know about the locket yet. Edits the scene
3. Dashboard: 2 unresolved foreshadowing pairs. "Forged report" is still unassigned for payoff → assigns to Scene 13 ("The trap")
4. Dashboard: word count = 8,420 / 15,000 target. 10 of 16 scenes drafted

---

## Appendix B: Entity Relationship Diagram

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────┐
│   Project    │───────<│     Character     │>───────│  Faction    │
│              │        │                  │ member  │             │
│  - name      │        │  - name          │  ship   │  - name     │
│  - format    │        │  - status        │         │  - ideology │
│  - genre     │        │  - motivation    │         │  - goals    │
└──────┬───────┘        │  - voice_notes   │         └─────────────┘
       │                └────────┬─────────┘
       │                         │
       │           ┌─────────────┼──────────────┐
       │           │             │              │
       │     has         has           has
       │   relationships  scenes       items
       │           │             │              │
       │           ▼             ▼              ▼
       │    ┌────────────┐ ┌─────────┐  ┌───────────┐
       │    │ Character   │ │  Scene  │  │   Item    │
       │    │ Relationship│ │         │  │           │
       │    │             │ │ - title │  │ - name    │
       │    │ - type      │ │ - slug  │  │ - status  │
       │    │ - sentiment │ │ - tone  │  │ - signif. │
       │    └─────────────┘ │ - func  │  │ - possess.│
       │                    └────┬────┘  └───────────┘
       │                         │
       │                    has draft
       │                         │
       │                         ▼
       │                  ┌─────────────┐
       │                  │ SceneDraft  │
       │                  │             │
       │                  │ - content   │
       │                  │ - mode      │
       │                  │ - wordcount │
       │                  └──────┬──────┘
       │                         │
       │                    contains
       │                         │
       │                         ▼
       │                  ┌──────────────┐
       │                  │EntityMention │
       │                  │              │
       │                  │ - entity_type│
       │                  │ - entity_id  │
       │                  └──────────────┘
       │
       ├───────<  Location
       │         - name, parent_location_id (self-ref)
       │
       ├───────<  Arc
       │         - name, type, color
       │
       ├───────<  ForeshadowingPair
       │         - setup_scene, payoff_scene, status
       │
       └───────<  Act
                 - name, sort_order

Cross-cutting join tables:
  - SceneArcTag (Scene ↔ Arc)
  - FactionMembership (Character ↔ Faction)
  - EntityLink (any entity ↔ any entity, generic)
  - Scene.characters_present (Scene ↔ Character[])
  - Scene.items_involved (Scene ↔ Item[])
```

---

## Appendix C: Glossary

|Term|Definition|
|---|---|
|**Story Graph**|The underlying data model where all story entities are nodes and relationships are edges. The single source of truth|
|**Bible**|The world-building space. Where entities (characters, locations, items, factions) are created and managed|
|**Board**|The story structure space. Where scenes are organized into acts, arcs are tracked, and foreshadowing is managed|
|**Draft**|The writing space. Scene-level rich text editor with inline Bible access|
|**Entity**|Any first-class story element: Character, Location, Item, Faction|
|**Scene Card**|The atomic unit of story structure. Contains metadata (characters, location, tone, arc tags) and links to a SceneDraft|
|**Arc**|A narrative throughline tracked across scenes. Can be a plot arc, character arc, relationship arc, or thematic arc|
|**Foreshadowing Pair**|A setup-payoff link between two story moments. Tracked with status (planted, paid off, abandoned, red herring)|
|**Backlink**|An auto-generated reverse reference. If Scene 5 mentions Character A, Character A's page shows a backlink to Scene 5|
|**Entity Mention**|An inline `@reference` in the manuscript that links draft text to a Bible entity|
|**Continuity Sidebar**|The contextual panel in the Draft editor that shows "state of the world" for the current scene|
|**Quick Capture**|Global shortcut to create any entity from anywhere in the app|
|**Genre Pack**|(V3+) An expansion that adds entity types and views specific to a genre (Fantasy, Sci-Fi, Mystery, Romance)|

---

_End of specification._