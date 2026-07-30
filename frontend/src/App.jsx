import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import BareShell from "./components/BareShell";
import AdminShell from "./components/AdminShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BookingFlow from "./pages/BookingFlow";
import BookingSuccess from "./pages/BookingSuccess";
import ClientHome from "./pages/ClientHome";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAgenda from "./pages/admin/AdminAgenda";
import AdminServices from "./pages/admin/AdminServices";
import AdminBarbers from "./pages/admin/AdminBarbers";
import AdminReports from "./pages/admin/AdminReports";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/minha-conta"
            element={
              <ProtectedRoute role="client">
                <ClientHome />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/entrar" element={<BareShell><Login /></BareShell>} />
        <Route path="/cadastro" element={<BareShell><Signup /></BareShell>} />
        <Route path="/painel/entrar" element={<BareShell><Login adminMode /></BareShell>} />

        <Route
          path="/agendar"
          element={
            <ProtectedRoute role="client">
              <BareShell><BookingFlow /></BareShell>
            </ProtectedRoute>
          }
        />
        <Route path="/agendar/sucesso" element={<BareShell><BookingSuccess /></BareShell>} />

        <Route
          path="/painel"
          element={
            <ProtectedRoute role="admin">
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="agenda" element={<AdminAgenda />} />
          <Route path="servicos" element={<AdminServices />} />
          <Route path="barbeiros" element={<AdminBarbers />} />
          <Route path="relatorios" element={<AdminReports />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
