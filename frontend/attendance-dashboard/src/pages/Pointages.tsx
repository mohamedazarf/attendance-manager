// src/pages/Pointages.tsx
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  Text,
  Spinner,
  Badge,
  Button,
  HStack,
  IconButton,
  useDisclosure,
  Input,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "@chakra-ui/icons/Close";
import { HamburgerIcon } from "@chakra-ui/icons/Hamburger";
import {
  ManualPunchModal,
  MarkAbsentModal,
} from "../components/AttendanceModals";
import { getCurrentDate } from "../../utils";

/* -------------------- Types -------------------- */
type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
  anomalies: string[];
  late_minutes?: number;
  extra_hours?: number;
  justification?: {
    reason: string;
    notes?: string;
  };
};

type DashboardData = {
  date: string;
  global: {
    total_employees: number;
    present_today: number;
    absent_today: number;
    attendance_rate: number;
  };
  employees: Employee[];
};

/* -------------------- Stat Card -------------------- */
const StatCard = ({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | number;
  onClick?: () => void;
}) => (
  <Box
    bg="white"
    p={6}
    borderRadius="lg"
    boxShadow="sm"
    cursor={onClick ? "pointer" : "default"}
    _hover={onClick ? { transform: "translateY(-2px)", boxShadow: "lg" } : {}}
    onClick={onClick}
  >
    <Text fontSize="sm" color="gray.600" mb={2}>
      {label}
    </Text>
    <Text fontSize="2xl" fontWeight="bold">
      {value}
    </Text>
  </Box>
);

/* -------------------- Daily Alerts -------------------- */
function DailyAlerts({
  employees,
  onManualPunch,
  onMarkAbsent,
}: {
  employees: Employee[];
  onManualPunch: (emp: { id: number; name: string }) => void;
  onMarkAbsent: (emp: { id: number; name: string }) => void;
}) {
  const { t } = useTranslation();

  if (employees.length === 0) {
    return <Text color="gray.500">{t("No alerts 🎉")}</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      {employees.map((emp) => (
        <Box
          key={emp.employee_id}
          p={4}
          borderRadius="md"
          border="1px solid"
          borderColor="red.200"
          bg="red.50"
        >
          <HStack justify="space-between">
            <Text fontWeight="bold">{emp.employee_name}</Text>
            {emp.justification && (
              <Badge colorScheme="green" variant="subtle">
                {t(emp.justification.reason)}
              </Badge>
            )}
          </HStack>

          <HStack mt={3} justify="space-between" align="start" wrap="wrap">
            <HStack spacing={2} wrap="wrap">
              {emp.status === "absent" && (
                <Badge colorScheme="red">{t("Absent")}</Badge>
              )}

              {emp.anomalies.includes("entree_sans_sortie") && (
                <Badge colorScheme="orange">{t("Missing check-out")}</Badge>
              )}

              {emp.anomalies.includes("sortie_sans_entree") && (
                <Badge colorScheme="purple">{t("Missing check-in")}</Badge>
              )}

              {emp.anomalies.includes("retard") && (
                <Badge colorScheme="yellow">
                  {t("Late")} ({emp.late_minutes} min)
                </Badge>
              )}

              {emp.anomalies.includes("early_departure") && (
                <Badge colorScheme="pink">{t("Early departure")}</Badge>
              )}
              {emp.anomalies.includes("incomplete_day") && (
                <Badge colorScheme="teal">{t("Incomplete day")}</Badge>
              )}

              {emp.extra_hours && emp.extra_hours > 0 && (
                <Badge colorScheme="blue">
                  {t("Extra hours")} +{emp.extra_hours}h
                </Badge>
              )}
            </HStack>

            <HStack spacing={2} wrap="wrap">
              {!emp.check_in_time && (
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() =>
                    onManualPunch({
                      id: emp.employee_id,
                      name: emp.employee_name,
                    })
                  }
                >
                  {t("Manual punch")}
                </Button>
              )}
              {!emp.check_in_time && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() =>
                    onMarkAbsent({
                      id: emp.employee_id,
                      name: emp.employee_name,
                    })
                  }
                >
                  {t("Mark absent")}
                </Button>
              )}
              {emp.anomalies.includes("retard") && (
                <Button
                  size="sm"
                  colorScheme="yellow"
                  variant="outline"
                  onClick={() => console.log("Confirm late", emp.employee_id)}
                >
                  {t("Confirm late")}
                </Button>
              )}
            </HStack>
          </HStack>
          {emp.justification?.notes && (
            <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
              Note: {emp.justification.notes}
            </Text>
          )}
        </Box>
      ))}
    </VStack>
  );
}

/* -------------------- Page -------------------- */
export default function Pointages() {
  const { t } = useTranslation();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());

  // Modals state
  const {
    isOpen: isManualOpen,
    onOpen: onManualOpen,
    onClose: onManualClose,
  } = useDisclosure();
  const {
    isOpen: isAbsentOpen,
    onOpen: onAbsentOpen,
    onClose: onAbsentClose,
  } = useDisclosure();

  const [selectedEmp, setSelectedEmp] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const navigate = useNavigate();

  const fetchDashboard = useCallback((day: string) => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${day}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [fetchDashboard, selectedDate]);

  const handleManualPunch = (emp: { id: number; name: string }) => {
    setSelectedEmp(emp);
    onManualOpen();
  };

  const handleMarkAbsent = (emp: { id: number; name: string }) => {
    setSelectedEmp(emp);
    onAbsentOpen();
  };

  if (loading && !dashboard) return <Spinner size="lg" />;

  const negativeAlerts =
    dashboard?.employees.filter(
      (emp) => emp.status === "absent" || emp.anomalies.length > 0,
    ) ?? [];
  const positiveAlerts =
    dashboard?.employees.filter(
      (emp) => emp.extra_hours && emp.extra_hours > 0,
    ) ?? [];

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

      <VStack flex={1} spacing={0} ml={["0", "250px"]} w="full">
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={2}>{t("Attendance dashboard")}</Heading>
          <HStack justify="space-between" mb={6}>
            <Text color="gray.500">
              {t("Date")}: {dashboard?.date}
            </Text>
            <HStack spacing={3}>
              <Input
                type="date"
                value={selectedDate}
                max={getCurrentDate()}
                onChange={(e) => setSelectedDate(e.target.value)}
                size="sm"
                bg="white"
              />
            </HStack>
            {loading && <Spinner size="sm" />}
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <StatCard
              label={t("Total Employees")}
              value={dashboard?.global.total_employees ?? 0}
              onClick={() => navigate("/employeesToday")}
            />
            <StatCard
              label={t("Present Today")}
              value={dashboard?.global.present_today ?? 0}
              onClick={() => navigate("/employeesToday?filter=present")}
            />
            <StatCard
              label={t("Absent Today")}
              value={dashboard?.global.absent_today ?? 0}
              onClick={() => navigate("/employeesToday?filter=absent")}
            />
            <StatCard
              label={t("Attendance Rate")}
              value={`${dashboard?.global.attendance_rate ?? 0}%`}
            />
          </SimpleGrid>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={6}>
              {t("Daily Alerts")}
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Heading size="sm" mb={3} color="red.500">
                  🚨 {t("Alertes de pointage")}
                </Heading>
                <DailyAlerts
                  employees={negativeAlerts}
                  onManualPunch={handleManualPunch}
                  onMarkAbsent={handleMarkAbsent}
                />
              </Box>

              <Box>
                <Heading size="sm" mb={3} color="blue.500">
                  ✅ {t("Extra hours")}
                </Heading>
                {positiveAlerts.length > 0 ? (
                  <DailyAlerts
                    employees={positiveAlerts}
                    onManualPunch={handleManualPunch}
                    onMarkAbsent={handleMarkAbsent}
                  />
                ) : (
                  <Text color="gray.500">{t("No alerts 🎉")}</Text>
                )}
              </Box>
            </SimpleGrid>
          </Box>
        </Container>
      </VStack>

      {/* Modals */}
      <ManualPunchModal
        isOpen={isManualOpen}
        onClose={onManualClose}
        employee={selectedEmp}
        date={selectedDate}
        onSuccess={() => fetchDashboard(selectedDate)}
      />
      <MarkAbsentModal
        isOpen={isAbsentOpen}
        onClose={onAbsentClose}
        employee={selectedEmp}
        date={selectedDate}
        onSuccess={() => fetchDashboard(selectedDate)}
      />
    </Box>
  );
}
