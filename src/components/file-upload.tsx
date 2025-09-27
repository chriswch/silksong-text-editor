import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Icon } from "@iconify/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { parseUnityAssetsFile } from "@/utils/tauri-bridge";

export const FileUpload = () => {
  const { setDialogueData } = useDialogueStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReadingAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const path = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "Unity Assets", extensions: ["assets"] }],
      });
      if (!path) return;

      const parsedData = await parseUnityAssetsFile(path);
      setDialogueData(parsedData);
    } catch (err) {
      setError(`Failed to read the file. ${err}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-12 border-2 border-dashed border-default-200 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-full bg-primary-50">
            <Icon
              icon="lucide:upload-cloud"
              className="text-5xl text-primary"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Upload Dialogue File</h2>
            <p className="text-default-500 mb-4">
              Click to browse and upload your Unity resources.assets file here
            </p>
            <label>
              <Button
                color="primary"
                startContent={!isLoading && <Icon icon="lucide:file-text" />}
                isLoading={isLoading}
                onPress={handleReadingAssets}
              >
                {isLoading ? "Processing..." : "Select File"}
              </Button>
            </label>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-danger-50 text-danger rounded-medium text-small">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:alert-circle" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
