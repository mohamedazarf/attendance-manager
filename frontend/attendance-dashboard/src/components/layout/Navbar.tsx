import { Flex, Text, Spacer, Box, Button} from "@chakra-ui/react";
import LanguageSwitcher from "./LanguageSwitcher"; 
import { useNavigate } from "react-router-dom";
import { FiArrowLeft,FiArrowRight } from 'react-icons/fi';

export default function Navbar() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // -1 goes back to previous page in history
  };
  const goForward = () => {
  navigate(1); // 1 goes forward to the next page in history
};
  return (
<Flex
  bg="white"
  px={4}
  py={3}
  shadow="sm"
  align="center"
  w="full"
>
  {/* Mobile spacing for hamburger */}
  <Box w={{ base: "50px", md: "auto" }}>
    <Flex display={{ base: "none", md: "flex" }} gap={2}>
      <Button
        height="40px"
        width="40px"
        borderRadius="full"
        onClick={goBack}
      >
        <FiArrowLeft />
      </Button>

      <Button
        height="40px"
        width="40px"
        borderRadius="full"
        fontWeight="bold"
        fontSize="50px"
        onClick={goForward}
      >
        <FiArrowRight />
      </Button>
    </Flex>
  </Box>

  {/* Title */}
  <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>
    Dashboard RH
  </Text>

  <Spacer />

  {/* Right side */}
  <Flex align="center" gap={4}>
    <Text display={{ base: "none", md: "block" }}>
      Admin
    </Text>
    <LanguageSwitcher />
  </Flex>
</Flex>

  );
}

// export default function Navbar() {
//   const navigate = useNavigate();

//   const goBack = () => {
//     navigate(-1);
//   };
  
//   const goForward = () => {
//     navigate(1);
//   };
  
//   return (
//     <Flex 
//       bg="white" 
//       p={{ base: 3, md: 4 }}  // Responsive padding
//       shadow="sm" 
//       ml={{ base: '50px', md: 0 }} 
//       align="center" 
//       w="full"
//     >
//       <Button  
//         display={{ base: 'none', md: 'flex' }}  
//         height="50px"
//         width="50px"
//         borderRadius="full"
//         mr={4} 
//         fontWeight="bold" 
//         fontSize="50px" 
//         onClick={goBack}
//       >
//         <FiArrowLeft />
//       </Button>
      
//       <Button 
//         display={{ base: 'none', md: 'flex' }}
//         height="50px"
//         width="50px"
//         borderRadius="full"
//         mr={4} 
//         fontWeight="bold" 
//         fontSize="50px" 
//         onClick={goForward}  // ← Fixed this
//       >
//         <FiArrowRight />
//       </Button>
      
//       <Text 
//         fontWeight="bold" 
//         fontSize={{ base: 'md', md: 'lg' }}  // Responsive text size
//       >
//         Dashboard RH
//       </Text>
      
//       <Spacer />
      
//       {/* Zone de droite */}
//       <Flex align="center" gap={{ base: 2, md: 4 }}>  {/* Responsive gap */}
//         <Text display={{ base: 'none', sm: 'block' }}>Admin</Text>  {/* Hide on very small screens */}
//         <Box>
//           <LanguageSwitcher />
//         </Box>
//       </Flex>
//     </Flex>
//   );
// }