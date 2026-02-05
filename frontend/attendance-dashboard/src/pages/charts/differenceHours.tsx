// EmployeeHoursChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList
} from "recharts";

// Sample data
const attendanceData = [
  {
    user_id: 4,
    employee_name: "Leila Mansouri",
    hours_difference: -0.77
  },
  {
    user_id: 2,
    employee_name: "Sara Trabelsi",
    hours_difference: -1.21
  },
  {
    user_id: 5,
    employee_name: "Mohamed Aziz Arfaoui",
    hours_difference: -0.94
  },
  {
    user_id: 1,
    employee_name: "Ahmed Ben Ali",
    hours_difference: -1.48
  },
  {
    user_id: 3,
    employee_name: "Masri.Mohamed",
    hours_difference: -1.37
  }
];

// Sort descending by hours_difference (largest negative first)
const sortedData = [...attendanceData].sort((a, b) => a.hours_difference - b.hours_difference);

const hoursDifference = () => {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <h2>Employees with Most Hours Difference</h2>
      <ResponsiveContainer>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="employee_name" />
          <Tooltip formatter={(value) => `${value} hrs`} />
          <Bar dataKey="hours_difference" fill="#ff4d4f">
            <LabelList dataKey="hours_difference" position="right" formatter={(val) => `${val}h`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default hoursDifference;
