import React from "react";
//Componente de la tarjeta 
interface Project {
  id: number;
  title: string;
  favorite: boolean;
  isShared?: boolean;
}

interface Props {
  project: Project;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const ProjectCard: React.FC<Props> = ({
  project,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-blue-800 text-white px-4 py-6 rounded-xl shadow-md flex flex-col justify-between items-start aspect-[4/2] min-h-[100px] relative group hover:shadow-lg transition-shadow duration-300">
      {/* Menú de opciones */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={onToggleMenu}
            className="text-white hover:text-gray-300 focus:outline-none"
            aria-label="Abrir menú"
          >
            &#8942;
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white text-black rounded shadow-md z-10">
              <button
                onClick={onEdit}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Editar
              </button>
              <button
                onClick={onDelete}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <span className="text-lg font-semibold">{project.title}</span>

      <button onClick={onToggleFavorite} aria-label="Marcar como favorito">
        {project.favorite ? (
          <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 20 20">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343 3.172 11.515a4 4 0 010-5.656z" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.72-7.72 1.06-1.06a5.5 5.5 0 000-7.82z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ProjectCard;
