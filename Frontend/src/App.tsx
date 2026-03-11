import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/context/AuthContext";
import { TicketProvider } from "./app/context/TicketContext";
import { DeskLayoutProvider } from "./app/context/DeskLayoutContext";
import { ProtectedRoute } from "./app/components/ProtectedRoute";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import AdminDashboard from "./app/pages/AdminDashboard";
import EmployeeDashboard from "./app/pages/EmployeeDashboard";
import OfficeMap from "./app/pages/OfficeMap";
import Unauthorized403 from "./app/pages/Unauthorized403";
import { Toaster } from "sonner"; 

function App() {
  return (
    <AuthProvider>
      <TicketProvider>
        <DeskLayoutProvider>
          <Toaster // componentes de la notificacion como colores, tiempo, posicion y si se muestra el boton de cerrar
            position="top-right"
            richColors 
            closeButton 
            duration={3000} 
          />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes - Admin Only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Employee Only */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Protected Routes - Employee Only (Admin sees map embedded in their dashboard) */}
              <Route
                path="/OfficeMap"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <OfficeMap />
                  </ProtectedRoute>
                }
              />

              {/* Authorization Error Page */}
              <Route path="/403" element={<Unauthorized403 />} />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </DeskLayoutProvider>
      </TicketProvider>
    </AuthProvider>
  );
}

export default App;
