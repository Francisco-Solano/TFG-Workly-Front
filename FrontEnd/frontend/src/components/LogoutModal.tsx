// src/components/LogoutModal.tsx
import React from "react";
//Vista para cuando se va a cerrar sesion
interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black-600 mb-1">Workly</h1>
          <p className="text-gray-800 text-lg mb-6">¿Deseas cerrar sesión?</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="w-1/2 mr-2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 ml-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
