interface DialogueContent {
  originalContent: string;
  editedContent?: string;
}

interface DialogueEntry {
  [name: string]: DialogueContent;
}

interface DialogueData {
  [scene: string]: DialogueEntry;
}

export type { DialogueData, DialogueEntry, DialogueContent };
