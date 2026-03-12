import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  VStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import API_BASE_URL from "../config/apiConfig";

export default function AddEmployeeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [privilege, setPrivilege] = useState(0);
  const [department, setDepartment] = useState("usine");
  const [matricule, setMatricule] = useState("");
  const [departments, setDepartments] = useState<string[]>([
    "usine",
    "administration",
  ]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/v1/attendance/dashboard/departments`,
        );
        const fetched = Array.isArray(res.data?.departments)
          ? res.data.departments
          : [];
        if (fetched.length > 0) {
          setDepartments(fetched);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const handleCreateUser = async () => {
    if (!uid || !name) {
      toast({
        title: t("Missing fields"),
        description: t("UID and Name are required"),
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/device/users/create`,
        {
          uid: Number(uid),
          name,
          privilege,
          department,
          matricule,
        },
      );

      if (
        res.data.status === "success" ||
        res.data.status === "enroll_started"
      ) {
        toast({
          title: t("Employee Created"),
          description: t(
            "User created successfully. Please scan fingerprint on the device.",
          ),
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: t("Creation Failed"),
          description: t(res.data.message) || t("Something went wrong"),
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      // Optionally, you can reset the form
      setUid("");
      setName("");
      setPrivilege(0);
      setDepartment("usine");
      setMatricule("");

      // Close modal if you want
      // onClose();
    } catch (err: any) {
      toast({
        title: t("Error"),
        description: t(err.response?.data?.message) || t(err.message),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("Add New Employee")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3}>
            <Input
              placeholder={t("UID (integer)")}
              value={uid}
              onChange={(e) => setUid(e.target.value)}
            />
            <Input
              placeholder={t("Name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder={t("Matricule")}
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
            />
            <Select
              value={privilege}
              onChange={(e) => {
                const selectedPrivilege = Number(e.target.value);
                setPrivilege(selectedPrivilege);

                // Auto update department
                if (selectedPrivilege === 14) {
                  setDepartment("administration");
                } else {
                  setDepartment("usine");
                }
              }}
            >
              <option value={0}>{t("User")}</option>
              <option value={14}>{t("Admin")}</option>
            </Select>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {t(dept)}
                </option>
              ))}
            </Select>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleCreateUser}
            isLoading={loading}
          >
            {t("Create & Enroll")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
