
import { useEffect, useMemo, useState } from "react"; import {
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
} from "@chakra-ui/react";
import { SearchIcon, HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/employee/`);
        setEmployees(res.data);
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
              {filteredEmployees.length} employee(s) found
            </Text>
          </Box>
        </Flex>

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
            <option value="1">Admin</option>
          </Select>
        </Flex>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
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
      </Box>
    </Box>
  );
}
