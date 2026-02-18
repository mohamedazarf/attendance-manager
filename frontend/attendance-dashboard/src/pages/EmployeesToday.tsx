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
  Text,
  Flex,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Input,
  IconButton
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";


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

type EmployeeHistory = {
  date: string;
  check_in_time: string;
  check_out_time: string;
  worked_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
  status: string; // "normal", "absent", "anomaly"*
  total_period_hours: number;
};

type DashboardData = {
  date: string;
  employees: Employee[];
};

// -------------------- Couleurs anomalies --------------------
const anomalyColors: Record<string, string> = {
  retard: "orange",
  early_departure: "red",
  incomplete_day: "yellow",
  entree_sans_sortie: "purple",
  sortie_sans_entree: "teal",
};

function getCurrentDate() {
  // Create a new Date object for the current date and time
  const today = new Date();

  // Get individual components
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');

  // Format as YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate; // Returns: "2026-02-18" (for example)
}

export default function EmployeesToday() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);



  const params = new URLSearchParams(location.search);
  const urlFilter = params.get("filter") as "all" | "present" | "absent" | "late" | null;

  const [filterState, setFilterState] = useState<"all" | "present" | "absent" | "late">(urlFilter || "all");



  // -------------------- Filtres principaux --------------------

  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
  const toggleAnomaly = (anom: string) => {
    setSelectedAnomalies(prev =>
      prev.includes(anom) ? prev.filter(a => a !== anom) : [...prev, anom]
    );
  };

  // -------------------- Historique employé --------------------
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [history, setHistory] = useState<EmployeeHistory[]>([]);
  const [totalPeriodHours, setTotalPeriodHours] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Dates filtre pour l’historique
  const [dateFrom, setDateFrom] = useState<string>("2026-01-01");
  const [dateTo, setDateTo] = useState<string>("2026-01-31");

  // -------------------- Filtres drawer --------------------
  const [drawerFilterState, setDrawerFilterState] = useState<"all" | "present" | "absent" | "late">("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<string[]>([]);

  // -------------------- Fetch dashboard --------------------
  useEffect(() => {
    const today = getCurrentDate();
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

  // -------------------- Filtrer les employés --------------------
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

  // -------------------- Afficher l’historique --------------------
  const openEmployeeHistory = (employee_id: number) => {
    setSelectedEmployeeId(employee_id);
    setHistoryLoading(true);

    fetch(`http://127.0.0.1:8000/api/v1/employee/${employee_id}/history?date_from=${dateFrom}&date_to=${dateTo}`)
      .then(res => res.json())
      .then(data => {
        setEmployeeName(data.employee_name);
        setHistory(data.history);
        setTotalPeriodHours(data.total_period_hours);
        console.log("Employee history:", data);
        setHistoryLoading(false);
        setDrawerFilterState("all");
        setDrawerSelectedAnomalies([]);
      })
      .catch(err => {
        console.error("Employee history fetch error:", err);
        setHistoryLoading(false);
      });
  };

  const closeDrawer = () => setSelectedEmployeeId(null);

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600} // above sidebar
      />
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />
        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={4}>All Employees Today</Heading>
          <Text color="gray.500" mb={6}>Date:{dashboard?.date} </Text>

          {/* -------------------- Filtres employés -------------------- */}
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
              {Object.keys(anomalyColors).map(a => (
                <Button
                  key={a}
                  colorScheme={selectedAnomalies.includes(a) ? "blue" : "gray"}
                  size="sm"
                  onClick={() => toggleAnomaly(a)}
                >
                  {a.replace("_", " ")}
                </Button>
              ))}
            </HStack>
          </Flex>

          {/* -------------------- Table employés -------------------- */}
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Check-in</Th>
                <Th>Check-out</Th>
                <Th bg={"gray.500"} fontWeight={"bold"} color={"white"}>Worked Hours</Th>
                <Th>Late</Th>
                <Th>Late Minutes</Th>
                <Th>Anomalies</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEmployees?.map(emp => (
                <Tr key={emp.employee_id} cursor="pointer" _hover={{ bg: "gray.100" }}
                  onClick={() => openEmployeeHistory(emp.employee_id)}>
                  <Td>{emp.employee_name}</Td>
                  <Td>
                    <Badge colorScheme={emp.status === "present" ? "green" : "red"}>{emp.status}</Badge>
                  </Td>
                  <Td>{emp.check_in_time?.split("T")[1] ?? "-"}</Td>
                  <Td>{emp.check_out_time?.split("T")[1] ?? "-"}</Td>
                  <Td border="2px solid" borderColor="gray.300" boxShadow="inset 0 1px 2px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.08)" bg="white">{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
                  <Td>{emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}</Td>
                  <Td>{emp.late_minutes || "-"}</Td>
                  <Td>
                    {emp.anomalies.map(a => (
                      <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>{a.replace("_", " ")}</Badge>
                    ))}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* -------------------- Employee History Drawer -------------------- */}
          <Drawer isOpen={!!selectedEmployeeId} placement="right" onClose={closeDrawer} size="full">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                Employee History  {employeeName && `- ${employeeName}`}

                {/* -------------------- Ligne 1 : Dates + Filter -------------------- */}
                <Flex gap={2} mt={2} align="center">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  <Button size="sm" onClick={() => selectedEmployeeId && openEmployeeHistory(selectedEmployeeId)}>
                    Filter
                  </Button>
                </Flex>

                {/* -------------------- Ligne 2 : Status + Anomalies -------------------- */}
                <Flex gap={2} mt={2} align="center" wrap="wrap">
                  {/* Status filters */}
                  <ButtonGroup size="sm">
                    {["all", "present", "absent", "late"].map(f => (
                      <Button
                        key={f}
                        colorScheme={drawerFilterState === f ? "yellow" : "gray"}
                        onClick={() => setDrawerFilterState(f as any)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </ButtonGroup>

                  {/* Anomaly filters */}
                  {Object.keys(anomalyColors).map(a => (
                    <Button
                      key={a}
                      colorScheme={drawerSelectedAnomalies.includes(a) ? "blue" : "gray"}
                      size="sm"
                      onClick={() => setDrawerSelectedAnomalies(prev =>
                        prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
                      )}
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
                        {history
                          .filter(h => {
                            if (drawerSelectedAnomalies.length === 0) return true;
                            return h.anomalies.some(a => drawerSelectedAnomalies.includes(a));
                          })
                          .filter(h => {
                            if (drawerFilterState === "present") return h.status === "normal";
                            if (drawerFilterState === "absent") return h.status === "absent";
                            if (drawerFilterState === "late") return h.is_late;
                            return true;
                          })
                          .map(h => (
                            <Tr key={h.date}>
                              <Td>{h.date}</Td>
                              <Td>{h.check_in_time?.split("T")[1] ?? "-"}</Td>
                              <Td>{h.check_out_time?.split("T")[1] ?? "-"}</Td>
                              <Td>{h.worked_hours.toFixed(2)}</Td>
                              <Td>{h.is_late ? "Yes" : "No"}</Td>
                              <Td>{h.late_minutes}</Td>
                              <Td>
                                {h.anomalies.map(a => (
                                  <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>{a.replace("_", " ")}</Badge>
                                ))}
                              </Td>
                              <Td>{h.status}</Td>
                            </Tr>
                          ))
                        }
                      </Tbody>
                    </Table>
                    {/* -------- TOTAL HOURS -------- */}
                    <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          Total Worked Hours in That Period:
                        </Text>
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

        </Container>
      </VStack>
    </Box>
  );
}



