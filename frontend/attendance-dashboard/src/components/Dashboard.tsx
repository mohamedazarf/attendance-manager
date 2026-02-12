// import { Box, VStack, Heading } from "@chakra-ui/react";
// import Sidebar from "../components/layout/Sidebar";
// import Navbar from "../components/layout/Navbar";
// import { useState } from "react";
// import HoursByEmployeeChart from "./charts/HoursByEmployeeChart";

// export default function RapportsChartsPage() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar
//         isSidebarOpen={isSidebarOpen}
//         toggleSidebar={toggleSidebar}
//       />

//       <VStack flex={1} ml={["0", "250px"]} spacing={0} align="stretch">
//         <Navbar />

//         <Box p={6}>
//           <Heading size="md" mb={6}>
//             Rapports · Graphiques
//           </Heading>

//           {/* Charts live HERE */}
//           <HoursByEmployeeChart />
//         </Box>
//       </VStack>
//     </Box>
//   );
// }


// import { Box, VStack, Heading, Flex } from "@chakra-ui/react";
// import Sidebar from "../components/layout/Sidebar";
// import Navbar from "../components/layout/Navbar";
// import { useState } from "react";
// import HoursByEmployeeChart from "./charts/HoursByEmployeeChart";
// // import AnotherChart from ".pages/charts/AnotherChart"; // ton nouveau graphique
// import MostAnomaliesPieChart from "./charts/mostAnomalies";

// export default function RapportsChartsPage() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <VStack flex={1} ml={["0", "250px"]} spacing={0} align="stretch">
//         <Navbar />

//         <Box p={6}>
//           <Heading size="md" mb={6}>
//             Rapports · Graphiques
//           </Heading>
//           <Flex gap={6} wrap="wrap">
//   <Box flex="1 1 45%" minW="300px">
//     <HoursByEmployeeChart />
//   </Box>

//   <Box flex="1 1 45%" minW="300px">
//     <MostAnomaliesPieChart />
//   </Box>
// </Flex>

//         </Box>
//       </VStack>
//     </Box>
//   );
// }


// import { Box, VStack, Heading, Flex } from "@chakra-ui/react";
// import Sidebar from "../components/layout/Sidebar";
// import Navbar from "../components/layout/Navbar";
// import { useState } from "react";
// import HoursByEmployeeChart from "./charts/HoursByEmployeeChart";
// import MostAnomaliesPieChart from "./charts/mostAnomalies";

// export default function RapportsChartsPage() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   // Fixed height for charts
//   const chartHeight = 450;

//   return (
//     <Box display="flex" minH="100vh" bg="gray.50">
//       <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//       <VStack flex={1} ml={["0", "250px"]} spacing={0} align="stretch">
//         <Navbar />

//         <Box p={6}>
//           <Heading size="md" mb={6}>
//             Rapports · Graphiques
//           </Heading>

//           {/* Flex container for side-by-side charts */}
//           <Flex gap={6} wrap="wrap">
//             <Box flex="1 1 45%" minW="300px" height={`${chartHeight}px`}>
//               <HoursByEmployeeChart fixedHeight={chartHeight} />
//             </Box>

//             <Box flex="1 1 45%" minW="300px" height={`${chartHeight}px`}>
//               <MostAnomaliesPieChart fixedHeight={chartHeight} />
//             </Box>
//           </Flex>
//         </Box>
//       </VStack>
//     </Box>
//   );
// }


import { Box, VStack, Heading, Flex, IconButton } from "@chakra-ui/react";
import Sidebar from "./layout/Sidebar";
import Navbar from "./layout/Navbar";
import { useState } from "react";
import HoursByEmployeeChart from "../pages/charts/HoursByEmployeeChart";
import MostAnomaliesPieChart from "../pages/charts/mostAnomalies";
import WeekendHoursByEmployeeChart from "../pages/charts/weekendHours";
import { Link } from "react-router-dom";
import { CloseIcon } from "@chakra-ui/icons/Close";
import { HamburgerIcon } from "@chakra-ui/icons/Hamburger";
import { useTranslation } from "react-i18next";

// import hoursDifference from ".charts/HoursByEmployeeChart";

export default function Dashbord() {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Hauteur fixe pour les deux charts
  const chartHeight = 450;

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Hamburger button for mobile */}
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label={t("sidebar.toggle")}
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600} // above sidebar
      />


      <VStack flex={1} ml={["0", "250px"]} spacing={0} align="stretch">
        <Navbar />

        <Box p={6}>
          <Heading size="md" mb={6}>
            {t("charts.reports")}
          </Heading>

          {/* Container flex pour deux charts côte à côte */}
          <Flex gap={6} wrap="wrap" mb={10}>
            <Box flex="1 1 45%" minW="300px" height={`${chartHeight}px`}>
              <Link to="/charts/hoursByEmployee">
                <HoursByEmployeeChart fixedHeight={chartHeight} />
              </Link>
            </Box>

            <Box flex="1 1 45%" minW="300px" height={`${chartHeight}px`}>
              <MostAnomaliesPieChart fixedHeight={chartHeight} />
            </Box>
          </Flex>
          <Flex gap={6} wrap="wrap" >
            <Box flex="1 1 45%" minW="300px" height={`${chartHeight}px`}>
              {/* <AnotherChart fixedHeight={chartHeight} /> */}
              <WeekendHoursByEmployeeChart />
            </Box>
          </Flex>
        </Box>
      </VStack>
    </Box>
  );
}
