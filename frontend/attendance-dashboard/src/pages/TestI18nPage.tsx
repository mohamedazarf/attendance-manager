// src/pages/TestI18nPage.tsx
import React from "react";
import { Box, Button, VStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

const TestI18nPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Box p={8}>
      <VStack spacing={4}>
        <Text fontSize="2xl">{t("welcome_message")}</Text>
        <Text>{t("description")}</Text>

        <Box>
          <Button colorScheme="blue" mr={2} onClick={() => changeLanguage("en")}>
            English
          </Button>
          <Button colorScheme="green" onClick={() => changeLanguage("fr")}>
            Français
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default TestI18nPage;
