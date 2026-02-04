// import { useEffect, useState } from "react";
// import { Box, Table } from "@chakra-ui/react";
// import axios from "axios";
// const BASE_URL = "http://localhost:8000/api/v1";

// interface Employee {
//   employee_code: string;
//   name: string;
//   privilege: number;
//   group_id: string;
//   card: number;
// }

// export default function EmployeesPage() {
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchEmployees = async () => {
//       try {
//         const response = await axios.get(`${BASE_URL}/employee/`);
//         setEmployees(response.data);
//       } catch (error) {
//         console.error("Error fetching employees:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEmployees();
//   }, []);

//   if (loading) return <Box p={5}>Chargement...</Box>;

//   return (
//     <Box ml={["0", "250px"]} p={5}>
//       <Table.Root variant="line">
//         <Table.Header>
//           <Table.Row>
//             <Table.ColumnHeader>Code</Table.ColumnHeader>
//             <Table.ColumnHeader>Nom</Table.ColumnHeader>
//             <Table.ColumnHeader>Privilege</Table.ColumnHeader>
//             <Table.ColumnHeader>Groupe</Table.ColumnHeader>
//             <Table.ColumnHeader>Carte</Table.ColumnHeader>
//           </Table.Row>
//         </Table.Header>

//         <Table.Body>
//           {employees.map((emp) => (
//             <Table.Row key={emp.employee_code}>
//               <Table.Cell>{emp.employee_code}</Table.Cell>
//               <Table.Cell>{emp.name}</Table.Cell>
//               <Table.Cell>{emp.privilege}</Table.Cell>
//               <Table.Cell>{emp.group_id || "-"}</Table.Cell>
//               <Table.Cell>{emp.card || "-"}</Table.Cell>
//             </Table.Row>
//           ))}
//         </Table.Body>
//       </Table.Root>
//     </Box>
//   );
// }

import { useEffect, useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";

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

  const filteredEmployees = employees.filter((emp) =>
    `${emp.name} ${emp.employee_code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box p={5} textAlign="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box ml={["0", "250px"]} p={5}>
      {/* 🔍 Search */}
      <InputGroup mb={4} maxW="300px">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Rechercher un employé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {/* 📋 Table */}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Code</Th>
            <Th>Nom</Th>
            <Th>Privilege</Th>
            <Th>Groupe</Th>
            <Th>Carte</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredEmployees.map((emp) => (
            <Tr key={emp.employee_code}>
              <Td>{emp.employee_code}</Td>
              <Td>{emp.name}</Td>
              <Td>{emp.privilege}</Td>
              <Td>{emp.group_id || "-"}</Td>
              <Td>{emp.card || "-"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
