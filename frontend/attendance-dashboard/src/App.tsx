import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import RapportPage from "./pages/RapportPage";
import HoursByEmployeeChart from "./pages/charts/HoursByEmployeeChart";
import RapportsChartsPage from "./pages/RapportChartsPage";
import Pointages from "./pages/Pointages";

// import RapportsChartsPage from "./pages/charts/RapportChartsPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/pointages" element={<Pointages />} />
        <Route path="/rapports" element={<RapportPage />} />
<Route path="/rapports/charts" element={<RapportsChartsPage />} />
        <Route path="/charts/hoursByEmployee" element={<HoursByEmployeeChart />} />
      </Routes>
    </BrowserRouter>
  );
}
