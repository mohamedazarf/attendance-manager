// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Traductions
const resources = {
  en: {
    translation: {
      // Global
      "Attendance dashboard": "Attendance dashboard",
      "Total Employees": "Total Employees",
      "Present Today": "Present Today",
      "Absent Today": "Absent Today",
      "Attendance Rate": "Attendance Rate",

      // Alerts
      "Daily Alerts": "Daily Alerts",
      "No alerts 🎉": "No alerts 🎉",
      "Extra hours": "Extra hours",
      "Missing check-in": "Missing check-in",
      "Missing check-out": "Missing check-out",
      "Late": "Late",
      "Absent": "Absent",

      // Buttons
      "Manual punch": "Manual punch",
      "Mark absent": "Mark absent",
      "Confirm late": "Confirm late",
    },
  },
  fr: {
    translation: {
      // Global
      "Attendance dashboard": "Tableau de pointage",
      "Total Employees": "Employés totaux",
      "Present Today": "Présents aujourd'hui",
      "Absent Today": "Absents aujourd'hui",
      "Attendance Rate": "Taux de présence",

      // Alerts
      "Daily Alerts": "Alertes quotidiennes",
      "No alerts 🎉": "Aucune alerte 🎉",
      "Extra hours": "Heures supplémentaires",
      "Missing check-in": "Check-in manquant",
      "Missing check-out": "Check-out manquant",
      "Late": "En retard",
      "Absent": "Absent",

      // Buttons
      "Manual punch": "Pointage manuel",
      "Mark absent": "Marquer absent",
      "Confirm late": "Confirmer retard",
    },
  },
};

i18n
  .use(initReactI18next) // passe i18n à react-i18next
  .init({
    resources,
    lng: "fr", // langue par défaut
    fallbackLng: "en", // langue de repli si traduction manquante
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
  });

export default i18n;

// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";

// i18n
//   .use(initReactI18next)
//   .init({
//     resources: {
//       fr: {
//         translation: {
//            welcome_message: "Welcome to i18next!",
//       description: "This is a test page to try translations.",
//           dashboard: "Tableau de bord",
//           employees: "Employés",
//           logout: "Déconnexion",
//         },
//       },
//       en: {
//         translation: {
//           welcome_message: "Bienvenue sur i18next !",
//       description: "Ceci est une page de test pour essayer les traductions.",
//           dashboard: "Dashboard",
//           employees: "Employees",
//           logout: "Logout",
//         },
//       },
//       ar: {
//         translation: {
//           dashboard: "لوحة التحكم",
//           employees: "الموظفون",
//           logout: "تسجيل الخروج",
//         },
//       },
//     },
//     lng: "fr", // langue par défaut
//     fallbackLng: "en",
//     interpolation: {
//       escapeValue: false,
//     },
//   });

// export default i18n;
