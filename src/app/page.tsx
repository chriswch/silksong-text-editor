"use client";

import { DialogueEditor } from "@/components/dialogue-editor";
import { FileUpload } from "@/components/file-upload";
import Footer from "@/components/footer";
import TopNavbar from "@/components/navbar";
import { useDialogueStore } from "@/hooks/use-dialogue-store";

export default function Home() {
  const { dialogueData } = useDialogueStore();
  const hasData = Object.keys(dialogueData).length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />

      <main className="flex-1 container mx-auto py-6 px-6">
        {hasData ? <DialogueEditor /> : <FileUpload />}
      </main>

      <Footer />
    </div>
  );
}
