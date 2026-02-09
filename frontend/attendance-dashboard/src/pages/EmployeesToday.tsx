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


//   const location = useLocation();
//   const navigate = useNavigate();
//   const params = new URLSearchParams(location.search);
//   const filter = params.get("filter"); // "all" | "present" | "absent"

//   useEffect(() => {
//     // const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD
//     const today="2026-01-26"

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

//   const filteredEmployees = dashboard?.employees.filter((emp) => {
//     if (filter === "present") return emp.status === "present";
//     if (filter === "absent") return emp.status === "absent";
//     return true; // all
//   });

//   if (loading) return <Spinner size="lg" />;

//   const handleFilterChange = (newFilter: "all" | "present" | "absent") => {
//     navigate(`/employeesToday?filter=${newFilter}`);
//   };

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <VStack flex={1} spacing={0} ml={["0", "250px"]}>
//         <Navbar />

//         <Container maxW="100%" flex={1} p={6}>
//           <Heading mb={4}>
//             {/* {filter === "present"
//               ? "Present Employees"
//               : filter === "absent"
//               ? "Absent Employees"
//               : "All Employees Today"} */}
//               Employees today
//           </Heading>
//  {/* -------------------- Filters -------------------- */}
//           <ButtonGroup mb={4}>
//             <Button
//               colorScheme={filter === "all" ? "yellow" : "gray"}
//             onClick={() => handleFilterChange("all")}
//             >
//               All
//             </Button>
//             <Button
//               colorScheme={filter === "present" ? "green" : "gray"}
//               onClick={() => handleFilterChange("present")}
//             >
//               Present
//             </Button>
//             <Button
//               colorScheme={filter === "absent" ? "red" : "gray"}
//               onClick={() => handleFilterChange("absent")}
//             >
//               Absent
//             </Button>
//           </ButtonGroup>
//           <Table size="sm">
//             <Thead>
//               <Tr>
//                 <Th>Name</Th>
//                 <Th>Status</Th>
//                 <Th>Check-in</Th>
//                 <Th>Check-out</Th>
//                 <Th>Worked Hours</Th>
//                 <Th>Late</Th>
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
//                   <Td>{emp.check_in_time ?? "-"}</Td>
//                   <Td>{emp.check_out_time ?? "-"}</Td>
//                   <Td>{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
//                   <Td>
//                     {emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}
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
};

type DashboardData = {
  date: string;
  employees: Employee[];
};

export default function EmployeesToday() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlFilter = params.get("filter") as "all" | "present" | "absent" | null;

  // -------------------- STATE HYBRIDE --------------------
  const [filterState, setFilterState] = useState<"all" | "present" | "absent">(urlFilter ?? "all");

  // Sync URL → state si l’URL change
  useEffect(() => {
    if (urlFilter && urlFilter !== filterState) {
      setFilterState(urlFilter);
    }
  }, [urlFilter]);

  // -------------------- Fetch data --------------------
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

  const filteredEmployees = dashboard?.employees
    // remove duplicates just in case
    .filter((emp, idx, arr) => arr.findIndex(e => e.employee_id === emp.employee_id) === idx)
    .filter((emp) => {
      if (filterState === "present") return emp.status === "present";
      if (filterState === "absent") return emp.status === "absent";
      return true;
    });

  if (loading) return <Spinner size="lg" />;

  // -------------------- Changement de filtre --------------------
  const handleFilterChange = (newFilter: "all" | "present" | "absent") => {
    setFilterState(newFilter); // update local state
    navigate(`/employeesToday?filter=${newFilter}`); // update URL
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
              : "All Employees Today"}
          </Heading>

          {/* -------------------- Filters -------------------- */}
          <ButtonGroup mb={4}>
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
          </ButtonGroup>

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
                    <Badge colorScheme={emp.status === "present" ? "green" : "red"}>
                      {emp.status}
                    </Badge>
                  </Td>
                  <Td>{emp.check_in_time ? emp.check_in_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.check_out_time ? emp.check_out_time.split("T")[1] : "-"}</Td>
                  <Td>{emp.status === "present" ? emp.worked_hours.toFixed(2) : "-"}</Td>
                  <Td>{emp.status === "present" ? (emp.is_late ? "Yes" : "No") : "-"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Container>
      </VStack>
    </Box>
  );
}

