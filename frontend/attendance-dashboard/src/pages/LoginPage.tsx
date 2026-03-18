import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useTranslation } from "react-i18next";

import { API_ENDPOINTS } from "../config/apiConfig";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const toast = useToast();
  const from = "/pointages";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      const userResponse = await fetch(API_ENDPOINTS.ROLES.ME, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userData = await userResponse.json();

      login(data.access_token, userData);
      toast({
        title: t("Welcome back!"),
        description: t("Successfully signed in as", {
          name: userData.full_name || userData.username,
        }),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({
        title: t("Authentication Failed"),
        description: t(err.message) || t("Something went wrong"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="black"
      px={4}
    >
      <Container maxW="md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="sm">
          <VStack spacing={8} align="stretch">
            <VStack spacing={2} textAlign="center">
              <Heading color="gray.800" size="xl" letterSpacing="tight">
                {t("Gestion des pointages")}
              </Heading>
              <Text color="gray.500">
                {t(
                  "Connectez-vous pour gérer les présences dans votre société",
                )}
              </Text>
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="gray.700">{t("Username")}</FormLabel>
                  <Input
                    type="text"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    color="gray.800"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("Enter username")}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.700">{t("Password")}</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      color="gray.800"
                      _hover={{ borderColor: "gray.300" }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px #3182ce",
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <InputRightElement _hover={{ cursor: "pointer" }}>
                      <IconButton
                        aria-label={
                          showPassword ? t("Hide password") : t("Show password")
                        }
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        color="gray.500"
                        onClick={() => setShowPassword(!showPassword)}
                        _hover={{ bg: "gray.100" }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  w="full"
                  mt={4}
                  bg="blue.500"
                  color="white"
                  isLoading={loading}
                  _hover={{
                    bg: "blue.600",
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  _active={{
                    bg: "blue.700",
                    transform: "translateY(0)",
                  }}
                  transition="all 0.2s"
                  borderRadius="md"
                  py={6}
                  fontSize="md"
                  fontWeight="medium"
                >
                  {t("Sign In")}
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" color="gray.400" fontSize="xs" mt={4}>
              © 2026 {t("Attendance Management System")}.{" "}
              {t("All rights reserved.")}
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
