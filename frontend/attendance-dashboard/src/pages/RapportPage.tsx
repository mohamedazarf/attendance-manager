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
  IconButton,
  Flex,
  Container,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { HamburgerIcon, CloseIcon, DownloadIcon } from "@chakra-ui/icons";
import axios from "axios";
import * as XLSX from "xlsx";

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

  total_hours_worked: number;
  overtime_hours: number;
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

import { useTranslation } from "react-i18next";

export default function RapportPage() {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [overtimeOnly, setOvertimeOnly] = useState(false);

  // Derive start/end dates from selected year+month
  const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [data, setData] = useState<AttendanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredData = data.filter((row) => {
    const search = employeeSearchTerm.trim().toLowerCase();
    const matchesSearch =
      search.length === 0 ||
      row.employee_name.toLowerCase().includes(search) ||
      String(row.employee_id).toLowerCase().includes(search);

    // Align filter behavior with displayed precision (2 decimals).
    const overtimeValue = Number(row.overtime_hours ?? 0);
    const overtimeDisplayed = Number(overtimeValue.toFixed(2));
    const matchesOvertime = !overtimeOnly || overtimeDisplayed > 0;

    return matchesSearch && matchesOvertime;
  });



  // -------------------- Employee History Drawer --------------------
  const [selectedEmployee, setSelectedEmployee] =
    useState<AttendanceMetric | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistoryItem[]>(
    [],
  );
  const [totalPeriodHours, setTotalPeriodHours] = useState(0);
  const [totalOvertimeHours, setTotalOvertimeHours] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [drawerFilterState, setDrawerFilterState] = useState<
    "all" | "present" | "absent" | "late"
  >("all");
  const [drawerSelectedAnomalies, setDrawerSelectedAnomalies] = useState<
    string[]
  >([]);
  // Drawer date range mirrors the selected month
  const dateFrom = startDate;
  const dateTo = endDate;

  // -------------------- Fetch metrics --------------------
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const empRes = await axios.get(`${BASE_URL}/employee/`);
        const employees = empRes.data;

        const metricsPromises = employees.map((emp: any) =>
          axios
            .get(
              `${BASE_URL}/attendance/metrics/employee/${emp.employee_code}/range`,
              {
                params: { start_date: startDate, end_date: endDate },
              },
            )
            .then((res) => ({
              employee_id: emp.employee_code,
              employee_name: emp.name,
              ...res.data.data,
            })),
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
  }, [selectedYear, selectedMonth]);

  // -------------------- Fetch employee history --------------------
  const fetchEmployeeHistory = async (employee: AttendanceMetric) => {
    setSelectedEmployee(employee);
    setHistoryLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/employee/${employee.employee_id}/history`,
        {
          params: { date_from: dateFrom, date_to: dateTo },
        },
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
      setTotalOvertimeHours(res.data.total_overtime_hours ?? 0);
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

  // -------------------- Download CSV / Excel --------------------
  const downloadCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "ID",
      "Name",
      "Period",
      "Working Days",
      "Presences",
      "Absences",
      "Total Hours",
      "Overtime Hours",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...filteredData.map((row) =>
          [
            row.employee_id,
            `"${row.employee_name}"`,
            `"${row.start_date} -> ${row.end_date}"`,
            row.total_working_days,
            row.days_present,
            row.days_absent,
            row.total_hours_worked?.toFixed(2) ?? "0.00",
            row.overtime_hours?.toFixed(2) ?? "0.00",
          ].join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_report_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllEmployeesExcel = () => {
    if (!filteredData || filteredData.length === 0) return;
    const sheetData = filteredData.map((emp) => ({
      ID: emp.employee_id,
      Name: emp.employee_name,
      Period: `${emp.start_date} → ${emp.end_date}`,
      "Working Days": emp.total_working_days,
      Presences: emp.days_present,
      Absences: emp.days_absent,

      "Total Hours": emp.total_hours_worked?.toFixed(2) ?? "0.00",
      "Overtime Hours": emp.overtime_hours?.toFixed(2) ?? "0.00",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(
      wb,
      `attendance_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.xlsx`,
    );
  };

  const downloadEmployeeHistoryCSV = () => {
    if (!selectedEmployee || employeeHistory.length === 0) return;

    const headers = [
      "Date",
      "Check-in",
      "Check-out",
      "Worked Hours",
      "Late",
      "Late Minutes",
      "Anomalies",
      "Status",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...employeeHistory.map((h) =>
          [
            h.date,
            h.check_in_time?.split("T")[1] ?? "-",
            h.check_out_time?.split("T")[1] ?? "-",
            h.worked_hours.toFixed(2),
            h.is_late ? "Yes" : "No",
            h.late_minutes,
            `"${h.anomalies.join("; ")}"`,
            h.status,
          ].join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_${selectedEmployee.employee_name}_${dateFrom}_to_${dateTo}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEmployeeExcel = () => {
    if (!selectedEmployee || employeeHistory.length === 0) return;
    const sheetData = employeeHistory.map((h) => ({
      Date: h.date,
      "Check-in": h.check_in_time?.slice(11, 16) ?? "-",
      "Check-out": h.check_out_time?.slice(11, 16) ?? "-",
      "Worked Hours": h.worked_hours.toFixed(2),
      Late: h.is_late ? "Yes" : "No",
      "Late Minutes": h.late_minutes,
      Anomalies: h.anomalies.join("; "),
      Status: h.status,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          `Employee: ${selectedEmployee.employee_name}`,
          `Period: ${dateFrom} → ${dateTo}`,
        ],
        [],
      ],
      { origin: "A1" },
    );
    XLSX.utils.sheet_add_json(ws, sheetData, {
      skipHeader: true,
      origin: "A3",
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(
      wb,
      `attendance_${selectedEmployee.employee_name}_${dateFrom}_to_${dateTo}.xlsx`,
    );
  };

  // -------------------- Graphs data --------------------

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
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            {t("Attendance Report")}
          </Text>

          {/* Month/Year filter + export buttons */}
          <HStack spacing={4} mb={4} justifyContent="space-between">
            <HStack spacing={2}>
              <Text fontWeight="medium">{t("Year")}:</Text>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E0",
                  fontSize: "14px",
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => now.getFullYear() - 2 + i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Text fontWeight="medium">{t("Month")}:</Text>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E0",
                  fontSize: "14px",
                }}
              >
                {[
                  "Janvier",
                  "Février",
                  "Mars",
                  "Avril",
                  "Mai",
                  "Juin",
                  "Juillet",
                  "Août",
                  "Septembre",
                  "Octobre",
                  "Novembre",
                  "Décembre",
                ].map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Text fontWeight="medium">{t("Search")}:</Text>
              <input
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                placeholder={t("Name or code (e.g. mohamed)")}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E0",
                  fontSize: "14px",
                  maxWidth: "220px",
                }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={overtimeOnly}
                  onChange={(e) => setOvertimeOnly(e.target.checked)}
                />
                <span style={{ fontSize: "14px" }}>{t("Overtime only")}</span>
              </label>
            </HStack>
            <HStack>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="green"
                onClick={downloadCSV}
              >
                {t("Export CSV")}
              </Button>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="green"
                onClick={downloadAllEmployeesExcel}
              >
                {t("Export Excel")}
              </Button>
            </HStack>
          </HStack>

          {/* -------------------- Table -------------------- */}
          {loading ? (
            <Spinner />
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>{t("Employee ID")}</Th>
                    <Th>{t("Name")}</Th>
                    <Th>{t("Period")}</Th>
                    <Th isNumeric>{t("Working Days")}</Th>
                    <Th isNumeric>{t("Presences")}</Th>
                    <Th isNumeric>{t("Absences")}</Th>
                    <Th isNumeric>{t("Total Hours")}</Th>
                    <Th isNumeric>{t("Overtime Hours")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredData.map((row) => (
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

                      <Td isNumeric>
                        {row.total_hours_worked?.toFixed(2) ?? "0.00"}
                      </Td>
                      <Td isNumeric>
                        {row.overtime_hours?.toFixed(2) ?? "0.00"}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* -------------------- Employee History Drawer -------------------- */}
          <Drawer
            isOpen={!!selectedEmployee}
            placement="right"
            onClose={closeDrawer}
            size="full"
          >
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                <Flex justifyContent="space-between">
                  <Text>
                    {t("Employee History")}{" "}
                    {selectedEmployee?.employee_name &&
                      `- ${selectedEmployee.employee_name}`}
                  </Text>
                  <HStack mr={10}>
                    <Button
                      leftIcon={<DownloadIcon />}
                      colorScheme="green"
                      onClick={downloadEmployeeHistoryCSV}
                    >
                      {t("Export CSV")}
                    </Button>
                    <Button
                      leftIcon={<DownloadIcon />}
                      colorScheme="blue"
                      onClick={downloadEmployeeExcel}
                    >
                      {t("Export Excel")}
                    </Button>
                  </HStack>
                </Flex>

                <Flex gap={2} mt={2}>
                  <ButtonGroup size="sm">
                    {["all", "present", "absent", "late"].map((f) => (
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
                  {Object.keys(anomalyColors).map((a) => (
                    <Button
                      key={a}
                      size="sm"
                      colorScheme={
                        drawerSelectedAnomalies.includes(a) ? "blue" : "gray"
                      }
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
                  <Spinner />
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
                          <Tr key={h.date + h.status}>
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

                    <Box mt={4} p={3} bg="gray.100" borderRadius="md">
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
                          {t("Overtime Hours (beyond 173.33 h/month)")}:
                        </Text>
                        <Text fontWeight="bold" color="orange.500">
                          {totalOvertimeHours.toFixed(2)} h
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
