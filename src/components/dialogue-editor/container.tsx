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

import DialogueTable from "./dialogue-table";

export default function Container() {
  const { dialogueData, saveDialogue } = useDialogueStore();
  const [selectedScene, setSelectedScene] = useState<string>(
    Object.keys(dialogueData)[0],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Dialogue Editor</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                endContent={<Icon icon="lucide:chevron-down" />}
              >
                {selectedScene ? `Scene: ${selectedScene}` : "All Scenes"}
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Scene selection">
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

      <Button variant="solid" color="primary" onPress={saveDialogue}>
        Save
      </Button>
    </div>
  );
}
