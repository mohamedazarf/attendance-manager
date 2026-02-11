// src/components/LanguageSwitcher.tsx
import { Menu, MenuButton, MenuList, MenuItem, Button } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
        {i18n.language.toUpperCase()}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => changeLanguage("en")}>English</MenuItem>
        <MenuItem onClick={() => changeLanguage("fr")}>Français</MenuItem>
        {/* Tu peux ajouter d’autres langues ici */}
      </MenuList>
    </Menu>
  );
};

export default LanguageSwitcher;
