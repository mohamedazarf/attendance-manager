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
  IconButton,
  Divider,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { ArrowForwardIcon, CloseIcon, HamburgerIcon, TimeIcon } from "@chakra-ui/icons";
import { useLocation } from "react-router-dom";
import { ManualPunchModal } from "../components/AttendanceModals";
import API_BASE_URL from "../config/apiConfig";

// -------------------- Types --------------------
type AttendanceEvent = {
  timestamp: string;
  event_type: "in" | "out";
};

type AttendanceInterval = {
  start: string;
  end: string;
  duration: number;
};

type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent" | "remote";
  check_in_time: string | null;
  check_out_time: string | null;
  worked_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
  events?: AttendanceEvent[];
  intervals?: AttendanceInterval[];
};

type EmployeeHistory = {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
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
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");

  // Format as YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate; // Returns: "2026-02-18" (for example)
}

function formatTime(isoString: string | undefined | null, length: number = 5) {
  if (!isoString || typeof isoString !== "string") return "--:--";
  const parts = isoString.split("T");
  if (parts.length < 2) return isoString;
  return parts[1].substring(0, length);
}

export default function EmployeesToday() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(search);
  const urlFilter = params.get("filter") as
    | "all"
    | "present"
    | "absent"
    | "late"
    | "remote"
    | null;
  const urlDate = params.get("date");
  const isValidDate = !!urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate);
  const targetDate = isValidDate ? urlDate : getCurrentDate();

  const [filterState, setFilterState] = useState<
    "all" | "present" | "absent" | "late" | "remote"
  >(urlFilter || "all");

  // -------------------- Filtres principaux --------------------

  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
  const toggleAnomaly = (anom: string) => {
    setSelectedAnomalies((prev) =>
      prev.includes(anom) ? prev.filter((a) => a !== anom) : [...prev, anom],
    );
  };

  // -------------------- Historique employé --------------------
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [employeeName, setEmployeeName] = useState<string>("");
  const [history, setHistory] = useState<EmployeeHistory[]>([]);
  const [totalPeriodHours, setTotalPeriodHours] = useState<number>(0);
  const [totalOvertimeHours, setTotalOvertimeHours] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualEmployee, setManualEmployee] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [manualDate, setManualDate] = useState<string>(targetDate);
  const [manualEventType, setManualEventType] = useState<"check_in" | "check_out">("check_out");

  const [selectedEmployeeForToday, setSelectedEmployeeForToday] = useState<Employee | null>(null);

  // Dates filtre pour l’historique
  const [dateFrom, setDateFrom] = useState<string>("2026-01-01");
  const [dateTo, setDateTo] = useState<string>("2026-01-31");

  // -------------------- Filtres drawer --------------------
  const [drawerFilterState, setDrawerFilterState] = useState<
    "all" | "present" | "absent" | "late" | "remote"
  >("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<
    string[]
  >([]);

  // -------------------- Fetch dashboard --------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/attendance/dashboard/day?day=${targetDate}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, [targetDate]);

  useEffect(() => {
    setFilterState(urlFilter || "all");
  }, [urlFilter]);

  // -------------------- Filtrer les employés --------------------
  const filteredEmployees = dashboard?.employees
    .filter(
      (emp, idx, arr) =>
        arr.findIndex((e) => e.employee_id === emp.employee_id) === idx,
    )
    .filter((emp) => {
      if (filterState === "present") return emp.status === "present";
      if (filterState === "absent") return emp.status === "absent";
      if (filterState === "remote") return emp.status === "remote";
      if (filterState === "late") return emp.is_late;
      return true;
    })
    .filter((emp) => {
      if (selectedAnomalies.length === 0) return true;
      return emp.anomalies.some((a) => selectedAnomalies.includes(a));
    });

  if (loading) return <Spinner size="lg" />;

  // -------------------- Afficher l’historique --------------------
  const openEmployeeHistory = (employee_id: number) => {
    // Trouver l'employé dans le dashboard pour avoir ses données du jour (events/intervals)
    const emp = dashboard?.employees.find(e => e.employee_id === employee_id);
    setSelectedEmployeeForToday(emp || null);

    setSelectedEmployeeId(employee_id);
    setHistoryLoading(true);

    fetch(
      `${API_BASE_URL}/api/v1/employee/${employee_id}/history?date_from=${dateFrom}&date_to=${dateTo}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setEmployeeName(data.employee_name);
        setHistory(data.history);
        setTotalPeriodHours(data.total_period_hours);
        setTotalOvertimeHours(data.total_overtime_hours);
        console.log("Employee history:", data);
        setHistoryLoading(false);
        setDrawerFilterState("all");
        setDrawerSelectedAnomalies([]);
      })
      .catch((err) => {
        console.error("Employee history fetch error:", err);
        setHistoryLoading(false);
      });
  };

  const closeDrawer = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployeeForToday(null);
  };

  const openManualPunchFromHistory = (historyDate: string, eventType: "check_in" | "check_out" = "check_out") => {
    if (!selectedEmployeeId) return;
    setManualEmployee({
      id: selectedEmployeeId,
      name: employeeName || `#${selectedEmployeeId}`,
    });
    setManualDate(historyDate);
    setManualEventType(eventType);
    setIsManualOpen(true);
  };

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
          <Heading mb={4}>{t("All Employees Today")}</Heading>
          <Text color="gray.500" mb={6}>
            Date:{dashboard?.date}{" "}
          </Text>

          {/* -------------------- Filtres employés -------------------- */}
          <Flex
            mb={4}
            align="center"
            justify="space-between"
            wrap="wrap"
            gap={4}
          >
            <ButtonGroup>
              {["all", "present", "absent", "remote", "late"].map((f) => (
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
                {t("All Anomalies")}
              </Button>
              {Object.keys(anomalyColors).map((a) => (
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
                <Th>{t("Name")}</Th>
                <Th>{t("Status")}</Th>
                <Th>{t("Check-in")}</Th>
                <Th>{t("Check-out")}</Th>
                <Th bg={"gray.500"} fontWeight={"bold"} color={"white"}>
                  {t("Worked Hours")}
                </Th>
                <Th>{t("Late")}</Th>
                <Th>{t("Late Minutes")}</Th>
                <Th>{t("Anomalies")}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEmployees?.map((emp) => (
                <Tr
                  key={emp.employee_id}
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => openEmployeeHistory(emp.employee_id)}
                >
                  <Td>{emp.employee_name}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        emp.status === "present"
                          ? "green"
                          : emp.status === "remote"
                            ? "purple"
                            : "red"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </Td>
                  <Td>{emp.check_in_time?.split("T")[1] ?? "-"}</Td>
                  <Td>{emp.check_out_time?.split("T")[1] ?? "-"}</Td>
                  <Td
                    border="2px solid"
                    borderColor="gray.300"
                    boxShadow="inset 0 1px 2px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.08)"
                    bg="white"
                  >
                    {emp.status === "present"
                      ? (emp.worked_hours ?? 0).toFixed(2)
                      : "-"}
                  </Td>
                  <Td>
                    {emp.status === "present"
                      ? emp.is_late
                        ? t("Yes")
                        : t("No")
                      : "-"}
                  </Td>
                  <Td>{emp.late_minutes || "-"}</Td>
                  <Td>
                    {emp.anomalies.map((a) => (
                      <Badge
                        key={a}
                        colorScheme={anomalyColors[a] || "gray"}
                        mr={1}
                      >
                        {a.replace("_", " ")}
                      </Badge>
                    ))}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* -------------------- Employee History Drawer -------------------- */}
          <Drawer
            isOpen={!!selectedEmployeeId}
            placement="right"
            onClose={closeDrawer}
            size="full"
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                {t("Employee History")} {employeeName && `- ${employeeName}`}
                {/* -------------------- Ligne 1 : Dates + Filter -------------------- */}
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
                    onClick={() =>
                      selectedEmployeeId &&
                      openEmployeeHistory(selectedEmployeeId)
                    }
                  >
                    {t("Filter")}
                  </Button>
                </Flex>
                {/* -------------------- Ligne 2 : Status + Anomalies -------------------- */}
                <Flex gap={2} mt={2} align="center" wrap="wrap">
                  {/* Status filters */}
                  <ButtonGroup size="sm">
                    {["all", "present", "absent", "remote", "late"].map((f) => (
                      <Button
                        key={f}
                        colorScheme={
                          drawerFilterState === f ? "yellow" : "gray"
                        }
                        onClick={() => setDrawerFilterState(f as any)}
                      >
                        {t(f.charAt(0).toUpperCase() + f.slice(1))}
                      </Button>
                    ))}
                  </ButtonGroup>

                  {/* Anomaly filters */}
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
                {/* -------------------- DÉTAILS DU JOUR (INTERVALLES) -------------------- */}
                {selectedEmployeeForToday && (
                  <Box mb={8} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                    <Heading size="md" mb={4} color="blue.600">
                      {t("Today's Sessions")} ({targetDate})
                    </Heading>
                    
                    <Flex gap={8} wrap="wrap">
                      {/* Section Intervalles */}
                      <Box flex={1} minW="300px">
                        <Text fontWeight="bold" mb={2}>{t("Intervals")}</Text>
                        <VStack align="stretch" spacing={2}>
                          {selectedEmployeeForToday.intervals && selectedEmployeeForToday.intervals.length > 0 ? (
                            selectedEmployeeForToday.intervals.map((interval, idx) => (
                              <Flex key={idx} justify="space-between" p={2} bg="white" borderRadius="sm" shadow="sm" align="center">
                                <HStack>
                                  <TimeIcon color="green.500" />
                                  <Text fontSize="sm">
                                    {formatTime(interval.start)} 
                                    <ArrowForwardIcon mx={2} />
                                    {formatTime(interval.end)}
                                  </Text>
                                </HStack>
                                <Badge colorScheme="blue">{(interval.duration ?? 0).toFixed(2)}h</Badge>
                              </Flex>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">{t("No intervals recorded")}</Text>
                          )}
                        </VStack>
                      </Box>

                      {/* Section Événements Bruts */}
                      <Box flex={1} minW="200px">
                        <Text fontWeight="bold" mb={2}>{t("Raw Events")}</Text>
                        <List spacing={1}>
                          {selectedEmployeeForToday.events && selectedEmployeeForToday.events.length > 0 ? (
                            selectedEmployeeForToday.events.map((ev, idx) => (
                              <ListItem key={idx} fontSize="sm">
                                <ListIcon 
                                  as={TimeIcon} 
                                  color={ev.event_type === "in" ? "green.500" : "red.500"} 
                                />
                                <Badge variant="outline" mr={2} colorScheme={ev.event_type === "in" ? "green" : "red"}>
                                  {ev.event_type.toUpperCase()}
                                </Badge>
                                  {formatTime(ev.timestamp, 8)}
                                </ListItem>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">{t("No events recorded")}</Text>
                          )}
                        </List>
                      </Box>
                    </Flex>
                    
                    <Divider my={4} />
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <Text fontWeight="bold">{t("Summary Today")}:</Text>
                        <Badge colorScheme="green" fontSize="sm">
                          {typeof selectedEmployeeForToday.worked_hours === 'number' ? selectedEmployeeForToday.worked_hours.toFixed(2) : "0.00"}h {t("Worked")}
                        </Badge>
                      </HStack>
                    </Flex>
                  </Box>
                )}

                <Heading size="md" mb={4} mt={6}>{t("Historical Records")}</Heading>

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
                        {history
                          .filter((h) => {
                            if (drawerSelectedAnomalies.length === 0)
                              return true;
                            return h.anomalies.some((a) =>
                              drawerSelectedAnomalies.includes(a),
                            );
                          })
                          .filter((h) => {
                            if (drawerFilterState === "present")
                              return h.status === "normal";
                            if (drawerFilterState === "absent")
                              return h.status === "absent";
                            if (drawerFilterState === "remote")
                              return h.status === "remote";
                            if (drawerFilterState === "late") return h.is_late;
                            return true;
                          })
                          .map((h) => (
                            <Tr key={h.date}>
                              <Td>{h.date}</Td>
                              <Td>{h.check_in_time?.split("T")[1] ?? "-"}</Td>
                              <Td>{h.check_out_time?.split("T")[1] ?? "-"}</Td>
                              <Td>{(h.worked_hours ?? 0).toFixed(2)}</Td>
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
                                {!h.check_in_time && (
                                  <Button
                                    size="xs"
                                    colorScheme="blue"
                                    mr={2}
                                    onClick={() =>
                                      openManualPunchFromHistory(h.date, "check_in")
                                    }
                                  >
                                    {t("Manual punch")}
                                  </Button>
                                )}
                                {(h.anomalies.includes("entree_sans_sortie") ||
                                  (!!h.check_in_time && !h.check_out_time)) && (
                                  <Button
                                    size="xs"
                                    colorScheme="orange"
                                    onClick={() =>
                                      openManualPunchFromHistory(h.date, "check_out")
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
                    {/* -------- TOTAL HOURS -------- */}
                    <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          {t("Total Worked Hours in That Period")}:
                        </Text>
                        <Text fontWeight="bold" color="blue.600">
                          {(totalPeriodHours ?? 0).toFixed(2)} h
                        </Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">
                          {t("Total Extra Hours in That Period..")}:
                        </Text>
                        <Text fontWeight="bold" color="blue.600">
                          {(totalOvertimeHours ?? 0).toFixed(2)} h
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
      <ManualPunchModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        employee={manualEmployee}
        date={manualDate}
        initialEventType={manualEventType}
        onSuccess={() => {
          if (selectedEmployeeId) {
            openEmployeeHistory(selectedEmployeeId);
          }
        }}
      />
    </Box>
  );
}
