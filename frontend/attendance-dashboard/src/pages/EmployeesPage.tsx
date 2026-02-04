import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Flex,
  Heading,
  Badge,
  Text,
  Select,
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import Sidebar from "../components/layout/Sidebar"; // path correct

const BASE_URL = "http://localhost:8000/api/v1";

interface Employee {
  employee_code: string;
  name: string;
  privilege: number;
  group_id?: string;
  card?: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [privilege, setPrivilege] = useState("all");

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/employee/`);
        setEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        `${emp.name} ${emp.employee_code}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchPrivilege =
        privilege === "all" || emp.privilege.toString() === privilege;

      return matchSearch && matchPrivilege;
    });
  }, [employees, search, privilege]);

  if (loading) {
    return (
      <Box p={5} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" display="flex">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Hamburger button for mobile */}
      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1600} // above sidebar
      />

      {/* Main content */}
      <Box flex={1} ml={["0", "250px"]} p={5}>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="md" pl="10">Employees</Heading>
            <Text fontSize="sm" color="gray.500" pl="10">
              {filteredEmployees.length} employee(s) found
            </Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Flex gap={4} mb={4} flexWrap="wrap">
          <InputGroup maxW="260px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>

          <Select
            maxW="200px"
            value={privilege}
            onChange={(e) => setPrivilege(e.target.value)}
          >
            <option value="all">All privileges</option>
            <option value="0">User</option>
            <option value="1">Admin</option>
          </Select>
        </Flex>

        {/* Employee cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
          {filteredEmployees.map((emp) => (
            <Box
              key={emp.employee_code}
              borderWidth="1px"
              borderRadius="lg"
              p={5}
              bg="white"
              shadow="md"
              _hover={{
                shadow: "xl",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              }}
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Heading size="md">{emp.name}</Heading>
                <Badge
                  colorScheme={emp.privilege === 1 ? "green" : "blue"}
                  fontSize="0.8em"
                >
                  {emp.privilege === 1 ? "Admin" : "User"}
                </Badge>
              </Flex>

              <Text fontSize="sm" mb={1}>
                <strong>Code:</strong> {emp.employee_code}
              </Text>
              <Text fontSize="sm" mb={1}>
                <strong>Group:</strong> {emp.group_id || "-"}
              </Text>
              <Text fontSize="sm">
                <strong>Card:</strong> {emp.card || "-"}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

