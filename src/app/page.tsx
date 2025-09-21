"use client";

import { FileUpload } from "@/components/file-upload";
import Footer from "@/components/footer";
import TopNavbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />

      <main className="flex-1 container mx-auto py-6 px-6">
        <FileUpload />
      </main>

      <Footer />
    </div>
  );
}
