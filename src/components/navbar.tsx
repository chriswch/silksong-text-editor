import { Button } from "@heroui/button";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { useDisclosure } from "@heroui/react";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

import { ExportModal } from "@/components/export-modal";
import { LanguageSelector } from "@/components/language-selector";
import { useDialogueStore } from "@/hooks/use-dialogue-store";
import { useLanguageStore } from "@/hooks/use-language";

const Logo = () => (
  <Icon icon="lucide:message-square-text" className="text-primary text-2xl" />
);

export default function TopNavbar() {
  const { t } = useLanguageStore();

  const { saveDialogue, dialogueData } = useDialogueStore();
  const hasData = Object.keys(dialogueData).length > 0;
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand>
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-semibold">{t("appTitle")}</h1>
          </div>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <LanguageSelector />
          </NavbarItem>
          <NavbarItem>
            <Tooltip content={t("save")}>
              <Button
                isIconOnly
                color="primary"
                variant="ghost"
                onPress={saveDialogue}
                isDisabled={!dialogueData || !hasData}
              >
                <Icon icon="lucide:save" className="text-lg" />
              </Button>
            </Tooltip>
          </NavbarItem>
          <NavbarItem>
            <Tooltip content={t("download")}>
              <Button
                isIconOnly
                color="primary"
                variant="solid"
                isDisabled={!hasData}
                onPress={onOpen}
              >
                <Icon icon="lucide:download" className="text-lg" />
              </Button>
            </Tooltip>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <ExportModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
