import { readDb, writeDb, generateId } from "./db";
import type { AssetRecord } from "../minimax/types";

export async function getAssets(): Promise<AssetRecord[]> {
  return readDb<AssetRecord[]>("assets.json", []);
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  const assets = await getAssets();
  return assets.find((a) => a.id === id) ?? null;
}

export async function createAsset(asset: Omit<AssetRecord, "id" | "createdAt" | "updatedAt">): Promise<AssetRecord> {
  const assets = await getAssets();
  const now = new Date().toISOString();
  const record: AssetRecord = {
    ...asset,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    tags: asset.tags ?? [],
    favorite: asset.favorite ?? false,
  };
  assets.unshift(record);
  await writeDb("assets.json", assets);
  return record;
}

export async function updateAsset(id: string, partial: Partial<AssetRecord>): Promise<AssetRecord | null> {
  const assets = await getAssets();
  const index = assets.findIndex((a) => a.id === id);
  if (index === -1) return null;

  assets[index] = { ...assets[index], ...partial, updatedAt: new Date().toISOString() };
  await writeDb("assets.json", assets);
  return assets[index];
}

export async function deleteAsset(id: string): Promise<boolean> {
  const assets = await getAssets();
  const filtered = assets.filter((a) => a.id !== id);
  if (filtered.length === assets.length) return false;
  await writeDb("assets.json", filtered);
  return true;
}

export async function clearAssets(): Promise<void> {
  await writeDb("assets.json", []);
}
