// import {
//   Box,
//   VStack,
//   Text,
//   Image,
//   HStack,
//   Collapse
// } from "@chakra-ui/react";
// import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
// import logo from "../../assets/logo.png";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";

// interface SidebarProps {
//   isSidebarOpen: boolean;
//   toggleSidebar: () => void;
// }

// export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
//   const navigate = useNavigate();
//   const [isRapportsOpen, setRapportsOpen] = useState(false);

//   const handleNavigate = (path: string) => {
//     navigate(path);
//     toggleSidebar();
//   };

//   return (
//     <Box
//       w={["full", "250px"]}
//       bg="gray.900"
//       color="white"
//       p={5}
//       pos="fixed"
//       top={0}
//       left={[isSidebarOpen ? "0" : "-100%", "0"]}
//       h="100vh"
//       zIndex={1000}
//       transition="left 0.3s"
//     >
//       <Image src={logo} alt="Logo" mb={6} h="60px" />

//       <VStack align="start" spacing={3} w="full">

//         <Text
//           _hover={{ color: "#B98112", cursor: "pointer" }}
//           onClick={() => handleNavigate("/")}
//         >
//           Dashboard
//         </Text>

//         <Text
//           _hover={{ color: "#B98112", cursor: "pointer" }}
//           onClick={() => handleNavigate("/pointages")}
//         >
//           Pointages
//         </Text>

//         <Text
//           _hover={{ color: "#B98112", cursor: "pointer" }}
//           onClick={() => handleNavigate("/employees")}
//         >
//           Employés
//         </Text>

//         {/* RAPPORTS WITH CLICK SUBMENU */}
//         <Box w="full">
//           <HStack
//             justify="space-between"
//             w="full"
//             cursor="pointer"
//             _hover={{ color: "#B98112" }}
//             onClick={() => setRapportsOpen(!isRapportsOpen)}
//           >
//             <Text>Rapports</Text>
//             {isRapportsOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
//           </HStack>

//           <Collapse in={isRapportsOpen} animateOpacity>
//             <VStack
//               align="start"
//               pl={4}
//               mt={2}
//               spacing={2}
//               borderLeft="2px solid"
//               borderColor="gray.600"
//             >
//               <Text
//                 fontSize="sm"
//                 color="gray.300"
//                 _hover={{ color: "#B98112", cursor: "pointer" }}
//                 onClick={() => handleNavigate("/rapports/charts")}
//               >
//                 • Graphiques
//               </Text>

//               <Text
//                 fontSize="sm"
//                 color="gray.300"
//                 _hover={{ color: "#B98112", cursor: "pointer" }}
//                 onClick={() => handleNavigate("/rapports")}
//               >
//                 • Rapport mensuel
//               </Text>
//             </VStack>
//           </Collapse>
//         </Box>

//       </VStack>
//     </Box>
//   );
// }

import { Box, VStack, Text, Image, HStack } from "@chakra-ui/react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    toggleSidebar(); // close sidebar on mobile
  };

  return (
    <Box
      w={["full", "250px"]}
      bg="gray.900"
      color="white"
      p={5}
      pos="fixed"
      top={0}
      left={[isSidebarOpen ? "0" : "-100%", "0"]}
      h="100vh"
      zIndex={1000}
      transition="left 0.3s"
    >
      <Image src={logo} alt="Logo" mb={6} h="60px" />

      <VStack align="start" spacing={3} w="full">

        <Text
          _hover={{ color: "#B98112", cursor: "pointer" }}
          onClick={() => handleNavigate("/")}
        >
          Dashboard
        </Text>

        <Text
          _hover={{ color: "#B98112", cursor: "pointer" }}
          onClick={() => handleNavigate("/pointages")}
        >
          Pointages
        </Text>

        <Text
          _hover={{ color: "#B98112", cursor: "pointer" }}
          onClick={() => handleNavigate("/employees")}
        >
          Employés
        </Text>

        {/* RAPPORTS MENU */}
        <Text
          fontWeight="bold"
          mt={4}
          mb={1}
          color="gray.400"
          textTransform="uppercase"
          fontSize="sm"
        >
          Rapports
        </Text>

        {/* SUBMENU – toujours visible */}
        <VStack align="start" pl={4} spacing={2}>
          <Text
            fontSize="sm"
            color="gray.300"
            _hover={{ color: "#B98112", cursor: "pointer" }}
            onClick={() => handleNavigate("/rapports/charts")}
          >
            • Graphiques
          </Text>

          <Text
            fontSize="sm"
            color="gray.300"
            _hover={{ color: "#B98112", cursor: "pointer" }}
            onClick={() => handleNavigate("/rapports")}
          >
            • Rapport mensuel
          </Text>
        </VStack>

      </VStack>
    </Box>
  );
}


