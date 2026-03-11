// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { ChakraProvider } from "@chakra-ui/react";
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import LoginPage from "./pages/LoginPage";
// import EmployeesPage from "./pages/EmployeesPage";
// import RapportPage from "./pages/RapportPage";
// import Pointages from "./pages/Pointages";
// import EmployeesToday from "./pages/EmployeesToday";
// import TestI18nPage from "./pages/TestI18nPage";
// import InactiveEmployeesPage from "./pages/InactiveEmployeesPage";
// import Parametrage from "./pages/Parametrage";
// import UserManagement from "./pages/UserManagement";
// import "./i18n";

// export default function App() {
//   return (
//     <ChakraProvider>
//       <AuthProvider>
//         <BrowserRouter>
//           <Routes>
//             <Route path="/login" element={<LoginPage />} />
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <Pointages />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/test-i18n"
//               element={
//                 <ProtectedRoute>
//                   <TestI18nPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/employees"
//               element={
//                 // <ProtectedRoute allowedRoles={["admin"]}>
//                 <ProtectedRoute>
//                   <EmployeesPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/employeesToday"
//               element={
//                 <ProtectedRoute>
//                   <EmployeesToday />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/pointages"
//               element={
//                 <ProtectedRoute>
//                   <Pointages />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/rapports"
//               element={
//                 <ProtectedRoute>
//                   <RapportPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/inactive-employees"
//               element={
//                 <ProtectedRoute>
//                   <InactiveEmployeesPage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/parametrage"
//               element={
//                 <ProtectedRoute allowedRoles={["admin"]}>
//                   <Parametrage />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/user-management"
//               element={
//                 <ProtectedRoute allowedRoles={["admin"]}>
//                   <UserManagement />
//                 </ProtectedRoute>
//               }
//             />
//           </Routes>
//         </BrowserRouter>
//       </AuthProvider>
//     </ChakraProvider>
//   );
// }

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import EmployeesPage from "./pages/EmployeesPage";
import RapportPage from "./pages/RapportPage";
import Pointages from "./pages/Pointages";
import EmployeesToday from "./pages/EmployeesToday";
import TestI18nPage from "./pages/TestI18nPage";
import InactiveEmployeesPage from "./pages/InactiveEmployeesPage";
import Parametrage from "./pages/Parametrage";
import UserManagement from "./pages/UserManagement";
import "./i18n";
import type { ReactNode } from "react";

const DEV_SKIP_AUTH = true; // Toggle this to enable/disable auth

export default function App() {
  // Conditionally use ProtectedRoute or a passthrough component
  const MaybeProtectedRoute = DEV_SKIP_AUTH 
    ? ({ children }: { children: ReactNode; allowedRoles?: string[] }) => <>{children}</>
    : ProtectedRoute;

  return (
    <ChakraProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <MaybeProtectedRoute>
                  <Pointages />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/test-i18n"
              element={
                <MaybeProtectedRoute>
                  <TestI18nPage />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <MaybeProtectedRoute>
                  <EmployeesPage />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/employeesToday"
              element={
                <MaybeProtectedRoute>
                  <EmployeesToday />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/pointages"
              element={
                <MaybeProtectedRoute>
                  <Pointages />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/rapports"
              element={
                <MaybeProtectedRoute>
                  <RapportPage />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/inactive-employees"
              element={
                <MaybeProtectedRoute>
                  <InactiveEmployeesPage />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/parametrage"
              element={
                <MaybeProtectedRoute allowedRoles={["admin"]}>
                  <Parametrage />
                </MaybeProtectedRoute>
              }
            />

            <Route
              path="/user-management"
              element={
                <MaybeProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </MaybeProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}