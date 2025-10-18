import { invoke } from "@tauri-apps/api/core";

import type { DialogueData } from "@/types/dialogue";

export async function parseUnityAssetsFile(
  filePath: string,
  language: string,
): Promise<DialogueData> {
  const result = await invoke<DialogueData>("parse_assets_file", {
    filePath,
    language,
  });
  return result;
}

export async function exportUnityAssetsFile(
  filePath: string,
  dialogueData: DialogueData,
): Promise<void> {
  await invoke("export_assets_file", {
    filePath,
    dialogueData,
  });
}

export async function parseAssetsJsonFile(
  filePath: string,
): Promise<DialogueData> {
  const result = await invoke<DialogueData>("parse_assets_json_file", {
    filePath,
  });
  return result;
}

export async function exportAssetsJsonFile(
  filePath: string,
  dialogueData: DialogueData,
): Promise<void> {
  await invoke("export_assets_json_file", {
    filePath,
    dialogueData,
  });
}
