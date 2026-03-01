import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  VStack,
  Text,
  Container,
  Spinner,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import axios from "axios";
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

type AttendanceMetric = {
  employee_id: number;
  employee_name: string;
  days_present: number;
  days_absent: number;
};

export default function GraphiquesPage() {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [data, setData] = useState<AttendanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

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
                params: { start_date: "2025-03-01", end_date: "2025-04-16" },
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
  }, []);

  const totalPresence = data.reduce((acc, e) => acc + e.days_present, 0);
  const totalAbsence = data.reduce((acc, e) => acc + e.days_absent, 0);

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar */}
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

      {/* Main Content */}
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />
        <Container maxW="100%" flex={1} p={6}>
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            {t("Attendance Charts")}
          </Text>

          {loading ? (
            <Spinner />
          ) : data.length === 0 ? (
            <Text>{t("No data available")}</Text>
          ) : (
            <>
              {/* Bar chart Presence vs Absence */}
              <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  {t("Presence vs Absence per Employee")}
                </Text>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="employee_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="days_present"
                      name={t("Presences")}
                      fill="#38A169"
                    />
                    <Bar
                      dataKey="days_absent"
                      name={t("Absences")}
                      fill="#E53E3E"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Pie chart global presence */}
              <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
                <Text fontSize="lg" fontWeight="bold" mb={2}>
                  {t("Global Presence Rate")}
                </Text>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t("Present"), value: totalPresence },
                        { name: t("Absent"), value: totalAbsence },
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
            </>
          )}
        </Container>
      </VStack>
    </Box>
  );
}
