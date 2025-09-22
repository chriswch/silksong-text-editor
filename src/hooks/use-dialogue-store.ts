import { create } from "zustand";

import { DialogueContent, DialogueData } from "@/types/dialogue";

interface DialogueStore {
  dialogueData: DialogueData;
  setDialogueContent: (
    scene: string,
    name: string,
    content: Partial<DialogueContent>,
  ) => void;
  setDialogueData: (data: DialogueData) => void;
  saveDialogue: () => void;
  resetDialogue: () => void;
}

export const useDialogueStore = create<DialogueStore>((set) => ({
  dialogueData: {},
  setDialogueContent: (scene, name, content) =>
    set((state) => ({
      dialogueData: {
        ...state.dialogueData,
        [scene]: {
          ...state.dialogueData[scene],
          [name]: {
            ...state.dialogueData[scene][name],
            ...content,
          },
        },
      },
    })),
  setDialogueData: (data) => set({ dialogueData: data }),
  saveDialogue: () =>
    set(({ dialogueData }) => ({
      dialogueData: Object.fromEntries(
        Object.entries(dialogueData).map(([scene, entries]) => [
          scene,
          Object.fromEntries(
            Object.entries(entries).map(([name, content]) => [
              name,
              {
                originalContent:
                  content.editedContent ?? content.originalContent,
              },
            ]),
          ),
        ]),
      ) as DialogueData,
    })),
  resetDialogue: () => set({ dialogueData: {} }),
}));
