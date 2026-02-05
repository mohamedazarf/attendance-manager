import { Box, Heading, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const BASE_URL = "http://localhost:8000/api/v1";

const COLORS = ["#E53E3E", "#38A169", "#3182CE", "#D69E2E", "#805AD5"];

interface AnomalyData {
  name: string;
  value: number;
}

export default function MostAnomaliesPieChart() {
  const [data, setData] = useState<AnomalyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/attendance/report-mock`);
        const employees = res.data.data;

        const anomalyCounts: Record<string, number> = {};

        employees.forEach((emp: any) => {
          emp.daily_records.forEach((record: any) => {
            record.anomalies.forEach((anomaly: string) => {
              if (!anomalyCounts[anomaly]) anomalyCounts[anomaly] = 0;
              anomalyCounts[anomaly] += 1;
            });
          });
        });

        const chartData: AnomalyData[] = Object.entries(anomalyCounts).map(
          ([name, value]) => ({ name, value })
        );

        setData(chartData);
      } catch (err) {
        console.error("Pie chart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Spinner size="xl" />;

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm">
      <Heading size="md" mb={4}>
        Répartition des anomalies
      </Heading>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
