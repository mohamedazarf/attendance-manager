import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloseIcon,
  HamburgerIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
} from "@chakra-ui/icons";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import API_BASE_URL from "../config/apiConfig";

interface UserPlatform {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  role: string;
  created_at: string;
  is_active: boolean;
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const toast = useToast();

  const [editingUser, setEditingUser] = useState<UserPlatform | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserPlatform | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "simple_user",
    password: "",
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/v1/platform-users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: t("Erreur lors de la récupération des utilisateurs"),
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user: UserPlatform | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role,
        password: "", // Don't show password
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        full_name: "",
        email: "",
        role: "simple_user",
        password: "",
      });
    }
    onOpen();
  };

  const handleSaveUser = async () => {
    const token = localStorage.getItem("token");
    const method = editingUser ? "PUT" : "POST";
    const url = editingUser
      ? `${API_BASE_URL}/api/v1/platform-users/${editingUser.id}`
      : `${API_BASE_URL}/api/v1/platform-users/`;

    // Remove password if empty during edit
    const payload = { ...formData };
    if (editingUser && !payload.password) {
      delete (payload as any).password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: editingUser
            ? t("Utilisateur mis à jour")
            : t("Utilisateur créé"),
          status: "success",
          duration: 3000,
        });
        onClose();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({
          title: t("Erreur"),
          description: errorData.detail || t("Une erreur est survenue"),
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleOpenDeleteModal = (user: UserPlatform) => {
    setUserToDelete(user);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/platform-users/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast({
          title: t("Utilisateur supprimé"),
          status: "success",
          duration: 3000,
        });
        onDeleteClose();
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast({
          title: t("Erreur"),
          description:
            errorData.detail || t("Impossible de supprimer l'utilisateur"),
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: t("Erreur"),
        description: t("Une erreur est survenue lors de la suppression"),
        status: "error",
        duration: 3000,
      });
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label={t("sidebar.toggle")}
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600}
      />

      <VStack flex={1} spacing={0} ml={["0", "250px"]} w="full">
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg">
              {t("Gestion des Utilisateurs Platform")}
            </Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={() => handleOpenModal()}
            >
              {t("Ajouter un utilisateur")}
            </Button>
          </Flex>

          <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>{t("Nom d'utilisateur")}</Th>
                  <Th>{t("Nom complet")}</Th>
                  <Th>{t("Email")}</Th>
                  <Th>{t("Rôle")}</Th>
                  <Th>{t("Date de création")}</Th>
                  <Th textAlign="right">{t("Actions")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td fontWeight="medium">{user.username}</Td>
                    <Td>{user.full_name}</Td>
                    <Td>{user.email || "-"}</Td>
                    <Td>
                      <Text
                        px={2}
                        py={1}
                        borderRadius="full"
                        bg={user.role === "admin" ? "purple.100" : "blue.100"}
                        color={
                          user.role === "admin" ? "purple.700" : "blue.700"
                        }
                        fontSize="xs"
                        fontWeight="bold"
                        display="inline-block"
                        textTransform="uppercase"
                      >
                        {t(user.role)}
                      </Text>
                    </Td>
                    <Td fontSize="sm" color="gray.600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Td>
                    <Td textAlign="right">
                      <HStack spacing={2} justify="flex-end">
                        <IconButton
                          aria-label={t("Modifier")}
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => handleOpenModal(user)}
                        />
                        <IconButton
                          aria-label={t("Supprimer")}
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleOpenDeleteModal(user)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {users.length === 0 && !loading && (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={10} color="gray.500">
                      {t("Aucun utilisateur trouvé.")}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Container>
      </VStack>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingUser
              ? t("Modifier l'utilisateur")
              : t("Ajouter un utilisateur")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>{t("Nom d'utilisateur")}</FormLabel>
                <Input
                  placeholder={t("admin_arfaoui")}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  isDisabled={!!editingUser}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{t("Nom complet")}</FormLabel>
                <Input
                  placeholder={t("Mohamed Aziz Arfaoui")}
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t("Email")}</FormLabel>
                <Input
                  type="email"
                  placeholder={t("email@example.com")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{t("Rôle")}</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="simple_user">{t("Utilisateur Simple")}</option>
                  <option value="admin">{t("Administrateur")}</option>
                </Select>
              </FormControl>

              <FormControl isRequired={!editingUser}>
                <FormLabel>
                  {t("Mot de passe")}{" "}
                  {editingUser && t("(laisser vide pour ne pas changer)")}
                </FormLabel>
                <Input
                  type="password"
                  placeholder={t("********")}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t("Annuler")}
            </Button>
            <Button colorScheme="blue" onClick={handleSaveUser}>
              {editingUser ? t("Mettre à jour") : t("Créer")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("Confirmer la suppression")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {t("Êtes-vous sûr de vouloir supprimer l'utilisateur")}{" "}
              <Text as="span" fontWeight="bold">
                {userToDelete?.username}
              </Text>{" "}
              ?
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              {t("Cette action est irréversible.")}
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              {t("Annuler")}
            </Button>
            <Button colorScheme="red" onClick={handleConfirmDelete}>
              {t("Supprimer")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
