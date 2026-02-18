import React, { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface ManualPunchModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: { id: number; name: string } | null;
    onSuccess: () => void;
}

export const ManualPunchModal: React.FC<ManualPunchModalProps> = ({
    isOpen,
    onClose,
    employee,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [eventType, setEventType] = useState("check_in");
    const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
    const [notes, setNotes] = useState("");

    const handleSubmit = async () => {
        if (!employee) return;
        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/attendance/manual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employee.id.toString(),
                    event_type: eventType,
                    timestamp: time,
                    notes,
                }),
            });

            if (response.ok) {
                toast({
                    title: t("Success"),
                    description: t("Manual punch recorded successfully"),
                    status: "success",
                    duration: 3000,
                });
                onSuccess();
                onClose();
            } else {
                throw new Error("Failed to record manual punch");
            }
        } catch (error) {
            toast({
                title: t("Error"),
                description: t("Failed to record manual punch"),
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t("Manual punch for")} {employee?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={4}>
                        <FormLabel>{t("Event Type")}</FormLabel>
                        <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                            <option value="check_in">{t("Check-In")}</option>
                            <option value="check_out">{t("Check-Out")}</option>
                        </Select>
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>{t("Time")}</FormLabel>
                        <Input
                            type="datetime-local"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>{t("Notes")}</FormLabel>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t("Optional notes...")}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        {t("Cancel")}
                    </Button>
                    <Button colorScheme="blue" isLoading={loading} onClick={handleSubmit}>
                        {t("Save")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

interface MarkAbsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: { id: number; name: string } | null;
    date: string;
    onSuccess: () => void;
}

export const MarkAbsentModal: React.FC<MarkAbsentModalProps> = ({
    isOpen,
    onClose,
    employee,
    date,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("Maladie");
    const [notes, setNotes] = useState("");

    const handleSubmit = async () => {
        if (!employee) return;
        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/attendance/confirm-absence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: employee.id.toString(),
                    date,
                    reason,
                    notes,
                }),
            });

            if (response.ok) {
                toast({
                    title: t("Success"),
                    description: t("Absence confirmed successfully"),
                    status: "success",
                    duration: 3000,
                });
                onSuccess();
                onClose();
            } else {
                throw new Error("Failed to confirm absence");
            }
        } catch (error) {
            toast({
                title: t("Error"),
                description: t("Failed to confirm absence"),
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t("Confirm absence for")} {employee?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={4}>
                        <FormLabel>{t("Reason")}</FormLabel>
                        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                            <option value="Maladie">{t("Sick Leave")}</option>
                            <option value="Congé">{t("Vacation")}</option>
                            <option value="Absence injustifiée">{t("Unjustified Absence")}</option>
                            <option value="Autre">{t("Other")}</option>
                        </Select>
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>{t("Notes")}</FormLabel>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t("Optional notes...")}
                        />
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        {t("Cancel")}
                    </Button>
                    <Button colorScheme="red" isLoading={loading} onClick={handleSubmit}>
                        {t("Confirm")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
