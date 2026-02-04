// import { Box, Container, Heading, SimpleGrid, VStack, Text } from "@chakra-ui/react";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";

// const StatCard = ({ label, value }: { label: string; value: string | number }) => (
//   <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
//     <Text fontSize="sm" color="gray.600" mb={2}>{label}</Text>
//     <Text fontSize="2xl" fontWeight="bold">{value}</Text>
//   </Box>
// );

// export default function Dashboard() {
//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar />
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


import { Box, Container, Heading, SimpleGrid, VStack, Text, IconButton } from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useState } from "react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
    <Text fontSize="sm" color="gray.600" mb={2}>{label}</Text>
    <Text fontSize="2xl" fontWeight="bold">{value}</Text>
  </Box>
);

export default function Dashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>

      <IconButton
    icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
    aria-label="Toggle Sidebar"
    display={["inline-flex", "none"]} // only mobile
    onClick={toggleSidebar}
    position="fixed"      // fixed so it’s always on screen
    top="4"               // spacing from top
    left="4"              // spacing from left
    zIndex={1500}         // higher than sidebar z-index (sidebar is 1000)
  />

      {/* Main content */}
      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={6}>Attendance Dashboard</Heading>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <StatCard label="Total Employees" value="0" />
            <StatCard label="Present Today" value="0" />
            <StatCard label="Absent Today" value="0" />
            <StatCard label="Attendance Rate" value="0%" />
          </SimpleGrid>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>Charts coming soon...</Heading>
          </Box>
        </Container>
      </VStack>
    </Box>
  );
}

