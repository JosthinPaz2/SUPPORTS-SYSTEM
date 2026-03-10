import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/context/AuthContext";
import { TicketProvider } from "./app/context/TicketContext";
import { DeskLayoutProvider } from "./app/context/DeskLayoutContext";
import Login from "./app/pages/Login";
import Register from "./app/pages/Register";
import AdminDashboard from "./app/pages/AdminDashboard";
import OfficeMap from "./app/pages/OfficeMap";
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
