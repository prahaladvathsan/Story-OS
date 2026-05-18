import JSZip from "jszip";
import { db } from "../../data/db";
import type { AssetRecord, ProjectSnapshot } from "../../data/schema";
import { deleteProject } from "../../data/repository";
import { extractPlainText, getOrderedActs, getOrderedScenes } from "../../data/selectors";
import { base64ToBlob, blobToBase64, downloadBlob, downloadText, slugify } from "../../lib/utils";

type BackupAssetRecord = Omit<AssetRecord, "blob"> & {
  filePath?: string;
};

type BackupPayload = Omit<ProjectSnapshot, "assets"> & {
  schemaVersion: 1;
  exportedAt: string;
  assets: BackupAssetRecord[];
};

export function buildProjectJson(snapshot: ProjectSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}

export function buildMarkdownExport(snapshot: ProjectSnapshot) {
  const acts = getOrderedActs(snapshot.acts);
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const lines = [`# ${snapshot.project.name}`, "", snapshot.project.description, ""];

  for (const act of acts) {
    lines.push(`## ${act.name}`, "");
    for (const scene of scenes.filter((entry) => entry.actId === act.id)) {
      const draft = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
      lines.push(`### ${scene.title || "Untitled Scene"}`, "");
      if (scene.summary) {
        lines.push(scene.summary, "");
      }
      lines.push(draft?.plainText || extractPlainText(draft?.content) || "_No draft yet_", "");
    }
  }

  return lines.join("\n");
}

export function buildFountainExport(snapshot: ProjectSnapshot) {
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const lines = [`Title: ${snapshot.project.name}`, `Author: Story OS`, ""];

  for (const scene of scenes) {
    const draft = snapshot.sceneDrafts.find((entry) => entry.sceneId === scene.id);
    lines.push(scene.slugLine || scene.title.toUpperCase() || "UNTITLED SCENE", "");
    lines.push(draft?.plainText || extractPlainText(draft?.content) || "", "");
  }

  return lines.join("\n");
}

export function buildSceneCsv(snapshot: ProjectSnapshot) {
  const scenes = getOrderedScenes(snapshot.acts, snapshot.scenes);
  const header = ["Title", "Act", "Summary", "Status", "POV", "Location", "Tone", "Function"];
  const rows = scenes.map((scene) => [
    scene.title,
    snapshot.acts.find((act) => act.id === scene.actId)?.name ?? "",
    scene.summary,
    scene.status,
    snapshot.characters.find((character) => character.id === scene.povCharacterId)?.name ?? "",
    snapshot.locations.find((location) => location.id === scene.locationId)?.name ?? "",
    scene.emotionalTone ?? "",
    scene.storyFunction ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export async function createProjectBackup(snapshot: ProjectSnapshot) {
  const zip = new JSZip();
  const backupAssets: BackupAssetRecord[] = [];
  const assetsFolder = zip.folder("assets");

  for (const asset of snapshot.assets) {
    if (asset.kind === "local" && asset.blob) {
      const extension = asset.extension ?? asset.name.split(".").pop() ?? "bin";
      const filePath = `assets/${asset.id}.${extension}`;
      assetsFolder?.file(`${asset.id}.${extension}`, asset.blob as Blob);
      backupAssets.push({
        ...asset,
        filePath,
      });
    } else {
      backupAssets.push(asset);
    }
  }

  const payload: BackupPayload = {
    ...snapshot,
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    assets: backupAssets,
  };

  zip.file("project.json", JSON.stringify(payload, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
}

export async function downloadProjectBackup(snapshot: ProjectSnapshot) {
  const blob = await createProjectBackup(snapshot);
  downloadBlob(blob, `${slugify(snapshot.project.name)}.storyos`);
}

export function downloadProjectJson(snapshot: ProjectSnapshot) {
  downloadText(buildProjectJson(snapshot), `${slugify(snapshot.project.name)}.json`, "application/json;charset=utf-8");
}

export function downloadMarkdown(snapshot: ProjectSnapshot) {
  downloadText(buildMarkdownExport(snapshot), `${slugify(snapshot.project.name)}.md`, "text/markdown;charset=utf-8");
}

export function downloadFountain(snapshot: ProjectSnapshot) {
  downloadText(buildFountainExport(snapshot), `${slugify(snapshot.project.name)}.fountain`, "text/plain;charset=utf-8");
}

export function downloadSceneCsv(snapshot: ProjectSnapshot) {
  downloadText(buildSceneCsv(snapshot), `${slugify(snapshot.project.name)}-scenes.csv`, "text/csv;charset=utf-8");
}

export async function importProjectBackup(file: File) {
  if (file.name.endsWith(".json")) {
    const text = await file.text();
    const payload = JSON.parse(text) as BackupPayload;
    await restoreBackupPayload(payload, {});
    return payload.project.id;
  }

  const zip = await JSZip.loadAsync(file);
  const projectText = await zip.file("project.json")?.async("string");
  if (!projectText) {
    throw new Error("project.json missing from backup");
  }

  const payload = JSON.parse(projectText) as BackupPayload;
  const localAssets: Record<string, Blob> = {};

  for (const asset of payload.assets) {
    if (asset.kind === "local" && asset.filePath) {
      const zipEntry = zip.file(asset.filePath);
      if (zipEntry) {
        localAssets[asset.id] = await zipEntry.async("blob");
      }
    }
  }

  await restoreBackupPayload(payload, localAssets);
  return payload.project.id;
}

async function restoreBackupPayload(payload: BackupPayload, localAssets: Record<string, Blob>) {
  await deleteProject(payload.project.id).catch(() => undefined);

  await db.transaction(
    "rw",
    db.projects,
    db.assets,
    db.characters,
    db.locations,
    db.items,
    db.factions,
    db.characterRelationships,
    db.factionMemberships,
    db.entityLinks,
    db.acts,
    db.scenes,
    db.arcs,
    db.sceneArcTags,
    db.foreshadowingPairs,
    db.sceneDrafts,
    db.entityMentions,
    db.uiState,
    db.recentEdits,
    async () => {
      await db.projects.put(payload.project);
      await db.assets.bulkPut(
        payload.assets.map((asset) => ({
          ...asset,
          blob: asset.kind === "local" ? localAssets[asset.id] : undefined,
        })),
      );
      await db.characters.bulkPut(payload.characters);
      await db.locations.bulkPut(payload.locations);
      await db.items.bulkPut(payload.items);
      await db.factions.bulkPut(payload.factions);
      await db.characterRelationships.bulkPut(payload.characterRelationships);
      await db.factionMemberships.bulkPut(payload.factionMemberships);
      await db.entityLinks.bulkPut(payload.entityLinks);
      await db.acts.bulkPut(payload.acts);
      await db.scenes.bulkPut(payload.scenes);
      await db.arcs.bulkPut(payload.arcs);
      await db.sceneArcTags.bulkPut(payload.sceneArcTags);
      await db.foreshadowingPairs.bulkPut(payload.foreshadowingPairs);
      await db.sceneDrafts.bulkPut(payload.sceneDrafts);
      await db.entityMentions.bulkPut(payload.entityMentions);
      await db.uiState.bulkPut(payload.uiState);
      await db.recentEdits.bulkPut(payload.recentEdits);
    },
  );
}
