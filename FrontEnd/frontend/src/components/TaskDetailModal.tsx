import React, { useState } from 'react';
import { API_URL } from "../config/api";

//Vista para editar la tarea
interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  assignee?: string;
}

interface Collaborator {
  id: number;
  username: string;
  email: string;
  foto?: string;
  rol?: string;
}

interface TaskDetailModalProps {
  task: {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    completed?: boolean;
    assignedUserId?: number;
    assignedUserEmail?: string;
   // members?: string[];
    subtasks?: Subtask[];
  };
  collaborators: Collaborator[];
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskDetailModalProps['task']) => void;
  onDeleteTask: (taskId: number) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isCompleted, setIsCompleted] = useState(task.completed || false);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  //const [members, setMembers] = useState(task.members || []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [status, setStatus] = useState<string>(
    task.completed
      ? 'Completada'
      : task.dueDate
      ? 'Pendiente'
      : 'Por hacer'
  );
 // const [assignedUserId, setAssignedUserId] = useState<number | "">(task.assignedUserId ?? "");

  const token = (() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).token : null;
  })();

  // ────────────────────────────────────────────────────────────
  // 1️⃣ LÓGICA AL PINCHAR EL CHECKBOX DE LA TAREA
  // ────────────────────────────────────────────────────────────
  const handleToggleCompleted = async () => {
    if (!token) {
      console.error('Token no encontrado');
      return;
    }

    // Invertimos el estado local
    const newCompleted = !isCompleted;

    // 1️⃣ Hacemos PUT en la tarea (aquí el trigger en la BD marcará sus subtareas)
    try {
      const body: any = { titulo: title.trim() };
      if (description.trim()) body.descripcion = description.trim();
      if (dueDate) {
        const [year, month, day] = dueDate.split('-');
        body.fechaLimite = `${day}/${month}/${year}`; // “dd/MM/yyyy”
      }
      body.estado = newCompleted ? 'Completada' : 'Pendiente';

      const resTask = await fetch(
        `${API_URL}/api/v1/tareas/${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!resTask.ok) {
        throw new Error(`Error ${resTask.status} al actualizar tarea`);
      }
      await resTask.json();
    } catch (err) {
      console.error('Error al marcar la tarea:', err);
      alert('No se pudo marcar la tarea como completada.');
      return;
    }

    // 2️⃣ Re‐fetch de la tarea completa (para leer subtareas ya “Completada”)
    try {
      const res2 = await fetch(
        `${API_URL}/api/v1/tareas/${task.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res2.ok) {
        throw new Error(`Error ${res2.status} al recargar tarea`);
      }
      const full = await res2.json();

      // Mapear subtareas a nuestro formato { id, title, completed }
      const freshSubtasks: Subtask[] = (full.subtareas || []).map((s: any) => ({
        id: s.subtareaId,
        title: s.titulo,
        completed: s.estado === 'Completada',
        assignee: undefined,
      }));

      // 3️⃣ Actualizamos estados locales y notificamos al padre
      setIsCompleted(newCompleted);
      setStatus(newCompleted ? 'Completada' : 'Pendiente');

      // ────────────────────────────────────────────────────
      //  Aquí marcamos forzosamente TODAS las subtareas a completed=true
      //  para el caso en que el backend no las regresara como “Completada” aún.
      const forcedSubtasks = newCompleted
        ? freshSubtasks.map(s => ({ ...s, completed: true }))
        : freshSubtasks;
      setSubtasks(forcedSubtasks);
      // ────────────────────────────────────────────────────

      onUpdateTask({
        id: full.tareaId,
        title: full.titulo,
        description: full.descripcion || '',
        dueDate: full.fechaLimite ? full.fechaLimite.slice(0, 10) : '',
        completed: newCompleted,
        assignedUserId: full.asignado?.id ?? undefined,
        assignedUserEmail: full.asignado?.email ?? undefined,
     //   members: full.miembros || [],
        subtasks: forcedSubtasks,
      });
    } catch (err) {
      console.error('Error recargando subtareas:', err);
      // Si falla recargar subtareas, la tarea ya quedó marcada; no bloqueamos al usuario.
      // Aun así, podemos marcar todas las subtareas localmente:
      if (newCompleted) {
        const forcedLocal = subtasks.map(s => ({ ...s, completed: true }));
        setSubtasks(forcedLocal);
        onUpdateTask({ ...task, completed: newCompleted, subtasks: forcedLocal });
      }
    }
  };

  // ────────────────────────────────────────────────────────────
  // 2️⃣ LÓGICA AL MARCAR/DESMARCAR CUALQUIER SUBTAREA INDEPENDIENTE
  // ────────────────────────────────────────────────────────────
  const handleToggleSubtask = async (id: number) => {
    if (!token) {
      console.error('Token no encontrado');
      return;
    }
    const sub = subtasks.find((s) => s.id === id);
    if (!sub) return;

    const nuevoEstadoStr = sub.completed ? 'Incompleta' : 'Completada';
    try {
      const res = await fetch(
        `${API_URL}/api/v1/subtareas/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: sub.title,
            estado: nuevoEstadoStr,
            tareaId: task.id,
          }),
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status} actualizando subtarea`);

      const updated = subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      );
      setSubtasks(updated);
      onUpdateTask({ ...task, subtasks: updated });
    } catch (err) {
      console.error('Error al actualizar subtarea:', err);
      alert('No se pudo cambiar el estado de la subtarea');
    }
  };

  // ────────────────────────────────────────────────────────────
  // 3️⃣ LÓGICA AL CAMBIAR EL DESPLEGABLE DE ESTADO (“Por hacer”/“Pendiente”/“Completada”)
  // ────────────────────────────────────────────────────────────
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    const completedFlag = newStatus === 'Completada';
    setIsCompleted(completedFlag);

    // ────────────────────────────────────────────────────────────
    // Cuando el usuario elige “Completada” desde el dropdown,
    // actualizamos localmente TODAS las subtareas a completed=true.
    if (completedFlag) {
      const allDone = subtasks.map(s => ({ ...s, completed: true }));
      setSubtasks(allDone);
      onUpdateTask({ ...task, completed: true, subtasks: allDone });
    } else {
      // Si elige “Pendiente” o “Por hacer”, podemos opcionalmente
      // desmarcar todo o simplemente notificar al padre sin tocar subtareas.
      onUpdateTask({ ...task, completed: false, subtasks });
    }
    // ────────────────────────────────────────────────────────────
  };

  const handleSaveDescription = () => {
    onUpdateTask({ ...task, title, description });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    if (!status || status === 'Por hacer') setStatus('Pendiente');
    onUpdateTask({ ...task, dueDate: e.target.value });
  };

  

  const handleDeleteTask = () => {
    if (
      window.confirm(
        `¿Estás seguro que quieres eliminar la tarea "${task.title}"?`
      )
    ) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
  if (!token) return alert('Token no encontrado');
  try {
    const res = await fetch(`${API_URL}/api/v1/subtareas/${subtaskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la subtarea');
    // Actualiza el estado local quitando la subtarea borrada
    const updated = subtasks.filter(s => s.id !== subtaskId);
    setSubtasks(updated);
    onUpdateTask({ ...task, subtasks: updated });
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar la subtarea');
  }
};

/*
  const updateTaskCompletionOnServer = async (newCompleted: boolean) => {
  if (!token) {
    console.error('Token no encontrado');
    return;
  }

  // 1️⃣ Hacer PUT /api/v1/tareas/{id} con el nuevo estado
  try {
    const body: any = { titulo: title.trim() };
    if (description.trim()) body.descripcion = description.trim();
    if (dueDate) {
      const [year, month, day] = dueDate.split('-');
      body.fechaLimite = `${day}/${month}/${year}`; // “dd/MM/yyyy”
    }
    body.estado = newCompleted ? 'Completada' : 'Pendiente';

    const resTask = await fetch(
      `http://localhost:8080/api/v1/tareas/${task.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    if (!resTask.ok) {
      throw new Error(`Error ${resTask.status} al actualizar tarea`);
    }
    await resTask.json(); // solo para que acabe
  } catch (err) {
    console.error('Error al marcar la tarea:', err);
    alert('No se pudo marcar la tarea como completada.');
    return;
  }

  // 2️⃣ Volver a hacer GET /api/v1/tareas/{id} para recargar subtareas
  try {
    const res2 = await fetch(
      `http://localhost:8080/api/v1/tareas/${task.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res2.ok) {
      throw new Error(`Error ${res2.status} al recargar tarea`);
    }
    const full = await res2.json();

    // Mapear subtareas a nuestro formato { id, title, completed }
    const freshSubtasks: Subtask[] = (full.subtareas || []).map((s: any) => ({
      id: s.subtareaId,
      title: s.titulo,
      completed: s.estado === 'Completada',
      assignee: undefined,
    }));

    // Forzamos subtareas a “completed=true” si newCompleted === true
    const forcedSubtasks = newCompleted
      ? freshSubtasks.map(s => ({ ...s, completed: true }))
      : freshSubtasks;

    // 3️⃣ Actualizar estado local
    setIsCompleted(newCompleted);
    setStatus(newCompleted ? 'Completada' : 'Pendiente');
    setSubtasks(forcedSubtasks);

    // 4️⃣ Avisar al padre (para actualizar en la lista de tarjetas)
    onUpdateTask({
      id: full.tareaId,
      title: full.titulo,
      description: full.descripcion || '',
      dueDate: full.fechaLimite ? full.fechaLimite.slice(0, 10) : '',
      completed: newCompleted,
      assignedUserId: full.asignado?.id ?? undefined,
      assignedUserEmail: full.asignado?.email ?? undefined,
      members: full.miembros || [],
      subtasks: forcedSubtasks,
    });
  } catch (err) {
    console.error('Error recargando subtareas:', err);
    // Si falla el GET, aun así marcamos localmente
    if (newCompleted) {
      const forcedLocal = subtasks.map(s => ({ ...s, completed: true }));
      setSubtasks(forcedLocal);
      onUpdateTask({ ...task, completed: newCompleted, subtasks: forcedLocal });
    }
  }
};
*/
  const handleAddSubtask = async () => {
    const nuevoTitulo = prompt('Título de la nueva subtarea:');
    if (!nuevoTitulo?.trim()) return;

    if (!task.id) {
      console.error('El ID de la tarea es indefinido');
      return;
    }
    if (!token) {
      console.error('Token no encontrado');
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/v1/subtareas/tarea/${task.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ titulo: nuevoTitulo.trim() }),
        }
      );
      if (!res.ok) throw new Error('Error al crear subtarea');
      const saved: {
        subtareaId: number;
        titulo: string;
        estado: string;
      } = await res.json();

      const nuevaSub: Subtask = {
        id: saved.subtareaId,
        title: saved.titulo,
        completed: saved.estado === 'Completada',
      };

      const updated = [...subtasks, nuevaSub];
      setSubtasks(updated);
      onUpdateTask({ ...task, subtasks: updated });
    } catch (err) {
      console.error(err);
      alert('No se pudo crear la subtarea');
    }
  };

  const saveTaskChanges = async () => {
    if (!task.id) {
      console.error('El ID de la tarea es undefined');
      return;
    }
    if (!token) {
      console.error('Token no encontrado');
      return;
    }

    const body: any = { titulo: title.trim() };
    if (description.trim()) body.descripcion = description.trim();
    if (dueDate) {
      const [year, month, day] = dueDate.split('-');
      body.fechaLimite = `${day}/${month}/${year}`;
    }
    body.estado = status === 'Completada' ? 'Completada'
                : status === 'Pendiente' ? 'Pendiente'
                : 'Por hacer';

    try {
      const res = await fetch(`${API_URL}/api/v1/tareas/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al actualizar la tarea');
      const tareaActualizada = await res.json();

      const updatedTask: TaskDetailModalProps['task'] = {
        id: tareaActualizada.tareaId,
        title: tareaActualizada.titulo,
        description: tareaActualizada.descripcion || '',
        dueDate: tareaActualizada.fechaLimite
          ? tareaActualizada.fechaLimite.slice(0, 10)
          : '',
        completed: tareaActualizada.estado === 'Completada',
        assignedUserId: task.assignedUserId,
        assignedUserEmail: task.assignedUserEmail,
        subtasks: tareaActualizada.subtareas?.map((s: any) => ({
          id: s.subtareaId,
          title: s.titulo,
          completed: s.estado === 'Completada',
          assignee: undefined,
        })) || [],
     //   members: task.members,
      };

      onUpdateTask(updatedTask);
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      alert('No se pudo guardar la tarea');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-auto max-h-[90vh] p-6 border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            {/* ───────── Checkbox TAREA ───────── */}
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleToggleCompleted}
              className="form-checkbox h-5 w-5 text-blue-600 mr-3"
            />

            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleSaveDescription}
              className={`text-2xl font-semibold bg-transparent border-none focus:outline-none ${
                isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            />
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-semibold"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-gray-600">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Due Date */}
            <div>
              <span className="font-medium">Vencimiento:</span>
              <input
                type="date"
                value={dueDate}
                onChange={handleDueDateChange}
                className="ml-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <span className="font-medium">Estado:</span>
              <select
                value={status}
                onChange={handleStatusChange}
                className="ml-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
              >
                
                <option value="Pendiente">Pendiente</option>
                <option value="Completada">Completada</option>
              </select>
              <span
                className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold ${
                  status === 'Completada'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-1">Descripción</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 resize-none min-h-[100px]"
              placeholder="Añade una descripción..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
            />
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-lg font-medium mb-2">Subtareas</h3>
            {subtasks.map(st => (
              <div
                key={st.id}
                className="bg-gray-100 p-3 rounded flex items-center justify-between"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => handleToggleSubtask(st.id)}
                    className="mr-3 h-4 w-4 text-blue-500"
                  />
                  <span className={st.completed ? 'line-through text-gray-400' : ''}>
                    {st.title}
                  </span>
                </div>
                <div className="flex space-x-3 text-gray-400 items-center">
                  {st.assignee && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {st.assignee.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Botón papelera */}
      <button
        onClick={() => handleDeleteSubtask(st.id)}
        title="Eliminar subtarea"
        className="hover:text-red-600 transition-colors"
      >
        {/* SVG papelera: */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5 0V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddSubtask}
              className="mt-3 text-blue-500 hover:underline text-sm"
            >
              + Crear subtarea
            </button>
          </div>

          {/* Delete & Save */}
          <button
            onClick={handleDeleteTask}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded shadow"
          >
            Eliminar tarea
          </button>

          <button
            onClick={() => {
              saveTaskChanges();
              onClose();
            }}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded shadow"
          >
            Guardar todos los cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
