import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/context/AuthContext";
import { TicketProvider } from "./app/context/TicketContext";
import { DeskLayoutProvider } from "./app/context/DeskLayoutContext";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import AdminDashboard from "./app/pages/AdminDashboard";
import OfficeMap from "./app/pages/OfficeMap";
import Splash from "./app/pages/Splash";

function App() {
  return (
    <AuthProvider>
      <TicketProvider>
        <DeskLayoutProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/splash" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/OfficeMap" element={<OfficeMap />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </DeskLayoutProvider>
      </TicketProvider>
    </AuthProvider>
  );
}

export default App;
