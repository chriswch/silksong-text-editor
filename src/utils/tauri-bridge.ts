import { invoke } from "@tauri-apps/api/core";

import type { DialogueData } from "@/types/dialogue";

export async function parseUnityAssetsFilet(
  filePath: string,
): Promise<DialogueData> {
  const result = await invoke<DialogueData>("parse_assets_file", {
    filePath,
  });
  return result;
}
