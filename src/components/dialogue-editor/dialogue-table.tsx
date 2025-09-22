import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import ReactDiffViewer from "react-diff-viewer-continued";

import { useDialogueStore } from "@/hooks/use-dialogue-store";

import ContentEditor from "./content-editor";

interface DialogueTableProps {
  scene: string;
}

export default function DialogueTable({ scene }: DialogueTableProps) {
  const { dialogueData } = useDialogueStore();
  const dialogueEntry = dialogueData[scene];

  return (
    <div className="bg-content1 rounded-medium border border-default-200">
      <Table aria-label="Dialogue entries table">
        <TableHeader>
          <TableColumn width="20%">NAME</TableColumn>
          <TableColumn width="80%">Content</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No dialogue entries found. Try adjusting your filters.">
          {Object.entries(dialogueEntry).map(([name, content]) => {
            const isEdited =
              content.editedContent !== undefined &&
              content.editedContent !== content.originalContent;

            return (
              <TableRow key={name}>
                <TableCell>
                  <div className="font-medium">{name}</div>
                </TableCell>
                <TableCell>
                  <ContentEditor scene={scene} entryName={name} />
                  {isEdited && (
                    <div className="border border-default-200 rounded-medium overflow-hidden">
                      <ReactDiffViewer
                        oldValue={content.originalContent}
                        newValue={content.editedContent}
                        splitView={false}
                        useDarkTheme={false}
                        hideLineNumbers
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
