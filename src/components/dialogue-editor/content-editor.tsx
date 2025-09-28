import { Textarea } from "@heroui/input";
import { useState } from "react";

import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { useLanguageStore } from "@/hooks/use-language";

interface ContentEditorProps {
  scene: string;
  entryName: string;
}

export default function ContentEditor({
  scene,
  entryName,
}: ContentEditorProps) {
  const { t } = useLanguageStore();

  const { dialogueData, setDialogueContent } = useDialogueStore();
  const dialogueContent = dialogueData[scene][entryName];

  const [content, setContent] = useState<string>(
    dialogueContent?.originalContent || "",
  );

  const handleSave = (value: string) => {
    setContent(value);
    setDialogueContent(scene, entryName, { editedContent: value });
  };

  return (
    <Textarea
      value={content}
      onValueChange={handleSave}
      minRows={2}
      placeholder={t("editContentText")}
    />
  );
}
