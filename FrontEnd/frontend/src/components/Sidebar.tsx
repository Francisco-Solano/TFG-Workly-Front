import React, { useState } from "react";
import LogoutModal from "./LogoutModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

//Componente de la barra lateral
const Sidebar: React.FC = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* ─── Botón hamburguesa visible solo en móvil ─── */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white shadow-md rounded-md"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ─── Sidebar Desktop (oculto en móvil) ─── */}
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-col rounded-r-lg min-h-screen sticky top-0">
        {/*
          Pasamos onCloseMobile = undefined, así que SidebarContent sabrá
          que está en “modo desktop” (>= md).
        */}
        <SidebarContent
          user={user}
          navigate={navigate}
          setShowLogoutModal={setShowLogoutModal}
          // onCloseMobile queda sin pasar
        />
      </aside>

      {/* ─── Sidebar Móvil (overlay) ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40">
          <aside className="w-64 bg-white shadow-md flex flex-col h-full">
            {/*
              Aquí sí pasamos onCloseMobile, para indicar que está en “modo móvil overlay”.
              De ese modo el wrapper interno aplicará pl-12 en lugar de pl-6.
            */}
            <SidebarContent
              user={user}
              navigate={navigate}
              setShowLogoutModal={setShowLogoutModal}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

interface SidebarContentProps {
  user: any;
  navigate: (path: string) => void;
  setShowLogoutModal: (val: boolean) => void;
  onCloseMobile?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  user,
  navigate,
  setShowLogoutModal,
  onCloseMobile,
}) => {
  // Si onCloseMobile está definido => estamos en “overlay móvil”.
  // Si onCloseMobile = undefined => estamos en desktop.
  const isOverlayMobile = typeof onCloseMobile === "function";

  return (
    <div
      className={
        // En móvil-overlay: pl-12 (48px)
        // En desktop (>=md): pl-6 (24px) – para que no quede tan desplazado
        `flex flex-col h-full ${
          isOverlayMobile ? "pl-12" : "pl-6"
        }`
      }
    >
      {/* ─── Cabecera con “Workly” ─── */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            navigate(user ? "/" : "/login");
          }}
          className="text-3xl font-bold text-gray-700"
        >
          Workly
        </button>
      </div>

      {/* ─── Navegación ─── */}
      <nav className="flex-1 py-6">
        <ul>
          <li className="mb-2">
            <a
              href="#"
              className={
                // Cambiamos px-6 (24px) por px-4 (16px) para no acumular tanto padding
                // (en overlay móvil ya tenemos 48px de pl-12, más 16px de px-4 = 64px aprox.)
                // En desktop, pl-6 + px-4 = 10px desde el borde del aside
                "block py-2 px-4 bg-gray-200 text-gray-900 font-semibold border-l-4 border-blue-600 rounded-r-md"
              }
            >
              Proyectos
            </a>
          </li>

          {/*
            Puedes añadir más items aquí. Por ejemplo:
            <li className="mb-2">
              <a href="#" className="block py-2 px-4 hover:bg-gray-100 rounded-md">Otro ítem</a>
            </li>
          */}
        </ul>
      </nav>

      {/* ─── Pie con “Opciones / Cerrar sesión” ─── */}
      <div className="p-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Opciones</h2>
        <ul>
          <li>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={
                // Nuevamente bajamos px-6 → px-4
                "flex items-center text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-md transition-colors duration-200 w-full text-left"
              }
            >
              <svg
                className="w-5 h-5 mr-2 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1"
                />
              </svg>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
