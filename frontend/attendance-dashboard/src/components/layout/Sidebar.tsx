// import { Box, VStack, Text, Image } from "@chakra-ui/react";
// import logo from "../../assets/logo.png";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";

// import { useTranslation } from "react-i18next";

// interface SidebarProps {
//   isSidebarOpen: boolean;
//   toggleSidebar: () => void;
// }

// export default function Sidebar({
//   isSidebarOpen,
//   toggleSidebar,
// }: SidebarProps) {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { isAdmin } = useAuth();

//   const handleNavigate = (path: string) => {
//     navigate(path);
//     toggleSidebar(); // close sidebar on mobile
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
//           onClick={() => handleNavigate("/pointages")}
//         >
//           {t("Pointages")}
//         </Text>

//         <Text
//           _hover={{ color: "#B98112", cursor: "pointer" }}
//           onClick={() => handleNavigate("/employees")}
//         >
//           {t("Employees")}
//         </Text>

//         {isAdmin && (
//           <Text
//             _hover={{ color: "#B98112", cursor: "pointer" }}
//             onClick={() => handleNavigate("/inactive-employees")}
//           >
//             {t("Inactive Employees")}
//           </Text>
//         )}

//         <Text
//           _hover={{ color: "#B98112", cursor: "pointer" }}
//           onClick={() => handleNavigate("/rapports")}
//         >
//           {t("Monthly Report")}
//         </Text>

//         {isAdmin && (
//           <Text
//             _hover={{ color: "#B98112", cursor: "pointer" }}
//             onClick={() => handleNavigate("/parametrage")}
//           >
//             {t("Settings")}
//           </Text>
//         )}

//         {isAdmin && (
//           <Text
//             _hover={{ color: "#B98112", cursor: "pointer" }}
//             onClick={() => handleNavigate("/user-management")}
//           >
//             {t("Platform Users")}
//           </Text>
//         )}
//       </VStack>
//     </Box>
//   );
// }

import { Box, VStack, Text, Image, Flex } from "@chakra-ui/react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Users,
  UserX,
  FileBarChart2,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
}: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    toggleSidebar();
  };

  const NavItem = ({
    icon,
    label,
    path,
  }: {
    icon: React.ReactNode;
    label: string;
    path: string;
  }) => (
    <Flex
      align="center"
      gap={3}
      w="full"
      px={3}
      py={2}
      borderRadius="md"
      cursor="pointer"
      _hover={{ color: "#B98112", bg: "whiteAlpha.100" }}
      transition="all 0.2s"
      onClick={() => handleNavigate(path)}
    >
      {icon}
      <Text fontWeight="medium">{label}</Text>
    </Flex>
  );

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

      <VStack align="start" spacing={1} w="full">
        <NavItem
          icon={<ClipboardList size={18} />}
          label={t("Pointages")}
          path="/pointages"
        />

        <NavItem
          icon={<Users size={18} />}
          label={t("Employees")}
          path="/employees"
        />

        {isAdmin && (
          <NavItem
            icon={<UserX size={18} />}
            label={t("Inactive Employees")}
            path="/inactive-employees"
          />
        )}

        <NavItem
          icon={<FileBarChart2 size={18} />}
          label={t("Monthly Report")}
          path="/rapports"
        />

        {isAdmin && (
          <NavItem
            icon={<Settings size={18} />}
            label={t("Settings")}
            path="/parametrage"
          />
        )}

        {isAdmin && (
          <NavItem
            icon={<ShieldCheck size={18} />}
            label={t("Platform Users")}
            path="/user-management"
          />
        )}
      </VStack>
    </Box>
  );
}
