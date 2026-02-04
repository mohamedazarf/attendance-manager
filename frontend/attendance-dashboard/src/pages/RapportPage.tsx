// import { useEffect, useState } from "react";
// import {
//   Box,
//   Select,
//   Spinner,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   HStack,
//   Text,
// } from "@chakra-ui/react";
// import axios from "axios";

// const BASE_URL = "http://localhost:8000/api/v1";

// interface AttendanceMetric {
//   employee_id: number;
//   year: number;
//   month: number;
//   period: string;
//   total_working_days: number;
//   present_days: number;
//   absent_days: number;
//   presence_rate: number;
//   absence_rate: number;
// }

// export default function RapportPage() {
//   const [year, setYear] = useState(2024);
//   const [month, setMonth] = useState(1);
//   const [data, setData] = useState<AttendanceMetric[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchMetrics = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `${BASE_URL}/attendance/metrics/all-employees`,
//           {
//             params: { year, month },
//           }
//         );
//         setData(res.data.data);
//       } catch (err) {
//         console.error("Error fetching metrics:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMetrics();
//   }, [year, month]);

//   return (
//     <Box ml={["0", "250px"]} p={5}>
//       <Text fontSize="xl" fontWeight="bold" mb={4}>
//         Rapport mensuel de présence
//       </Text>

//       {/* 🎛️ Filters */}
//       <HStack spacing={4} mb={6}>
//         <Select
//           maxW="150px"
//           value={year}
//           onChange={(e) => setYear(Number(e.target.value))}
//         >
//           {[2022, 2023, 2024, 2025].map((y) => (
//             <option key={y} value={y}>
//               {y}
//             </option>
//           ))}
//         </Select>

//         <Select
//           maxW="150px"
//           value={month}
//           onChange={(e) => setMonth(Number(e.target.value))}
//         >
//           {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
//             <option key={m} value={m}>
//               {m.toString().padStart(2, "0")}
//             </option>
//           ))}
//         </Select>
//       </HStack>

//       {/* ⏳ Loading */}
//       {loading ? (
//         <Box textAlign="center" py={10}>
//           <Spinner />
//         </Box>
//       ) : (
//         <Table variant="simple" size="sm">
//           <Thead>
//             <Tr>
//               <Th>ID Employé</Th>
//               <Th>Période</Th>
//               <Th isNumeric>Jours ouvrés</Th>
//               <Th isNumeric>Présences</Th>
//               <Th isNumeric>Absences</Th>
//               <Th isNumeric>Présence %</Th>
//               <Th isNumeric>Absence %</Th>
//             </Tr>
//           </Thead>
//           <Tbody>
//             {data.map((row, index) => (
//               <Tr key={`${row.employee_id}-${index}`}>
//                 <Td>{row.employee_id}</Td>
//                 <Td>{row.period}</Td>
//                 <Td isNumeric>{row.total_working_days}</Td>
//                 <Td isNumeric>{row.present_days}</Td>
//                 <Td isNumeric>{row.absent_days}</Td>
//                 <Td isNumeric>
//                   {(row.presence_rate * 100).toFixed(1)}%
//                 </Td>
//                 <Td isNumeric>
//                   {(row.absence_rate * 100).toFixed(1)}%
//                 </Td>
//               </Tr>
//             ))}
//           </Tbody>
//         </Table>
//       )}
//     </Box>
//   );
// }

// import { useEffect, useState } from "react";
// import {
//   Box,
//   Select,
//   Spinner,
//   Table,
//   Thead,
//   Tbody,
//   Tr,
//   Th,
//   Td,
//   HStack,
//   Text,
//   IconButton,
// } from "@chakra-ui/react";
// import Sidebar from "../components/layout/Sidebar"; // import Sidebar
// import axios from "axios";
// import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
// import Navbar from "../components/layout/Navbar";

// const BASE_URL = "http://localhost:8000/api/v1";

// interface AttendanceMetric {
//   employee_id: number;
//   year: number;
//   month: number;
//   period: string;
//   total_working_days: number;
//   present_days: number;
//   absent_days: number;
//   presence_rate: number;
//   absence_rate: number;
// }

// export default function RapportPage() {
//   const [year, setYear] = useState(2024);
//   const [month, setMonth] = useState(1);
//   const [data, setData] = useState<AttendanceMetric[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
// const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);


//   useEffect(() => {
//     const fetchMetrics = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(
//           `${BASE_URL}/attendance/metrics/all-employees`,
//           {
//             params: { year, month },
//           }
//         );
//         setData(res.data.data);
//       } catch (err) {
//         console.error("Error fetching metrics:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMetrics();
//   }, [year, month]);

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//         <IconButton
//   icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
//   aria-label="Toggle Sidebar"
//   display={["inline-flex", "none"]}
//   position="fixed"
//   top="4"
//   left="4"
//   zIndex={1500}
//   onClick={toggleSidebar}
// />

//       {/* Sidebar */}
//     <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />


//       {/* Main content */}
//       <Box flex={1} ml={["0", "250px"]} p={5}>
//           <Navbar />
//         <Box >
//           <Text fontSize="xl" fontWeight="bold" mb={4}>
//             Rapport mensuel de présence
//           </Text>
//           </Box>

//         {/* 🎛️ Filters */}
//         <HStack spacing={4} mb={6}>
//           <Select
//             maxW="150px"
//             value={year}
//             onChange={(e) => setYear(Number(e.target.value))}
//           >
//             {[2022, 2023, 2024, 2025].map((y) => (
//               <option key={y} value={y}>
//                 {y}
//               </option>
//             ))}
//           </Select>

//           <Select
//             maxW="150px"
//             value={month}
//             onChange={(e) => setMonth(Number(e.target.value))}
//           >
//             {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
//               <option key={m} value={m}>
//                 {m.toString().padStart(2, "0")}
//               </option>
//             ))}
//           </Select>
//         </HStack>

//         {/* ⏳ Loading */}
//         {loading ? (
//           <Box textAlign="center" py={10}>
//             <Spinner />
//           </Box>
//         ) : (
//           <Table variant="simple" size="sm">
//             <Thead>
//               <Tr>
//                 <Th>ID Employé</Th>
//                 <Th>Période</Th>
//                 <Th isNumeric>Jours ouvrés</Th>
//                 <Th isNumeric>Présences</Th>
//                 <Th isNumeric>Absences</Th>
//                 <Th isNumeric>Présence %</Th>
//                 <Th isNumeric>Absence %</Th>
//               </Tr>
//             </Thead>
//             <Tbody>
//               {data.map((row, index) => (
//                 <Tr key={`${row.employee_id}-${index}`}>
//                   <Td>{row.employee_id}</Td>
//                   <Td>{row.period}</Td>
//                   <Td isNumeric>{row.total_working_days}</Td>
//                   <Td isNumeric>{row.present_days}</Td>
//                   <Td isNumeric>{row.absent_days}</Td>
//                   <Td isNumeric>
//                     {(row.presence_rate * 100).toFixed(1)}%
//                   </Td>
//                   <Td isNumeric>
//                     {(row.absence_rate * 100).toFixed(1)}%
//                   </Td>
//                 </Tr>
//               ))}
//             </Tbody>
//           </Table>
//         )}
//       </Box>
//     </Box>
//   );
// }


import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Text,
  HStack,
  Select,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
} from "@chakra-ui/react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";

const BASE_URL = "http://localhost:8000/api/v1";

interface AttendanceMetric {
  employee_id: number;
  year: number;
  month: number;
  period: string;
  total_working_days: number;
  present_days: number;
  absent_days: number;
  presence_rate: number;
  absence_rate: number;
}

export default function RapportPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(1);
  const [data, setData] = useState<AttendanceMetric[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/attendance/metrics/all-employees`, {
          params: { year, month },
        });
        setData(res.data.data);
      } catch (err) {
        console.error("Error fetching metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [year, month]);

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Mobile Hamburger Button */}
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]} // only on mobile
        position="fixed"
        top="4"
        left="4"
        zIndex={1500} // above sidebar
        onClick={toggleSidebar}
      />

      {/* Main content */}
      <VStack flex={1} spacing={0} ml={["0", "250px"]} align="stretch">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <Box p={5}>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Rapport mensuel de présence
          </Text>

          {/* Filters */}
          <HStack spacing={4} mb={6} flexWrap="wrap">
            <Select
              maxW="150px"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>

            <Select
              maxW="150px"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, "0")}
                </option>
              ))}
            </Select>
          </HStack>

          {/* Loading */}
          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner />
            </Box>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>ID Employé</Th>
                  <Th>Période</Th>
                  <Th isNumeric>Jours ouvrés</Th>
                  <Th isNumeric>Présences</Th>
                  <Th isNumeric>Absences</Th>
                  <Th isNumeric>Présence %</Th>
                  <Th isNumeric>Absence %</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row, index) => (
                  <Tr key={`${row.employee_id}-${index}`}>
                    <Td>{row.employee_id}</Td>
                    <Td>{row.period}</Td>
                    <Td isNumeric>{row.total_working_days}</Td>
                    <Td isNumeric>{row.present_days}</Td>
                    <Td isNumeric>{row.absent_days}</Td>
                    <Td isNumeric>{(row.presence_rate * 100).toFixed(1)}%</Td>
                    <Td isNumeric>{(row.absence_rate * 100).toFixed(1)}%</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

