import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import { Icon } from "@iconify/react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

import { exportUnityAssetsFile } from "@/utils/tauri-bridge";

import { useDialogueStore } from "../hooks/use-dialogue-store";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const { dialogueData } = useDialogueStore();
  const [exportOption, setExportOption] = useState("new");
  const [isExporting, setIsExporting] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChooseFile = async () => {
    setError(null);
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Unity resources.assets",
          extensions: ["assets"],
        },
      ],
    });
    if (!selected) return;
    if (Array.isArray(selected)) {
      setTargetPath(selected[0] ?? null);
    } else {
      setTargetPath(selected);
    }
  };

  const handleExport = async () => {
    setError(null);
    if (!targetPath) {
      setError("Please select a resources.assets file first.");
      return;
    }
    setIsExporting(true);
    try {
      await exportUnityAssetsFile(targetPath, dialogueData);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to export. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:download" className="text-primary" />
                <span>Export Dialogue</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-500 mb-4">
                Choose how you want to export your edited dialogue:
              </p>

              <RadioGroup value={exportOption} onValueChange={setExportOption}>
                <Radio
                  value="new"
                  description="Create a new file with your edits applied"
                >
                  Create new file (resources_edited.assets)
                </Radio>
              </RadioGroup>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="flat"
                    onPress={handleChooseFile}
                    startContent={<Icon icon="lucide:file" />}
                  >
                    Choose resources.assets
                  </Button>
                  {targetPath && (
                    <span
                      className="text-small text-default-600 truncate"
                      title={targetPath}
                    >
                      {targetPath}
                    </span>
                  )}
                </div>
                {error && (
                  <span className="text-tiny text-danger-600">{error}</span>
                )}
              </div>

              <div className="mt-6 p-3 bg-warning-50 rounded-medium flex items-start gap-2">
                <Icon
                  icon="lucide:alert-triangle"
                  className="text-warning mt-0.5"
                />
                <div className="text-small text-warning-700">
                  <strong>Note:</strong> This is a demo application. In a real
                  implementation, this would export a properly formatted Unity
                  assets file. For now, it will export your dialogue data as
                  JSON.
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleExport}
                isLoading={isExporting}
                startContent={!isExporting && <Icon icon="lucide:download" />}
              >
                {isExporting ? "Exporting..." : "Confirm"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
