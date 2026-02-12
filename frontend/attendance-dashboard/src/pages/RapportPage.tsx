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
  IconButton,
} from "@chakra-ui/react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";

const BASE_URL = "http://localhost:8000/api/v1";
interface AttendanceMetric {
  employee_id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  period: string;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  presence_rate: number;
  absence_rate: number;
  weekend_days_worked: number;
  weekend_hours_worked: number;
}

export default function RapportPage() {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [startDate, setStartDate] = useState("2025-03-01");
  const [endDate, setEndDate] = useState("2025-04-16");
  const [data, setData] = useState<AttendanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // 1️⃣ Get all employees
        const empRes = await axios.get(`${BASE_URL}/employee/`);
        const employees = empRes.data; // array of employees

        // 2️⃣ Fetch metrics for each employee in parallel
        const metricsPromises = employees.map((emp: any) =>
          axios
            .get(
              `${BASE_URL}/attendance/metrics/employee/${emp.employee_code}/range`,
              { params: { start_date: startDate, end_date: endDate } }
            )
            .then((res) => ({
              employee_id: emp.employee_code,
              employee_name: emp.name, // <-- on garde le nom
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
        zIndex={1500}
        onClick={toggleSidebar}
      />

      <VStack flex={1} spacing={0} ml={["0", "250px"]} align="stretch">
        <Navbar />

        <Box p={5}>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            {t("Attendance report")}
          </Text>

          {/* Date range filters */}
          <HStack spacing={4} mb={6} flexWrap="wrap">
            <Text>{t("Start Date")}</Text>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Text>{t("End Date")}</Text>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </HStack>

          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner />
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>{t("Employee ID")}</Th>
                    <Th>{t("Employee Name")}</Th> {/* <-- affichage du nom */}
                    <Th>{t("Period")}</Th>
                    <Th isNumeric>{t("Working days")}</Th>
                    <Th isNumeric>{t("Presences")}</Th>
                    <Th isNumeric>{t("Absences")}</Th>
                    <Th isNumeric>{t("Presence %")}</Th>
                    <Th isNumeric>{t("Absence %")}</Th>
                    <Th isNumeric>{t("Weekend Days")}</Th>
                    <Th isNumeric>{t("Weekend Hours")}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((row) => (
                    <Tr key={row.employee_id}>
                      <Td>{row.employee_id}</Td>
                      <Td>{row.employee_name}</Td> {/* <-- affichage du nom */}
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
        </Box>
      </VStack>
    </Box>
  );
}

