import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CreateProjectModal from '../components/CreateProjectModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config/api";


interface Project {
  id: number;
  title: string;
  favorite: boolean;
  owner: boolean;
}

const Home = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<Project | undefined>(undefined);

  const { user } = useAuth();
  const token = user?.token;
  

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!token || !user) return;

        const resMios = await fetch(`${API_URL}/api/v1/proyectos/mios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resMios.ok) throw new Error("Error al cargar proyectos propios");
        const dataMios = await resMios.json();

        const resCompartidos = await fetch(`${API_URL}/api/v1/proyectos/compartidos/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        if (!resCompartidos.ok) throw new Error("Error al cargar proyectos compartidos");
        const dataCompartidos = await resCompartidos.json();

        const proyectosMios = dataMios.map((p: any) => ({
          id: p.proyectoId,
          title: p.nombre,
          favorite: false,
          owner: true,
        }));

        const proyectosCompartidos = dataCompartidos.map((p: any) => ({
          id: p.proyectoId,
          title: p.nombre,
          favorite: false,
          owner: false,
        }));

        setProjects([...proyectosMios, ...proyectosCompartidos]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProjects();
  }, [token, user]);

  const handleCreateProject = async (title: string) => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/v1/proyectos/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: title, visibilidad: false }),
      });
      if (!res.ok) throw new Error("Error al crear proyecto");
      const newProject = await res.json();
      const adaptedProject = {
        id: newProject.proyectoId,
        title: newProject.nombre,
        favorite: false,
        owner: true,
      };
      setProjects((prev) => [...prev, adaptedProject]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProject = async (id: number, title: string) => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/v1/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: title, visibilidad: true }),
      });
      if (!res.ok) throw new Error("Error al actualizar proyecto");
      const updatedProject = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: updatedProject.nombre } : p))
      );
      setShowModal(false);
      setEditingProject(undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = (id: number) => {
    setProjects(
      projects.map((project) =>
        project.id === id ? { ...project, favorite: !project.favorite } : project
      )
    );
  };

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const proyectosMios = filteredProjects.filter((p) => p.owner);
  const proyectosCompartidos = filteredProjects.filter((p) => !p.owner);

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar colapsable coloca fuera mobile */}
      <div className="sticky left-0 top-0 z-30 shrink-0">
      <Sidebar />
      </div>
      {/* Contenedor principal */}
      <div className="flex flex-col flex-1 relative overflow-auto">
        {/* Header con espacio left en móvil para evitar solapamiento */}
        <div className="pl-12 md:pl-0">
          <Header
            onNavigateToCreateProject={() => {
              setEditingProject(undefined);
              setShowModal(true);
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Proyectos</h1>

          {proyectosMios.length === 0 ? (
            <p>No hay proyectos propios que coincidan con "{searchTerm}"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              {proyectosMios.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setEditingProject={setEditingProject}
                  setShowModal={setShowModal}
                  setProjectToDelete={setProjectToDelete}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-800 mb-6">Compartidos conmigo</h2>
          {proyectosCompartidos.length === 0 ? (
            <p>No hay proyectos compartidos que coincidan con "{searchTerm}"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {proyectosCompartidos.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setEditingProject={setEditingProject}
                  setShowModal={setShowModal}
                  setProjectToDelete={setProjectToDelete}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <CreateProjectModal
          onClose={() => {
            setShowModal(false);
            setEditingProject(undefined);
          }}
          onCreate={(title, id) => {
            if (id) {
              handleEditProject(id, title);
            } else {
              handleCreateProject(title);
            }
          }}
          editingProject={editingProject}
        />
      )}

      {projectToDelete && (
        <ConfirmDeleteModal
          projectTitle={projectToDelete.title}
          collaboratorEmail=''
          onCancel={() => setProjectToDelete(undefined)}
          onConfirm={async () => {
            try {
              if (!token) return;
              const res = await fetch(`${API_URL}/api/v1/proyectos/${projectToDelete.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("Error al eliminar el proyecto");
              setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
              setProjectToDelete(undefined);
            } catch (err) {
              console.error(err);
              alert("Error al eliminar el proyecto. Intenta de nuevo.");
              setProjectToDelete(undefined);
            }
          }}
        />
      )}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  openMenuId: number | null;
  setOpenMenuId: React.Dispatch<React.SetStateAction<number | null>>;
  setEditingProject: React.Dispatch<React.SetStateAction<Project | undefined>>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectToDelete: React.Dispatch<React.SetStateAction<Project | undefined>>;
  toggleFavorite: (id: number) => void;
}

const ProjectCard = ({
  project,
  openMenuId,
  setOpenMenuId,
  setEditingProject,
  setShowModal,
  setProjectToDelete,
  toggleFavorite,
}: ProjectCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/proyecto/${project.id}`)}
      className="bg-blue-800 text-white px-4 py-6 rounded-xl shadow-md flex flex-col justify-between items-start aspect-[4/2] min-h-[100px] relative group hover:shadow-lg transition-shadow duration-300"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(project.id === openMenuId ? null : project.id);
            }}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            &#8942;
          </button>

          {openMenuId === project.id && (
            <div className="absolute right-0 mt-2 w-32 bg-white text-black rounded shadow-md z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProject(project);
                  setShowModal(true);
                  setOpenMenuId(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  setProjectToDelete(project);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <span className="text-lg font-semibold">{project.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(project.id);
        }}
      >
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

export default Home;
