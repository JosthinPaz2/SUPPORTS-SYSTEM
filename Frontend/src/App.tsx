import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/context/AuthContext";
import { TicketProvider } from "./app/context/TicketContext";
import Login from "./app/pages/Login";
import AdminDashboard from "./app/pages/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <TicketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </TicketProvider>
    </AuthProvider>
  );
}

export default App;
