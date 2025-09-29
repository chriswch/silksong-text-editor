import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { Icon } from "@iconify/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { useLanguageStore } from "@/hooks/use-language";
import { FileFormat } from "@/types/text-resources";
import {
  parseAssetsJsonFile,
  parseUnityAssetsFile,
} from "@/utils/tauri-bridge";

export const FileUpload = () => {
  const { t } = useLanguageStore();

  const { setDialogueData } = useDialogueStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFormat, setUploadFormat] = useState<FileFormat>(
    FileFormat.ASSETS,
  );

  const handleReadingAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters =
        uploadFormat === FileFormat.ASSETS
          ? [{ name: "Unity Assets", extensions: ["assets"] }]
          : [{ name: "Unity Assets JSON", extensions: ["json"] }];

      const path = await open({
        multiple: false,
        directory: false,
        filters,
      });
      if (!path) return;

      const parsedData =
        uploadFormat === FileFormat.ASSETS
          ? await parseUnityAssetsFile(path)
          : await parseAssetsJsonFile(path);
      setDialogueData(parsedData);
    } catch (err) {
      setError(`Failed to read the file. ${err}`);
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
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-2">
              {t("uploadAssetsFile")}
            </h2>
            <div className="flex items-center justify-center gap-4">
              <Tabs
                aria-label="Options"
                variant="bordered"
                selectedKey={uploadFormat}
                onSelectionChange={(key) => setUploadFormat(key as FileFormat)}
              >
                <Tab
                  key={FileFormat.ASSETS}
                  title={
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:file-text" />
                      <span>{t("uploadOriginalFormat")}</span>
                    </div>
                  }
                />
                <Tab
                  key={FileFormat.JSON}
                  title={
                    <div className="flex items-center space-x-2">
                      <Icon icon="lucide:braces" />
                      <span>{t("uploadJsonFormat")}</span>
                    </div>
                  }
                />
              </Tabs>
              <Button
                color="primary"
                startContent={!isLoading && <Icon icon="lucide:file-text" />}
                isLoading={isLoading}
                onPress={handleReadingAssets}
              >
                {isLoading ? t("processing") : t("selectFile")}
              </Button>
            </div>
            <p className="text-default-500 mb-4">{t("uploadDescription")}</p>
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
