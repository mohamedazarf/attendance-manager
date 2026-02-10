// import {
//   Box,
//   Container,
//   Heading,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   Badge,
//   Spinner,
//   VStack,
//   ButtonGroup,
//   Button,
// } from "@chakra-ui/react";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";
// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// type Employee = {
//   employee_id: number;
//   employee_name: string;
//   status: "present" | "absent";
//   check_in_time: string | null;
//   check_out_time: string | null;
//   worked_hours: number;
//   is_late: boolean;
//   late_minutes: number | null;
//   anomalies: string[]; // new field for anomalies
// };

// type DashboardData = {
//   date: string;
//   employees: Employee[];
// };

// export default function EmployeesToday() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   const [dashboard, setDashboard] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const params = new URLSearchParams(location.search);
//   const urlFilter = params.get("filter") as "all" | "present" | "absent" | null;

//   // -------------------- STATE HYBRIDE --------------------
//   const [filterState, setFilterState] = useState<"all" | "present" | "absent">(urlFilter ?? "all");

//   // Sync URL → state si l’URL change
//   useEffect(() => {
//     if (urlFilter && urlFilter !== filterState) {
//       setFilterState(urlFilter);
//     }
//   }, [urlFilter]);

//   // -------------------- Fetch data --------------------
//   useEffect(() => {
//     const today = "2026-01-26";

//     fetch(`http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${today}`)
//       .then((res) => res.json())
//       .then((data) => {
//         setDashboard(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Dashboard fetch error:", err);
//         setLoading(false);
//       });
//   }, []);

//   const filteredEmployees = dashboard?.employees
//     // remove duplicates just in case
//     .filter((emp, idx, arr) => arr.findIndex(e => e.employee_id === emp.employee_id) === idx)
//     .filter((emp) => {
//       if (filterState === "present") return emp.status === "present";
//       if (filterState === "absent") return emp.status === "absent";
//       return true;
//     });

//   if (loading) return <Spinner size="lg" />;

//   // -------------------- Changement de filtre --------------------
//   const handleFilterChange = (newFilter: "all" | "present" | "absent") => {
//     setFilterState(newFilter); // update local state
//     navigate(`/employeesToday?filter=${newFilter}`); // update URL
//   };

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <VStack flex={1} spacing={0} ml={["0", "250px"]}>
//         <Navbar />

//         <Container maxW="100%" flex={1} p={6}>
//           <Heading mb={4}>
//             {filterState === "present"
//               ? "Present Employees"
//               : filterState === "absent"
//               ? "Absent Employees"
//               : "All Employees Today"}
//           </Heading>

//           {/* -------------------- Filters -------------------- */}
//           <ButtonGroup mb={4}>
//             <Button
//               colorScheme={filterState === "all" ? "yellow" : "gray"}
//               onClick={() => handleFilterChange("all")}
//             >
//               All
//             </Button>
//             <Button
//               colorScheme={filterState === "present" ? "green" : "gray"}
//               onClick={() => handleFilterChange("present")}
//             >
//               Present
//             </Button>
//             <Button
//               colorScheme={filterState === "absent" ? "red" : "gray"}
//               onClick={() => handleFilterChange("absent")}
//             >
//               Absent
//             </Button>
//           </ButtonGroup>

//           {/* -------------------- Table -------------------- */}
//           <Table size="sm">
//             <Thead>
//               <Tr>
//                 <Th>Name</Th>
//                 <Th>Status</Th>
//                 <Th>Check-in</Th>
//                 <Th>Check-out</Th>
//                 <Th>Worked Hours</Th>
//                 <Th>Late</Th>
//                 <Th>late minutes</Th>
//                 <Th>Anomalies</Th>
//               </Tr>
//             </Thead>
//             <Tbody>
//               {filteredEmployees?.map((emp) => (
//                 <Tr
//                   key={emp.employee_id}
//                   cursor="pointer"
//                   _hover={{ bg: "gray.100" }}
//                   onClick={() => navigate(`/employee/${emp.employee_id}`)}
//                 >
//                   <Td>{emp.employee_name}</Td>
//                   <Td>
//                     <Badge colorScheme={emp.status === "present" ? "green" : "red"}>
//                       {emp.status}
//                     </Badge>
//                   </Td>
//                   <Td>{emp.check_in_time ? emp.check_in_time.split("T")[1] : "-"}</Td>
//                   <Td>{emp.check_out_time ? emp.check_out_time.split("T")[1] : "-"}</Td>
//                   <Td>{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
//                   <Td>{emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}</Td>
//                   <Td>{emp.late_minutes ? emp.late_minutes : "-"}</Td>
//                   <Td>
//                     {emp.anomalies.length > 0
//                       ? emp.anomalies.join(", ")
//                       : "-"}
//                   </Td>
//                 </Tr>
//               ))}
//             </Tbody>
//           </Table>
//         </Container>
//       </VStack>
//     </Box>
//   );
// }


import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  VStack,
  ButtonGroup,
  Button,
  HStack,
  Text,
  Flex
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
  worked_hours: number;
  is_late: boolean;
  late_minutes: number;
  anomalies: string[];
};

type DashboardData = {
  date: string;
  employees: Employee[];
};

// Map pour colorier les anomalies
const anomalyColors: Record<string, string> = {
  retard: "orange",
  early_departure: "red",
  incomplete_day: "yellow",
  entree_sans_sortie: "purple",
  sortie_sans_entree: "teal",
};

export default function EmployeesToday() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlFilter = params.get("filter") as string | null;

  // Filtre principal (all/present/absent/late)
  const [filterState, setFilterState] = useState<"all" | "present" | "absent" | "late">(urlFilter as any ?? "all");

  // Filtre par anomalies spécifiques
  const [anomalyFilter, setAnomalyFilter] = useState<string>("all");
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);
const toggleAnomaly = (anom: string) => {
  setSelectedAnomalies(prev =>
    prev.includes(anom)
      ? prev.filter(a => a !== anom) // remove if already selected
      : [...prev, anom] // add if not selected
  );
};

  useEffect(() => {
    if (urlFilter && urlFilter !== filterState) {
      setFilterState(urlFilter as any);
    }
  }, [urlFilter]);

  // Fetch dashboard
  useEffect(() => {
    const today = "2026-01-26";

    fetch(`http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${today}`)
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

  // Filtrer les employés
  const filteredEmployees = dashboard?.employees
    .filter((emp, idx, arr) => arr.findIndex(e => e.employee_id === emp.employee_id) === idx)
    .filter((emp) => {
      if (filterState === "present") return emp.status === "present";
      if (filterState === "absent") return emp.status === "absent";
      if (filterState === "late") return emp.is_late;
      return true;
    })
    .filter((emp) => {
      if (selectedAnomalies.length === 0) return true;
      return emp.anomalies.some(a => selectedAnomalies.includes(a));
    });

  if (loading) return <Spinner size="lg" />;

  // -------------------- Changement de filtre --------------------
  const handleFilterChange = (newFilter: "all" | "present" | "absent" | "late") => {
    setFilterState(newFilter);
    navigate(`/employeesToday?filter=${newFilter}`);
  };

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />
        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={4}>
            {filterState === "present"
              ? "Present Employees"
              : filterState === "absent"
              ? "Absent Employees"
              : filterState === "late"
              ? "Late Employees"
              : "All Employees Today"}
          </Heading>
             <Text color="gray.500" mb={6}>
                      Date: {"2026-01-26"}
              </Text>

 
<Flex
  mb={4}
  align="center"
  justify="space-between"
  wrap="wrap"
  gap={4}
>
  {/* ----- Filtre statut ----- */}
  <ButtonGroup>
    <Button
      colorScheme={filterState === "all" ? "yellow" : "gray"}
      onClick={() => handleFilterChange("all")}
    >
      All
    </Button>
    <Button
      colorScheme={filterState === "present" ? "green" : "gray"}
      onClick={() => handleFilterChange("present")}
    >
      Present
    </Button>
    <Button
      colorScheme={filterState === "absent" ? "red" : "gray"}
      onClick={() => handleFilterChange("absent")}
    >
      Absent
    </Button>
    <Button
      colorScheme={filterState === "late" ? "orange" : "gray"}
      onClick={() => handleFilterChange("late")}
    >
      Late
    </Button>
  </ButtonGroup>

  {/* ----- Filtre anomalies ----- */}
  <HStack spacing={2}>
    <Button
      colorScheme={anomalyFilter === "all" ? "yellow" : "gray"}
      size="sm"
      onClick={() => setAnomalyFilter("all")}
    >
      All Anomalies
    </Button>

    {Object.keys(anomalyColors).map((anom) => (
      <Button
        key={anom}
        colorScheme={selectedAnomalies.includes(anom) ? "blue" : "gray"}
        size="sm"
        onClick={() => toggleAnomaly(anom)}
      >
        {anom.replace("_", " ")}
      </Button>
    ))}
  </HStack>
</Flex>


          {/* -------------------- Table -------------------- */}
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Check-in</Th>
                <Th>Check-out</Th>
                <Th>Worked Hours</Th>
                <Th>Late</Th>
                <Th>Late Minutes</Th>
                <Th>Anomalies</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredEmployees?.map((emp) => (
                <Tr
                  key={emp.employee_id}
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => navigate(`/employee/${emp.employee_id}`)}
                >
                  <Td>{emp.employee_name}</Td>
                  <Td>
                    <Badge colorScheme={emp.status === "present" ? "green" : "red"}>{emp.status}</Badge>
                  </Td>
                  <Td>{emp.check_in_time ? emp.check_in_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.check_out_time ? emp.check_out_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
                  <Td>{emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}</Td>
                  <Td>{emp.late_minutes || "-"}</Td>
                  <Td>
                    {emp.anomalies.length
                      ? emp.anomalies.map((a) => (
                          <Badge key={a} colorScheme={anomalyColors[a] || "gray"} mr={1}>
                            {a.replace("_", " ")}
                          </Badge>
                        ))
                      : "-"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Container>
      </VStack>
    </Box>
  );
}

