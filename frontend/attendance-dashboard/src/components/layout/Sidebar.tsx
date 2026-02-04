// import { Box, VStack, Text, Image } from "@chakra-ui/react";
// import logo from "../../assets/logo.png";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// export default function Sidebar() {
//   const navigate = useNavigate();
//     const BASE_URL = "http://localhost:8000/api/v1"; // change to your backend URL
// const handleClick = async (endpoint: string,params?: any) => {
//     try {
//       const response = await axios.get(`${BASE_URL}${endpoint}`,{ params });
//       console.log("Response:", response.data);
//       // Here you can set state to show data in your main content
//     } catch (error) {
//       console.error("Error calling API:", error);
//     }
//   };
//   return (
//   //   <Box
//   //     // width: full on mobile, 250px on larger screens
//   //     w={["full", "250px"]} 
//   //     bg="gray.900"
//   //     color="white"
//   //     p={5}
//   //     // fixed position on mobile, static on larger screens
//   //     pos={["fixed", "static"]}
//   //     top={0}
//   //     left={0}
//   //     h={["100vh", "auto"]}
//   //     zIndex={1000} // ensures sidebar is above other content
//   //   >
//   //     <Image src={logo} alt="Logo" mb={6} h={["50px", "60px"]} />
//   //     <VStack align="start" spacing={[3, 4]}>
//   //       <Text _hover={{ cursor: "pointer", color: "#B98112" }}
//   //                 onClick={() =>
//   //   handleClick("/attendance/metrics/all-employees", {
//   //     year: 2024, 
//   //     month: 1,   
//   //   })
//   // }
//   //       >Dashboard</Text>
//   //       <Text _hover={{ cursor: "pointer", color: "#B98112" }}>Pointages</Text>
//   //       <Text _hover={{ cursor: "pointer", color: "#B98112" }}
//   //       onClick={() =>
//   //   // handleClick("/employee")
//   //   navigate("/employees")
//   // }>Employés</Text>
//   //       <Text _hover={{ cursor: "pointer", color: "#B98112" }}
//   //       onClick={() => navigate("/rapports")}>Rapports</Text>
//   //     </VStack>
//     // </Box>
//     // Sidebar.tsx
// <Box
//   // w={["full", "250px"]} 
//   // bg="gray.900"
//   // color="white"
//   // p={5}
//   // pos="fixed"        // fixed so it spans full height
//   // top={0}
//   // left={0}
//   // h="100vh"          // full viewport height
//   // zIndex={1000}
//   w={["full", "250px"]}
//   bg="gray.900"
//   color="white"
//   p={5}
//   pos={["fixed", "fixed"]}
//   left={["-100%", "0"]} // hide by default on mobile
//   top={0}
//   h="100vh"
//   zIndex={1000}
//   transition="left 0.3s"
// >
//   <Image src={logo} alt="Logo" mb={6} h="60px" />
//   <VStack align="start" spacing={4}>
//     <Text _hover={{ cursor: "pointer", color: "#B98112" }} onClick={() => navigate("/")}>Dashboard</Text>
//     <Text _hover={{ cursor: "pointer", color: "#B98112" }}>Pointages</Text>
//     <Text _hover={{ cursor: "pointer", color: "#B98112" }} onClick={() => navigate("/employees")}>Employés</Text>
//     <Text _hover={{ cursor: "pointer", color: "#B98112" }} onClick={() => navigate("/rapports")}>Rapports</Text>
//   </VStack>
// </Box>

//   );
// }

import { Box, VStack, Text, Image } from "@chakra-ui/react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void; // add this
}

export default function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    toggleSidebar(); // close sidebar after clicking on mobile
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
      <VStack align="start" spacing={4}>
        <Text
          _hover={{ cursor: "pointer", color: "#B98112" }}
          onClick={() => handleNavigate("/")}
        >
          Dashboard
        </Text>
        <Text
          _hover={{ cursor: "pointer", color: "#B98112" }}
          onClick={() => handleNavigate("/pointages")}
        >
          Pointages
        </Text>
        <Text
          _hover={{ cursor: "pointer", color: "#B98112" }}
          onClick={() => handleNavigate("/employees")}
        >
          Employés
        </Text>
        <Text
          _hover={{ cursor: "pointer", color: "#B98112" }}
          onClick={() => handleNavigate("/rapports")}
        >
          Rapports
        </Text>
      </VStack>
    </Box>
  );
}
