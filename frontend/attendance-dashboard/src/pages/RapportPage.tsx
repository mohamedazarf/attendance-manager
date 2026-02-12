// import { useEffect, useState } from "react";
// import {
//   Box,
//   VStack,
//   Text,
//   HStack,
//   Spinner,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   IconButton,
// } from "@chakra-ui/react";
// import Sidebar from "../components/layout/Sidebar";
// import Navbar from "../components/layout/Navbar";
// import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
// import axios from "axios";
// import { useTranslation } from "react-i18next";

// const BASE_URL = "http://localhost:8000/api/v1";
// interface AttendanceMetric {
//   employee_id: number;
//   employee_name: string;
//   start_date: string;
//   end_date: string;
//   period: string;
//   total_working_days: number;
//   days_present: number;
//   days_absent: number;
//   presence_rate: number;
//   absence_rate: number;
//   weekend_days_worked: number;
//   weekend_hours_worked: number;
// }

// export default function RapportPage() {
//   const { t } = useTranslation();
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   const [startDate, setStartDate] = useState("2025-03-01");
//   const [endDate, setEndDate] = useState("2025-04-16");
//   const [data, setData] = useState<AttendanceMetric[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [selectedEmployee, setSelectedEmployee] = useState<AttendanceMetric | null>(null);
//   const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);
//   const [historyLoading, setHistoryLoading] = useState(false);

//   const [presenceFilter, setPresenceFilter] = useState<number | "all">("all");
//   const [absentFilter, setAbsentFilter] = useState<number | "all">("all");


//   const fetchEmployeeHistory = async (employee: AttendanceMetric) => {
//     setSelectedEmployee(employee);
//     setHistoryLoading(true);
//     try {
//       const res = await axios.get(
//         `${BASE_URL}/attendance/employee/${employee.employee_id}/history`,
//         {
//           params: {
//             start_date: startDate,
//             end_date: endDate,
//           },
//         }
//       );
//       console.log("Raw history response:", res.data);
//       const history = res.data.history.map((item: any) => ({
//         date: item.date,
//         checkin: item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString() : "-",
//         checkout: item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString() : "-",
//         worked_hours: item.worked_hours,
//         late: item.is_late,
//         late_minutes: item.late_minutes,
//         anomalies: item.anomalies.join(", "),
//         status: item.status,
//       }));
//       setEmployeeHistory(history); // tableau d’objets {date, checkin, checkout, worked_hours, ...}
//     } catch (err) {
//       console.error("Error fetching employee history:", err);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };



//   useEffect(() => {
//     const fetchMetrics = async () => {
//       setLoading(true);
//       try {
//         // 1️⃣ Get all employees
//         const empRes = await axios.get(`${BASE_URL}/employee/`);
//         const employees = empRes.data; // array of employees

//         // 2️⃣ Fetch metrics for each employee in parallel
//         const metricsPromises = employees.map((emp: any) =>
//           axios
//             .get(
//               `${BASE_URL}/attendance/metrics/employee/${emp.employee_code}/range`,
//               { params: { start_date: startDate, end_date: endDate } }
//             )
//             .then((res) => ({
//               employee_id: emp.employee_code,
//               employee_name: emp.name, // <-- on garde le nom
//               ...res.data.data,
//             }))
//         );

//         const allMetrics = await Promise.all(metricsPromises);
//         setData(allMetrics);
//       } catch (err) {
//         console.error("Error fetching metrics:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMetrics();
//   }, [startDate, endDate]);
//   // Remplacez votre bloc filteredData par celui-ci :
//   const filteredData = data.filter((row) => {
//     // Conversion explicite en nombre pour éviter les erreurs de type
//     const presence = Number(row.presence_rate) || 0;
//     const absences = Number(row.days_absent) || 0;

//     const matchesPresence =
//       presenceFilter === "all" || presence >= (presenceFilter as number);

//     const matchesAbsence =
//       absentFilter === "all" || absences >= (absentFilter as number);

//     return matchesPresence && matchesAbsence;
//   });

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
//       <IconButton
//         icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
//         aria-label="Toggle Sidebar"
//         display={["inline-flex", "none"]}
//         position="fixed"
//         top="4"
//         left="4"
//         zIndex={1500}
//         onClick={toggleSidebar}
//       />

//       <VStack flex={1} spacing={0} ml={["0", "250px"]} align="stretch">
//         <Navbar />

//         <Box p={5}>
//           <Text fontSize="xl" fontWeight="bold" mb={4}>
//             {t("Attendance report")}
//           </Text>

//           {/* Date range filters */}
//           <HStack spacing={4} mb={6} flexWrap="wrap">
//             {/* Start / End Date */}
//             <Text>{t("Start Date")}</Text>
//             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//             <Text>{t("End Date")}</Text>
//             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

//             {/* Nouvelle section filtres */}
//             <Text>{t("Min Presence %")}</Text>
//             <select
//               value={presenceFilter}
//               onChange={(e) =>
//                 setPresenceFilter(e.target.value === "all" ? "all" : Number(e.target.value))
//               }
//             >
//               <option value="all">{t("All")}</option>
//               <option value={50}>≥50%</option>
//               <option value={75}>≥75%</option>
//               <option value={90}>≥90%</option>
//             </select>

//             <Text>{t("Min Absences")}</Text>
//             <select
//               value={absentFilter}
//               onChange={(e) =>
//                 setAbsentFilter(e.target.value === "all" ? "all" : Number(e.target.value))
//               }
//             >
//               <option value="all">{t("All")}</option>
//               <option value={1}>≥1</option>
//               <option value={3}>≥3</option>
//               <option value={5}>≥5</option>
//             </select>
//           </HStack>


//           {loading ? (
//             <Box textAlign="center" py={10}>
//               <Spinner />
//             </Box>
//           ) : (
//             <Box overflowX="auto">
//               <Table variant="simple" size="sm">
//                 <Thead>
//                   <Tr>
//                     <Th>{t("Employee ID")}</Th>
//                     <Th>{t("Employee Name")}</Th> {/* <-- affichage du nom */}
//                     <Th>{t("Period")}</Th>
//                     <Th isNumeric>{t("Working days")}</Th>
//                     <Th isNumeric>{t("Presences")}</Th>
//                     <Th isNumeric>{t("Absences")}</Th>
//                     <Th isNumeric>{t("Presence %")}</Th>
//                     <Th isNumeric>{t("Absence %")}</Th>
//                     <Th isNumeric>{t("Weekend Days")}</Th>
//                     <Th isNumeric>{t("Weekend Hours")}</Th>
//                   </Tr>
//                 </Thead>
//                 <Tbody>
//                   {filteredData.map((row, index) => (
//                     <Tr key={`$row.employee_id}-$index`} onClick={() => fetchEmployeeHistory(row)} style={{ cursor: "pointer" }}>
//                       <Td>{row.employee_id}</Td>
//                       <Td>{row.employee_name}</Td> {/* <-- affichage du nom */}
//                       <Td>{`${row.start_date} → ${row.end_date}`}</Td>
//                       <Td isNumeric>{row.total_working_days}</Td>
//                       <Td isNumeric>{row.days_present}</Td>
//                       <Td isNumeric>{row.days_absent}</Td>
//                       <Td isNumeric>{row.presence_rate.toFixed(1)}%</Td>
//                       <Td isNumeric>{row.absence_rate.toFixed(1)}%</Td>
//                       <Td isNumeric>{row.weekend_days_worked}</Td>
//                       <Td isNumeric>{row.weekend_hours_worked}</Td>
//                     </Tr>
//                   ))}
//                 </Tbody>
//               </Table>
//             </Box>
//           )}
//         </Box>
//       </VStack>
//       {selectedEmployee && (
//         <Box mt={10} bg="white" p={5} borderRadius="md" boxShadow="sm">
//           <Text fontSize="lg" fontWeight="bold" mb={4}>
//             {t("Employee History")} - {selectedEmployee.employee_name}
//           </Text>

//           {historyLoading ? (
//             <Spinner />
//           ) : (
//             <Table variant="simple" size="sm">
//               <Thead>
//                 <Tr>
//                   <Th>{t("Date")}</Th>
//                   <Th>{t("Check-in")}</Th>
//                   <Th>{t("Check-out")}</Th>
//                   <Th isNumeric>{t("Worked Hours")}</Th>
//                   <Th>{t("Late")}</Th>
//                   <Th isNumeric>{t("Late Minutes")}</Th>
//                   <Th>{t("Anomalies")}</Th>
//                   <Th>{t("Status")}</Th>
//                 </Tr>
//               </Thead>
//               <Tbody>
//                 {employeeHistory.map((row: any, index: number) => (
//                   <Tr key={index}>
//                     <Td>{row.date}</Td>
//                     <Td>{row.checkin || "-"}</Td>
//                     <Td>{row.checkout || "-"}</Td>
//                     <Td isNumeric>{row.worked_hours?.toFixed(2) ?? 0}</Td>
//                     <Td>{row.late ? t("Yes") : t("No")}</Td>
//                     <Td isNumeric>{row.late_minutes ?? 0}</Td>
//                     <Td>{row.anomalies || "-"}</Td>
//                     <Td>{row.status}</Td>
//                   </Tr>
//                 ))}
//               </Tbody>
//             </Table>
//           )}

//           {/* Total worked hours */}
//           <Text fontWeight="bold" mt={4}>
//             {t("Total Worked Hours in That Period")}:{" "}
//             {employeeHistory.reduce((acc, cur) => acc + (cur.worked_hours ?? 0), 0).toFixed(2)} h
//           </Text>
//         </Box>
//       )}

//     </Box>
//   );
// }

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
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";

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
  const [historyLoading, setHistoryLoading] = useState(false);

  // Drawer filters
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
          params: {
            date_from: dateFrom,
            date_to: dateTo,
          },
        }
      );

      const history = res.data.history.map((item: any) => ({
        date: item.date,
        check_in_time: item.check_in_time,
        check_out_time: item.check_out_time,
        worked_hours: item.worked_hours,
        is_late: item.is_late,
        late_minutes: item.late_minutes,
        anomalies: item.anomalies,
        status: item.status,
      }));

      setEmployeeHistory(history);
      setTotalPeriodHours(res.data.total_period_hours);
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

          {/* Date range filters */}
          <HStack spacing={2} mb={4}>
            <Text>Start Date:</Text>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <Text>End Date:</Text>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </HStack>

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
          <Drawer isOpen={!!selectedEmployee} placement="right" onClose={closeDrawer} size="xl">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>
                Employee History {selectedEmployee?.employee_name && `- ${selectedEmployee.employee_name}`}
                <Flex gap={2} mt={2}>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  <Button size="sm" onClick={() => selectedEmployee && fetchEmployeeHistory(selectedEmployee)}>
                    Filter
                  </Button>
                </Flex>
                <Flex gap={2} mt={2}>
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
                  {Object.keys(anomalyColors).map(a => (
                    <Button
                      key={a}
                      size="sm"
                      colorScheme={drawerSelectedAnomalies.includes(a) ? "blue" : "gray"}
                      onClick={() =>
                        setDrawerSelectedAnomalies(prev =>
                          prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
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

