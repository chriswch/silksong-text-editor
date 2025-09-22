import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { mockParseDialogueFile } from "@/utils/mock-parser";

export const FileUpload = () => {
  const { setDialogueData } = useDialogueStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsedData = await mockParseDialogueFile(file);
      setDialogueData(parsedData);
    } catch (err) {
      setError(
        "Failed to parse file. Please ensure it's a valid Unity resources.assets file.",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card
        className={`p-12 border-2 border-dashed ${
          isDragging ? "border-primary bg-primary-50" : "border-default-200"
        } transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
              Drag and drop your Unity resources.assets file here, or click to
              browse
            </p>
            <label>
              <Button
                color="primary"
                startContent={!isLoading && <Icon icon="lucide:file-text" />}
                isLoading={isLoading}
                onPress={() => fileInputRef.current?.click()}
              >
                {isLoading ? "Processing..." : "Select File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".assets"
                className="hidden"
                onChange={handleUploadFile}
              />
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
