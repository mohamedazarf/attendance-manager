// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";

// const resources = {
//   en: {
//     translation: {
//       /* Dashboard */
//       "Attendance dashboard": "Attendance Dashboard",
//       "Date": "Date",
//       "Total Employees": "Total Employees",
//       "Present Today": "Present Today",
//       "Absent Today": "Absent Today",
//       "Attendance Rate": "Attendance Rate",
//       "Daily Alerts": "Daily Alerts",
//       "Alertes de pointage": "Attendance Alerts",
//       "No alerts 🎉": "No alerts 🎉",

//       /* Employee status */
//       "Absent": "Absent",
//       "Missing check-out": "Missing check-out",
//       "Missing check-in": "Missing check-in",
//       "Late": "Late",
//       "Extra hours": "Extra hours",

//       /* Actions */
//       "Manual punch": "Manual punch",
//       "Mark absent": "Mark absent",
//       "Confirm late": "Confirm late",

//       /* Navigation */
//       "Employees Today": "Employees Today"
//     },
//   },

//   fr: {
//     translation: {
//       /* Dashboard */
//       "Attendance dashboard": "Tableau de bord des pointages",
//       "Date": "Date",
//       "Total Employees": "Employés totaux",
//       "Present Today": "Présents aujourd'hui",
//       "Absent Today": "Absents aujourd'hui",
//       "Attendance Rate": "Taux de présence",
//       "Daily Alerts": "Alertes quotidiennes",
//       "Alertes de pointage": "Alertes de pointage",
//       "No alerts 🎉": "Aucune alerte 🎉",

//       /* Employee status */
//       "Absent": "Absent",
//       "Missing check-out": "Sortie manquante",
//       "Missing check-in": "Entrée manquante",
//       "Late": "Retard",
//       "Extra hours": "Heures supplémentaires",

//       /* Actions */
//       "Manual punch": "Pointage manuel",
//       "Mark absent": "Marquer absent",
//       "Confirm late": "Confirmer le retard",

//       /* Navigation */
//       "Employees Today": "Employés du jour"
//     },
//   },
// };

// i18n
//   .use(initReactI18next)
//   .init({
//     resources,
//     lng: "fr", // langue par défaut
//     fallbackLng: "en",
//     interpolation: {
//       escapeValue: false,
//     },
//   });

// export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      /* ===== Dashboard & Layout ===== */
      "Attendance dashboard": "Attendance Dashboard",
      "Dashboard RH": "HR Dashboard",
      Date: "Date",
      "Total Employees": "Total Employees",
      "Present Today": "Present Today",
      "Absent Today": "Absent Today",
      "Attendance Rate": "Attendance Rate",
      "Daily Alerts": "Daily Alerts",
      "Alertes de pointage": "Attendance Alerts",
      "No alerts 🎉": "No alerts 🎉",
      Logout: "Logout",
      Dashboard: "Dashboard",
      Pointages: "Attendance",
      Employees: "Employees",
      "Inactive Employees": "Inactive Employees",
      Reports: "Reports",
      Charts: "Charts",
      "Monthly Report": "Monthly Report",

      /* ===== Employee status & Anomalies ===== */
      Absent: "Absent",
      "Missing check-out": "Missing check-out",
      "Missing check-in": "Missing check-in",
      Late: "Late",
      "Extra hours": "Extra hours",
      "Early departure": "Early departure",
      "Incomplete day": "Incomplete day",
      retard: "Late",
      early_departure: "Early departure",
      incomplete_day: "Incomplete day",
      entree_sans_sortie: "Entry without exit",
      sortie_sans_entree: "Exit without entry",

      /* ===== Actions ===== */
      "Manual punch": "Manual punch",
      "Mark absent": "Mark absent",
      "Confirm late": "Confirm late",
      Delete: "Delete",
      Password: "Password",
      Edit: "Edit",
      "Add Employee": "Add Employee",
      Filter: "Filter",
      "Export CSV": "Export CSV",
      "Export Excel": "Export Excel",
      "Enroll Fingerprint": "Enroll Fingerprint",
      "Add Another Fingerprint": "Add Another Fingerprint",
      "All Employees Today": "All Employees Today",
      "All Anomalies": "All Anomalies",
      "Total Extra Hours in That Period..": "Total Extra Hours in That Period",
      "No inactive employees found": "No inactive employees found",
      "charts.reports": "Reports & Charts",
      "sidebar.toggle": "Toggle Sidebar",
      "Attendance Charts": "Attendance Charts",
      "Presence vs Absence per Employee": "Presence vs Absence per Employee",
      "Global Presence Rate": "Global Presence Rate",
      "No data available": "No data available",
      "Hours by Employee": "Hours by Employee",
      "Most Anomalies": "Most Anomalies",
      "Worked vs Expected Hours": "Worked vs Expected Hours",
      "Filter by employee...": "Filter by employee...",
      "Weekend Worked Hours": "Weekend Worked Hours",
      "Weekend hours": "Weekend hours",
      Insufficient: "Insufficient",
      "Expected hours": "Expected hours",

      /* ===== Employees Page ===== */
      "employee(s) found": "employee(s) found",
      "Search employee...": "Search employee...",
      "All privileges": "All privileges",
      User: "User",
      Admin: "Admin",
      Cards: "Cards",
      Table: "Table",
      Name: "Name",
      Code: "Code",
      Privilege: "Privilege",
      Group: "Group",
      Card: "Card",
      Fingerprint: "Fingerprint",
      Actions: "Actions",
      enrolled: "enrolled",
      None: "None",
      "Employee History": "Employee History",
      All: "All",
      Present: "Present",

      /* ===== Reports Page ===== */
      "Monthly attendance report": "Monthly Attendance Report",
      "Employee ID": "Employee ID",
      Period: "Period",
      "Working days": "Working Days",
      Presences: "Presences",
      Absences: "Absences",
      "Presence %": "Presence %",
      "Absence %": "Absence %",
      Year: "Year",
      Month: "Month",
      Loading: "Loading...",
      "Attendance Report": "Attendance Report",
      "Start Date": "Start Date",
      "End Date": "End Date",
      "Weekend Days": "Weekend Days",
      "Weekend Hours": "Weekend Hours",
      "Total Worked Hours in That Period": "Total Worked Hours in That Period",
      "Total weekend Worked Hours in That Period":
        "Total weekend Worked Hours in That Period",
      "Check-in": "Check-in",
      "Check-out": "Check-out",
      "Worked Hours": "Worked Hours",
      "Late Minutes": "Late Minutes",
      Anomalies: "Anomalies",
      Status: "Status",

      /* ===== Messages & Toasts ===== */
      "Enrollment Started": "Enrollment Started",
      "Enrollment Timed Out": "Enrollment Timed Out",
      "Fingerprint Enrolled": "Fingerprint Enrolled",
      "Enrollment Failed": "Enrollment Failed",
      "Password Set": "Password Set",
      "Failed to set password": "Failed to set password",
      "User Created": "User Created",
      "Error creating employee": "Error creating employee",
      "Employee Updated": "Employee Updated",
      "Update failed": "Update failed",
      Note: "Note",
      Yes: "Yes",
      No: "No",
      Cancel: "Cancel",
      "Are you sure you want to delete": "Are you sure you want to delete",
      "This action cannot be undone": "This action cannot be undone",
      "Enter new password": "Enter new password",
      "Save Password": "Save Password",
      "Save Employee": "Save Employee",
      "Update Employee": "Update Employee",
    },
  },

  fr: {
    translation: {
      /* ===== Dashboard & Layout ===== */
      "Attendance dashboard": "Tableau de bord des pointages",
      "Dashboard RH": "Tableau de bord RH",
      Date: "Date",
      "Total Employees": "Employés totaux",
      "Present Today": "Présents aujourd'hui",
      "Absent Today": "Absents aujourd'hui",
      "Attendance Rate": "Taux de présence",
      "Daily Alerts": "Alertes quotidiennes",
      "Alertes de pointage": "Alertes de pointage",
      "No alerts 🎉": "Aucune alerte 🎉",
      Logout: "Déconnexion",
      Dashboard: "Tableau de bord",
      Pointages: "Pointages",
      Employees: "Employés",
      "Inactive Employees": "Employés inactifs",
      Reports: "Rapports",
      Charts: "Graphiques",
      "Monthly Report": "Rapport mensuel",

      /* ===== Employee status & Anomalies ===== */
      Absent: "Absent",
      "Missing check-out": "Sortie manquante",
      "Missing check-in": "Entrée manquante",
      Late: "Retard",
      "Extra hours": "Heures supplémentaires",
      "Early departure": "Départ anticipé",
      "Incomplete day": "Journée incomplète",
      retard: "Retard",
      early_departure: "Départ anticipé",
      incomplete_day: "Journée incomplète",
      entree_sans_sortie: "Entrée sans sortie",
      sortie_sans_entree: "Sortie sans entrée",

      /* ===== Actions ===== */
      "Manual punch": "Pointage manuel",
      "Mark absent": "Marquer absent",
      "Confirm late": "Confirmer le retard",
      Delete: "Supprimer",
      Password: "Mot de passe",
      Edit: "Modifier",
      "Add Employee": "Ajouter un employé",
      Filter: "Filtrer",
      "Export CSV": "Exporter CSV",
      "Export Excel": "Exporter Excel",
      "Enroll Fingerprint": "Enrégi. Empreinte",
      "Add Another Fingerprint": "Ajouter une autre empreinte",
      "All Employees Today": "Tous les employés aujourd'hui",
      "All Anomalies": "Toutes les anomalies",
      "Total Extra Hours in That Period..": "Total des heures supplémentaires",
      "No inactive employees found": "Aucun employé inactif trouvé",
      "charts.reports": "Rapports & Graphiques",
      "sidebar.toggle": "Basculer la barre latérale",
      "Attendance Charts": "Graphiques de présence",
      "Presence vs Absence per Employee": "Présence vs Absence par employé",
      "Global Presence Rate": "Taux de présence global",
      "No data available": "Aucune donnée disponible",
      "Hours by Employee": "Heures par employé",
      "Most Anomalies": "Plus d'anomalies",
      "Worked vs Expected Hours": "Heures travaillées vs attendues",
      "Filter by employee...": "Filtrer par employé...",
      "Weekend Worked Hours": "Heures travaillées le week-end",
      "Weekend hours": "Heures week-end",
      Insufficient: "Insuffisant",
      "Expected hours": "Heures attendues",

      /* ===== Employees Page ===== */
      "employee(s) found": "employé(s) trouvé(s)",
      "Search employee...": "Rechercher un employé...",
      "All privileges": "Tous les privilèges",
      User: "Utilisateur",
      Admin: "Admin",
      Cards: "Cartes",
      Table: "Tableau",
      Name: "Nom",
      Code: "Code",
      Privilege: "Privilège",
      Group: "Groupe",
      Card: "Carte",
      Fingerprint: "Empreinte",
      Actions: "Actions",
      enrolled: "enrôlé(s)",
      None: "Aucun",
      "Employee History": "Historique de l'employé",
      All: "Tout",
      Present: "Présent",

      /* ===== Reports Page ===== */
      "Monthly attendance report": "Rapport mensuel de présence",
      "Employee ID": "ID Employé",
      Period: "Période",
      "Working days": "Jours ouvrés",
      Presences: "Présences",
      Absences: "Absences",
      "Presence %": "Présence %",
      "Absence %": "Absence %",
      Year: "Année",
      Month: "Mois",
      Loading: "Chargement...",
      "Attendance Report": "Rapport de présence",
      "Start Date": "Date de début",
      "End Date": "Date de fin",
      "Weekend Days": "Jours de week-end",
      "Weekend Hours": "Heures de week-end",
      "Total Worked Hours in That Period":
        "Total des heures travaillées sur la période",
      "Total weekend Worked Hours in That Period":
        "Total des heures de week-end sur la période",
      "Check-in": "Entrée",
      "Check-out": "Sortie",
      "Worked Hours": "Heures travaillées",
      "Late Minutes": "Minutes de retard",
      Anomalies: "Anomalies",
      Status: "Statut",

      /* ===== Messages & Toasts ===== */
      "Enrollment Started": "Enrôlement commencé",
      "Enrollment Timed Out": "Temps d'enrôlement écoulé",
      "Fingerprint Enrolled": "Empreinte enrôlée",
      "Enrollment Failed": "Échec de l'enrôlement",
      "Password Set": "Mot de passe défini",
      "Failed to set password": "Échec de la définition du mot de passe",
      "User Created": "Utilisateur créé",
      "Error creating employee": "Erreur lors de la création de l'employé",
      "Employee Updated": "Employé mis à jour",
      "Update failed": "La mise à jour a échoué",
      Note: "Note",
      Yes: "Oui",
      No: "Non",
      Cancel: "Annuler",
      "Are you sure you want to delete": "Êtes-vous sûr de vouloir supprimer",
      "This action cannot be undone": "Cette action est irréversible",
      "Enter new password": "Entrez le nouveau mot de passe",
      "Save Password": "Enregistrer le mot de passe",
      "Save Employee": "Enregistrer l'employé",
      "Update Employee": "Mettre à jour l'employé",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
