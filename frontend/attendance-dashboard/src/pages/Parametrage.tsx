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
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { CloseIcon } from "@chakra-ui/icons/Close";
import { HamburgerIcon } from "@chakra-ui/icons/Hamburger";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { getCurrentDate } from "../../utils";

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

  const fetchRules = useCallback((year: number) => {
    setRulesLoading(true);
    setNormalLoading(true);
    setRamadanLoading(true);

    Promise.all([
      fetch("http://127.0.0.1:8000/api/v1/attendance/dashboard/day-rules").then(
        (res) => res.json(),
      ),
      fetch(
        `http://127.0.0.1:8000/api/v1/attendance/dashboard/special-days?start_date=${year}-01-01&end_date=${year}-12-31`,
      ).then((res) => res.json()),
      fetch(
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/normal-config",
      ).then((res) => res.json()),
      fetch(
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/ramadan-config",
      ).then((res) => res.json()),
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
      await fetch(
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/day-rules",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ include_sunday: value }),
        },
      );
      fetchRules(selectedYear);
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
        title: "Jour special enregistre",
        status: "success",
        duration: 1800,
        isClosable: true,
      });
      fetchRules(selectedYear);
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
    setter((prev) => ({
      ...(prev || { start_date: null, end_date: null, departments: {} }),
      [field]: value || null,
    }));
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

      const nextValue =
        field === "pause_minutes" ? Number(value || 0) : value;

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
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/normal-config",
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
        title: "Horaires normaux enregistres",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to save normal config", err);
      toast({
        title: "Erreur lors de l'enregistrement des horaires normaux",
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
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/ramadan-config",
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
        title: "Horaires de ramadhan enregistres",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to save ramadan config", err);
      toast({
        title: "Erreur lors de l'enregistrement des horaires de ramadhan",
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
        title: "Veuillez remplir le nom et les horaires",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/attendance/dashboard/departments",
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
        title: "Departement enregistre",
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
        title: "Erreur lors de la creation du departement",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      console.error("Failed to add department", err);
    }
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
        zIndex={1600}
      />

      <VStack flex={1} spacing={0} ml={["0", "250px"]} w="full">
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={2}>Parametrage</Heading>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
            <HStack justify="space-between" mb={4} wrap="wrap">
              <Heading size="md">Jours speciaux</Heading>
              <HStack>
                <Text fontSize="sm">Annee</Text>
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
              <Text>Inclure automatiquement le dimanche comme non ouvrable</Text>
              <Switch
                isChecked={rules?.include_sunday ?? true}
                onChange={(e) => updateIncludeSunday(e.target.checked)}
              />
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
                  <option value="holiday">Jour ferie</option>
                  <option value="remote_day">Jour a distance</option>
                </Select>
              </Box>
              <Box flex={1} minW="220px">
                <Text fontSize="sm" mb={1}>
                  Libelle (optionnel)
                </Text>
                <Input
                  value={newSpecialLabel}
                  onChange={(e) => setNewSpecialLabel(e.target.value)}
                  placeholder="Ex: Fete nationale"
                  size="sm"
                  bg="white"
                />
              </Box>
              <Button colorScheme="blue" size="sm" onClick={addSpecialDay}>
                Ajouter / Mettre a jour
              </Button>
            </HStack>

            <VStack align="stretch" spacing={2}>
              {(rules?.special_days ?? []).length === 0 && (
                <Text color="gray.500" fontSize="sm">
                  Aucun jour special configure.
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
                        {item.type === "holiday" ? "Jour ferie" : "Jour a distance"}
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

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
            <Heading size="sm" mb={2}>
              Ajouter un departement
            </Heading>
            <Text fontSize="sm" color="gray.600" mb={4}>
              Le departement est ajoute aux horaires normaux et ramadhan. Vous pourrez
              ensuite personnaliser chaque section separatement.
            </Text>
            <HStack spacing={3} wrap="wrap" align="end">
              <Box minW="220px">
                <Text fontSize="sm" mb={1}>
                  Nom du departement
                </Text>
                <Input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Ex: logistique"
                  size="sm"
                  bg="white"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Heure d'entree (par defaut)
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
                <Text fontSize="sm" mb={1}>
                  Heure de sortie (par defaut)
                </Text>
                <Input
                  type="time"
                  value={newDepartmentEndTime}
                  onChange={(e) => setNewDepartmentEndTime(e.target.value)}
                  size="sm"
                  bg="white"
                />
              </Box>
              <Button colorScheme="blue" size="sm" onClick={addDepartment}>
                Ajouter departement
              </Button>
            </HStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={8}>
            <HStack justify="space-between" mb={4} wrap="wrap">
              <Heading size="md">Horaires des jours normaux</Heading>
              {normalLoading && <Spinner size="sm" />}
            </HStack>

            <HStack mb={4} spacing={3} wrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>
                  Date de debut
                </Text>
                <Input
                  type="date"
                  value={normalConfig?.start_date ?? ""}
                  onChange={(e) =>
                    handlePeriodFieldChange("normal", "start_date", e.target.value)
                  }
                  bg="white"
                  size="sm"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Date de fin
                </Text>
                <Input
                  type="date"
                  value={normalConfig?.end_date ?? ""}
                  onChange={(e) =>
                    handlePeriodFieldChange("normal", "end_date", e.target.value)
                  }
                  bg="white"
                  size="sm"
                />
              </Box>
            </HStack>

            <Divider my={4} />

            <VStack align="stretch" spacing={4}>
              {Object.entries(normalConfig?.departments ?? {}).map(
                ([deptName, deptCfg]) => (
                  <Box key={`normal-${deptName}`}>
                    <Heading size="sm" mb={2}>
                      {deptName}
                    </Heading>
                    <HStack spacing={3} wrap="wrap">
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Heure d'entree
                        </Text>
                        <Input
                          type="time"
                          value={deptCfg?.start_time ?? ""}
                          onChange={(e) =>
                            handleDepartmentFieldChange(
                              "normal",
                              deptName,
                              "start_time",
                              e.target.value,
                            )
                          }
                          size="sm"
                          bg="white"
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Heure de sortie
                        </Text>
                        <Input
                          type="time"
                          value={deptCfg?.end_time ?? ""}
                          onChange={(e) =>
                            handleDepartmentFieldChange(
                              "normal",
                              deptName,
                              "end_time",
                              e.target.value,
                            )
                          }
                          size="sm"
                          bg="white"
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Pause (minutes)
                        </Text>
                        <Input
                          type="number"
                          min={0}
                          value={deptCfg?.pause_minutes ?? 0}
                          onChange={(e) =>
                            handleDepartmentFieldChange(
                              "normal",
                              deptName,
                              "pause_minutes",
                              e.target.value,
                            )
                          }
                          size="sm"
                          bg="white"
                          w="140px"
                        />
                      </Box>
                    </HStack>
                  </Box>
                ),
              )}
            </VStack>

            <Button mt={6} colorScheme="blue" size="sm" onClick={saveNormalConfig}>
              Enregistrer les horaires normaux
            </Button>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <HStack justify="space-between" mb={4} wrap="wrap">
              <Heading size="md">Horaires de ramadhan</Heading>
              {ramadanLoading && <Spinner size="sm" />}
            </HStack>

            <HStack mb={2} spacing={3} wrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>
                  Date de debut
                </Text>
                <Input
                  type="date"
                  value={ramadanConfig?.start_date ?? ""}
                  onChange={(e) =>
                    handlePeriodFieldChange("ramadan", "start_date", e.target.value)
                  }
                  bg="white"
                  size="sm"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Date de fin
                </Text>
                <Input
                  type="date"
                  value={ramadanConfig?.end_date ?? ""}
                  onChange={(e) =>
                    handlePeriodFieldChange("ramadan", "end_date", e.target.value)
                  }
                  bg="white"
                  size="sm"
                />
              </Box>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              En ramadhan la pause est automatiquement fixee a 0 minute.
            </Text>

            <Divider my={4} />

            <VStack align="stretch" spacing={4}>
              {Object.entries(ramadanConfig?.departments ?? {}).map(
                ([deptName, deptCfg]) => (
                  <Box key={`ramadan-${deptName}`}>
                    <Heading size="sm" mb={2}>
                      {deptName}
                    </Heading>
                    <HStack spacing={3} wrap="wrap" align="end">
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Heure d'entree
                        </Text>
                        <Input
                          type="time"
                          value={deptCfg?.start_time ?? ""}
                          onChange={(e) =>
                            handleDepartmentFieldChange(
                              "ramadan",
                              deptName,
                              "start_time",
                              e.target.value,
                            )
                          }
                          size="sm"
                          bg="white"
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>
                          Heure de sortie
                        </Text>
                        <Input
                          type="time"
                          value={deptCfg?.end_time ?? ""}
                          onChange={(e) =>
                            handleDepartmentFieldChange(
                              "ramadan",
                              deptName,
                              "end_time",
                              e.target.value,
                            )
                          }
                          size="sm"
                          bg="white"
                        />
                      </Box>
                      <Badge colorScheme="orange" alignSelf="center">
                        Pause: 0 min
                      </Badge>
                    </HStack>
                  </Box>
                ),
              )}
            </VStack>

            <Button mt={6} colorScheme="blue" size="sm" onClick={saveRamadanConfig}>
              Enregistrer les horaires de ramadhan
            </Button>
          </Box>
        </Container>
      </VStack>
    </Box>
  );
}
