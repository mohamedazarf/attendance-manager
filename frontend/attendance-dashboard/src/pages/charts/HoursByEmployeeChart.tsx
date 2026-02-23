import {
  Box,
  Heading,
  Spinner,
  Input,
  IconButton,
  Collapse,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

const BASE_URL = "http://localhost:8000/api/v1";

interface ChartRow {
  name: string;
  worked: number;
  expected: number;
  date?: string; // optional
}

export default function HoursByEmployeeChart() {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<ChartRow | null>(
    null
  );

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/attendance/report-mock`);
        console.log("Fetched chart data:", res.data.data);

        const chartData = res.data.data.map((emp: any) => ({
          name: emp.employee_name || "Unknown",
          worked: Math.round(emp.total_hours * 100) / 100,
          expected: emp.expected_hours || 0,
          date: emp.date || "",
        }));
        setData(chartData);
      } catch (err) {
        console.error("Chart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter by name and date
  const filteredData = data.filter((emp) => {
    const empName = emp.name || "";
    const matchesName = empName.toLowerCase().includes(filterName.toLowerCase() || "");
    const matchesDate =
      (!startDate || (emp.date && emp.date >= startDate)) &&
      (!endDate || (emp.date && emp.date <= endDate));
    return matchesName && matchesDate;
  });

  if (loading) return <Spinner size="xl" />;

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      shadow="sm"
      cursor="pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <Heading size="md" mb={4}>
        Heures travaillées vs attendues
        <IconButton
          aria-label="Toggle chart size"
          icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          ml={2}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        />
      </Heading>

      {/* Filters */}
      <Collapse in={expanded} animateOpacity>
        <HStack mb={4} spacing={2}>
          <Input
            placeholder="Filtrer par employé..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </HStack>
      </Collapse>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={expanded ? 500 : 250}>
        <BarChart data={filteredData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              if (name === "worked") {
                return [
                  `${value} h`,
                  `Travaillées (attendu: ${props.payload.expected} h)`,
                ];
              }
              return value;
            }}
          />
          <Bar dataKey="expected" fill="#CBD5E0" />
          <Bar dataKey="worked">
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.worked >= entry.expected ? "#38A169" : "#E53E3E"}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEmployee(entry);
                  onOpen();
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedEmployee.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Heures travaillées : {selectedEmployee.worked} h</Text>
              <Text>Heures attendues : {selectedEmployee.expected} h</Text>
              <Text>
                Statut :{" "}
                {selectedEmployee.worked >= selectedEmployee.expected
                  ? "✅ OK"
                  : "❌ Insuffisant"}
              </Text>
              {selectedEmployee.date && (
                <Text>Date : {selectedEmployee.date}</Text>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

