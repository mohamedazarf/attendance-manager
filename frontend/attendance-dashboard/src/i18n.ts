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
      /* ===== Dashboard ===== */
      "Attendance dashboard": "Attendance Dashboard",
      "Date": "Date",
      "Total Employees": "Total Employees",
      "Present Today": "Present Today",
      "Absent Today": "Absent Today",
      "Attendance Rate": "Attendance Rate",
      "Daily Alerts": "Daily Alerts",
      "Alertes de pointage": "Attendance Alerts",
      "No alerts 🎉": "No alerts 🎉",

      /* ===== Employee status ===== */
      "Absent": "Absent",
      "Missing check-out": "Missing check-out",
      "Missing check-in": "Missing check-in",
      "Late": "Late",
      "Extra hours": "Extra hours",

      /* ===== Actions ===== */
      "Manual punch": "Manual punch",
      "Mark absent": "Mark absent",
      "Confirm late": "Confirm late",

      /* ===== Employees Today ===== */
      "Employees Today": "Employees Today",

      /* ===== Reports Page ===== */
      "Monthly attendance report": "Monthly Attendance Report",
      "Employee ID": "Employee ID",
      "Period": "Period",
      "Working days": "Working Days",
      "Presences": "Presences",
      "Absences": "Absences",
      "Presence %": "Presence %",
      "Absence %": "Absence %",
      "Year": "Year",
      "Month": "Month",
      "Loading": "Loading...",
      "Attendance Report": "Attendance Report",
    },
  },

  fr: {
    translation: {
      /* ===== Dashboard ===== */
      "Attendance dashboard": "Tableau de bord des pointages",
      "Date": "Date",
      "Total Employees": "Employés totaux",
      "Present Today": "Présents aujourd'hui",
      "Absent Today": "Absents aujourd'hui",
      "Attendance Rate": "Taux de présence",
      "Daily Alerts": "Alertes quotidiennes",
      "Alertes de pointage": "Alertes de pointage",
      "No alerts 🎉": "Aucune alerte 🎉",

      /* ===== Employee status ===== */
      "Absent": "Absent",
      "Missing check-out": "Sortie manquante",
      "Missing check-in": "Entrée manquante",
      "Late": "Retard",
      "Extra hours": "Heures supplémentaires",

      /* ===== Actions ===== */
      "Manual punch": "Pointage manuel",
      "Mark absent": "Marquer absent",
      "Confirm late": "Confirmer le retard",

      /* ===== Employees Today ===== */
      "Employees Today": "Employés du jour",

      /* ===== Reports Page ===== */
      "Monthly attendance report": "Rapport mensuel de présence",
      "Employee ID": "ID Employé",
      "Period": "Période",
      "Working days": "Jours ouvrés",
      "Presences": "Présences",
      "Absences": "Absences",
      "Presence %": "Présence %",
      "Absence %": "Absence %",
      "Year": "Année",
      "Month": "Mois",
      "Loading": "Chargement...",
      "Attendance Report": "Rapport de présence",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
