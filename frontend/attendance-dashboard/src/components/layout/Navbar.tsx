import { Flex, Text, Spacer, Box, Button } from "@chakra-ui/react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const goBack = () => {
    navigate(-1);
  };

  const goForward = () => {
    navigate(1);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Flex
      bg="white"
      p={{ base: 3, md: 4 }}
      shadow="sm"
      ml={{ base: "50px", md: 0 }}
      align="center"
      w="full"
    >
      <Button
        display={{ base: "none", md: "flex" }}
        height="50px"
        width="50px"
        borderRadius="full"
        mr={4}
        fontWeight="bold"
        fontSize="50px"
        onClick={goBack}
      >
        <FiArrowLeft />
      </Button>

      <Button
        display={{ base: "none", md: "flex" }}
        height="50px"
        width="50px"
        borderRadius="full"
        mr={4}
        fontWeight="bold"
        fontSize="50px"
        onClick={goForward}
      >
        <FiArrowRight />
      </Button>

      <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>
        {t("Dashboard RH")}
      </Text>

      <Spacer />

      <Flex align="center" gap={{ base: 2, md: 4 }}>
        {user && (
          <Text display={{ base: "none", sm: "block" }}>{user.username}</Text>
        )}
        <Box>
          <LanguageSwitcher />
        </Box>
        <Button
          size="sm"
          variant="outline"
          colorScheme="red"
          onClick={handleLogout}
        >
          {t("Logout")}
        </Button>
      </Flex>
    </Flex>
  );
}
