import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: {
          dashboard: "Tableau de bord",
          employees: "Employés",
          logout: "Déconnexion",
        },
      },
      en: {
        translation: {
          dashboard: "Dashboard",
          employees: "Employees",
          logout: "Logout",
        },
      },
      ar: {
        translation: {
          dashboard: "لوحة التحكم",
          employees: "الموظفون",
          logout: "تسجيل الخروج",
        },
      },
    },
    lng: "fr", // langue par défaut
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
