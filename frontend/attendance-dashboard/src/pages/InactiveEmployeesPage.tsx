import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  SimpleGrid,
  Heading,
  Badge,
  Text,
  Flex,
  Spinner,
  Button,
  ButtonGroup,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from "@chakra-ui/react";
import axios from "axios";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import { HamburgerIcon, CloseIcon, SearchIcon } from "@chakra-ui/icons";
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

export default function InactiveEmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toast = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [history, setHistory] = useState<EmployeeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalPeriodHours, setTotalPeriodHours] = useState(0);
  const [totalWeekendHours, setTotalWeekendHours] = useState(0);

  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-01-31");

  const [drawerFilterState, setDrawerFilterState] = useState<
    "all" | "present" | "absent" | "late"
  >("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<
    string[]
  >([]);

  const [search, setSearch] = useState("");
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch = `${emp.name} ${emp.employee_code}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchSearch;
    });
  }, [employees, search]);

  useEffect(() => {
    const fetchInactiveEmployees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/employee/`);
        const inactive = res.data.filter(
          (emp: Employee) => emp.is_active === false,
        );
        setEmployees(inactive);
      } catch (err: any) {
        toast({
          title: "Error fetching employees",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInactiveEmployees();
  }, []);

  const fetchEmployeeHistory = async (emp: Employee) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/employee/${emp.employee_code}/history`,
        { params: { date_from: dateFrom, date_to: dateTo } },
      );
      setHistory(res.data.history || []);
      setTotalPeriodHours(res.data.total_period_hours || 0);
      setTotalWeekendHours(res.data.total_weekend_hours || 0);
      setDrawerFilterState("all");
      setDrawerSelectedAnomalies([]);
    } catch (err: any) {
      toast({
        title: "Error fetching history",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEmployeeClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    fetchEmployeeHistory(emp);
  };

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

        <Box p={5}>
          {/* 🔹 Header + Toggle */}
          <Flex
            justify="space-between"
            align="center"
            mb={6}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Heading>{t("Inactive Employees")}</Heading>

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
          <Flex gap={4} mb={4} flexWrap="wrap">
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
          </Flex>
          {employees.length === 0 ? (
            <Text>{t("No inactive employees found")}.</Text>
          ) : viewMode === "cards" ? (
            /* 🔹 CARDS VIEW */
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
              {filteredEmployees.map((emp) => (
                <Box
                  key={emp.employee_code}
                  borderWidth="1px"
                  borderRadius="lg"
                  p={5}
                  bg="white"
                  shadow="sm"
                  cursor="pointer"
                  _hover={{
                    shadow: "lg",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleEmployeeClick(emp)}
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
                    <strong>{t("Code")}:</strong> {emp.employee_code}
                  </Text>
                  <Text fontSize="sm" mb={1}>
                    <strong>{t("Group")}:</strong> {emp.group_id || "-"}
                  </Text>
                  <Text fontSize="sm">
                    <strong>{t("Card")}:</strong> {emp.card || "-"}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            /* 🔹 TABLE VIEW */
            <TableContainer bg="white" borderRadius="lg" shadow="sm">
              <Table variant="simple">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>{t("Name")}</Th>
                    <Th>{t("Code")}</Th>
                    <Th>{t("Privilege")}</Th>
                    <Th>{t("Group")}</Th>
                    <Th>{t("Card")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {employees.map((emp) => (
                    <Tr
                      key={emp.employee_code}
                      onClick={() => handleEmployeeClick(emp)}
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                    >
                      <Td fontWeight="medium">{emp.name}</Td>
                      <Td>{emp.employee_code}</Td>
                      <Td>
                        <Badge
                          colorScheme={emp.privilege === 1 ? "green" : "blue"}
                        >
                          {emp.privilege === 1 ? t("Admin") : t("User")}
                        </Badge>
                      </Td>
                      <Td>{emp.group_id || "-"}</Td>
                      <Td>{emp.card || "-"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* -------------------- Employee History Drawer -------------------- */}
      <Drawer
        isOpen={!!selectedEmployee}
        placement="right"
        onClose={() => setSelectedEmployee(null)}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {t("Employee History")}{" "}
            {selectedEmployee && `- ${selectedEmployee.name}`}
            {/* Date filter */}
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
                  if (selectedEmployee) fetchEmployeeHistory(selectedEmployee);
                }}
              >
                {t("Filter")}
              </Button>
            </Flex>
            {/* Status & anomaly filters */}
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
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {/* Summary box */}
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
                      <Text fontWeight="bold">{t("Total Weekend Hours")}:</Text>
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
    </Box>
  );
}
