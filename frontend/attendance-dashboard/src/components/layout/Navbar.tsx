import { Flex, Text, Spacer} from "@chakra-ui/react";

export default function Navbar() {

  return (
    <Flex bg="white" p={4} shadow="sm" ml={{ base: '50px', md: 0 }}>
      <Text fontWeight="bold">Dashboard RH</Text>
      <Spacer />
      <Text>Admin</Text>
    </Flex>
  );
}

