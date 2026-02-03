import { Box, VStack, Text } from "@chakra-ui/react";

export default function Sidebar() {
  return (
    <Box w="250px" bg="gray.900" color="white" p={5}>
      <Text fontSize="xl" fontWeight="bold" mb={6}>
        gestion RH
      </Text>
      <VStack align="start" spacing={4}>
        <Text _hover={{ bg: "gray.200" }}>Dashboard</Text>
        <Text _hover={{ cursor: "pointer" }}>Pointages</Text>
        <Text>Employés</Text>
        <Text>Rapports</Text>
      </VStack>
    </Box>
  );
}
