import { useState } from "react";
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

export default function AddEmployeeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [privilege, setPrivilege] = useState(0);
  const [department, setDepartment] = useState("employee");
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const handleCreateUser = async () => {
    if (!uid || !name) {
      toast({
        title: "Missing fields",
        description: "UID and Name are required",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/v1/device/users/create",
        {
          uid: Number(uid),
          name,
          privilege,
          department,
        },
      );

      if (
        res.data.status === "success" ||
        res.data.status === "enroll_started"
      ) {
        toast({
          title: "Employee Created",
          description:
            "User created successfully. Please scan fingerprint on the device.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Creation Failed",
          description: res.data.message || "Something went wrong",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }

      // Optionally, you can reset the form
      setUid("");
      setName("");
      setPrivilege(0);
      setDepartment("employee");

      // Close modal if you want
      // onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message,
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
        <ModalHeader>Add New Employee</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={3}>
            <Input
              placeholder="UID (integer)"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
            />
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                  setDepartment("employee");
                }
              }}
            >
              <option value={0}>User</option>
              <option value={14}>Admin</option>
            </Select>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="employee">Employee (7:30 - 16:30)</option>
              <option value="administration">
                Administration (8:30 - 17:30)
              </option>
            </Select>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleCreateUser}
            isLoading={loading}
          >
            Create & Enroll
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
