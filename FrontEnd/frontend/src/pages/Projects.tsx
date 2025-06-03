// src/pages/Projects.tsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import CardColumn from '../components/CardColumn';
import TaskDetailModal from '../components/TaskDetailModal';
import AddCollaboratorModal from '../components/AddCollaboratorModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';


import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


function isoToDateInput(isoStr: string): string {
  if (!isoStr) return '';
  return isoStr.slice(0, 10);
}


interface Project {
  id: number;
  title: string;
  favorite: boolean;
  owner?: boolean;
}


interface Collaborator {
  id: number;
  username: string;
  email: string;
  foto?: string;
  rol?: string;
}


interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  assignee?: string;
}


export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  assignedUserId?: number;
  assignedUserEmail?: string;
  subtasks?: Subtask[];
}


export interface Card {
  id: number;
  title: string;
  tasks: Task[];
}


interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}


const Projects: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const { user } = useAuth();
  const token = user?.token;


  const [project, setProject] = useState<Project | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);


  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);


  // Nuevo estado: colaborador que se quiere eliminar
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<Collaborator | null>(null);


  // ────────────────────────────────────────────────────────────
  // Sensores para DnD (por defecto, arranque con PointerSensor)
  // ────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // mínimo 5px de movimiento para considerar un “drag”
      },
    })
  );


  // ────────────────────────────────────────────────────────────
  // Al terminar de arrastrar (tanto columnas como tareas)
  // ────────────────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;


    // -----------------
    // 1) ¿Se estaba arrastrando una COLUMNA?
    //    - En `active.data.current.type` guardamos si es "column" o "task"
    // -----------------
    const type = active.data.current?.type as 'column' | 'task';
    if (type === 'column') {
      const oldIndex = cards.findIndex((c) => String(c.id) === active.id);
      const newIndex = cards.findIndex((c) => String(c.id) === over.id);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;


      const newOrder = arrayMove(cards, oldIndex, newIndex);
      setCards(newOrder);


      // (Opcional: avisar a backend del nuevo orden de columnas)
      for (let i = 0; i < newOrder.length; i++) {
        const c = newOrder[i];
        await fetch(
          `http://localhost:8080/api/v1/tablas/${c.id}/posicion?posicion=${i}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      return;
    }


    // -----------------
    // 2) Se estaba arrastrando una TAREA
    //    - Id de la tarea: active.id (string con el número)
    //    - fromCardId: lo guardamos en active.data.current.fromCol
    //    - toCardId: lo obtenemos de over.id (será el id de la columna destino)
    // -----------------
    const taskId = Number(active.id);
    const fromCardId = Number(active.data.current?.fromCol);
    let toCardId: number;

if (over.data.current?.type === 'task') {
  toCardId = Number(over.data.current.fromCol);
} else if (over.data.current?.type === 'column') {
  toCardId = Number(over.id);
} else {
  // fallback: si soltó en fondo de columna (sin data), asumimos ID es columna
  toCardId = Number(over.id);
}


    // Si no hubo movimiento real (delta < 5px), lo descartamos como “click”
    const { delta } = event;
    if (Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5) {
      return;
    }


    // 2.a) Si queda en la misma columna, reordenamos esa columna localmente
    if (fromCardId === toCardId) {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== fromCardId) return card;
          const oldTasks = [...card.tasks];
          const fromIndex = oldTasks.findIndex((t) => t.id === taskId);
          if (fromIndex < 0) return card;


          // para simplicidad, lo mandamos siempre al final
          const [moved] = oldTasks.splice(fromIndex, 1);
          oldTasks.push(moved);
          return { ...card, tasks: oldTasks };
        })
      );


      // Actualizamos posiciones en el backend (solo esa columna)
      const updatedColumn = cards.find((c) => c.id === fromCardId);
      if (updatedColumn) {
        for (let i = 0; i < updatedColumn.tasks.length; i++) {
          const t = updatedColumn.tasks[i];
          await fetch(
            `http://localhost:8080/api/v1/tareas/${t.id}/posicion?posicion=${i}`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }
      return;
    }


    // 2.b) Si cambia de columna:
    let taskToMove: Task | undefined;


    const intermediate = cards.map((card) => {
      if (card.id === fromCardId) {
        const newTasks = [...card.tasks];
        const fromIndex = newTasks.findIndex((t) => t.id === taskId);
        if (fromIndex >= 0) {
          const [removed] = newTasks.splice(fromIndex, 1);
          taskToMove = removed;
        }
        return { ...card, tasks: newTasks };
      }
      return card;
    });


    if (!taskToMove) return;


    const newCards = intermediate.map((card) => {
      if (card.id === toCardId) {
        return { ...card, tasks: [...card.tasks, taskToMove!] };
      }
      return card;
    });
    setCards(newCards);


    // Avisamos al backend del cambio de columna
    await fetch(
      `http://localhost:8080/api/v1/tareas/${taskId}/mover/${toCardId}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );


    // Re-posicionamos todas las tareas en la columna destino
    const destinoColumn = newCards.find((c) => c.id === toCardId)!;
    for (let i = 0; i < destinoColumn.tasks.length; i++) {
      const t = destinoColumn.tasks[i];
      await fetch(
        `http://localhost:8080/api/v1/tareas/${t.id}/posicion?posicion=${i}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }
  };


  // ────────────────────────────────────────────────────────────
  // Método para eliminar colaborador (sin prompt nativo)
  // ────────────────────────────────────────────────────────────
  const handleRemoveCollaborator = async (userId: number) => {
    if (!token) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/proyectos/${projectId}/colaboradores/${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 204) {
        // Actualizar localmente la lista
        setCollaborators((prev) => prev.filter((c) => c.id !== userId));
      } else if (res.status === 404) {
        alert('Colaborador no encontrado en este proyecto.');
        // Forzar recarga de la lista para mantener consistencia
        fetchCollaborators();
      } else {
        throw new Error(`Error al eliminar colaborador: status=${res.status}`);
      }
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar colaborador');
    } finally {
      // Cerrar modal de confirmación
      setCollaboratorToDelete(null);
    }
  };


  // ────────────────────────────────────────────────────────────
  // Añadir colaborador (recibe email)
  // ────────────────────────────────────────────────────────────
  const handleAddCollaborator = async (email: string) => {
    if (!token) return alert('No autenticado');
    try {
      const userRes = await fetch(
        `http://localhost:8080/api/v1/usuarios/email/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!userRes.ok) throw new Error('Usuario no encontrado');
      const usr = (await userRes.json()) as {
        id: number;
        username: string;
        email: string;
      };
      if (collaborators.some((c) => c.id === usr.id)) {
        return alert('Este usuario ya es colaborador del proyecto.');
      }
      const linkRes = await fetch(
        `http://localhost:8080/api/v1/proyectos/${projectId}/colaboradores?usuarioId=${usr.id}&rol=ROLE_USER`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!linkRes.ok) throw new Error('Error al añadir colaborador');
      alert(`Colaborador ${usr.username} agregado`);
      fetchCollaborators();
      setShowAddCollaboratorModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al añadir colaborador');
    }
  };


  // ────────────────────────────────────────────────────────────
  // Crear nueva columna
  // ────────────────────────────────────────────────────────────
  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      const res = await fetch('http://localhost:8080/api/v1/tablas/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: newCardTitle.trim(),
          idProyecto: projectId,
        }),
      });
      if (!res.ok) throw new Error();
      const tab = await res.json();
      setCards((prev) => [
        ...prev,
        { id: tab.tablaId, title: tab.nombre, tasks: [] },
      ]);
      setNewCardTitle('');
      setCreatingCard(false);
    } catch (err) {
      console.error('Error al crear tabla:', err);
      alert('No se pudo crear la tabla');
    }
  };


  // ────────────────────────────────────────────────────────────
  // Crear nueva tarea
  // ────────────────────────────────────────────────────────────
  const handleAddTask = async (cardId: number, title: string) => {
    const tokenRaw = localStorage.getItem('user');
    const tok = tokenRaw ? JSON.parse(tokenRaw).token : null;
    if (!tok) return console.error('Token no encontrado');
    try {
      const res = await fetch('http://localhost:8080/api/v1/tareas/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({
          titulo: title,
          estado: 'Pendiente',
          tablaId: cardId,
        }),
      });
      if (!res.ok) throw new Error();
      const tarea = await res.json();
      const newTask: Task = {
        id: tarea.tareaId,
        title: tarea.titulo,
        description: tarea.descripcion || '',
        dueDate: tarea.fechaLimite || '',
        completed: tarea.estado === 'Completada',
        subtasks: tarea.subtareas || [],
      };
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, tasks: [...c.tasks, newTask] } : c
        )
      );
    } catch (err) {
      console.error('Error al crear tarea:', err);
    }
  };


  // ────────────────────────────────────────────────────────────
  // Editar título de columna
  // ────────────────────────────────────────────────────────────
  const handleUpdateCardTitle = async (cardId: number, newTitle: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/tablas/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: newTitle, idProyecto: projectId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, title: updated.nombre } : c
        )
      );
    } catch (err) {
      console.error('Error actualizando columna:', err);
    }
  };


  // ────────────────────────────────────────────────────────────
  // Eliminar columna
  // ────────────────────────────────────────────────────────────
  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm('¿Eliminar esta tabla?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/tablas/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error('Error al eliminar tabla:', err);
    }
  };


  // ────────────────────────────────────────────────────────────
  // Abrir “TaskDetailModal”
  // ────────────────────────────────────────────────────────────
  const handleOpenTaskModal = async (task: Task) => {
    if (typeof task.id !== 'number') {
      console.error('ID de tarea inválido:', task);
      return;
    }
    const tokenRaw = localStorage.getItem('user');
    const tok = tokenRaw ? JSON.parse(tokenRaw).token : null;
    if (!tok) {
      console.error('Token no encontrado');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/v1/tareas/${task.id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status} al cargar tarea`);
      const full = await res.json();
      const fechaConvertida = full.fechaLimite
        ? isoToDateInput(full.fechaLimite)
        : '';
      setSelectedTask({
        id: full.tareaId,
        title: full.titulo,
        description: full.descripcion || '',
        dueDate: fechaConvertida,
        completed: full.estado === 'Completada',
        assignedUserId: full.asignado?.id ?? undefined,
        assignedUserEmail: full.asignado?.email ?? undefined,
        subtasks: (full.subtareas || []).map((s: any) => ({
          id: s.subtareaId,
          title: s.titulo,
          completed: s.estado === 'Completada',
          assignee: undefined,
        })),
      });
      setIsTaskModalOpen(true);
    } catch (err) {
      console.error('Error cargando detalles:', err);
    }
  };


  // ────────────────────────────────────────────────────────────
  // Cerrar TaskDetailModal
  // ────────────────────────────────────────────────────────────
  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };


  // ────────────────────────────────────────────────────────────
  // Actualizar tarea desde modal
  // ────────────────────────────────────────────────────────────
  const handleUpdateTask = (updated: Task) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
    );
  };


  // ────────────────────────────────────────────────────────────
  // Eliminar tarea desde modal
  // ────────────────────────────────────────────────────────────
  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/tareas/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar tarea`);
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          tasks: c.tasks.filter((t) => t.id !== taskId),
        }))
      );
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('Error al eliminar la tarea:', err);
      alert('No se pudo eliminar la tarea. Intenta de nuevo más tarde.');
    }
  };


  // ────────────────────────────────────────────────────────────
  // Listar colaboradores
  // ────────────────────────────────────────────────────────────
  const fetchCollaborators = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/v1/proyectos/${projectId}/colaboradores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error listando colaboradores');
      const data: Collaborator[] = await res.json();
      setCollaborators(data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchCollaborators();
  }, [projectId, token]);


  // ────────────────────────────────────────────────────────────
  // Carga inicial de columnas + tareas + proyecto
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError('No autenticado');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8080/api/v1/tablas/proyecto/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const tablas = await res.json();


        const formateadas: Card[] = tablas
          .sort((a: any, b: any) => a.posicion - b.posicion)
          .map((t: any) => ({
            id: t.tablaId,
            title: t.nombre,
            tasks:
              t.tareas?.map((ta: any) => ({
                id: ta.tareaId,
                title: ta.titulo,
                description: ta.descripcion || '',
                dueDate: isoToDateInput(ta.fechaLimite),
                completed: ta.estado === 'Completada',
                assignedUserId: ta.asignado?.id ?? undefined,
                assignedUserEmail: ta.asignado?.email ?? undefined,
                subtasks: (ta.subtareas || []).map((s: any) => ({
                  id: s.subtareaId,
                  title: s.titulo,
                  completed: s.estado === 'Completada',
                  assignee: undefined,
                })),
              })) || [],
          }));


        setCards(formateadas);
       // Cargar también el nombre real del proyecto
const projectRes = await fetch(
  `http://localhost:8080/api/v1/proyectos/${projectId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
if (!projectRes.ok) throw new Error("No se pudo cargar el proyecto");
const projectData = await projectRes.json();

setProject({
  id: projectData.proyectoId,
  title: projectData.nombre,
  favorite: false,
  owner: true,
});

        setError(null);
      } catch (err) {
        console.error(err);
        setError('Error cargando proyecto');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, token]);


  if (loading) return <div className="text-center">Cargando proyecto...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!project) return <div className="text-center">Proyecto no encontrado.</div>;

return (
  <div className="min-h-screen bg-gray-100 font-sans flex">
    {/* Sidebar sticky (permanece visible en scroll horizontal) */}
    <div className="sticky left-0 top-0 z-30 shrink-0">
      <Sidebar />
    </div>

    {/* Contenido principal con scroll horizontal si necesario */}
    <div className="flex-1 overflow-x-auto">
      <div className="min-w-fit">
        {/* Header sticky */}
        <div className="sticky top-0 bg-gray-100 z-20 p-6 border-b border-gray-200 pl-12 md:pl-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <button
              onClick={() => setShowAddCollaboratorModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Compartir
            </button>
          </div>

          <div>
            <h2 className="font-medium">Colaboradores:</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center bg-white p-2 rounded shadow-sm"
                >
                  <span className="mr-2">{c.email}</span>
                  <button
                    onClick={() => setCollaboratorToDelete(c)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tableros Kanban */}
        <main className="p-6 pl-12 md:pl-6">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cards.map((c) => String(c.id))}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex space-x-6 items-start">
                {cards.map((card) => (
                  <SortableColumnWrapper
                    key={card.id}
                    id={String(card.id)}
                    card={card}
                    onAddTask={handleAddTask}
                    onTaskClick={handleOpenTaskModal}
                    onUpdateCardTitle={handleUpdateCardTitle}
                    onDeleteCard={handleDeleteCard}
                  />
                ))}

                {/* Botón nueva tarjeta */}
                {creatingCard ? (
                  <div className="w-[320px] p-4 bg-white rounded-xl shadow-md">
                    <input
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Nombre de la tarjeta"
                      className="w-full mb-2 p-2 border rounded"
                    />
                    <div className="flex justify-between">
                      <button
                        onClick={handleAddCard}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => setCreatingCard(false)}
                        className="px-4 py-2 text-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreatingCard(true)}
                    className="w-[320px] p-4 bg-gray-300 text-gray-700 rounded-xl shadow-md flex items-center justify-center"
                  >
                    + Añadir nueva tarjeta
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </main>

        {/* Modales */}
        {showAddCollaboratorModal && (
          <AddCollaboratorModal
            onClose={() => setShowAddCollaboratorModal(false)}
            onAdd={handleAddCollaborator}
            onRemove={() => {}}
            existing={collaborators}
          />
        )}

        {collaboratorToDelete && (
          <ConfirmDeleteModal
            collaboratorEmail={collaboratorToDelete.email}
            onConfirm={() => handleRemoveCollaborator(collaboratorToDelete.id)}
            onCancel={() => setCollaboratorToDelete(null)}
          />
        )}

        {selectedTask && isTaskModalOpen && (
          <TaskDetailModal
            task={selectedTask}
            collaborators={collaborators}
            onClose={handleCloseTaskModal}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </div>
    </div>
  </div>
);








};


export default Projects;


/*
  Componente auxiliar para envolver cada columna y hacerla “sortable”:
*/
interface SortableColumnWrapperProps {
  id: string;
  card: Card;
  onAddTask: (cardId: number, title: string) => void;
  onTaskClick: (task: Task) => void;
  onUpdateCardTitle: (cardId: number, title: string) => void;
  onDeleteCard: (cardId: number) => void;
}


function SortableColumnWrapper({
  id,
  card,
  onAddTask,
  onTaskClick,
  onUpdateCardTitle,
  onDeleteCard,
}: SortableColumnWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'column' }, // indica que arrastramos una columna
  });


  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
  };


  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardColumn
        card={card}
        onAddTask={onAddTask}
        onTaskClick={onTaskClick}
        onUpdateCardTitle={onUpdateCardTitle}
        onDeleteCard={onDeleteCard}
      />
    </div>
  );
}
