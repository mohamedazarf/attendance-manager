// import { useEffect, useState } from "react";
// import {
//     Box,
//     SimpleGrid,
//     Heading,
//     Badge,
//     Text,
//     Flex,
//     Spinner,
//     Button,
//     useToast,
// } from "@chakra-ui/react";
// import axios from "axios";
// import Navbar from "../components/layout/Navbar";
// import Sidebar from "../components/layout/Sidebar";

// const BASE_URL = "http://localhost:8000/api/v1";

// interface Employee {
//     employee_code: string;
//     name: string;
//     privilege: number;
//     group_id?: string;
//     card?: number;
//     is_active?: boolean;
// }

// export default function InactiveEmployeesPage() {
//     const [employees, setEmployees] = useState<Employee[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [isSidebarOpen, setSidebarOpen] = useState(false);
//     const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//     const toast = useToast();

//     useEffect(() => {
//         const fetchInactiveEmployees = async () => {
//             try {
//                 const res = await axios.get(`${BASE_URL}/employee/`);
//                 const inactive = res.data.filter((emp: Employee) => emp.is_active === false);
//                 setEmployees(inactive);
//             } catch (err: any) {
//                 toast({
//                     title: "Error fetching employees",
//                     description: err.message,
//                     status: "error",
//                     duration: 5000,
//                     isClosable: true,
//                 });
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchInactiveEmployees();
//     }, []);

//     if (loading) {
//         return (
//             <Box p={5} textAlign="center">
//                 <Spinner size="xl" />
//             </Box>
//         );
//     }

//     return (
//         <Box bg="gray.50" minH="100vh" display="flex">
//             <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//             <Box flex={1} ml={["0", "250px"]} display="flex" flexDirection="column">
//                 <Navbar />
//                 <Box p={5}>
//                     <Heading mb={4}>Inactive Employees</Heading>
//                     {employees.length === 0 ? (
//                         <Text>No inactive employees found.</Text>
//                     ) : (
//                         <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
//                             {employees.map((emp) => (
//                                 <Box
//                                     key={emp.employee_code}
//                                     borderWidth="1px"
//                                     borderRadius="lg"
//                                     p={5}
//                                     bg="gray.100"
//                                     shadow="md"
//                                     _hover={{ shadow: "xl", transform: "translateY(-2px)", transition: "all 0.2s" }}
//                                 >
//                                     <Flex justify="space-between" align="center" mb={3}>
//                                         <Heading size="md">{emp.name}</Heading>
//                                         <Badge
//                                             colorScheme={emp.privilege === 1 ? "green" : "blue"}
//                                             fontSize="0.8em"
//                                         >
//                                             {emp.privilege === 1 ? "Admin" : "User"}
//                                         </Badge>
//                                     </Flex>
//                                     <Text fontSize="sm" mb={1}><strong>Code:</strong> {emp.employee_code}</Text>
//                                     <Text fontSize="sm" mb={1}><strong>Group:</strong> {emp.group_id || "-"}</Text>
//                                     <Text fontSize="sm"><strong>Card:</strong> {emp.card || "-"}</Text>
//                                 </Box>
//                             ))}
//                         </SimpleGrid>
//                     )}
//                 </Box>
//             </Box>
//         </Box>
//     );
// }


import { useEffect, useState } from "react";
import {
    Box,
    SimpleGrid,
    Heading,
    Badge,
    Text,
    Flex,
    Spinner,
    Button,
    ButtonGroup,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
} from "@chakra-ui/react";
import axios from "axios";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

const BASE_URL = "http://localhost:8000/api/v1";

interface Employee {
    employee_code: string;
    name: string;
    privilege: number;
    group_id?: string;
    card?: number;
    is_active?: boolean;
}

export default function InactiveEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const toast = useToast();

    useEffect(() => {
        const fetchInactiveEmployees = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/employee/`);
                const inactive = res.data.filter(
                    (emp: Employee) => emp.is_active === false
                );
                setEmployees(inactive);
            } catch (err: any) {
                toast({
                    title: "Error fetching employees",
                    description: err.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchInactiveEmployees();
    }, []);

    if (loading) {
        return (
            <Box p={5} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box bg="gray.50" minH="100vh" display="flex">
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <Box flex={1} ml={["0", "250px"]} display="flex" flexDirection="column">
                <Navbar />

                <Box p={5}>
                    {/* 🔹 Header + Toggle */}
                    <Flex
                        justify="space-between"
                        align="center"
                        mb={6}
                        direction={{ base: "column", md: "row" }}
                        gap={4}
                    >
                        <Heading>Inactive Employees</Heading>

                        <ButtonGroup size="sm" isAttached variant="outline">
                            <Button
                                colorScheme={viewMode === "cards" ? "blue" : "gray"}
                                onClick={() => setViewMode("cards")}
                            >
                                Cards
                            </Button>
                            <Button
                                colorScheme={viewMode === "table" ? "blue" : "gray"}
                                onClick={() => setViewMode("table")}
                            >
                                Table
                            </Button>
                        </ButtonGroup>
                    </Flex>

                    {employees.length === 0 ? (
                        <Text>No inactive employees found.</Text>
                    ) : viewMode === "cards" ? (
                        /* 🔹 CARDS VIEW */
                        <SimpleGrid
                            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                            spacing={5}
                        >
                            {employees.map((emp) => (
                                <Box
                                    key={emp.employee_code}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    p={5}
                                    bg="white"
                                    shadow="sm"
                                    _hover={{
                                        shadow: "lg",
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
                    ) : (
                        /* 🔹 TABLE VIEW */
                        <TableContainer bg="white" borderRadius="lg" shadow="sm">
                            <Table variant="simple">
                                <Thead bg="gray.100">
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>Code</Th>
                                        <Th>Privilege</Th>
                                        <Th>Group</Th>
                                        <Th>Card</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {employees.map((emp) => (
                                        <Tr key={emp.employee_code}>
                                            <Td fontWeight="medium">{emp.name}</Td>
                                            <Td>{emp.employee_code}</Td>
                                            <Td>
                                                <Badge
                                                    colorScheme={
                                                        emp.privilege === 1 ? "green" : "blue"
                                                    }
                                                >
                                                    {emp.privilege === 1 ? "Admin" : "User"}
                                                </Badge>
                                            </Td>
                                            <Td>{emp.group_id || "-"}</Td>
                                            <Td>{emp.card || "-"}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </Box>
        </Box>
    );
}