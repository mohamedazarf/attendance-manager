
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Flex,
  Heading,
  Badge,
  Text,
  Select,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  ButtonGroup,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,

  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast, // Using toast for better feedback
} from "@chakra-ui/react";
import { SearchIcon, HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import AddEmployeeModal from "../components/AddEmployeeModal";


const BASE_URL = "http://localhost:8000/api/v1";

const anomalyColors: Record<string, string> = {
  retard: "orange",
  early_departure: "red",
  incomplete_day: "yellow",
  entree_sans_sortie: "purple",
  sortie_sans_entree: "teal",
};

interface Employee {
  employee_code: string;
  name: string;
  privilege: number;
  group_id?: string;
  card?: number;
  is_active?: boolean;
}

type EmployeeHistoryItem = {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  worked_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
  status: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [privilege, setPrivilege] = useState("all");

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const { isOpen, onOpen, onClose } = useDisclosure();


  // -------------------- History Drawer State --------------------
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [history, setHistory] = useState<EmployeeHistoryItem[]>([]);
  const [totalPeriodHours, setTotalPeriodHours] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-01-31");

  const [drawerFilterState, setDrawerFilterState] = useState<"all" | "present" | "absent" | "late">("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<string[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employee_code: "",
    name: "",
    privilege: 0,
    group_id: "",
    card: "",
    password: ""
  });

  const [addLoading, setAddLoading] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const cancelRef = useRef<HTMLButtonElement>(null);

  // -------------------- Password & Enroll State --------------------
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState<string | null>(null);

  const toast = useToast();

  const handleEnrollFingerprint = async (emp: Employee) => {
    setEnrollLoading(emp.employee_code);
    try {
      const res = await axios.post(`${BASE_URL}/device/users/${emp.employee_code}/enroll`);
      toast({
        title: "Enrollment Started",
        description: res.data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: "Enrollment Failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEnrollLoading(null);
    }
  };

  const openPasswordModal = (emp: Employee) => {
    setPasswordEmployee(emp);
    setNewPassword("");
    setIsPasswordOpen(true);
  };

  const handleSetPassword = async () => {
    if (!passwordEmployee) return;
    setPasswordLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/device/users/${passwordEmployee.employee_code}/set-password`, null, {
        params: { password: newPassword }
      });
      toast({
        title: "Password Set",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsPasswordOpen(false);
      setPasswordEmployee(null);
    } catch (err: any) {
      toast({
        title: "Failed to set password",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPasswordLoading(false);
    }
  };


  const pollFingerprintStatus = async (uid: number) => {
    const startTime = Date.now();
    const timeout = 60000; // 60 seconds
    const interval = 2000; // 2 seconds

    const check = async () => {
      if (Date.now() - startTime > timeout) {
        toast({
          title: "Enrollment check timed out",
          description: "Could not verify fingerprint enrollment. Please check on the device.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/device/users/${uid}/fingerprint-status`);
        if (res.data.status === "enrolled" || res.data.fingerprint_count > 0) {
          toast({
            title: "Fingerprint Enrolled",
            description: "Fingerprint successfully enrolled on device.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      } catch (err) {
        console.error("Polling error", err);
      }

      setTimeout(check, interval);
    };

    setTimeout(check, interval);
  };

  const handleAddEmployee = async () => {
    setAddLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/device/users/create-and-enroll`, {
        uid: Number(newEmployee.employee_code),
        name: newEmployee.name,
        privilege: newEmployee.privilege
      });

      if (res.data.message) {
        toast({
          title: "User Created",
          description: res.data.message, // "User created. Please enroll fingerprint..."
          status: "info",
          duration: 6000,
          isClosable: true,
        });

        setIsAddOpen(false);

        // Start polling for fingerprint
        pollFingerprintStatus(Number(newEmployee.employee_code));

        // Refresh employees list
        const empRes = await axios.get(`${BASE_URL}/employee/`);
        setEmployees(empRes.data);

        // Reset form
        setNewEmployee({
          employee_code: "",
          name: "",
          privilege: 0,
          group_id: "",
          card: "",
          password: ""
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error creating employee",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    setDeleteLoading(true);
    try {
      // 1️⃣ Delete from device
      await axios.delete(`${BASE_URL}/device/users/${deletingEmployee.employee_code}`);

      // 2️⃣ Resync device
      await axios.post(`${BASE_URL}/device/sync`);

      // 3️⃣ Remove from frontend list
      setEmployees((prev) =>
        prev.filter((e) => e.employee_code !== deletingEmployee.employee_code)
      );

      setDeletingEmployee(null);
    } catch (err) {
      console.error("Error deleting employee:", err);
    } finally {
      setDeleteLoading(false);
    }
  };


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/employee/`);
        setEmployees(res.data);
        console.log("=== USERS FROM DATABASE ===");
        console.log(res.data);
        // 🔹 Appel Device users
        const deviceRes = await axios.get(`${BASE_URL}/device/users`);
        console.log("=== USERS FROM DEVICE ===");
        console.log(deviceRes.data);

      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch = `${emp.name} ${emp.employee_code}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchPrivilege =
        privilege === "all" || emp.privilege.toString() === privilege;
      return matchSearch && matchPrivilege;
    });
  }, [employees, search, privilege]);

  // -------------------- Fetch Employee History --------------------
  const openEmployeeHistory = (emp: Employee) => {
    setSelectedEmployeeCode(emp.employee_code);
    setHistoryLoading(true);

    axios
      .get(`${BASE_URL}/employee/${emp.employee_code}/history`, {
        params: { date_from: dateFrom, date_to: dateTo },
      })
      .then((res) => {
        setEmployeeName(res.data.employee_name || emp.name);
        setHistory(res.data.history);
        setTotalPeriodHours(res.data.total_period_hours);
        setDrawerFilterState("all");
        setDrawerSelectedAnomalies([]);
      })
      .catch((err) => console.error("Employee history fetch error:", err))
      .finally(() => setHistoryLoading(false));
  };

  const closeDrawer = () => setSelectedEmployeeCode(null);

  // -------------------- Drawer Filtering --------------------
  const filteredHistory = history
    .filter((h) => {
      if (drawerSelectedAnomalies.length === 0) return true;
      return h.anomalies.some((a) => drawerSelectedAnomalies.includes(a));
    })
    .filter((h) => {
      if (drawerFilterState === "present") return h.status === "normal";
      if (drawerFilterState === "absent") return h.status === "absent";
      if (drawerFilterState === "late") return h.is_late;
      return true;
    });

  if (loading) {
    return (
      <Box p={5} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }



  return (
    <Box bg="gray.50" minH="100vh" display="flex">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600}
      />

      <Box flex={1} ml={["0", "250px"]} display="flex" flexDirection="column">
        <Navbar />
        <Flex justify="space-between" p={5} align="center" mb={6}>
          <Box>
            <Heading size="md" pl="10">Employees</Heading>
            <Text fontSize="sm" color="gray.500" pl="10">
              {filteredEmployees.filter((emp) => emp.is_active === true).length} employee(s) found
            </Text>
          </Box>
          <Button
            colorScheme="blue"
            onClick={() => setIsAddOpen(true)}
            mr={10}
          >
            + Add Employee
          </Button>

        </Flex>
        <AddEmployeeModal isOpen={isOpen} onClose={onClose} />

        <Flex gap={4} mb={4} flexWrap="wrap">
          <InputGroup maxW="260px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>

          <Select
            maxW="200px"
            value={privilege}
            onChange={(e) => setPrivilege(e.target.value)}
          >
            <option value="all">All privileges</option>
            <option value="0">User</option>
            <option value="14">Admin</option>
          </Select>
        </Flex>

        {/* <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
          {filteredEmployees.map((emp) => (
            <Box
              key={emp.employee_code}
              borderWidth="1px"
              borderRadius="lg"
              p={5}
              bg="white"
              shadow="md"
              cursor="pointer"
              onClick={() => openEmployeeHistory(emp)}
              _hover={{
                shadow: "xl",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              }}
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Heading size="md">{emp.name}</Heading>
                <Badge
                  colorScheme={emp.privilege === 1 ? "green" : "blue"}
                  fontSize="0.8em"
                >
                  {emp.privilege === 1 ? "Admin" : "User"}
                </Badge>
              </Flex>
              <Text fontSize="sm" mb={1}>
                <strong>Code:</strong> {emp.employee_code}
              </Text>
              <Text fontSize="sm" mb={1}>
                <strong>Group:</strong> {emp.group_id || "-"}
              </Text>
              <Text fontSize="sm">
                <strong>Card:</strong> {emp.card || "-"}
              </Text>
              <Text fontSize="sm">
                <strong>Is Active:</strong> {emp.is_active === false ? "No" : "Yes"}
              </Text>
              <Flex gap={2} mt={3} wrap="wrap">
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening history drawer
                    setDeletingEmployee(emp);
                  }}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPasswordModal(emp);
                  }}
                >
                  Password
                </Button>
                <Button
                  size="sm"
                  colorScheme="orange"
                  isLoading={enrollLoading === emp.employee_code}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnrollFingerprint(emp);
                  }}
                >
                  Enroll FP
                </Button>
              </Flex>

            </Box>
          ))}
        </SimpleGrid> */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>

          {/* Active Employees */}
          {filteredEmployees
            .filter((emp) => emp.is_active !== false) // Active first
            .map((emp) => (
              <Box
                key={emp.employee_code}
                borderWidth="1px"
                borderRadius="lg"
                p={5}
                bg="white"
                shadow="md"
                cursor="pointer"
                onClick={() => openEmployeeHistory(emp)}
                _hover={{
                  shadow: "xl",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                }}
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Heading size="md">{emp.name}</Heading>
                  <Badge
                    colorScheme={emp.privilege === 14 ? "green" : "blue"}
                    fontSize="0.8em"
                  >
                    {emp.privilege === 14 ? "Admin" : "User"}
                  </Badge>
                </Flex>
                <Text fontSize="sm" mb={1}>
                  <strong>Code:</strong> {emp.employee_code}
                </Text>
                <Text fontSize="sm" mb={1}>
                  <strong>Group:</strong> {emp.group_id || "-"}
                </Text>
                <Text fontSize="sm">
                  <strong>Card:</strong> {emp.card || "-"}
                </Text>


                <Flex gap={2} mt={3} wrap="wrap">
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingEmployee(emp);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPasswordModal(emp);
                    }}
                  >
                    Password
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    isLoading={enrollLoading === emp.employee_code}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnrollFingerprint(emp);
                    }}
                  >
                    Enroll FP
                  </Button>
                </Flex>
              </Box>
            ))}




        </SimpleGrid>


        {/* -------------------- Employee History Drawer -------------------- */}
        <Drawer isOpen={!!selectedEmployeeCode} placement="right" onClose={closeDrawer} size="full">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              Employee History {employeeName && `- ${employeeName}`}

              <Flex gap={2} mt={2} align="center">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    const emp = employees.find((e) => e.employee_code === selectedEmployeeCode);
                    if (emp) openEmployeeHistory(emp);
                  }}
                >
                  Filter
                </Button>
              </Flex>

              <Flex gap={2} mt={2} align="center" wrap="wrap">
                <ButtonGroup size="sm">
                  {(["all", "present", "absent", "late"] as const).map((f) => (
                    <Button
                      key={f}
                      colorScheme={drawerFilterState === f ? "yellow" : "gray"}
                      onClick={() => setDrawerFilterState(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </ButtonGroup>

                {Object.keys(anomalyColors).map((a) => (
                  <Button
                    key={a}
                    colorScheme={drawerSelectedAnomalies.includes(a) ? "blue" : "gray"}
                    size="sm"
                    onClick={() =>
                      setDrawerSelectedAnomalies((prev) =>
                        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                      )
                    }
                  >
                    {a.replace("_", " ")}
                  </Button>
                ))}
              </Flex>
            </DrawerHeader>

            <DrawerBody>
              {historyLoading ? (
                <Spinner size="lg" />
              ) : (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Check-in</Th>
                        <Th>Check-out</Th>
                        <Th>Worked Hours</Th>
                        <Th>Late</Th>
                        <Th>Late Minutes</Th>
                        <Th>Anomalies</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredHistory.map((h) => (
                        <Tr key={h.date}>
                          <Td>{h.date}</Td>
                          <Td>{h.check_in_time?.split("T")[1] ?? "-"}</Td>
                          <Td>{h.check_out_time?.split("T")[1] ?? "-"}</Td>
                          <Td>{h.worked_hours.toFixed(2)}</Td>
                          <Td>{h.is_late ? "Yes" : "No"}</Td>
                          <Td>{h.late_minutes}</Td>
                          <Td>
                            {h.anomalies.map((a) => (
                              <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>
                                {a.replace("_", " ")}
                              </Badge>
                            ))}
                          </Td>
                          <Td>{h.status}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold">Total Worked Hours in That Period:</Text>
                      <Text fontWeight="bold" color="blue.600">
                        {totalPeriodHours.toFixed(2)} h
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {/* -------------------- Add Employee Drawer -------------------- */}
        <Drawer
          isOpen={isAddOpen}
          placement="right"
          onClose={() => setIsAddOpen(false)}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Add New Employee</DrawerHeader>

            <DrawerBody>
              <Flex direction="column" gap={4}>

                <Input
                  placeholder="Employee Code"
                  value={newEmployee.employee_code}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, employee_code: e.target.value })
                  }
                />

                <Input
                  placeholder="Name"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                />

                <Select
                  value={newEmployee.privilege}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, privilege: Number(e.target.value) })
                  }
                >
                  <option value={0}>User</option>
                  <option value={1}>Admin</option>
                </Select>

                <Input
                  placeholder="Group ID"
                  value={newEmployee.group_id}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, group_id: e.target.value })
                  }
                />

                <Input
                  placeholder="Card Number"
                  type="number"
                  value={newEmployee.card}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, card: e.target.value })
                  }
                />

                <Input
                  placeholder="Password"
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password: e.target.value })
                  }
                />

                <Button
                  colorScheme="blue"
                  onClick={handleAddEmployee}
                  isLoading={addLoading}
                >
                  Save Employee
                </Button>

              </Flex>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

      </Box>


      <AlertDialog
        isOpen={!!deletingEmployee}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeletingEmployee(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Employee
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete{" "}
              <strong>{deletingEmployee?.name}</strong>? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeletingEmployee(null)}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteEmployee}
                ml={3}
                isLoading={deleteLoading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* -------------------- Password Modal -------------------- */}
      <Modal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Password for {passwordEmployee?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter new password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSetPassword} isLoading={passwordLoading}>
              Save Password
            </Button>
            <Button variant="ghost" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>

  );

}
