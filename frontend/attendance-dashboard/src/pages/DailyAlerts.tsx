import {
  Box,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Divider,
} from "@chakra-ui/react";

type AlertEmployee = {
  employee_id: number;
  employee_name: string;
  anomalies: string[]; // absence | entree_sans_sortie | sortie_sans_entree | retard
  late_minutes?: number;
  extra_hours?: number;
};
type Props = {
  employees: AlertEmployee[];
};

export default function DailyAlerts({ employees }: Props) {
  if (employees.length === 0) {
    return <Text color="gray.500">No alerts today 🎉</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      {employees.map((emp) => {
        const hasExtraHours = Number(emp.extra_hours ?? 0) > 0;

        const bgColor = hasExtraHours ? "green.50" : "red.50";
        const borderColor = hasExtraHours ? "green.200" : "red.200";
        return (
        <Box
          key={emp.employee_id}
          p={4}
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
          bg={bgColor}
        >
          <Text fontWeight="bold">{emp.employee_name}</Text>

          {/* ---------- Anomalies ---------- */}
          <HStack mt={2} spacing={2} wrap="wrap">
            {emp.anomalies.includes("absence") && (
              <Badge colorScheme="red">Absent</Badge>
            )}

            {emp.anomalies.includes("entree_sans_sortie") && (
              <Badge colorScheme="orange">Missing check-out</Badge>
            )}

            {emp.anomalies.includes("sortie_sans_entree") && (
              <Badge colorScheme="purple">Missing check-in</Badge>
            )}

            {emp.anomalies.includes("retard") && (
              <Badge colorScheme="yellow">Late ({emp.late_minutes} min)</Badge>
            )}

            {emp.extra_hours && emp.extra_hours > 0 && (
              <Badge colorScheme="blue">Extra hours +{emp.extra_hours}h</Badge>
            )}
          </HStack>

          <Divider my={3} />

          {/* ---------- Actions Admin ---------- */}
          <HStack spacing={3}>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => console.log("Manual punch for", emp.employee_id)}
            >
              Manual punch
            </Button>

            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => console.log("Mark absent", emp.employee_id)}
            >
              Mark absent
            </Button>

            {emp.anomalies.includes("retard") && (
              <Button
                size="sm"
                colorScheme="yellow"
                variant="outline"
                onClick={() =>
                  console.log("Confirm late arrival", emp.employee_id)
                }
              >
                Confirm late
              </Button>
            )}
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
