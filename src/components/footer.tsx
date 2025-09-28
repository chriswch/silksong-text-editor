import { useLanguageStore } from "@/hooks/use-language";

export default function Footer() {
  const { t } = useLanguageStore();

  return (
    <footer className="bg-content1 border-t border-divider py-3">
      <div className="container mx-auto text-center text-small text-default-500">
        {t("appTitle")} &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
