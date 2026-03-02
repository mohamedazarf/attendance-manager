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
  Select,
  Switch,
  Alert,
  AlertIcon,
  Divider,
  useToast,
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
import { useAuth } from "../context/AuthContext";

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

type SpecialDay = {
  date: string;
  type: "holiday" | "remote_day";
  label?: string;
};

type DayRulesConfig = {
  include_sunday: boolean;
  special_days: SpecialDay[];
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
  onConfirmLate,
}: {
  employees: Employee[];
  onManualPunch: (emp: { id: number; name: string }) => void;
  onMarkAbsent: (emp: { id: number; name: string }) => void;
  onConfirmLate: (id: number) => void;
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
                  onClick={() => onConfirmLate(emp.employee_id)}
                >
                  {t("Confirm late")}
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
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());
  const [rules, setRules] = useState<DayRulesConfig | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [newSpecialDate, setNewSpecialDate] = useState<string>(getCurrentDate());
  const [newSpecialType, setNewSpecialType] = useState<"holiday" | "remote_day">(
    "holiday",
  );
  const [newSpecialLabel, setNewSpecialLabel] = useState<string>("");

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

  const fetchRules = useCallback(
    (year: number) => {
      if (!isAdmin) return;
      setRulesLoading(true);
      Promise.all([
        fetch("http://127.0.0.1:8000/api/v1/attendance/dashboard/day-rules").then(
          (res) => res.json(),
        ),
        fetch(
          `http://127.0.0.1:8000/api/v1/attendance/dashboard/special-days?start_date=${year}-01-01&end_date=${year}-12-31`,
        ).then((res) => res.json()),
      ])
        .then(([config, specialDays]) => {
          setRules({
            include_sunday: config.include_sunday ?? true,
            special_days: specialDays.special_days ?? [],
          });
          setRulesLoading(false);
        })
        .catch((err) => {
          console.error("Day rules fetch error:", err);
          setRulesLoading(false);
        });
    },
    [isAdmin],
  );

  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [fetchDashboard, selectedDate]);

  useEffect(() => {
    if (!isAdmin) return;
    const year = Number(selectedDate.split("-")[0]);
    if (!Number.isNaN(year)) {
      fetchRules(year);
    }
  }, [selectedDate, isAdmin, fetchRules]);

  const handleManualPunch = (emp: { id: number; name: string }) => {
    setSelectedEmp(emp);
    onManualOpen();
  };

  const handleMarkAbsent = (emp: { id: number; name: string }) => {
    setSelectedEmp(emp);
    onAbsentOpen();
  };

  const updateIncludeSunday = async (value: boolean) => {
    try {
      await fetch("http://127.0.0.1:8000/api/v1/attendance/dashboard/day-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ include_sunday: value }),
      });
      const year = Number(selectedDate.split("-")[0]);
      fetchRules(year);
      fetchDashboard(selectedDate);
    } catch (err) {
      console.error("Failed to update include_sunday", err);
    }
  };

  const addSpecialDay = async () => {
    if (!newSpecialDate) return;
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/special-days",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: newSpecialDate,
            type: newSpecialType,
            label: newSpecialLabel,
          }),
        },
      );
      if (!response.ok) {
        throw new Error("Invalid payload");
      }
      toast({
        title: "Jour spécial enregistré",
        status: "success",
        duration: 1800,
        isClosable: true,
      });
      const year = Number(selectedDate.split("-")[0]);
      fetchRules(year);
      fetchDashboard(selectedDate);
      setNewSpecialLabel("");
    } catch (err) {
      toast({
        title: "Erreur d'enregistrement",
        status: "error",
        duration: 1800,
        isClosable: true,
      });
      console.error("Failed to add special day", err);
    }
  };

  const deleteSpecialDay = async (day: string) => {
    try {
      await fetch(
        `http://127.0.0.1:8000/api/v1/attendance/dashboard/special-days/${day}`,
        {
          method: "DELETE",
        },
      );
      const year = Number(selectedDate.split("-")[0]);
      fetchRules(year);
      fetchDashboard(selectedDate);
    } catch (err) {
      console.error("Failed to delete special day", err);
    }
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

          {isSpecialDay && (
            <Alert status="info" borderRadius="md" mb={6}>
              <AlertIcon />
              <Text fontSize="sm">
                Cette date est un jour spécial:{" "}
                <strong>{dashboard?.day_context?.label}</strong>. Les absences ne
                sont pas comptabilisées.
              </Text>
            </Alert>
          )}

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
              value={suppressAbsence ? "-" : (dashboard?.global.absent_today ?? 0)}
              onClick={
                suppressAbsence
                  ? undefined
                  : () => navigate("/employeesToday?filter=absent")
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

          {isAdmin && (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
              <Heading size="md" mb={4}>
                Paramétrage des jours spéciaux (admin)
              </Heading>

              <HStack justify="space-between" mb={4} wrap="wrap">
                <Text>Inclure automatiquement le dimanche comme non ouvrable</Text>
                <HStack>
                  {rulesLoading && <Spinner size="sm" />}
                  <Switch
                    isChecked={rules?.include_sunday ?? true}
                    onChange={(e) => updateIncludeSunday(e.target.checked)}
                  />
                </HStack>
              </HStack>

              <Divider mb={4} />

              <HStack mb={4} spacing={3} wrap="wrap" align="end">
                <Box>
                  <Text fontSize="sm" mb={1}>
                    Date
                  </Text>
                  <Input
                    type="date"
                    value={newSpecialDate}
                    onChange={(e) => setNewSpecialDate(e.target.value)}
                    bg="white"
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>
                    Type
                  </Text>
                  <Select
                    value={newSpecialType}
                    onChange={(e) =>
                      setNewSpecialType(e.target.value as "holiday" | "remote_day")
                    }
                    size="sm"
                    bg="white"
                  >
                    <option value="holiday">Jour férié</option>
                    <option value="remote_day">Jour à distance</option>
                  </Select>
                </Box>
                <Box flex={1} minW="220px">
                  <Text fontSize="sm" mb={1}>
                    Libellé (optionnel)
                  </Text>
                  <Input
                    value={newSpecialLabel}
                    onChange={(e) => setNewSpecialLabel(e.target.value)}
                    placeholder="Ex: Fête nationale"
                    size="sm"
                    bg="white"
                  />
                </Box>
                <Button colorScheme="blue" size="sm" onClick={addSpecialDay}>
                  Ajouter / Mettre à jour
                </Button>
              </HStack>

              <VStack align="stretch" spacing={2}>
                {(rules?.special_days ?? []).length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    Aucun jour spécial configuré.
                  </Text>
                )}
                {(rules?.special_days ?? [])
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((item) => (
                    <HStack
                      key={item.date}
                      justify="space-between"
                      p={3}
                      border="1px solid"
                      borderColor="gray.100"
                      borderRadius="md"
                    >
                      <HStack>
                        <Badge colorScheme={item.type === "holiday" ? "red" : "blue"}>
                          {item.type === "holiday" ? "Jour férié" : "Jour à distance"}
                        </Badge>
                        <Text fontSize="sm">{item.date}</Text>
                        {item.label && (
                          <Text fontSize="sm" color="gray.600">
                            - {item.label}
                          </Text>
                        )}
                      </HStack>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => deleteSpecialDay(item.date)}
                      >
                        Supprimer
                      </Button>
                    </HStack>
                  ))}
              </VStack>
            </Box>
          )}

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
                  onManualPunch={handleManualPunch}
                  onMarkAbsent={handleMarkAbsent}
                  onConfirmLate={(id) => console.log("Confirm late", id)}
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
                    onConfirmLate={(id) => console.log("Confirm late", id)}
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
