import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/context/AuthContext";
import { TicketProvider } from "./app/context/TicketContext";
import { DeskLayoutProvider } from "./app/context/DeskLayoutContext";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import AdminDashboard from "./app/pages/AdminDashboard";
import EmployeeDashboard from "./app/pages/EmployeeDashboard";
import OfficeMap from "./app/pages/OfficeMap";
import { ProtectedRoute } from "./app/components/ProtectedRoute";
import { Toaster } from "sonner"; 

function App() {
  return (
    <AuthProvider>
      <TicketProvider>
        <DeskLayoutProvider>
          <Toaster // componentes de la notificacion como colores, tiempo, posicion y si se muestra el boton de cerrar
            position="top-right"
            offset={{ top: 86, right: 18 }}
            richColors
            closeButton
            duration={1000}
            visibleToasts={1}
          />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/OfficeMap"
                element={
                  <ProtectedRoute requiredRole={["admin", "employee"]}>
                    <OfficeMap />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </DeskLayoutProvider>
      </TicketProvider>
    </AuthProvider>
  );
}

export default App;