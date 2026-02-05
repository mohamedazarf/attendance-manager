// import { Box, VStack, Text, Image } from "@chakra-ui/react";
// import logo from "../../assets/logo.png";
// import { useNavigate } from "react-router-dom";

// interface SidebarProps {
//   isSidebarOpen: boolean;
//   toggleSidebar: () => void; // add this
// }

// export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
//   const navigate = useNavigate();

//   const handleNavigate = (path: string) => {
//     navigate(path);
//     toggleSidebar(); // close sidebar after clicking on mobile
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
//       <VStack align="start" spacing={4}>
//         <Text
//           _hover={{ cursor: "pointer", color: "#B98112" }}
//           onClick={() => handleNavigate("/")}
//         >
//           Dashboard
//         </Text>
//         <Text
//           _hover={{ cursor: "pointer", color: "#B98112" }}
//           onClick={() => handleNavigate("/pointages")}
//         >
//           Pointages
//         </Text>
//         <Text
//           _hover={{ cursor: "pointer", color: "#B98112" }}
//           onClick={() => handleNavigate("/employees")}
//         >
//           Employés
//         </Text>
//         <Text
//           _hover={{ cursor: "pointer", color: "#B98112" }}
//           onClick={() => handleNavigate("/rapports")}
//         >
//           Rapports
//         </Text>
//       </VStack>
//     </Box>
//   );
// }


import { Box, VStack, Text, Image } from "@chakra-ui/react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();
  const [isRapportsOpen, setRapportsOpen] = useState(false);

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

        {/* RAPPORTS WITH SUBMENU */}
        <Box
          w="full"
          onMouseEnter={() => setRapportsOpen(true)}
          onMouseLeave={() => setRapportsOpen(false)}
        >
          <Text
            _hover={{ color: "#B98112", cursor: "pointer" }}
            onClick={() => setRapportsOpen(!isRapportsOpen)} // mobile support
          >
            Rapports
          </Text>

          {isRapportsOpen && (
            <VStack align="start" pl={4} mt={2} spacing={2}>
              <Text
                fontSize="sm"
                color="gray.300"
                _hover={{ color: "#B98112", cursor: "pointer" }}
                onClick={() => handleNavigate("/rapports/charts")}
              >
                Graphiques
              </Text>

              <Text
                fontSize="sm"
                color="gray.300"
                _hover={{ color: "#B98112", cursor: "pointer" }}
                onClick={() => handleNavigate("/rapports")}
              >
                Rapport mensuel
              </Text>
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

