import {
  Box,
  Heading,
  Spinner,
  Input,
  IconButton,
  Collapse,
  HStack,
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
  weekendHours: number;
}

export default function WeekendHoursByEmployeeChart() {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/attendance/metrics/weekend`
        );

        const chartData = res.data.map((emp: any) => ({
          name: emp.employee_name,
          weekendHours: Math.round(emp.weekend_hours_worked * 100) / 100,
        }));

        setData(chartData);
      } catch (err) {
        console.error("Weekend KPI fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = data.filter((emp) =>
    emp.name.toLowerCase().includes(filterName.toLowerCase())
  );

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
        Heures travaillées le week-end
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

      <Collapse in={expanded} animateOpacity>
        <HStack mb={4} spacing={2}>
          <Input
            placeholder="Filtrer par employé..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </HStack>
      </Collapse>

      <ResponsiveContainer width="100%" height={expanded ? 500 : 250}>
        <BarChart data={filteredData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [`${value} h`, "Heures week-end"]}
          />
          <Bar dataKey="weekendHours">
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.weekendHours > 12
                    ? "#E53E3E" // surcharge
                    : "#3182CE" // normal
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
