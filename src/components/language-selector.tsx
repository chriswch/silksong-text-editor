import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Icon } from "@iconify/react";
import React from "react";

import { Language, useLanguageStore } from "@/hooks/use-language";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, availableLanguages } = useLanguageStore();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light" isIconOnly aria-label="Select language">
          <Icon icon="lucide:globe" className="text-lg" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectedKeys={[language]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            setLanguage(selected as Language);
          }
        }}
      >
        {availableLanguages.map((lang) => (
          <DropdownItem key={lang.code}>{lang.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};
