import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  VStack,
  ButtonGroup,
  Button,
  HStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Flex,
  Text
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// -------------------- Types --------------------
type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
  worked_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
};

type DashboardData = {
  date: string;
  employees: Employee[];
};

type EmployeeHistoryItem = {
  date: string;
  check_in_time: string;
  check_out_time: string;
  worked_hours: number;
  expected_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
  status: string;
};

// -------------------- Map Anomalies Colors --------------------
const anomalyColors: Record<string, string> = {
  retard: "orange",
  early_departure: "red",
  incomplete_day: "yellow",
  entree_sans_sortie: "purple",
  sortie_sans_entree: "teal",
};

// -------------------- Component --------------------
export default function EmployeesToday() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlFilter = params.get("filter") as string | null;

  // Status filter
  const [filterState, setFilterState] = useState<"all" | "present" | "absent" | "late">(urlFilter as any ?? "all");

  // Anomalies filter
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
  const toggleAnomaly = (anom: string) => {
    setSelectedAnomalies(prev =>
      prev.includes(anom) ? prev.filter(a => a !== anom) : [...prev, anom]
    );
  };

  // Drawer state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [history, setHistory] = useState<EmployeeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openDrawer = (empId: number) => {
    setSelectedEmployeeId(empId);
    fetchEmployeeHistory(empId);
  };

  const closeDrawer = () => {
    setSelectedEmployeeId(null);
    setHistory([]);
  };

  const fetchEmployeeHistory = async (empId: number) => {
    setHistoryLoading(true);
    const dateFrom = "2026-01-01";
    const dateTo = "2026-01-31";
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/employee/${empId}/history?date_from=${dateFrom}&date_to=${dateTo}`
      );
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
    setHistoryLoading(false);
  };

  // -------------------- Fetch dashboard --------------------
  useEffect(() => {
    const today = "2026-01-26";
    fetch(`http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${today}`)
      .then(res => res.json())
      .then(data => {
        setDashboard(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  // -------------------- Filters --------------------
  const filteredEmployees = dashboard?.employees
    .filter((emp, idx, arr) => arr.findIndex(e => e.employee_id === emp.employee_id) === idx)
    .filter(emp => {
      if (filterState === "present") return emp.status === "present";
      if (filterState === "absent") return emp.status === "absent";
      if (filterState === "late") return emp.is_late;
      return true;
    })
    .filter(emp => {
      if (selectedAnomalies.length === 0) return true;
      return emp.anomalies.some(a => selectedAnomalies.includes(a));
    });

  if (loading) return <Spinner size="lg" />;

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />
        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={4}>
            {filterState === "present" ? "Present Employees" :
             filterState === "absent" ? "Absent Employees" :
             filterState === "late" ? "Late Employees" :
             "All Employees Today"}
          </Heading>
          <Text color="gray.500" mb={6}>Date: 2026-01-26</Text>

          {/* ---------- Filters ---------- */}
          <Flex mb={4} align="center" justify="space-between" wrap="wrap" gap={4}>
            <ButtonGroup>
              {["all", "present", "absent", "late"].map(f => (
                <Button
                  key={f}
                  colorScheme={filterState === f ? "yellow" : "gray"}
                  onClick={() => setFilterState(f as any)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </ButtonGroup>

            <HStack spacing={2}>
              <Button
                colorScheme={selectedAnomalies.length === 0 ? "yellow" : "gray"}
                size="sm"
                onClick={() => setSelectedAnomalies([])}
              >
                All Anomalies
              </Button>
              {Object.keys(anomalyColors).map(anom => (
                <Button
                  key={anom}
                  colorScheme={selectedAnomalies.includes(anom) ? "blue" : "gray"}
                  size="sm"
                  onClick={() => toggleAnomaly(anom)}
                >
                  {anom.replace("_", " ")}
                </Button>
              ))}
            </HStack>
          </Flex>

          {/* ---------- Employee Table ---------- */}
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Check-in</Th>
                <Th>Check-out</Th>
                <Th>Worked Hours</Th>
                <Th>Late</Th>
                <Th>Late Minutes</Th>
                <Th>Anomalies</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEmployees?.map(emp => (
                <Tr
                  key={emp.employee_id}
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => openDrawer(emp.employee_id)}
                >
                  <Td>{emp.employee_name}</Td>
                  <Td>
                    <Badge colorScheme={emp.status === "present" ? "green" : "red"}>{emp.status}</Badge>
                  </Td>
                  <Td>{emp.check_in_time ? emp.check_in_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.check_out_time ? emp.check_out_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
                  <Td>{emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}</Td>
                  <Td>{emp.late_minutes || "-"}</Td>
                  <Td>
                    {emp.anomalies.length
                      ? emp.anomalies.map(a => (
                          <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>
                            {a.replace("_", " ")}
                          </Badge>
                        ))
                      : "-"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Container>

        {/* ---------- Employee History Drawer ---------- */}
        <Drawer isOpen={!!selectedEmployeeId} placement="right" onClose={closeDrawer} size="full">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Employee History</DrawerHeader>
            <DrawerBody>
              {historyLoading ? (
                <Spinner size="lg" />
              ) : (
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
                    {history.map(h => (
                      <Tr key={h.date}>
                        <Td>{h.date}</Td>
                        <Td>{h.check_in_time?.split("T")[1] ?? "-"}</Td>
                        <Td>{h.check_out_time?.split("T")[1] ?? "-"}</Td>
                        <Td>{h.worked_hours.toFixed(2)}</Td>
                        <Td>{h.is_late ? "Yes" : "No"}</Td>
                        <Td>{h.late_minutes}</Td>
                        <Td>
                          {h.anomalies.map(a => (
                            <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>
                              {a.replace("_"," ")}
                            </Badge>
                          ))}
                        </Td>
                        <Td>{h.status}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </VStack>
    </Box>
  );
}
