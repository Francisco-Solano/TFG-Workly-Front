import React, { useState } from "react";

interface Collaborator {
  id: number;
  email: string;
}

interface Props {
  onClose: () => void;
  onAdd: (email: string) => void;
  onRemove: (collaboratorId: number) => void;
  existing: Collaborator[]; // lista actual de colaboradores
}

const AddCollaboratorModal: React.FC<Props> = ({
  onClose,
  onAdd,
  onRemove,
  existing,
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onAdd(email.trim());
    setEmail("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Gestionar Colaboradores
        </h2>

        {/* ––– Cualquier colaborador existente ––– */}
        {existing.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Colaboradores actuales:</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {existing.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between bg-gray-100 rounded px-3 py-2"
                >
                  <span>{c.email}</span>
                  <button
                    onClick={() => onRemove(c.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar colaborador"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ––– Formulario para añadir nuevo colaborador ––– */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email del colaborador"
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Añadir
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCollaboratorModal;
