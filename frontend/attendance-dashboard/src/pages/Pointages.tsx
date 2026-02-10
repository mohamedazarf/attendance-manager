import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  Text,
  IconButton,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from "@chakra-ui/react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import { useEffect, useState } from "react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import { useLocation, useNavigate } from "react-router-dom";

/* -------------------- Types -------------------- */

type Employee = {
  employee_id: number;
  employee_name: string;
  status: "present" | "absent";
  check_in_time: string | null;
  check_out_time: string | null;
};

type DashboardData = {
  date: string;
  global: {
    total_employees: number;
    present_today: number;
    absent_today: number;
    attendance_rate: number;
  };
  employees: Employee[];
};

/* -------------------- Stat Card -------------------- */

const StatCard = ({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | number;
  onClick?: () => void;
}) => (
  <Box
    bg="white"
    p={6}
    borderRadius="lg"
    boxShadow="sm"
    cursor={onClick ? "pointer" : "default"}
    _hover={{
        borderColor: "blue.400",
        transform: "translateY(-2px)",
        boxShadow: "lg",
      }}
    onClick={onClick}
  >
    <Text fontSize="sm" color="gray.600" mb={2}>
      {label}
    </Text>
    <Text fontSize="2xl" fontWeight="bold">
      {value}
    </Text>
  </Box>
);

/* -------------------- Page -------------------- */

export default function Pointages() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "present" | "absent" | null
  >(null);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filter = params.get("filter"); // "all" | "present" | "absent"

  /* -------------------- Fetch data -------------------- */

  useEffect(() => {
    const TEST_DATE = "2026-01-26"; // change here if needed

    fetch(
      `http://127.0.0.1:8000/api/v1/attendance/dashboard/day?day=${TEST_DATE}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Dashboard response:", data);
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  /* -------------------- Filter employees -------------------- */

  const filteredEmployees = dashboard?.employees.filter((emp) => {
    if (selectedFilter === "present") return emp.status === "present";
    if (selectedFilter === "absent") return emp.status === "absent";
    return true;
  });

  /* -------------------- Render -------------------- */

  return (
    <Box display="flex" minH="100vh" bg="gray.50">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <IconButton
        icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        aria-label="Toggle Sidebar"
        display={["inline-flex", "none"]}
        onClick={toggleSidebar}
        position="fixed"
        top="4"
        left="4"
        zIndex={1500}
      />

      <VStack flex={1} spacing={0} ml={["0", "250px"]}>
        <Navbar />

        <Container maxW="100%" flex={1} p={6}>
          <Heading mb={2}>Attendance Dashboard  {filter === "present"
              ? "Present Employees"
              : filter === "absent"
              ? "Absent Employees"
              : "All Employees Today"}</Heading>

          <Text color="gray.500" mb={6}>
            Date: {dashboard?.date}
          </Text>

          {loading ? (
            <Spinner size="lg" />
          ) : (
            <>
              {/* -------- STATS -------- */}
              <SimpleGrid
                columns={{ base: 1, md: 4 }}
                spacing={6}
                mb={8}
              >
                <StatCard
                  label="Total Employees"
                  value={dashboard?.global.total_employees ?? 0}
                  onClick={() => navigate("/employeesToday")}
                />
                <StatCard
                  label="Present Today"
                  value={dashboard?.global.present_today ?? 0}
                  onClick={() => navigate("/employeesToday?filter=present")}
                />
                <StatCard
                  label="Absent Today"
                  value={dashboard?.global.absent_today ?? 0}
                  onClick={() => navigate("/employeesToday?filter=absent")}
                />
                <StatCard
                  label="Attendance Rate"
                  value={`${dashboard?.global.attendance_rate ?? 0}%`}
                />
              </SimpleGrid>

              {/* -------- ALERTS -------- */}
              <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
                <Heading size="md" mb={6}>
                  Daily Alerts
                </Heading>

                {dashboard?.employees
                  .filter(
                    (emp) =>
                      !emp.check_in_time ||
                      !emp.check_out_time
                  )
                  .map((emp) => (
                    <Box
                      key={emp.employee_id}
                      p={4}
                      mb={3}
                      border="1px solid"
                      borderColor="red.100"
                      borderRadius="md"
                    >
                      <Text fontWeight="bold">
                        {emp.employee_name}
                      </Text>
                      <Badge colorScheme="red">
                        Missing Punch
                      </Badge>
                    </Box>
                  ))}

                {dashboard?.employees.filter(
                  (emp) => emp.check_in_time && emp.check_out_time
                ).length === 0 && (
                  <Text color="gray.500">
                    No alerts today
                  </Text>
                )}
              </Box>
            </>
          )}
        </Container>
      </VStack>

      {/* -------- MODAL -------- */}
      <Modal
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter(null)}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedFilter === "all" && "All Employees"}
            {selectedFilter === "present" && "Present Today"}
            {selectedFilter === "absent" && "Absent Today"}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Check-in</Th>
                  <Th>Check-out</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredEmployees?.map((emp) => (
                  <Tr key={emp.employee_id}>
                    <Td>{emp.employee_name}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          emp.status === "present"
                            ? "green"
                            : "red"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </Td>
                    <Td>{emp.check_in_time ?? "-"}</Td>
                    <Td>{emp.check_out_time ?? "-"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

