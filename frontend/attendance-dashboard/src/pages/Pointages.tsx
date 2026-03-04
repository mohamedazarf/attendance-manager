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
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "@chakra-ui/icons/Close";
import { HamburgerIcon } from "@chakra-ui/icons/Hamburger";
import { ManualPunchModal } from "../components/AttendanceModals";
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
  day_context?: {
    is_special_day: boolean;
    type: "holiday" | "remote_day" | "sunday" | "working_day";
    label: string;
    suppress_absence: boolean;
  };
  global: {
    total_employees: number;
    present_today: number;
    absent_today: number;
    raw_absent_today?: number;
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
  defaultDate,
  onManualPunch,
}: {
  employees: Employee[];
  defaultDate: string;
  onManualPunch: (emp: {
    id: number;
    name: string;
    date: string;
    eventType: "check_in" | "check_out";
  }) => void;
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
                      date: defaultDate,
                      eventType: "check_in",
                    })
                  }
                >
                  {t("Manual punch")}
                </Button>
              )}
              {emp.anomalies.includes("entree_sans_sortie") && (
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={() =>
                    onManualPunch({
                      id: emp.employee_id,
                      name: emp.employee_name,
                      date: defaultDate,
                      eventType: "check_out",
                    })
                  }
                >
                  {t("Add manual check-out")}
                </Button>
              )}
            </HStack>
          </HStack>
          {emp.justification?.notes && (
            <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
              {t("Note")}: {emp.justification.notes}
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
  const [yesterdayDashboard, setYesterdayDashboard] =
    useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());
  const [selectedManualDate, setSelectedManualDate] =
    useState<string>(getCurrentDate());
  const [selectedManualEventType, setSelectedManualEventType] = useState<
    "check_in" | "check_out"
  >("check_in");

  const {
    isOpen: isManualOpen,
    onOpen: onManualOpen,
    onClose: onManualClose,
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

  const getPreviousDate = (day: string) => {
    const [year, month, date] = day.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, date));
    utcDate.setUTCDate(utcDate.getUTCDate() - 1);
    return utcDate.toISOString().split("T")[0];
  };

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [fetchDashboard, selectedDate]);

  const fetchYesterdayDashboard = useCallback((day: string) => {
    const yesterday = getPreviousDate(day);
    fetch(
      `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${yesterday}`,
    )
      .then((res) => res.json())
      .then((data) => setYesterdayDashboard(data))
      .catch((err) => {
        console.error("Yesterday dashboard fetch error:", err);
        setYesterdayDashboard(null);
      });
  }, []);

  useEffect(() => {
    fetchYesterdayDashboard(selectedDate);
  }, [fetchYesterdayDashboard, selectedDate]);

  const handleManualPunch = (emp: {
    id: number;
    name: string;
    date: string;
    eventType: "check_in" | "check_out";
  }) => {
    setSelectedEmp({ id: emp.id, name: emp.name });
    setSelectedManualDate(emp.date);
    setSelectedManualEventType(emp.eventType);
    onManualOpen();
  };

  const goToEmployeesToday = (filter?: "present" | "absent") => {
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    if (filter) params.set("filter", filter);
    navigate(`/employeesToday?${params.toString()}`);
  };

  if (loading && !dashboard) return <Spinner size="lg" />;

  const isSpecialDay = dashboard?.day_context?.is_special_day;
  const suppressAbsence = dashboard?.day_context?.suppress_absence;

  const negativeAlerts =
    dashboard?.employees.filter(
      (emp) =>
        (suppressAbsence ? false : emp.status === "absent") ||
        emp.anomalies.length > 0,
    ) ?? [];
  const previousDate = getPreviousDate(selectedDate);
  const previousDateMissingCheckout =
    yesterdayDashboard?.employees.filter((emp) =>
      emp.anomalies.includes("entree_sans_sortie"),
    ) ?? [];
  const positiveAlerts =
    yesterdayDashboard?.employees.filter(
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
        zIndex={1600}
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

          {isSpecialDay && (
            <Alert status="info" borderRadius="md" mb={6}>
              <AlertIcon />
              <Text fontSize="sm">
                {t("Special date", { label: dashboard?.day_context?.label })}
              </Text>
            </Alert>
          )}

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <StatCard
              label={t("Total Employees")}
              value={dashboard?.global.total_employees ?? 0}
              onClick={() => goToEmployeesToday()}
            />
            <StatCard
              label={t("Present Today")}
              value={dashboard?.global.present_today ?? 0}
              onClick={() => goToEmployeesToday("present")}
            />
            <StatCard
              label={t("Absent Today")}
              value={
                suppressAbsence ? "-" : (dashboard?.global.absent_today ?? 0)
              }
              onClick={
                suppressAbsence ? undefined : () => goToEmployeesToday("absent")
              }
            />
            <StatCard
              label={t("Attendance Rate")}
              value={
                suppressAbsence
                  ? "-"
                  : `${dashboard?.global.attendance_rate ?? 0}%`
              }
            />
          </SimpleGrid>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>
              {t("Daily Alerts")}
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <Heading size="sm" mb={3} color="red.500">
                  🚨 {t("Attendance Alerts")}
                </Heading>
                <DailyAlerts
                  employees={negativeAlerts}
                  defaultDate={selectedDate}
                  onManualPunch={(emp) =>
                    handleManualPunch({
                      ...emp,
                      date: selectedDate,
                      eventType: emp.eventType,
                    })
                  }
                />
              </Box>

              <Box>
                <Heading size="sm" mb={3} color="blue.500">
                  ✅ {t("Extra hours")} ({t("Yesterday")}: {previousDate})
                </Heading>
                {positiveAlerts.length > 0 ? (
                  <DailyAlerts
                    employees={positiveAlerts}
                    defaultDate={previousDate}
                    onManualPunch={(emp) =>
                      handleManualPunch({
                        ...emp,
                        date: previousDate,
                        eventType: emp.eventType,
                      })
                    }
                  />
                ) : (
                  <Text color="gray.500">
                    {t("No extra hours reported yesterday")}
                  </Text>
                )}

                <Heading size="sm" mt={6} mb={3} color="orange.500">
                  {t("Missing check-out")} ({t("Yesterday")}: {previousDate})
                </Heading>
                {previousDateMissingCheckout.length > 0 ? (
                  <VStack spacing={2} align="stretch" mt={2}>
                    {previousDateMissingCheckout.map((emp) => (
                      <HStack
                        key={`missing-${emp.employee_id}`}
                        justify="space-between"
                        bg="orange.50"
                        border="1px solid"
                        borderColor="orange.200"
                        borderRadius="md"
                        p={3}
                      >
                        <Text fontWeight="bold">{emp.employee_name}</Text>
                        <Button
                          size="sm"
                          colorScheme="orange"
                          onClick={() =>
                            handleManualPunch({
                              id: emp.employee_id,
                              name: emp.employee_name,
                              date: previousDate,
                              eventType: "check_out",
                            })
                          }
                        >
                          {t("Add manual check-out")}
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">{t("No missing check-out yesterday")}</Text>
                )}
              </Box>
            </SimpleGrid>
          </Box>
        </Container>
        <ManualPunchModal
          isOpen={isManualOpen}
          onClose={onManualClose}
          employee={selectedEmp}
          date={selectedManualDate}
          initialEventType={selectedManualEventType}
          onSuccess={() => {
            fetchDashboard(selectedDate);
            fetchYesterdayDashboard(selectedDate);
          }}
        />
      </VStack>
    </Box>
  );
}
