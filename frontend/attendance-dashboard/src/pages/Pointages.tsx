// import {
//   Box,
//   Container,
//   Heading,
//   SimpleGrid,
//   VStack,
//   Text,
//   Spinner,
//   Badge,
//   Button,
//   HStack,
//   Divider,
// } from "@chakra-ui/react";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// /* -------------------- Types -------------------- */

// type Employee = {
//   employee_id: number;
//   employee_name: string;
//   status: "present" | "absent";
//   check_in_time: string | null;
//   check_out_time: string | null;
//   anomalies: string[];
//   late_minutes?: number;
//   extra_hours?: number;
// };

// type DashboardData = {
//   date: string;
//   global: {
//     total_employees: number;
//     present_today: number;
//     absent_today: number;
//     attendance_rate: number;
//   };
//   employees: Employee[];
// };

// /* -------------------- Stat Card -------------------- */

// const StatCard = ({
//   label,
//   value,
//   onClick,
// }: {
//   label: string;
//   value: string | number;
//   onClick?: () => void;
// }) => (
//   <Box
//     bg="white"
//     p={6}
//     borderRadius="lg"
//     boxShadow="sm"
//     cursor={onClick ? "pointer" : "default"}
//     _hover={onClick ? { transform: "translateY(-2px)", boxShadow: "lg" } : {}}
//     onClick={onClick}
//   >
//     <Text fontSize="sm" color="gray.600" mb={2}>
//       {label}
//     </Text>
//     <Text fontSize="2xl" fontWeight="bold">
//       {value}
//     </Text>
//   </Box>
// );

// /* -------------------- Daily Alerts -------------------- */

// function DailyAlerts({ employees }: { employees: Employee[] }) {
//   if (employees.length === 0) {
//     return <Text color="gray.500">No alerts today 🎉</Text>;
//   }

//   return (
//     <VStack spacing={4} align="stretch">
//       {employees.map(emp => (
//         <Box
//           key={emp.employee_id}
//           p={4}
//           borderRadius="md"
//           border="1px solid"
//           borderColor="red.200"
//           bg="red.50"
//         >
//           <Text fontWeight="bold">{emp.employee_name}</Text>

//           <HStack mt={2} spacing={2} wrap="wrap">
//             {emp.status === "absent" && (
//               <Badge colorScheme="red">Absent</Badge>
//             )}

//             {emp.anomalies.includes("entree_sans_sortie") && (
//               <Badge colorScheme="orange">Missing check-out</Badge>
//             )}

//             {emp.anomalies.includes("sortie_sans_entree") && (
//               <Badge colorScheme="purple">Missing check-in</Badge>
//             )}

//             {emp.anomalies.includes("retard") && (
//               <Badge colorScheme="yellow">
//                 Late ({emp.late_minutes} min)
//               </Badge>
//             )}

//             {emp.extra_hours && emp.extra_hours > 0 && (
//               <Badge colorScheme="blue">
//                 Extra hours +{emp.extra_hours}h
//               </Badge>
//             )}
//           </HStack>

//           <Divider my={3} />

//           {/* Actions */}
//           <HStack spacing={3}>
//             <Button
//               size="sm"
//               colorScheme="blue"
//               onClick={() =>
//                 console.log("Manual punch for", emp.employee_id)
//               }
//             >
//               Manual punch
//             </Button>

//             <Button
//               size="sm"
//               colorScheme="red"
//               variant="outline"
//               onClick={() =>
//                 console.log("Mark absent", emp.employee_id)
//               }
//             >
//               Mark absent
//             </Button>

//             {emp.anomalies.includes("retard") && (
//               <Button
//                 size="sm"
//                 colorScheme="yellow"
//                 variant="outline"
//                 onClick={() =>
//                   console.log("Confirm late", emp.employee_id)
//                 }
//               >
//                 Confirm late
//               </Button>
//             )}
//           </HStack>
//         </Box>
//       ))}
//     </VStack>
//   );
// }

// /* -------------------- Page -------------------- */

// export default function Pointages() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   const [dashboard, setDashboard] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();

//   /* -------------------- Fetch data -------------------- */

//   useEffect(() => {
//     const TEST_DATE = "2026-01-26";

//     fetch(
//       `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${TEST_DATE}`
//     )
//       .then(res => res.json())
//       .then(data => {
//         setDashboard(data);
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error("Dashboard fetch error:", err);
//         setLoading(false);
//       });
//   }, []);

//   if (loading) return <Spinner size="lg" />;

//   const alertEmployees =
//     dashboard?.employees.filter(
//       emp => emp.status === "absent" || emp.anomalies.length > 0
//     ) ?? [];

//   /* -------------------- Render -------------------- */

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <VStack flex={1} spacing={0} ml={["0", "250px"]}>
//         <Navbar />

//         <Container maxW="100%" flex={1} p={6}>
//           <Heading mb={2}>Attendance Dashboard</Heading>
//           <Text color="gray.500" mb={6}>
//             Date: {dashboard?.date}
//           </Text>

//           {/* -------- STATS -------- */}
//           <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
//             <StatCard
//               label="Total Employees"
//               value={dashboard?.global.total_employees ?? 0}
//               onClick={() => navigate("/employeesToday")}
//             />
//             <StatCard
//               label="Present Today"
//               value={dashboard?.global.present_today ?? 0}
//               onClick={() =>
//                 navigate("/employeesToday?filter=present")
//               }
//             />
//             <StatCard
//               label="Absent Today"
//               value={dashboard?.global.absent_today ?? 0}
//               onClick={() =>
//                 navigate("/employeesToday?filter=absent")
//               }
//             />
//             <StatCard
//               label="Attendance Rate"
//               value={`${dashboard?.global.attendance_rate ?? 0}%`}
//             />
//           </SimpleGrid>

//           {/* -------- ALERTS -------- */}
//           <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//             <Heading size="md" mb={6}>
//               Daily Alerts
//             </Heading>

//             <DailyAlerts employees={alertEmployees} />
//           </Box>
//         </Container>
//       </VStack>
//     </Box>
//   );
// }

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
  Divider,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

function DailyAlerts({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return <Text color="gray.500">No alerts 🎉</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      {employees.map(emp => (
      <Box
  key={emp.employee_id}
  p={4}
  borderRadius="md"
  border="1px solid"
  borderColor="red.200"
  bg="red.50"
>
  <Text fontWeight="bold">{emp.employee_name}</Text>

  {/* Ligne Statut + Actions */}
  <HStack mt={3} justify="space-between" align="start" wrap="wrap">
    
    {/* Status & Anomalies */}
    <HStack spacing={2} wrap="wrap">
      {emp.status === "absent" && (
        <Badge colorScheme="red">Absent</Badge>
      )}

      {emp.anomalies.includes("entree_sans_sortie") && (
        <Badge colorScheme="orange">Missing check-out</Badge>
      )}

      {emp.anomalies.includes("sortie_sans_entree") && (
        <Badge colorScheme="purple">Missing check-in</Badge>
      )}

      {emp.anomalies.includes("retard") && (
        <Badge colorScheme="yellow">
          Late ({emp.late_minutes} min)
        </Badge>
      )}

      {emp.extra_hours && emp.extra_hours > 0 && (
        <Badge colorScheme="blue">
          Extra hours +{emp.extra_hours}h
        </Badge>
      )}
    </HStack>

    {/* Actions */}
    <HStack spacing={2} wrap="wrap">
      <Button
        size="sm"
        colorScheme="blue"
        onClick={() =>
          console.log("Manual punch for", emp.employee_id)
        }
      >
        Manual punch
      </Button>

      <Button
        size="sm"
        colorScheme="red"
        variant="outline"
        onClick={() =>
          console.log("Mark absent", emp.employee_id)
        }
      >
        Mark absent
      </Button>

      {emp.anomalies.includes("retard") && (
        <Button
          size="sm"
          colorScheme="yellow"
          variant="outline"
          onClick={() =>
            console.log("Confirm late", emp.employee_id)
          }
        >
          Confirm late
        </Button>
      )}
    </HStack>

  </HStack>
</Box>

      ))}
    </VStack>
  );
}

/* -------------------- Page -------------------- */

export default function Pointages() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  /* -------------------- Fetch data -------------------- */

  useEffect(() => {
    const TEST_DATE = "2026-01-26";

    fetch(
      `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${TEST_DATE}`
    )
      .then(res => res.json())
      .then(data => {
        setDashboard(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner size="lg" />;

  /* -------------------- Alert categories -------------------- */

  const negativeAlerts =
    dashboard?.employees.filter(
      emp =>
        emp.status === "absent" ||
        emp.anomalies.length > 0
    ) ?? [];

  const positiveAlerts =
    dashboard?.employees.filter(
      emp => emp.extra_hours && emp.extra_hours > 0
    ) ?? [];

  /* -------------------- Render -------------------- */

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={2}>Attendance dashboard</Heading>
          <Text color="gray.500" mb={6}>
            Date: {dashboard?.date}
          </Text>

          {/* -------- STATS -------- */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <StatCard
              label="Total Employees"
              value={dashboard?.global.total_employees ?? 0}
              onClick={() => navigate("/employeesToday")}
            />
            <StatCard
              label="Present Today"
              value={dashboard?.global.present_today ?? 0}
              onClick={() =>
                navigate("/employeesToday?filter=present")
              }
            />
            <StatCard
              label="Absent Today"
              value={dashboard?.global.absent_today ?? 0}
              onClick={() =>
                navigate("/employeesToday?filter=absent")
              }
            />
            <StatCard
              label="Attendance Rate"
              value={`${dashboard?.global.attendance_rate ?? 0}%`}
            />
          </SimpleGrid>

          {/* -------- ALERTS -------- */}
      <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
  <Heading size="md" mb={6}>
    Daily Alerts
  </Heading>

  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
    
    {/* 🚨 Alertes négatives */}
    <Box>
      <Heading size="sm" mb={3} color="red.500">
        🚨 Alertes de pointage
      </Heading>

      <DailyAlerts employees={negativeAlerts} />
    </Box>

    {/* ✅ Heures supplémentaires */}
    <Box>
      <Heading size="sm" mb={3} color="blue.500">
        ✅ Heures supplémentaires
      </Heading>

      {positiveAlerts.length > 0 ? (
        <DailyAlerts employees={positiveAlerts} />
      ) : (
        <Text color="gray.500">
          Aucun employé en heures supplémentaires
        </Text>
      )}
    </Box>

  </SimpleGrid>
</Box>

        </Container>
      </VStack>
    </Box>
  );
}




