import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { useLanguageStore } from "@/hooks/use-language";

import DialogueTable from "./dialogue-table";

export default function Container() {
  const { t } = useLanguageStore();

  const { dialogueData } = useDialogueStore();
  const [selectedScene, setSelectedScene] = useState<string>(
    Object.keys(dialogueData)[0],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{t("contentEntriesTable")}</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                endContent={<Icon icon="lucide:chevron-down" />}
              >
                {selectedScene
                  ? `${t("category")}: ${selectedScene}`
                  : t("allCategories")}
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Category selection">
              {Object.keys(dialogueData).map((scene) => (
                <DropdownItem
                  key={scene}
                  onPress={() => setSelectedScene(scene)}
                >
                  {scene}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <DialogueTable scene={selectedScene} />
    </div>
  );
}
