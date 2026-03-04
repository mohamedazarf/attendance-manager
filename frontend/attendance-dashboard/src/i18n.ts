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

      /* ===== Login Page ===== */
      "Sign in to manage your workplace": "Sign in to manage your workplace",
      Username: "Username",
      "Enter username": "Enter username",
      "Sign In": "Sign In",
      "Welcome back!": "Welcome back!",
      "Successfully signed in as": "Successfully signed in as {{name}}",
      "Authentication Failed": "Authentication Failed",
      "Something went wrong": "Something went wrong",
      "Invalid username or password": "Invalid username or password",

      /* ===== Modals & Shared ===== */
      Success: "Success",
      Error: "Error",
      "Manual punch recorded successfully":
        "Manual punch recorded successfully",
      "Failed to record manual punch": "Failed to record manual punch",
      "Manual punch for": "Manual punch for",
      "Event Type": "Event Type",
      "Check-In": "Check-In",
      "Check-Out": "Check-Out",
      Time: "Time",
      "Optional notes...": "Optional notes...",
      Save: "Save",
      "Confirm absence for": "Confirm absence for",
      Reason: "Reason",
      "Sick Leave": "Sick Leave",
      Vacation: "Vacation",
      "Unjustified Absence": "Unjustified Absence",
      Other: "Other",
      Confirm: "Confirm",
      "Missing fields": "Missing fields",
      "UID and Name are required": "UID and Name are required",
      "User created successfully. Please scan fingerprint on the device.":
        "User created successfully. Please scan fingerprint on the device.",
      "Creation Failed": "Creation Failed",
      "Add New Employee": "Add New Employee",
      "UID (integer)": "UID (integer)",
      "Employee (7:30 - 16:30)": "Employee (7:30 - 16:30)",
      "Administration (8:30 - 17:30)": "Administration (8:30 - 17:30)",
      "Create & Enroll": "Create & Enroll",
      "Enrollment check timed out": "Enrollment check timed out",
      "Could not verify fingerprint enrollment. Please check on the device.":
        "Could not verify fingerprint enrollment. Please check on the device.",
      "Fingerprint successfully enrolled on device.":
        "Fingerprint successfully enrolled on device.",
      "User created successfully. You can now enroll fingerprint.":
        "User created successfully. You can now enroll fingerprint.",
      Department: "Department",
      "Error fetching employees": "Error fetching employees",
      "Error fetching history": "Error fetching history",

      /* ===== Parametrage (Settings) ===== */
      Settings: "Settings",
      "Special Days": "Special Days",
      "Include Sunday automatically as non-working day":
        "Include Sunday automatically as non-working day",
      "Label (optional)": "Label (optional)",
      "Ex: National holiday": "Ex: National holiday",
      "Add / Update": "Add / Update",
      "No special days configured": "No special days configured",
      "Special day saved": "Special day saved",
      "Save error": "Save error",
      "This page is reserved for administrators":
        "This page is reserved for administrators",
      "Special date":
        "This date is a special day: {{label}}. Absences are not counted.",
      "National holiday": "National holiday",
      "Remote day": "Remote day",
      Sunday: "Sunday",
      "Working day": "Working day",
      "Total Weekend Hours": "Total Weekend Hours",
      "No extra hours reported yesterday": "No extra hours reported yesterday",
      "No missing check-out yesterday": "No missing check-out yesterday",
      "Add manual check-out": "Add manual check-out",
      Yesterday: "Yesterday",
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

      /* ===== Login Page ===== */
      "Sign in to manage your workplace":
        "Connectez-vous pour gérer votre espace de travail",
      Username: "Nom d'utilisateur",
      "Enter username": "Entrez le nom d'utilisateur",
      "Sign In": "Se connecter",
      "Welcome back!": "Bon retour !",
      "Successfully signed in as": "Connecté avec succès en tant que {{name}}",
      "Authentication Failed": "Échec de l'authentification",
      "Something went wrong": "Une erreur est survenue",
      "Invalid username or password":
        "Nom d'utilisateur ou mot de passe invalide",

      /* ===== Modals & Shared ===== */
      Success: "Succès",
      Error: "Erreur",
      "Manual punch recorded successfully": "Pointage manuel enregistré",
      "Failed to record manual punch": "Échec de l'enregistrement du pointage",
      "Manual punch for": "Pointage manuel pour",
      "Event Type": "Type d'événement",
      "Check-In": "Entrée",
      "Check-Out": "Sortie",
      Time: "Heure",
      "Optional notes...": "Notes optionnelles...",
      Save: "Enregistrer",
      "Confirm absence for": "Confirmer l'absence pour",
      Reason: "Motif",
      "Sick Leave": "Maladie",
      Vacation: "Congé",
      "Unjustified Absence": "Absence injustifiée",
      Other: "Autre",
      Confirm: "Confirmer",
      "Missing fields": "Champs manquants",
      "UID and Name are required": "L'UID et le Nom sont requis",
      "User created successfully. Please scan fingerprint on the device.":
        "Utilisateur créé. Veuillez scanner l'empreinte sur l'appareil.",
      "Creation Failed": "Échec de la création",
      "Add New Employee": "Ajouter un nouvel employé",
      "UID (integer)": "UID (entier)",
      "Employee (7:30 - 16:30)": "Employé (7:30 - 16:30)",
      "Administration (8:30 - 17:30)": "Administration (8:30 - 17:30)",
      "Create & Enroll": "Créer et enrôler",
      "Enrollment check timed out": "Délai d'enrôlement expiré",
      "Could not verify fingerprint enrollment. Please check on the device.":
        "Impossible de vérifier l'enrôlement. Veuillez vérifier sur l'appareil.",
      "Fingerprint successfully enrolled on device.":
        "Empreinte enrôlée avec succès sur l'appareil.",
      "User created successfully. You can now enroll fingerprint.":
        "Utilisateur créé avec succès. Vous pouvez maintenant enrôler l'empreinte.",
      Department: "Département",
      "Error fetching employees": "Erreur lors de la récupération des employés",
      "Error fetching history":
        "Erreur lors de la récupération de l'historique",

      /* ===== Parametrage (Settings) ===== */
      Settings: "Paramétrage",
      "Special Days": "Jours spéciaux",
      "Include Sunday automatically as non-working day":
        "Inclure automatiquement le dimanche comme non ouvrable",
      "Label (optional)": "Libellé (optionnel)",
      "Ex: National holiday": "Ex: Fête nationale",
      "Add / Update": "Ajouter / Mettre à jour",
      "No special days configured": "Aucun jour spécial configuré",
      "Special day saved": "Jour spécial enregistré",
      "Save error": "Erreur d'enregistrement",
      "This page is reserved for administrators":
        "Cette page est réservée aux administrateurs.",
      "Special date":
        "Cette date est un jour spécial: {{label}}. Les absences ne sont pas comptabilisées.",
      "National holiday": "Jour férié",
      "Remote day": "Jour à distance",
      Sunday: "Dimanche",
      "Working day": "Jour ouvrable",
      "Total Weekend Hours": "Total des heures de week-end",
      "No extra hours reported yesterday": "Aucune heure supplémentaire hier",
      "No missing check-out yesterday": "Aucune sortie manquante hier",
      "Add manual check-out": "Ajouter une sortie manuelle",
      Yesterday: "Hier",
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
