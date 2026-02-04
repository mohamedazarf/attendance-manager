import { Flex, Text, Spacer} from "@chakra-ui/react";

export default function Navbar() {

  return (
    <Flex bg="white" p={4} shadow="sm">
      <Text fontWeight="bold">Dashboard RH</Text>
      <Spacer />
      <Text>Admin</Text>
    </Flex>
  );
}

// import { Flex, Text, Spacer, IconButton } from "@chakra-ui/react";
// import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

// interface NavbarProps {
//   isSidebarOpen: boolean;
//   toggleSidebar: () => void;
//   title?: string; // optional page title
// }

// export default function Navbar({ isSidebarOpen, toggleSidebar, title }: NavbarProps) {
//   return (
//     <Flex
//       bg="white"
//       p={4}
//       shadow="sm"
//       align="center"
//       position="sticky"
//       top={0}
//       zIndex={1200} // above main content but below the mobile hamburger (1500)
//     >
//       {/* Hamburger button for mobile */}
//       <IconButton
//         icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
//         aria-label="Toggle Sidebar"
//         display={["inline-flex", "none"]}
//         mr={4}
//         onClick={toggleSidebar}
//       />

//       {/* Page title */}
//       <Text fontWeight="bold" fontSize="lg">
//         {title || "Dashboard RH"}
//       </Text>

//       <Spacer />
//       <Text>Admin</Text>
//     </Flex>
//   );
// }

// import { Flex, Text, Spacer, IconButton } from "@chakra-ui/react";
// import { HamburgerIcon } from "@chakra-ui/icons";

// interface NavbarProps {
//   isSidebarOpen: boolean;
//   toggleSidebar: () => void;
//   title?: string;
// }

// export default function Navbar({ isSidebarOpen, toggleSidebar, title }: NavbarProps) {
//   return (
//     <Flex
//       bg="white"
//       p={4}
//       shadow="sm"
//       align="center"
//       position="sticky"
//       top={0}
//       zIndex={1200} // above main content
//     >
//       {/* Hamburger button only shows when sidebar is closed on mobile */}
//       {!isSidebarOpen && (
//         <IconButton
//           icon={<HamburgerIcon />}
//           aria-label="Toggle Sidebar"
//           display={["inline-flex", "none"]}
//           mr={4}
//           onClick={toggleSidebar}
//         />
//       )}

//       <Text fontWeight="bold" fontSize="lg">
//         {title || "Dashboard RH"}
//       </Text>

//       <Spacer />
//       <Text>Admin</Text>
//     </Flex>
//   );
// }
