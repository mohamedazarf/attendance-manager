import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import RapportPage from "./pages/RapportPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/rapports" element={<RapportPage />} />
      </Routes>
    </BrowserRouter>
  );
}
