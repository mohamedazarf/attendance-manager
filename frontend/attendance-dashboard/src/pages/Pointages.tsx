// import { Box, Container, Heading, SimpleGrid, VStack, Text, IconButton } from "@chakra-ui/react";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";
// import { useState } from "react";
// import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";

// const StatCard = ({ label, value }: { label: string; value: string | number }) => (
//   <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//     <Text fontSize="sm" color="gray.600" mb={2}>{label}</Text>
//     <Text fontSize="2xl" fontWeight="bold">{value}</Text>
//   </Box>
// );

// export default function Pointages() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       {/* Sidebar */}
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>

//       <IconButton
//     icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
//     aria-label="Toggle Sidebar"
//     display={["inline-flex", "none"]} // only mobile
//     onClick={toggleSidebar}
//     position="fixed"      // fixed so it’s always on screen
//     top="4"               // spacing from top
//     left="4"              // spacing from left
//     zIndex={1500}         // higher than sidebar z-index (sidebar is 1000)
//   />

//       {/* Main content */}
//       <VStack flex={1} spacing={0} ml={["0", "250px"]}>
//         <Navbar />

//         <Container maxW="100%" flex={1} p={6}>
//           <Heading mb={6}>Attendance Dashboard</Heading>

//           <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
//             <StatCard label="Total Employees" value="0" />
//             <StatCard label="Present Today" value="0" />
//             <StatCard label="Absent Today" value="0" />
//             <StatCard label="Attendance Rate" value="0%" />
//           </SimpleGrid>

//           <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//             <Heading size="md" mb={4}>Charts coming soon...</Heading>
//           </Box>
//         </Container>
//       </VStack>
//     </Box>
//   );
// }



// import {
//   Box,
//   Container,
//   Heading,
//   SimpleGrid,
//   VStack,
//   Text,
//   IconButton,
//   Spinner
// } from "@chakra-ui/react";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";
// import { useEffect, useState } from "react";
// import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";

// const StatCard = ({ label, value }: { label: string; value: string | number }) => (
//   <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//     <Text fontSize="sm" color="gray.600" mb={2}>{label}</Text>
//     <Text fontSize="2xl" fontWeight="bold">{value}</Text>
//   </Box>
// );

// type DashboardData = {
//   date: string;
//   global: {
//     total_employees: number;
//     present_today: number;
//     absent_today: number;
//     attendance_rate: number;
//   };
// };

// export default function Pointages() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   const [dashboard, setDashboard] = useState<DashboardData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // 👇 hardcoded test date
//     const day = "2026-01-26";

//     fetch(
//       `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${day}`
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

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <IconButton
//         icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
//         aria-label="Toggle Sidebar"
//         display={["inline-flex", "none"]}
//         onClick={toggleSidebar}
//         position="fixed"
//         top="4"
//         left="4"
//         zIndex={1500}
//       />

//       <VStack flex={1} spacing={0} ml={["0", "250px"]}>
//         <Navbar />

//         <Container maxW="100%" flex={1} p={6}>
//           <Heading mb={6}>Attendance Dashboard</Heading>

//           {loading ? (
//             <Spinner size="lg" />
//           ) : (
//             <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
//               <StatCard
//                 label="Total Employees"
//                 value={dashboard?.global.total_employees ?? 0}
//               />
//               <StatCard
//                 label="Present Today"
//                 value={dashboard?.global.present_today ?? 0}
//               />
//               <StatCard
//                 label="Absent Today"
//                 value={dashboard?.global.absent_today ?? 0}
//               />
//               <StatCard
//                 label="Attendance Rate"
//                 value={`${dashboard?.global.attendance_rate ?? 0}%`}
//               />
//             </SimpleGrid>
//           )}

//           <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//             <Heading size="md" mb={4}>Charts coming soon...</Heading>
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
  IconButton,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";

/* -------------------- Stat Card -------------------- */
const StatCard = ({
  label,
  value,
  onClick
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
    _hover={onClick ? { bg: "gray.50" } : undefined}
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

/* -------------------- Types -------------------- */
type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
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

/* -------------------- Page -------------------- */
export default function Pointages() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "present" | "absent" | null
  >(null);

  /* -------------------- Fetch data -------------------- */
  useEffect(() => {
    const day = "2026-01-26"; // test day

    fetch(
      `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${day}`
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

  /* -------------------- Filter employees -------------------- */
  const filteredEmployees = dashboard?.employees.filter(emp => {
    if (selectedFilter === "present") return emp.status === "present";
    if (selectedFilter === "absent") return emp.status === "absent";
    return true;
  });

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1500}
      />

      {/* Main */}
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={6}>Attendance Dashboard</Heading>

          {loading ? (
            <Spinner size="lg" />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
              <StatCard
                label="Total Employees"
                value={dashboard?.global.total_employees ?? 0}
                onClick={() => setSelectedFilter("all")}
              />
              <StatCard
                label="Present Today"
                value={dashboard?.global.present_today ?? 0}
                onClick={() => setSelectedFilter("present")}
              />
              <StatCard
                label="Absent Today"
                value={dashboard?.global.absent_today ?? 0}
                onClick={() => setSelectedFilter("absent")}
              />
              <StatCard
                label="Attendance Rate"
                value={`${dashboard?.global.attendance_rate ?? 0}%`}
              />
            </SimpleGrid>
          )}

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md">Charts coming soon...</Heading>
          </Box>
        </Container>
      </VStack>

      {/* -------------------- Modal -------------------- */}
      <Modal
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter(null)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedFilter === "all" && "All Employees"}
            {selectedFilter === "present" && "Present Today"}
            {selectedFilter === "absent" && "Absent Today"}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Check-in</Th>
                  <Th>Check-out</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEmployees?.map(emp => (
                  <Tr key={emp.employee_id}>
                    <Td>{emp.employee_name}</Td>
                    <Td>{emp.status}</Td>
                    <Td>{emp.check_in_time ?? "-"}</Td>
                    <Td>{emp.check_out_time ?? "-"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}



