import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  HStack,
  IconButton,
  Input,
  Select,
  Switch,
  Divider,
  Button,
  Badge,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloseIcon,
  HamburgerIcon,
  DeleteIcon,
  EditIcon,
  InfoIcon,
  TimeIcon,
  SettingsIcon,
} from "@chakra-ui/icons";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { getCurrentDate } from "../../utils";
import API_BASE_URL from "../config/apiConfig";

type SpecialDay = {
  date: string;
  type: "holiday" | "remote_day";
  label?: string;
};

type DayRulesConfig = {
  include_sunday: boolean;
  special_days: SpecialDay[];
};

type DepartmentScheduleConfig = {
  start_time: string;
  end_time: string;
  pause_minutes: number;
};

type PeriodDepartmentConfig = {
  start_date: string | null;
  end_date: string | null;
  departments: Record<string, DepartmentScheduleConfig>;
};

type DeleteDepartmentStrategy = "reassign_default" | "delete";

const DEFAULT_DEPARTMENTS: Record<string, DepartmentScheduleConfig> = {
  administration: { start_time: "08:30", end_time: "17:30", pause_minutes: 75 },
  employee: { start_time: "07:30", end_time: "16:30", pause_minutes: 75 },
};

function normalizeDepartmentConfig(
  raw: Record<string, Partial<DepartmentScheduleConfig>> | undefined,
  defaultPause: number,
): Record<string, DepartmentScheduleConfig> {
  const result: Record<string, DepartmentScheduleConfig> = {};
  const allNames = new Set([
    ...Object.keys(DEFAULT_DEPARTMENTS),
    ...Object.keys(raw ?? {}),
  ]);

  allNames.forEach((name) => {
    const key = name.toLowerCase();
    const base = DEFAULT_DEPARTMENTS[key] ?? {
      start_time: "08:30",
      end_time: "17:30",
      pause_minutes: defaultPause,
    };
    const current = raw?.[name] ?? raw?.[key] ?? {};

    result[key] = {
      start_time: String(current.start_time ?? base.start_time),
      end_time: String(current.end_time ?? base.end_time),
      pause_minutes: Number(current.pause_minutes ?? defaultPause),
    };
  });

  return result;
}

export default function Parametrage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [rules, setRules] = useState<DayRulesConfig | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [newSpecialDate, setNewSpecialDate] =
    useState<string>(getCurrentDate());
  const [newSpecialType, setNewSpecialType] = useState<
    "holiday" | "remote_day"
  >("holiday");
  const [newSpecialLabel, setNewSpecialLabel] = useState<string>("");

  const [normalConfig, setNormalConfig] =
    useState<PeriodDepartmentConfig | null>(null);
  const [normalLoading, setNormalLoading] = useState(false);

  const [ramadanConfig, setRamadanConfig] =
    useState<PeriodDepartmentConfig | null>(null);
  const [ramadanLoading, setRamadanLoading] = useState(false);

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentStartTime, setNewDepartmentStartTime] = useState("");
  const [newDepartmentEndTime, setNewDepartmentEndTime] = useState("");
  const [departmentActionLoading, setDepartmentActionLoading] = useState<
    string | null
  >(null);

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  const [selectedDeptName, setSelectedDeptName] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<
    0 | 1 | 2
  >(0);
  const [deleteStrategy, setDeleteStrategy] =
    useState<DeleteDepartmentStrategy>("reassign_default");

  const departmentNames = useMemo(() => {
    const names = new Set<string>([
      ...Object.keys(normalConfig?.departments ?? {}),
      ...Object.keys(ramadanConfig?.departments ?? {}),
    ]);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [normalConfig, ramadanConfig]);

  const isSystemDepartment = (name: string) =>
    ["usine", "administration"].includes(name.toLowerCase());

  const fetchRules = useCallback((year: number) => {
    setRulesLoading(true);
    setNormalLoading(true);
    setRamadanLoading(true);

    Promise.all([
      fetch(`${API_BASE_URL}/api/v1/attendance/dashboard/day-rules`).then(
        (res) => res.json(),
      ),
      fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/special-days?start_date=${year}-01-01&end_date=${year}-12-31`,
      ).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/v1/attendance/dashboard/normal-config`).then(
        (res) => res.json(),
      ),
      fetch(`${API_BASE_URL}/api/v1/attendance/dashboard/ramadan-config`).then(
        (res) => res.json(),
      ),
    ])
      .then(([config, specialDays, normal, ramadan]) => {
        setRules({
          include_sunday: config.include_sunday ?? true,
          special_days: specialDays.special_days ?? [],
        });

        setNormalConfig({
          start_date: normal.start_date ?? null,
          end_date: normal.end_date ?? null,
          departments: normalizeDepartmentConfig(normal.departments, 75),
        });

        const ramadanDepartments = normalizeDepartmentConfig(
          ramadan.departments,
          0,
        );
        Object.keys(ramadanDepartments).forEach((dept) => {
          ramadanDepartments[dept].pause_minutes = 0;
        });

        setRamadanConfig({
          start_date: ramadan.start_date ?? null,
          end_date: ramadan.end_date ?? null,
          departments: ramadanDepartments,
        });
      })
      .catch((err) => {
        console.error("Configuration fetch error:", err);
      })
      .finally(() => {
        setRulesLoading(false);
        setNormalLoading(false);
        setRamadanLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRules(selectedYear);
  }, [selectedYear, fetchRules]);

  const updateIncludeSunday = async (value: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/attendance/dashboard/day-rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ include_sunday: value }),
      });
      fetchRules(selectedYear);
    } catch (err) {
      console.error("Failed to update include_sunday", err);
    }
  };

  const addSpecialDay = async () => {
    if (!newSpecialDate) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/special-days`,
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
        title: t("Jour special enregistre"),
        status: "success",
        duration: 1800,
        isClosable: true,
      });
      fetchRules(selectedYear);
      setNewSpecialLabel("");
    } catch (err) {
      toast({
        title: t("Erreur d'enregistrement"),
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
        `${API_BASE_URL}/api/v1/attendance/dashboard/special-days/${day}`,
        {
          method: "DELETE",
        },
      );
      fetchRules(selectedYear);
    } catch (err) {
      console.error("Failed to delete special day", err);
    }
  };

  const handlePeriodFieldChange = (
    mode: "normal" | "ramadan",
    field: "start_date" | "end_date",
    value: string,
  ) => {
    const setter = mode === "normal" ? setNormalConfig : setRamadanConfig;
    setter((prev) => {
      const updated = {
        ...(prev || { start_date: null, end_date: null, departments: {} }),
        [field]: value || null,
      };

      // Auto-calculate end date for ramadan if start_date is changed
      if (mode === "ramadan" && field === "start_date" && value) {
        const startDate = new Date(value);
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 29);
          updated.end_date = endDate.toISOString().split("T")[0];
        }
      }

      return updated;
    });
  };

  const handleDepartmentFieldChange = (
    mode: "normal" | "ramadan",
    dept: string,
    field: "start_time" | "end_time" | "pause_minutes",
    value: string,
  ) => {
    const setter = mode === "normal" ? setNormalConfig : setRamadanConfig;
    setter((prev) => {
      const base: PeriodDepartmentConfig = prev || {
        start_date: null,
        end_date: null,
        departments: {},
      };
      const current = base.departments[dept] || {
        start_time: "",
        end_time: "",
        pause_minutes: mode === "normal" ? 75 : 0,
      };

      const nextValue = field === "pause_minutes" ? Number(value || 0) : value;

      return {
        ...base,
        departments: {
          ...base.departments,
          [dept]: {
            ...current,
            [field]: nextValue,
            pause_minutes:
              mode === "ramadan"
                ? 0
                : field === "pause_minutes"
                  ? Number(value || 0)
                  : current.pause_minutes,
          },
        },
      };
    });
  };

  const saveNormalConfig = async () => {
    if (!normalConfig) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/normal-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: normalConfig.start_date,
            end_date: normalConfig.end_date,
            departments: normalConfig.departments,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Invalid payload");
      }

      const data = await response.json();
      setNormalConfig({
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        departments: normalizeDepartmentConfig(data.departments, 75),
      });

      toast({
        title: t("Horaires normaux enregistres"),
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to save normal config", err);
      toast({
        title: t("Erreur lors de l'enregistrement des horaires normaux"),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const saveRamadanConfig = async () => {
    if (!ramadanConfig) return;
    try {
      const departmentsWithoutPause = Object.fromEntries(
        Object.entries(ramadanConfig.departments).map(([dept, cfg]) => [
          dept,
          {
            start_time: cfg.start_time,
            end_time: cfg.end_time,
            pause_minutes: 0,
          },
        ]),
      );

      const response = await fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/ramadan-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: ramadanConfig.start_date,
            end_date: ramadanConfig.end_date,
            departments: departmentsWithoutPause,
          }),
        },
      );
      if (!response.ok) {
        throw new Error("Invalid payload");
      }
      const data = await response.json();
      const departments = normalizeDepartmentConfig(data.departments, 0);
      Object.keys(departments).forEach((dept) => {
        departments[dept].pause_minutes = 0;
      });

      setRamadanConfig({
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        departments,
      });
      toast({
        title: t("Horaires de ramadhan enregistres"),
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to save ramadan config", err);
      toast({
        title: t("Erreur lors de l'enregistrement des horaires de ramadhan"),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const addDepartment = async () => {
    const name = newDepartmentName.trim().toLowerCase();
    if (!name || !newDepartmentStartTime || !newDepartmentEndTime) {
      toast({
        title: t("Veuillez remplir le nom et les horaires"),
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/departments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            start_time: newDepartmentStartTime,
            end_time: newDepartmentEndTime,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Echec creation departement");
      }

      toast({
        title: t("Departement enregistre"),
        status: "success",
        duration: 1800,
        isClosable: true,
      });

      setNormalConfig((prev) => {
        const base: PeriodDepartmentConfig = prev || {
          start_date: null,
          end_date: null,
          departments: {},
        };
        return {
          ...base,
          departments: {
            ...base.departments,
            [name]: {
              start_time: newDepartmentStartTime,
              end_time: newDepartmentEndTime,
              pause_minutes: 75,
            },
          },
        };
      });

      setRamadanConfig((prev) => {
        const base: PeriodDepartmentConfig = prev || {
          start_date: null,
          end_date: null,
          departments: {},
        };
        return {
          ...base,
          departments: {
            ...base.departments,
            [name]: {
              start_time: newDepartmentStartTime,
              end_time: newDepartmentEndTime,
              pause_minutes: 0,
            },
          },
        };
      });

      setNewDepartmentName("");
      setNewDepartmentStartTime("");
      setNewDepartmentEndTime("");
      fetchRules(selectedYear);
    } catch (err) {
      toast({
        title: t("Erreur lors de la creation du departement"),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      console.error("Failed to add department", err);
    }
  };

  const deleteDepartment = async (
    department: string,
    explicitStrategy?: DeleteDepartmentStrategy,
  ) => {
    if (isSystemDepartment(department)) {
      toast({
        title: t("Ce departement systeme ne peut pas etre supprime"),
        status: "warning",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    const strategy =
      explicitStrategy ??
      deleteStrategyByDepartment[department] ??
      "reassign_default";

    // Only show window.confirm if explicitStrategy is NOT provided (backward compatibility)
    if (!explicitStrategy) {
      const confirmMessage =
        strategy === "delete"
          ? t('Supprimer le departement "{{department}}" et tous ses employes ?', {
              department,
            })
          : t(
              'Supprimer le departement "{{department}}" et reaffecter ses employes au departement par defaut ?',
              { department },
            );
      if (!window.confirm(confirmMessage)) return;
    }

    setDepartmentActionLoading(department);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/attendance/dashboard/departments/${encodeURIComponent(department)}?employee_strategy=${strategy}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Echec suppression departement");
      }

      toast({
        title: t("Departement supprime"),
        description:
          strategy === "delete"
            ? t("{{count}} employe(s) supprime(s).", {
                count: data.employees_affected ?? 0,
              })
            : t(
                "{{count}} employe(s) reaffecte(s) au departement par defaut.",
                { count: data.employees_affected ?? 0 },
              ),
        status: "success",
        duration: 2400,
        isClosable: true,
      });

      fetchRules(selectedYear);
    } catch (err) {
      toast({
        title: t("Erreur lors de la suppression du departement"),
        status: "error",
        duration: 2200,
        isClosable: true,
      });
      console.error("Failed to delete department", err);
    } finally {
      setDepartmentActionLoading(null);
    }
  };

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label={t("sidebar.toggle")}
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
          <Heading mb={2}>{t("Parametrage")}</Heading>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
            <HStack justify="space-between" mb={4} wrap="wrap">
              <Heading size="md">{t("Jours speciaux")}</Heading>
              <HStack>
                <Text fontSize="sm">{t("Annee")}</Text>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(Number(e.target.value || currentYear))
                  }
                  min={2000}
                  max={2100}
                  size="sm"
                  w="120px"
                  bg="white"
                />
                {rulesLoading && <Spinner size="sm" />}
              </HStack>
            </HStack>

            <HStack justify="space-between" mb={4} wrap="wrap">
              <Text>{t("Inclure automatiquement le dimanche comme non ouvrable")}</Text>
              <Switch
                isChecked={rules?.include_sunday ?? true}
                onChange={(e) => updateIncludeSunday(e.target.checked)}
              />
            </HStack>

            <Divider mb={4} />

            <HStack mb={4} spacing={3} wrap="wrap" align="end">
              <Box>
                <Text fontSize="sm" mb={1}>
                  {t("Date")}
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
                  {t("Type")}
                </Text>
                <Select
                  value={newSpecialType}
                  onChange={(e) =>
                    setNewSpecialType(
                      e.target.value as "holiday" | "remote_day",
                    )
                  }
                  size="sm"
                  bg="white"
                >
                  <option value="holiday">{t("Jour ferie")}</option>
                  <option value="remote_day">{t("Jour a distance")}</option>
                </Select>
              </Box>
              <Box flex={1} minW="220px">
                <Text fontSize="sm" mb={1}>
                  {t("Libelle (optionnel)")}
                </Text>
                <Input
                  value={newSpecialLabel}
                  onChange={(e) => setNewSpecialLabel(e.target.value)}
                  placeholder={t("Ex: Fete nationale")}
                  size="sm"
                  bg="white"
                />
              </Box>
              <Button colorScheme="blue" size="sm" onClick={addSpecialDay}>
                {t("Ajouter / Mettre a jour")}
              </Button>
            </HStack>

            <VStack align="stretch" spacing={2}>
              {(rules?.special_days ?? []).length === 0 && (
                <Text color="gray.500" fontSize="sm">
                  {t("Aucun jour special configure.")}
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
                      <Badge
                        colorScheme={item.type === "holiday" ? "red" : "blue"}
                      >
                        {item.type === "holiday"
                          ? t("Jour ferie")
                          : t("Jour a distance")}
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
                      {t("Supprimer")}
                    </Button>
                  </HStack>
                ))}
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
            <Heading size="sm" mb={2}>
              {t("Gestion des départements")}
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={6}>
              {t(
                "Configurez les périodes globales et gérez les horaires par département via les cartes.",
              )}
            </Text>

            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={6}
              mb={8}
              bg="blue.50"
              p={4}
              borderRadius="md"
            >
              <Box borderColor="orange.200" borderRadius="lg" p={4}>
                <Heading
                  size="xs"
                  mb={3}
                  textTransform="uppercase"
                  color="orange.700"
                  letterSpacing="wider"
                >
                  {t("Période Ramadan")}
                </Heading>
                <VStack align="stretch" spacing={3}>
                  <HStack spacing={3} align="flex-end">
                    <Box flex={1}>
                      <Text
                        fontSize="xs"
                        mb={1}
                        fontWeight="bold"
                        color="gray.600"
                      >
                        {t("Début")}
                      </Text>
                      <Input
                        type="date"
                        value={ramadanConfig?.start_date ?? ""}
                        onChange={(e) =>
                          handlePeriodFieldChange(
                            "ramadan",
                            "start_date",
                            e.target.value,
                          )
                        }
                        bg="white"
                        size="sm"
                        borderColor="orange.200"
                        _hover={{ borderColor: "orange.400" }}
                        _focus={{
                          borderColor: "orange.500",
                          boxShadow:
                            "0 0 0 1px var(--chakra-colors-orange-500)",
                        }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="xs"
                        mb={1}
                        fontWeight="bold"
                        color="gray.600"
                      >
                        {t("Fin")}
                      </Text>
                      <Input
                        type="date"
                        value={ramadanConfig?.end_date ?? ""}
                        onChange={(e) =>
                          handlePeriodFieldChange(
                            "ramadan",
                            "end_date",
                            e.target.value,
                          )
                        }
                        bg="white"
                        size="sm"
                        borderColor="orange.200"
                        _hover={{ borderColor: "orange.400" }}
                        _focus={{
                          borderColor: "orange.500",
                          boxShadow:
                            "0 0 0 1px var(--chakra-colors-orange-500)",
                        }}
                      />
                    </Box>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={saveRamadanConfig}
                      isLoading={ramadanLoading}
                      loadingText={t("Enregistrement...")}
                      leftIcon={<span>🌙</span>}
                      fontWeight="semibold"
                      px={5}
                      flexShrink={0}
                      boxShadow="sm"
                      _hover={{
                        transform: "translateY(-1px)",
                        boxShadow: "md",
                      }}
                      _active={{ transform: "translateY(0)" }}
                      transition="all 0.15s ease"
                    >
                      {t("Enregistrer")}
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>

            <Box mb={3}>
              <Heading size="sm">{t("Gestion des départements")}</Heading>
              <Text fontSize="sm" color="gray.600">
                {t(
                  "Configurez les périodes globales et gérez les horaires par département via les cartes.",
                )}
              </Text>
            </Box>

            <HStack
              spacing={3}
              wrap="wrap"
              align="end"
              mb={8}
              p={4}
              bg="gray.100"
              borderRadius="md"
            >
              <Box minW="220px">
                <Text fontSize="sm" mb={1} fontWeight="bold">
                  {t("Nom du nouveau département")}
                </Text>
                <Input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder={t("Ex: logistique")}
                  size="sm"
                  bg="white"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1} fontWeight="bold">
                  {t("Heure d'entrée")}
                </Text>
                <Input
                  type="time"
                  value={newDepartmentStartTime}
                  onChange={(e) => setNewDepartmentStartTime(e.target.value)}
                  size="sm"
                  bg="white"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1} fontWeight="bold">
                  {t("Heure de sortie")}
                </Text>
                <Input
                  type="time"
                  value={newDepartmentEndTime}
                  onChange={(e) => setNewDepartmentEndTime(e.target.value)}
                  size="sm"
                  bg="white"
                />
              </Box>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={addDepartment}
                leftIcon={<EditIcon />}
              >
                {t("Ajouter")}
              </Button>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {departmentNames.map((deptName) => {
                const isSystem = isSystemDepartment(deptName);
                const normalHours = normalConfig?.departments[deptName];

                return (
                  <Card
                    key={deptName}
                    variant="outline"
                    cursor="pointer"
                    _hover={{ shadow: "md", borderColor: "blue.400" }}
                    onClick={() => {
                      setSelectedDeptName(deptName);
                      setDeleteConfirmationStep(0);
                      onModalOpen();
                    }}
                  >
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="xs" textTransform="uppercase">
                          {deptName}
                        </Heading>
                        {isSystem && (
                          <Badge colorScheme="gray">{t("Système")}</Badge>
                        )}
                      </Flex>
                    </CardHeader>
                    <CardBody pt={2}>
                      <VStack align="stretch" spacing={1}>
                        <HStack fontSize="xs" color="gray.600">
                          <Icon as={TimeIcon} />
                          <Text>
                            {t("Normal")}: {normalHours?.start_time} -{" "}
                            {normalHours?.end_time}
                          </Text>
                        </HStack>
                        <HStack fontSize="xs" color="gray.500">
                          <Icon as={InfoIcon} />
                          <Text>
                            {t("Pause")}: {normalHours?.pause_minutes} min
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          </Box>

          {/* Department Detail Modal */}
          <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl">
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent>
              <ModalHeader borderBottomWidth="1px">
                <HStack justifyContent="space-between" pr={10}>
                  <HStack>
                    <Icon as={SettingsIcon} color="blue.500" />
                    <Text>
                      {t("Configuration")}: {selectedDeptName}
                    </Text>
                  </HStack>
                  {selectedDeptName && isSystemDepartment(selectedDeptName) && (
                    <Badge colorScheme="gray">{t("Système")}</Badge>
                  )}
                </HStack>
              </ModalHeader>
              <ModalCloseButton mt={2} />

              <ModalBody py={6}>
                {selectedDeptName && (
                  <Tabs colorScheme="blue" variant="enclosed">
                    <TabList>
                      <Tab>
                        <Icon as={TimeIcon} mr={2} /> {t("Horaires Normaux")}
                      </Tab>
                      <Tab>
                        <Icon as={TimeIcon} mr={2} /> {t("Ramadhan")}
                      </Tab>
                    </TabList>
                    <TabPanels mt={4}>
                      {/* Normal Hours Tab */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4}>
                            <Box flex={1}>
                              <Text fontSize="sm" mb={1} fontWeight="bold">
                                {t("Heure d'entrée")}
                              </Text>
                              <Input
                                type="time"
                                value={
                                  normalConfig?.departments[selectedDeptName]
                                    ?.start_time ?? ""
                                }
                                onChange={(e) =>
                                  handleDepartmentFieldChange(
                                    "normal",
                                    selectedDeptName,
                                    "start_time",
                                    e.target.value,
                                  )
                                }
                                bg="white"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text fontSize="sm" mb={1} fontWeight="bold">
                                {t("Heure de sortie")}
                              </Text>
                              <Input
                                type="time"
                                value={
                                  normalConfig?.departments[selectedDeptName]
                                    ?.end_time ?? ""
                                }
                                onChange={(e) =>
                                  handleDepartmentFieldChange(
                                    "normal",
                                    selectedDeptName,
                                    "end_time",
                                    e.target.value,
                                  )
                                }
                                bg="white"
                              />
                            </Box>
                          </HStack>
                          <Box>
                            <Text fontSize="sm" mb={1} fontWeight="bold">
                              {t("Pause (minutes)")}
                            </Text>
                            <Input
                              type="number"
                              min={0}
                              value={
                                normalConfig?.departments[selectedDeptName]
                                  ?.pause_minutes ?? 0
                              }
                              onChange={(e) =>
                                handleDepartmentFieldChange(
                                  "normal",
                                  selectedDeptName,
                                  "pause_minutes",
                                  e.target.value,
                                )
                              }
                              bg="white"
                            />
                          </Box>
                          <Button
                            colorScheme="blue"
                            size="sm"
                            alignSelf="flex-end"
                            onClick={saveNormalConfig}
                            isLoading={normalLoading}
                          >
                            {t("Enregistrer ces horaires")}
                          </Button>
                        </VStack>
                      </TabPanel>

                      {/* Ramadan Hours Tab */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4}>
                            <Box flex={1}>
                              <Text fontSize="sm" mb={1} fontWeight="bold">
                                {t("Heure d'entrée")}
                              </Text>
                              <Input
                                type="time"
                                value={
                                  ramadanConfig?.departments[selectedDeptName]
                                    ?.start_time ?? ""
                                }
                                onChange={(e) =>
                                  handleDepartmentFieldChange(
                                    "ramadan",
                                    selectedDeptName,
                                    "start_time",
                                    e.target.value,
                                  )
                                }
                                bg="white"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text fontSize="sm" mb={1} fontWeight="bold">
                                {t("Heure de sortie")}
                              </Text>
                              <Input
                                type="time"
                                value={
                                  ramadanConfig?.departments[selectedDeptName]
                                    ?.end_time ?? ""
                                }
                                onChange={(e) =>
                                  handleDepartmentFieldChange(
                                    "ramadan",
                                    selectedDeptName,
                                    "end_time",
                                    e.target.value,
                                  )
                                }
                                bg="white"
                              />
                            </Box>
                          </HStack>
                          <Flex
                            p={3}
                            bg="orange.50"
                            borderRadius="md"
                            align="center"
                          >
                            <Icon as={InfoIcon} color="orange.400" mr={2} />
                            <Text fontSize="sm" color="orange.800">
                              {t(
                                "En ramadhan, la pause est automatiquement fixée à 0 minute.",
                              )}
                            </Text>
                          </Flex>
                          <Button
                            colorScheme="blue"
                            size="sm"
                            alignSelf="flex-end"
                            onClick={saveRamadanConfig}
                            isLoading={ramadanLoading}
                          >
                            {t("Enregistrer ces horaires (Ramadhan)")}
                          </Button>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                )}
              </ModalBody>

              <ModalFooter borderTopWidth="1px" bg="gray.50">
                {deleteConfirmationStep === 0 ? (
                  <HStack
                    spacing={3}
                    width="full"
                    justifyContent="space-between"
                  >
                    <Button variant="ghost" onClick={onModalClose}>
                      {t("Fermer")}
                    </Button>
                    {!selectedDeptName ||
                    !isSystemDepartment(selectedDeptName) ? (
                      <Button
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirmationStep(1)}
                        isLoading={departmentActionLoading === selectedDeptName}
                      >
                        {t("Supprimer le département")}
                      </Button>
                    ) : (
                      <Tooltip
                        label={t(
                          "Les départements système ne peuvent pas être supprimés",
                        )}
                      >
                        <Box>
                          <Button
                            isDisabled
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<DeleteIcon />}
                          >
                            {t("Supprimer")}
                          </Button>
                        </Box>
                      </Tooltip>
                    )}
                  </HStack>
                ) : (
                  <VStack spacing={3} width="full" align="stretch">
                    <Text fontWeight="bold" color="red.600" fontSize="sm">
                      {deleteConfirmationStep === 1
                        ? t("Confirmation : Choisir la stratégie de suppression")
                        : t("Dernière confirmation requise")}
                    </Text>

                    {deleteConfirmationStep === 1 ? (
                      <>
                        <Select
                          size="sm"
                          value={deleteStrategy}
                          onChange={(e) =>
                            setDeleteStrategy(
                              e.target.value as DeleteDepartmentStrategy,
                            )
                          }
                          bg="white"
                        >
                          <option value="reassign_default">
                            {t(
                              "Réaffecter les employés au département par défaut",
                            )}
                          </option>
                          <option value="delete">
                            {t("Supprimer définitivement tous les employés")}
                          </option>
                        </Select>
                        <HStack spacing={3} justifyContent="flex-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmationStep(0)}
                          >
                            {t("Annuler")}
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => setDeleteConfirmationStep(2)}
                          >
                            {t("Continuer")}
                          </Button>
                        </HStack>
                      </>
                    ) : (
                      <HStack
                        spacing={3}
                        justifyContent="space-between"
                        bg="red.50"
                        p={2}
                        borderRadius="md"
                      >
                        <Text fontSize="xs" color="red.800">
                          {t(
                            "Êtes-vous certain de vouloir supprimer \"{{department}}\" ? Cette action est irréversible.",
                            { department: selectedDeptName },
                          )}
                        </Text>
                        <HStack>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeleteConfirmationStep(1)}
                          >
                            {t("Retour")}
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={async () => {
                              if (selectedDeptName) {
                                await deleteDepartment(
                                  selectedDeptName,
                                  deleteStrategy,
                                );
                                onModalClose();
                              }
                            }}
                          >
                            {t("Confirmer définitivement")}
                          </Button>
                        </HStack>
                      </HStack>
                    )}
                  </VStack>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Container>
      </VStack>
    </Box>
  );
}


