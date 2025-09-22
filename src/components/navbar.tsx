import { Button } from "@heroui/button";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";

import { ExportModal } from "@/components/export-modal";
import { useDialogueStore } from "@/hooks/use-dialogue-store";

const Logo = () => (
  <Icon icon="lucide:message-square-text" className="text-primary text-2xl" />
);

export default function TopNavbar() {
  const { dialogueData } = useDialogueStore();
  const hasData = Object.keys(dialogueData).length > 0;
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Navbar isBordered>
        <NavbarBrand>
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-semibold">
              Silksong Dialogue Subtitle Editor
            </h1>
          </div>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              variant="solid"
              color="primary"
              startContent={<Icon icon="lucide:download" />}
              isDisabled={!hasData}
              onPress={onOpen}
            >
              Export
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <ExportModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
