import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      const userResponse = await fetch(
        "http://localhost:8000/api/v1/roles/me",
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        },
      );

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
      bgGradient="linear(to-br, blue.900, purple.900, black)"
      px={4}
    >
      <Container maxW="md">
        <Box
          bg="whiteAlpha.100"
          backdropFilter="blur(20px)"
          p={8}
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.200"
          boxShadow="2xl"
        >
          <VStack spacing={8} align="stretch">
            <VStack spacing={2} textAlign="center">
              <Heading color="white" size="xl" letterSpacing="tight">
                {t("Attendance")}
              </Heading>
              <Text color="purple.200">
                {t("Sign in to manage your workplace")}
              </Text>
            </VStack>

            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="purple.100">{t("Username")}</FormLabel>
                  <Input
                    type="text"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 1px purple.500",
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("Enter username")}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="purple.100">{t("Password")}</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _hover={{ borderColor: "purple.400" }}
                      _focus={{
                        borderColor: "purple.500",
                        boxShadow: "0 0 0 1px purple.500",
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
                        color="whiteAlpha.600"
                        onClick={() => setShowPassword(!showPassword)}
                        _hover={{ bg: "whiteAlpha.200" }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  w="full"
                  mb={10}
                  bgGradient="linear(to-r, purple.600, blue.600)"
                  color="white"
                  isLoading={loading}
                  _hover={{
                    bgGradient: "linear(to-r, purple.500, blue.500)",
                    transform: "translateY(-1px)",
                    boxShadow: "lg",
                  }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.2s"
                  borderRadius="xl"
                  py={6}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  {t("Sign In")}
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" color="whiteAlpha.400" fontSize="xs">
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
