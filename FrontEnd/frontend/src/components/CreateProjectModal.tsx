import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Props {
  onClose: () => void;
  onCreate: (
    title: string,
    id?: number,
    visibility?: string,
    collaborators?: Collaborator[]
  ) => void;
  editingProject?: { id: number; title: string };
}

interface Collaborator {
  email: string;
  id: number;
}

const CreateProjectModal: React.FC<Props> = ({
  onClose,
  onCreate,
  editingProject,
}) => {
  const { user } = useAuth();
  const token = user?.token;

  const [title, setTitle] = useState(editingProject?.title || "");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    onCreate(title, editingProject?.id, undefined, collaborators);
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
          {editingProject ? "Editar Proyecto" : "Crear Proyecto"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Título del proyecto"
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>

        
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
          >
            {editingProject ? "Guardar Cambios" : "Crear"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
