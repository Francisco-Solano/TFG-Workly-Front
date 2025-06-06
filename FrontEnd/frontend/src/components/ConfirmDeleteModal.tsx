import React from 'react';

//Vista que se muestra cuando se quiere eliminar un elemento 
interface ConfirmDeleteModalProps {
  projectTitle: string;
  collaboratorEmail:string,
  onConfirm: () => void;
  onCancel: () => void;
}





const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Eliminar elemento</h1>
          <p className="text-gray-700 text-lg mb-6">
            ¿Deseas eliminar?
          </p>
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
            className="w-1/2 ml-2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
