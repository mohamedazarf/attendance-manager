import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Text,
  HStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  ButtonGroup,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Input,
  IconButton,
  Flex,
  Container,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { HamburgerIcon, CloseIcon, DownloadIcon } from "@chakra-ui/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = "http://localhost:8000/api/v1";

// Couleurs anomalies
const anomalyColors: Record<string, string> = {
  retard: "orange",
  early_departure: "red",
  incomplete_day: "yellow",
  entree_sans_sortie: "purple",
  sortie_sans_entree: "teal",
};

type AttendanceMetric = {
  employee_id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  presence_rate: number;
  absence_rate: number;
  weekend_days_worked: number;
  weekend_hours_worked: number;
};

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

export default function RapportPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [startDate, setStartDate] = useState("2025-03-01");
  const [endDate, setEndDate] = useState("2025-04-16");

  const [data, setData] = useState<AttendanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------- Employee History Drawer --------------------
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceMetric | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistoryItem[]>([]);
  const [totalPeriodHours, setTotalPeriodHours] = useState(0);
  const [totalWeekendHours, setTotalWeekendHours] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [drawerFilterState, setDrawerFilterState] = useState<"all" | "present" | "absent" | "late">("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("2025-03-01");
  const [dateTo, setDateTo] = useState("2025-04-16");

  // -------------------- Fetch metrics --------------------
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const empRes = await axios.get(`${BASE_URL}/employee/`);
        const employees = empRes.data;

        const metricsPromises = employees.map((emp: any) =>
          axios
            .get(`${BASE_URL}/attendance/metrics/employee/${emp.employee_code}/range`, {
              params: { start_date: startDate, end_date: endDate },
            })
            .then((res) => ({
              employee_id: emp.employee_code,
              employee_name: emp.name,
              ...res.data.data,
            }))
        );

        const allMetrics = await Promise.all(metricsPromises);
        setData(allMetrics);
      } catch (err) {
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [startDate, endDate]);

  // -------------------- Fetch employee history --------------------
  const fetchEmployeeHistory = async (employee: AttendanceMetric) => {
    setSelectedEmployee(employee);
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/employee/${employee.employee_id}/history`,
        {
          params: { date_from: dateFrom, date_to: dateTo },
        }
      );

      const history = res.data.history.map((item: any) => ({
        date: item.date,
        check_in_time: item.check_in_time,
        check_out_time: item.check_out_time,
        worked_hours: item.worked_hours,
        weekend_hours: item.weekend_hours,
        is_late: item.is_late,
        late_minutes: item.late_minutes,
        anomalies: item.anomalies,
        status: item.status,
      }));

      setEmployeeHistory(history);
      setTotalPeriodHours(res.data.total_period_hours);
      setTotalWeekendHours(res.data.total_weekend_hours);
      setDrawerFilterState("all");
      setDrawerSelectedAnomalies([]);
    } catch (err) {
      console.error("Error fetching employee history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeDrawer = () => setSelectedEmployee(null);

  // -------------------- Drawer filtering --------------------
  const filteredHistory = employeeHistory
    .filter(h => {
      if (drawerSelectedAnomalies.length === 0) return true;
      return h.anomalies.some(a => drawerSelectedAnomalies.includes(a));
    })
    .filter(h => {
      if (drawerFilterState === "present") return h.status === "normal";
      if (drawerFilterState === "absent") return h.status === "absent";
      if (drawerFilterState === "late") return h.is_late;
      return true;
    });

  // -------------------- Download CSV / Excel --------------------
  const downloadCSV = () => {
    if (!data || data.length === 0) return;

    const headers = [
      "ID", "Name", "Period", "Working Days", "Presences", "Absences", "Presence %", "Absence %", "Weekend Days", "Weekend Hours"
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...data.map(row =>
        [
          row.employee_id,
          `"${row.employee_name}"`,
          `"${row.start_date} -> ${row.end_date}"`,
          row.total_working_days,
          row.days_present,
          row.days_absent,
          row.presence_rate.toFixed(1),
          row.absence_rate.toFixed(1),
          row.weekend_days_worked,
          row.weekend_hours_worked
        ].join(",")
      )].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllEmployeesExcel = () => {
    if (!data || data.length === 0) return;
    const sheetData = data.map(emp => ({
      "ID": emp.employee_id,
      "Name": emp.employee_name,
      "Period": `${emp.start_date} → ${emp.end_date}`,
      "Working Days": emp.total_working_days,
      "Presences": emp.days_present,
      "Absences": emp.days_absent,
      "Presence %": emp.presence_rate.toFixed(1),
      "Absence %": emp.absence_rate.toFixed(1),
      "Weekend Days": emp.weekend_days_worked,
      "Weekend Hours": emp.weekend_hours_worked,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_all_employees_${startDate}_to_${endDate}.xlsx`);
  };

  const downloadEmployeeHistoryCSV = () => {
    if (!selectedEmployee || employeeHistory.length === 0) return;

    const headers = [
      "Date", "Check-in", "Check-out", "Worked Hours", "Late", "Late Minutes", "Anomalies", "Status"
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...employeeHistory.map(h =>
        [
          h.date,
          h.check_in_time?.split("T")[1] ?? "-",
          h.check_out_time?.split("T")[1] ?? "-",
          h.worked_hours.toFixed(2),
          h.is_late ? "Yes" : "No",
          h.late_minutes,
          `"${h.anomalies.join("; ")}"`,
          h.status
        ].join(",")
      )].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedEmployee.employee_name}_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEmployeeExcel = () => {
    if (!selectedEmployee || employeeHistory.length === 0) return;
    const sheetData = employeeHistory.map(h => ({
      Date: h.date,
      "Check-in": h.check_in_time?.slice(11, 16) ?? "-",
      "Check-out": h.check_out_time?.slice(11, 16) ?? "-",
      "Worked Hours": h.worked_hours.toFixed(2),
      Late: h.is_late ? "Yes" : "No",
      "Late Minutes": h.late_minutes,
      Anomalies: h.anomalies.join("; "),
      Status: h.status
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.sheet_add_aoa(ws, [[`Employee: ${selectedEmployee.employee_name}`, `Period: ${dateFrom} → ${dateTo}`], []], { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, sheetData, { skipHeader: true, origin: "A3" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${selectedEmployee.employee_name}_${dateFrom}_to_${dateTo}.xlsx`);
  };

  // -------------------- Graphs data --------------------
  const totalPresence = data.reduce((acc, e) => acc + e.days_present, 0);
  const totalAbsence = data.reduce((acc, e) => acc + e.days_absent, 0);

  const anomaliesCount = Object.keys(anomalyColors).map(a => ({
    anomaly: a.replace("_", " "),
    count: employeeHistory.filter(h => h.anomalies.includes(a)).length
  }));

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600}
        onClick={toggleSidebar}
      />
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />
        <Container maxW="100%" flex={1} p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={4}>Attendance Report</Text>

          {/* Date filters + export buttons */}
          <HStack spacing={2} mb={4} justifyContent="space-between">
            <HStack>
              <Text>Start Date:</Text>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Text>End Date:</Text>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </HStack>
            <HStack>
              <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={downloadCSV}>Export CSV</Button>
              <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={downloadAllEmployeesExcel}>Export Excel</Button>
            </HStack>
          </HStack>

          {/* -------------------- GRAPHS -------------------- */}
          {data.length > 0 && (
            <>
              {/* Bar chart Presence vs Absence */}
              <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={2}>Presence vs Absence per Employee</Text>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="employee_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="days_present" name="Presences" fill="#38A169" />
                    <Bar dataKey="days_absent" name="Absences" fill="#E53E3E" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Pie chart global presence */}
              <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={2}>Global Presence Rate</Text>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Present", value: totalPresence },
                        { name: "Absent", value: totalAbsence },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      <Cell fill="#38A169" />
                      <Cell fill="#E53E3E" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Bar chart anomalies */}
              {selectedEmployee && (
                <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
                  <Text fontSize="lg" fontWeight="bold" mb={2}>Anomalies Count (Selected Employee)</Text>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={anomaliesCount} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="anomaly" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count">
                        {anomaliesCount.map((a, idx) => (
                          <Cell key={a.anomaly} fill={Object.values(anomalyColors)[idx % Object.values(anomalyColors).length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </>
          )}

          {/* -------------------- Table -------------------- */}
          {loading ? (
            <Spinner />
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Period</Th>
                    <Th isNumeric>Working Days</Th>
                    <Th isNumeric>Presences</Th>
                    <Th isNumeric>Absences</Th>
                    <Th isNumeric>Presence %</Th>
                    <Th isNumeric>Absence %</Th>
                    <Th isNumeric>Weekend Days</Th>
                    <Th isNumeric>Weekend Hours</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((row) => (
                    <Tr
                      key={row.employee_id}
                      cursor="pointer"
                      _hover={{ bg: "gray.100" }}
                      onClick={() => fetchEmployeeHistory(row)}
                    >
                      <Td>{row.employee_id}</Td>
                      <Td>{row.employee_name}</Td>
                      <Td>{`${row.start_date} → ${row.end_date}`}</Td>
                      <Td isNumeric>{row.total_working_days}</Td>
                      <Td isNumeric>{row.days_present}</Td>
                      <Td isNumeric>{row.days_absent}</Td>
                      <Td isNumeric>{row.presence_rate.toFixed(1)}%</Td>
                      <Td isNumeric>{row.absence_rate.toFixed(1)}%</Td>
                      <Td isNumeric>{row.weekend_days_worked}</Td>
                      <Td isNumeric>{row.weekend_hours_worked}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* -------------------- Employee History Drawer -------------------- */}
          <Drawer isOpen={!!selectedEmployee} placement="right" onClose={closeDrawer} size="full">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                <Flex justifyContent="space-between">
                  <Text>Employee History {selectedEmployee?.employee_name && `- ${selectedEmployee.employee_name}`}</Text>
                  <HStack mr={10}>
                    <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={downloadEmployeeHistoryCSV}>Export CSV</Button>
                    <Button leftIcon={<DownloadIcon />} colorScheme="blue" onClick={downloadEmployeeExcel}>Export Excel</Button>
                  </HStack>
                </Flex>
                <Flex gap={2} mt={2}>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  <Button size="sm" onClick={() => selectedEmployee && fetchEmployeeHistory(selectedEmployee)}>Filter</Button>
                </Flex>
                <Flex gap={2} mt={2}>
                  <ButtonGroup size="sm">
                    {["all", "present", "absent", "late"].map(f => (
                      <Button key={f} colorScheme={drawerFilterState === f ? "yellow" : "gray"} onClick={() => setDrawerFilterState(f as any)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </ButtonGroup>
                  {Object.keys(anomalyColors).map(a => (
                    <Button key={a} size="sm" colorScheme={drawerSelectedAnomalies.includes(a) ? "blue" : "gray"}
                      onClick={() => setDrawerSelectedAnomalies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}>
                      {a.replace("_", " ")}
                    </Button>
                  ))}
                </Flex>
              </DrawerHeader>

              <DrawerBody>
                {historyLoading ? (
                  <Spinner />
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
                        {filteredHistory.map(h => (
                          <Tr key={h.date + h.status}>
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
                        ))}
                      </Tbody>
                    </Table>

                    <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">Total Worked Hours in That Period:</Text>
                        <Text fontWeight="bold" color="blue.600">{totalPeriodHours.toFixed(2)} h</Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">Total weekend Worked Hours in That Period:</Text>
                        <Text fontWeight="bold" color="blue.600">{totalWeekendHours.toFixed(2)} h</Text>
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
