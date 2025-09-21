import { Button } from "@heroui/button";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { Icon } from "@iconify/react";

const Logo = () => (
  <Icon icon="lucide:message-square-text" className="text-primary text-2xl" />
);

export default function TopNavbar() {
  return (
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
            // isDisabled={!hasData}
            // onPress={() => setIsExportModalOpen(true)}
          >
            Export
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
