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
import { useState } from "react";

import { useDialogueStore } from "../hooks/use-dialogue-store";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const { dialogueData } = useDialogueStore();
  const [exportOption, setExportOption] = useState("new");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      // In a real app, this would process the dialogueData and create a Unity asset file
      // For this demo, we'll just export the JSON data
      const exportData = JSON.stringify(dialogueData, null, 2);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resources_edited.assets";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      onClose();
    }, 1500);
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
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
