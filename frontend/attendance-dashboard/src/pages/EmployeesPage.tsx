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
import { useAuth } from "../context/AuthContext";
import { ManualPunchModal } from "../components/AttendanceModals";

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
  fingerprint_count?: number;
  department?: string;
  password?: string;
  remote_start_date?: string | null;
  remote_end_date?: string | null;
}

interface DeviceUser {
  uid: number;
  user_id: string;
  name: string;
  privilege: number;
  card?: number;
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

import { useTranslation } from "react-i18next";

export default function EmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [privilege, setPrivilege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [departments, setDepartments] = useState<string[]>([
    "usine",
    "administration",
  ]);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  // -------------------- History Drawer State --------------------
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<
    string | null
  >(null);
  const [employeeName, setEmployeeName] = useState("");
  const [history, setHistory] = useState<EmployeeHistoryItem[]>([]);
  const [totalPeriodHours, setTotalPeriodHours] = useState(0);
  const [totalWeekendHours, setTotalWeekendHours] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-01-31");

  const [drawerFilterState, setDrawerFilterState] = useState<
    "all" | "present" | "absent" | "late"
  >("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<
    string[]
  >([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employee_code: "",
    name: "",
    privilege: 0,
    group_id: "",
    card: "",
    password: "",
    department: "usine",
  });

  const [addLoading, setAddLoading] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const cancelRef = useRef<HTMLButtonElement>(null);

  // -------------------- Password & Enroll State --------------------
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordEmployee, setPasswordEmployee] = useState<Employee | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const toast = useToast();

  // -------------------- Remote Work State --------------------
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [remoteEmployee, setRemoteEmployee] = useState<Employee | null>(null);
  const [remoteStart, setRemoteStart] = useState("");
  const [remoteEnd, setRemoteEnd] = useState("");
  const [remoteLoading, setRemoteLoading] = useState(false);

  const openRemoteModal = (emp: Employee) => {
    setRemoteEmployee(emp);
    setRemoteStart(emp.remote_start_date || "");
    setRemoteEnd(emp.remote_end_date || "");
    setIsRemoteOpen(true);
  };

  const handleUpdateRemote = async () => {
    if (!remoteEmployee) return;
    setRemoteLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/employee/${remoteEmployee.employee_code}/remote-config`,
        null,
        {
          params: {
            remote_start_date: remoteStart || null,
            remote_end_date: remoteEnd || null,
          },
        },
      );
      toast({
        title: t("Remote Work Updated"),
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsRemoteOpen(false);

      setEmployees((prev) =>
        prev.map((e) =>
          e.employee_code === remoteEmployee.employee_code
            ? {
                ...e,
                remote_start_date: remoteStart || null,
                remote_end_date: remoteEnd || null,
              }
            : e,
        ),
      );
    } catch (err: any) {
      toast({
        title: t("Update failed"),
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRemoteLoading(false);
    }
  };

  const getDefaultDepartment = (selectedPrivilege: number) => {
    if (selectedPrivilege === 14 && departments.includes("administration")) {
      return "administration";
    }
    return departments.includes("usine") ? "usine" : departments[0] || "usine";
  };

  const resolveDeviceUid = async (employeeCode: string): Promise<number> => {
    const res = await axios.get<DeviceUser[]>(`${BASE_URL}/device/users`);
    const deviceUser = res.data.find(
      (u) => String(u.user_id) === String(employeeCode),
    );
    if (!deviceUser) {
      throw new Error(`User ${employeeCode} not found on device`);
    }
    return deviceUser.uid;
  };

  const handleEnrollFingerprint = async (emp: Employee) => {
    setEnrollLoading(emp.employee_code);
    try {
      const deviceUid = await resolveDeviceUid(emp.employee_code);
      await axios.post(`${BASE_URL}/device/users/${deviceUid}/enroll`);
      const pendingToastId = `pending-enroll-${emp.employee_code}`;
      toast({
        id: pendingToastId,
        title: t("Enrollment Mode Triggered"),
        description:
          "L'employe doit mettre son doigt pour enregistrer son empreinte.",
        status: "warning",
        duration: null,
        isClosable: true,
      });
      pollFingerprintStatus(deviceUid, emp.employee_code, pendingToastId);
    } catch (err: any) {
      toast({
        title: t("Enrollment Failed"),
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
      const res = await axios.post(
        `${BASE_URL}/device/users/${passwordEmployee.employee_code}/set-password`,
        null,
        {
          params: { password: newPassword },
        },
      );
      toast({
        title: t("Password Set"),
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsPasswordOpen(false);
      setPasswordEmployee(null);
    } catch (err: any) {
      toast({
        title: t("Failed to set password"),
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const pollFingerprintStatus = async (
    uid: number,
    employeeCode: string,
    pendingToastId?: string,
  ) => {
    const startTime = Date.now();
    const timeout = 60000; // 60 seconds
    const interval = 2000; // 2 seconds

    const check = async () => {
      if (Date.now() - startTime > timeout) {
        if (pendingToastId) {
          toast.close(pendingToastId);
        }
        toast({
          title: "Enrollment check timed out",
          description:
            "Could not verify fingerprint enrollment. Please check on the device.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      try {
        const res = await axios.get(
          `${BASE_URL}/device/users/${uid}/fingerprint-status`,
        );
        if (res.data.status === "enrolled" || res.data.fingerprint_count > 0) {
          setEmployees((prev) =>
            prev.map((e) =>
              e.employee_code === String(employeeCode)
                ? { ...e, fingerprint_count: res.data.fingerprint_count }
                : e,
            ),
          );
          if (pendingToastId) {
            toast.close(pendingToastId);
          }
          // Ensure the new fingerprint count is saved to the DB
          await axios.post(`${BASE_URL}/device/sync/employees`);
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
      await axios.post(`${BASE_URL}/device/users/create`, {
        uid: Number(newEmployee.employee_code),
        name: newEmployee.name,
        privilege: newEmployee.privilege,
        password: newEmployee.password,
        department: newEmployee.department,
      });
      await axios.post(`${BASE_URL}/device/sync/employees`);

      const createdUid = Number(newEmployee.employee_code);

      toast({
        title: t("User Created"),
        description:
          "User created successfully. You can now enroll fingerprint.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      const pendingToastId = `pending-enroll-${createdUid}`;
      toast({
        id: pendingToastId,
        title: t("Enrollment Mode Triggered"),
        description:
          "L'employe doit mettre son doigt pour enregistrer son empreinte.",
        status: "warning",
        duration: null,
        isClosable: true,
      });
      pollFingerprintStatus(createdUid, String(createdUid), pendingToastId);

      setIsAddOpen(false);

      // Refresh employees list
      const empRes = await axios.get(`${BASE_URL}/employee/`);
      setEmployees(empRes.data);

      // Trigger another fetch after a short delay to ensure everything is settled
      setTimeout(async () => {
        const refreshRes = await axios.get(`${BASE_URL}/employee/`);
        setEmployees(refreshRes.data);
      }, 2000);

      // Reset form
      setNewEmployee({
        employee_code: "",
        name: "",
        privilege: 0,
        group_id: "",
        card: "",
        password: "",
        department: getDefaultDepartment(0),
      });
    } catch (err: any) {
      toast({
        title: t("Error creating employee"),
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
      await axios.delete(
        `${BASE_URL}/device/users/${deletingEmployee.employee_code}`,
      );

      // 2️⃣ Resync device
      await axios.post(`${BASE_URL}/device/sync/employees`);

      // 3️⃣ Remove from frontend list
      setEmployees((prev) =>
        prev.filter((e) => e.employee_code !== deletingEmployee.employee_code),
      );

      setDeletingEmployee(null);
    } catch (err) {
      console.error("Error deleting employee:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    setEditLoading(true);

    try {
      const res = await axios.put(
        `${BASE_URL}/device/users/${editingEmployee.employee_code}`,
        null,
        {
          params: {
            name: editingEmployee.name,
            privilege: editingEmployee.privilege,
            department: editingEmployee.department,
          },
        },
      );

      toast({
        title: t("Employee Updated"),
        description: res.data.message || "Employee updated successfully.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // Update frontend list immediately (optimistic update)
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employee_code === editingEmployee.employee_code
            ? editingEmployee
            : emp,
        ),
      );
      await axios.post(`${BASE_URL}/device/sync/employees`);

      setIsEditOpen(false);
      setEditingEmployee(null);
    } catch (err: any) {
      toast({
        title: t("Update failed"),
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const [employeesRes, departmentsRes] = await Promise.all([
          axios.get(`${BASE_URL}/employee/`),
          axios.get(`${BASE_URL}/attendance/dashboard/departments`),
        ]);
        setEmployees(employeesRes.data);
        const fetchedDepartments = Array.isArray(
          departmentsRes.data?.departments,
        )
          ? departmentsRes.data.departments
          : [];
        if (fetchedDepartments.length > 0) {
          setDepartments(fetchedDepartments);
        }
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
      const matchDepartment =
        department === "all" || emp.department === department;
      return matchSearch && matchPrivilege && matchDepartment;
    });
  }, [employees, search, privilege, department]);

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
        setTotalWeekendHours(res.data.total_weekend_hours || 0);
        setDrawerFilterState("all");
        setDrawerSelectedAnomalies([]);
      })
      .catch((err) => console.error("Employee history fetch error:", err))
      .finally(() => setHistoryLoading(false));
  };

  const closeDrawer = () => setSelectedEmployeeCode(null);

  const openManualCheckoutFromHistory = (historyDate: string) => {
    if (!selectedEmployeeCode) return;
    setManualDate(historyDate);
    setIsManualOpen(true);
  };

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
            <Heading size="md" pl="10">
              {t("Employees")}
            </Heading>
            <Text fontSize="sm" color="gray.500" pl="10">
              {filteredEmployees.filter((emp) => emp.is_active === true).length}{" "}
              {t("employee(s) found")}
            </Text>
          </Box>
          <Button
            colorScheme="blue"
            onClick={async () => {
              try {
                const res = await axios.get(`${BASE_URL}/employee/next-code`);
                setNewEmployee((prev) => ({
                  ...prev,
                  employee_code: res.data.next_code,
                  department: getDefaultDepartment(prev.privilege),
                }));
                setIsAddOpen(true);
              } catch (err) {
                console.error("Error fetching next employee code", err);
                setIsAddOpen(true);
              }
            }}
            mr={10}
          >
            + {t("Add Employee")}
          </Button>
        </Flex>
        <AddEmployeeModal isOpen={isOpen} onClose={onClose} />

        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <Flex gap={4} align="center">
            <InputGroup maxW="260px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder={t("Search employee...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>

            <Select
              maxW="200px"
              value={privilege}
              onChange={(e) => setPrivilege(e.target.value)}
            >
              <option value="all">{t("All privileges")}</option>
              <option value="0">{t("User")}</option>
              <option value="14">{t("Admin")}</option>
            </Select>

            <Select
              maxW="200px"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="all">{t("All departments")}</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </Flex>

          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              colorScheme={viewMode === "cards" ? "blue" : "gray"}
              onClick={() => setViewMode("cards")}
            >
              {t("Cards")}
            </Button>
            <Button
              colorScheme={viewMode === "table" ? "blue" : "gray"}
              onClick={() => setViewMode("table")}
            >
              {t("Table")}
            </Button>
          </ButtonGroup>
        </Flex>

        {viewMode === "cards" ? (
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
                      {emp.privilege === 14 ? t("Admin") : t("User")}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" mb={1}>
                    <strong>{t("Code")}:</strong> {emp.employee_code}
                  </Text>

                  <Text fontSize="sm" mb={1}>
                    <strong>{t("Department")}:</strong>{" "}
                    {t(emp.department || "usine")}
                  </Text>
                  <Text fontSize="sm">
                    <strong>{t("Card")}:</strong> {emp.card || "-"}
                  </Text>
                  <Text fontSize="sm">
                    <strong>{t("Fingerprint")}:</strong>{" "}
                    {emp.fingerprint_count > 0
                      ? `${emp.fingerprint_count} ${t("enrolled")}`
                      : t("None")}
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
                      {t("Delete")}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPasswordModal(emp);
                      }}
                    >
                      {t("Password")}
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
                      {emp.fingerprint_count > 0
                        ? t("Add Another Fingerprint")
                        : t("Enroll Fingerprint")}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEmployee({ ...emp });
                        setIsEditOpen(true);
                      }}
                    >
                      {t("Edit")}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRemoteModal(emp);
                      }}
                    >
                      {t("Remote Config")}
                    </Button>
                  </Flex>
                </Box>
              ))}
          </SimpleGrid>
        ) : (
          <Box bg="white" borderRadius="lg" shadow="md" overflowX="auto">
            <Table size="sm">
              <Thead bg="gray.100">
                <Tr>
                  <Th>{t("Name")}</Th>
                  <Th>{t("Code")}</Th>
                  <Th>{t("Privilege")}</Th>
                  <Th>{t("Department")}</Th>
                  {/* <Th>{t("Group")}</Th> */}
                  <Th>{t("Card")}</Th>

                  <Th>{t("Fingerprint")}</Th>
                  <Th>{t("Actions")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEmployees
                  .filter((emp) => emp.is_active !== false)
                  .map((emp) => (
                    <Tr
                      key={emp.employee_code}
                      _hover={{ bg: "gray.50", cursor: "pointer" }}
                      onClick={() => openEmployeeHistory(emp)}
                    >
                      <Td fontWeight="semibold">{emp.name}</Td>
                      <Td>{emp.employee_code}</Td>
                      <Td>
                        <Badge
                          colorScheme={emp.privilege === 14 ? "green" : "blue"}
                        >
                          {emp.privilege === 14 ? t("Admin") : t("User")}
                        </Badge>
                      </Td>
                      <Td>{t(emp.department || "usine")}</Td>
                      {/* <Td>{emp.group_id || "-"}</Td> */}
                      <Td>{emp.card || "-"}</Td>
                      <Td>
                        {emp.fingerprint_count > 0
                          ? `${emp.fingerprint_count} ${t("enrolled")}`
                          : t("None")}
                      </Td>

                      <Td>
                        <Flex gap={2} wrap="wrap">
                          {/* Delete */}
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingEmployee(emp);
                            }}
                          >
                            {t("Delete")}
                          </Button>

                          {/* Password */}
                          <Button
                            size="xs"
                            colorScheme="teal"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPasswordModal(emp);
                            }}
                          >
                            {t("Password")}
                          </Button>

                          {/* Enroll Fingerprint */}
                          <Button
                            size="xs"
                            colorScheme="orange"
                            isLoading={enrollLoading === emp.employee_code}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnrollFingerprint(emp);
                            }}
                          >
                            {emp.fingerprint_count > 0
                              ? t("Add Another Fingerprint")
                              : t("Enroll Fingerprint")}
                          </Button>

                          {/* Edit */}
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEmployee({ ...emp });
                              setIsEditOpen(true);
                            }}
                          >
                            {t("Edit")}
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="purple"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRemoteModal(emp);
                            }}
                          >
                            {t("Remote Config")}
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* -------------------- Employee History Drawer -------------------- */}
        <Drawer
          isOpen={!!selectedEmployeeCode}
          placement="right"
          onClose={closeDrawer}
          size="full"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              {t("Employee History")} {employeeName && `- ${employeeName}`}
              <Flex gap={2} mt={2} align="center">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const emp = employees.find(
                      (e) => e.employee_code === selectedEmployeeCode,
                    );
                    if (emp) openEmployeeHistory(emp);
                  }}
                >
                  {t("Filter")}
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
                      {t(f.charAt(0).toUpperCase() + f.slice(1))}
                    </Button>
                  ))}
                </ButtonGroup>

                {Object.keys(anomalyColors).map((a) => (
                  <Button
                    key={a}
                    colorScheme={
                      drawerSelectedAnomalies.includes(a) ? "blue" : "gray"
                    }
                    size="sm"
                    onClick={() =>
                      setDrawerSelectedAnomalies((prev) =>
                        prev.includes(a)
                          ? prev.filter((x) => x !== a)
                          : [...prev, a],
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
                        <Th>{t("Date")}</Th>
                        <Th>{t("Check-in")}</Th>
                        <Th>{t("Check-out")}</Th>
                        <Th>{t("Worked Hours")}</Th>
                        <Th>{t("Late")}</Th>
                        <Th>{t("Late Minutes")}</Th>
                        <Th>{t("Anomalies")}</Th>
                        <Th>{t("Status")}</Th>
                        <Th>{t("Actions")}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredHistory.map((h) => (
                        <Tr key={h.date}>
                          <Td>{h.date}</Td>
                          <Td>{h.check_in_time?.split("T")[1] ?? "-"}</Td>
                          <Td>{h.check_out_time?.split("T")[1] ?? "-"}</Td>
                          <Td>{h.worked_hours.toFixed(2)}</Td>
                          <Td>{h.is_late ? t("Yes") : t("No")}</Td>
                          <Td>{h.late_minutes}</Td>
                          <Td>
                            {h.anomalies.map((a) => (
                              <Badge
                                key={a}
                                colorScheme={anomalyColors[a] || "gray"}
                                mr={1}
                              >
                                {a.replace("_", " ")}
                              </Badge>
                            ))}
                          </Td>
                          <Td>{h.status}</Td>
                          <Td>
                            {(h.anomalies.includes("entree_sans_sortie") ||
                              (!!h.check_in_time && !h.check_out_time)) && (
                              <Button
                                size="xs"
                                colorScheme="orange"
                                onClick={() =>
                                  openManualCheckoutFromHistory(h.date)
                                }
                              >
                                {t("Add manual check-out")}
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>

                  <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                    <Flex direction="column" gap={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          {t("Total Worked Hours in That Period")}:
                        </Text>
                        <Text fontWeight="bold" color="blue.600">
                          {totalPeriodHours.toFixed(2)} h
                        </Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          {t("Total Weekend Hours")}:
                        </Text>
                        <Text fontWeight="bold" color="orange.600">
                          {totalWeekendHours.toFixed(2)} h
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>
                </Box>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        <ManualPunchModal
          isOpen={isManualOpen}
          onClose={() => setIsManualOpen(false)}
          employee={
            selectedEmployeeCode
              ? { id: Number(selectedEmployeeCode), name: employeeName || "" }
              : null
          }
          date={manualDate}
          initialEventType="check_out"
          onSuccess={() => {
            const emp = employees.find(
              (e) => e.employee_code === selectedEmployeeCode,
            );
            if (emp) {
              openEmployeeHistory(emp);
            }
          }}
        />
        {/* -------------------- Add Employee Drawer -------------------- */}
        <Drawer
          isOpen={isAddOpen}
          placement="right"
          onClose={() => setIsAddOpen(false)}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>{t("Add Employee")}</DrawerHeader>

            <DrawerBody>
              <Flex direction="column" gap={4}>
                <Input
                  placeholder={t("Code")}
                  value={newEmployee.employee_code}
                  isReadOnly
                  bg="gray.100"
                />

                <Input
                  placeholder={t("Name")}
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                />

                <Select
                  value={newEmployee.privilege}
                  onChange={(e) => {
                    const selectedPrivilege = Number(e.target.value);
                    setNewEmployee({
                      ...newEmployee,
                      privilege: selectedPrivilege,
                      department: getDefaultDepartment(selectedPrivilege),
                    });
                  }}
                >
                  <option value={0}>{t("User")}</option>
                  <option value={14}>{t("Admin")}</option>
                </Select>

                <Select
                  value={newEmployee.department}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      department: e.target.value,
                    })
                  }
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {t(dept)}
                    </option>
                  ))}
                </Select>

                <Input
                  placeholder={t("Group")}
                  value={newEmployee.group_id}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, group_id: e.target.value })
                  }
                />

                <Input
                  placeholder={t("Card")}
                  type="number"
                  value={newEmployee.card}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, card: e.target.value })
                  }
                />
                <Input
                  placeholder={t("Password")}
                  type="password"
                  value={newEmployee.password}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^\d*$/.test(value)) {
                      setNewEmployee({ ...newEmployee, password: value });
                    }
                  }}
                />

                <Button
                  colorScheme="blue"
                  onClick={handleAddEmployee}
                  isLoading={addLoading}
                >
                  {t("Save Employee")}
                </Button>
              </Flex>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {/* -------------------- Edit Employee Drawer -------------------- */}
        <Drawer
          isOpen={isEditOpen}
          placement="right"
          onClose={() => setIsEditOpen(false)}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>{t("Edit")}</DrawerHeader>

            <DrawerBody>
              <Flex direction="column" gap={4}>
                <Input
                  placeholder={t("Code")}
                  value={editingEmployee?.employee_code}
                  isReadOnly
                  bg="gray.100"
                />

                <Input
                  placeholder={t("Name")}
                  value={editingEmployee?.name}
                  onChange={(e) => {
                    if (editingEmployee) {
                      setEditingEmployee({
                        ...editingEmployee,
                        name: e.target.value,
                      } as Employee);
                    }
                  }}
                />

                <Select
                  value={editingEmployee?.privilege}
                  onChange={(e) => {
                    if (editingEmployee) {
                      const selectedPrivilege = Number(e.target.value);
                      setEditingEmployee({
                        ...editingEmployee,
                        privilege: selectedPrivilege,
                        department: getDefaultDepartment(selectedPrivilege),
                      } as Employee);
                    }
                  }}
                >
                  <option value={0}>{t("User")}</option>
                  <option value={14}>{t("Admin")}</option>
                </Select>

                <Select
                  value={editingEmployee?.department || getDefaultDepartment(0)}
                  onChange={(e) => {
                    if (editingEmployee) {
                      setEditingEmployee({
                        ...editingEmployee,
                        department: e.target.value,
                      } as Employee);
                    }
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {t(dept)}
                    </option>
                  ))}
                </Select>

                <Input
                  placeholder={t("Group")}
                  value={editingEmployee?.group_id}
                  onChange={(e) => {
                    if (editingEmployee) {
                      setEditingEmployee({
                        ...editingEmployee,
                        group_id: e.target.value,
                      } as Employee);
                    }
                  }}
                />

                <Input
                  placeholder={t("Card")}
                  type="number"
                  value={editingEmployee?.card}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      card: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder={t("Password")}
                  type="password"
                  value={editingEmployee?.password}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => {
                    const value = e.target.value;

                    if (/^\d*$/.test(value)) {
                      setEditingEmployee({
                        ...editingEmployee,
                        password: value,
                      });
                    }
                  }}
                />

                <Button
                  colorScheme="blue"
                  onClick={handleUpdateEmployee}
                  isLoading={editLoading}
                >
                  {t("Update Employee")}
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
              {t("Delete")}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t("Are you sure you want to delete")}{" "}
              <strong>{deletingEmployee?.name}</strong>?{" "}
              {t("This action cannot be undone")}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeletingEmployee(null)}>
                {t("Cancel")}
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteEmployee}
                ml={3}
                isLoading={deleteLoading}
              >
                {t("Delete")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* -------------------- Password Modal -------------------- */}
      <Modal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {t("Password")} - {passwordEmployee?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* <Input
              placeholder={t("Enter new password")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            /> */}
            <Input
              placeholder={t("Enter new password")}
              type="password"
              value={newPassword}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => {
                const value = e.target.value;

                if (/^\d*$/.test(value)) {
                  setNewPassword(value);
                }
              }}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSetPassword}
              isLoading={passwordLoading}
            >
              {t("Save Password")}
            </Button>
            <Button variant="ghost" onClick={() => setIsPasswordOpen(false)}>
              {t("Cancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* -------------------- Remote Config Modal -------------------- */}
      <Modal isOpen={isRemoteOpen} onClose={() => setIsRemoteOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {t("Remote Config")} - {remoteEmployee?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex direction="column" gap={4}>
              <Box>
                <Text mb={2} fontWeight="bold">
                  {t("Start Date")}
                </Text>
                <Input
                  type="date"
                  value={remoteStart}
                  onChange={(e) => setRemoteStart(e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2} fontWeight="bold">
                  {t("End Date")}
                </Text>
                <Input
                  type="date"
                  value={remoteEnd}
                  onChange={(e) => setRemoteEnd(e.target.value)}
                />
              </Box>
              <Text fontSize="sm" color="gray.500">
                {t(
                  "Leave both empty to disable remote work for this employee. If only start date is provided, it applies indefinitely from that date.",
                )}
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleUpdateRemote}
              isLoading={remoteLoading}
            >
              {t("Save")}
            </Button>
            <Button variant="ghost" onClick={() => setIsRemoteOpen(false)}>
              {t("Cancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
