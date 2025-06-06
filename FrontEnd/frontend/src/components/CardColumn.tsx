import React, { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import TaskItem from './TaskItem';
import { Card as CardType, Task as TaskType } from '../types/kanban';

interface Props {
  card: CardType;
  onAddTask: (cardId: number, title: string) => void;
  onTaskClick: (task: TaskType) => void;
  onUpdateCardTitle: (cardId: number, title: string) => void;
  onDeleteCard: (cardId: number) => void;
}

export default function CardColumn({
  card,
  onAddTask,
  onTaskClick,
  onUpdateCardTitle,
  onDeleteCard,
}: Props) {
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(card.title);
  const [showOptions, setShowOptions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  //Configuramos este contenedor como “droppable” para recibir tareas
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: String(card.id),
    data: { type: 'taskContainer' }, //este droppable es contenedor de tareas
  });

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(card.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setShowTaskInput(false);
  };

  return (
    <div
      ref={setDroppableRef}
      className={`relative w-[320px] bg-gray-100 rounded-xl shadow-md p-4 transition ${
        isOver ? 'bg-blue-50' : ''
      }`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false);
        setEditingTitle(false);
        setTempTitle(card.title);
      }}
    >
      {/* ─── Botón para editar/ eliminar columna ─── */}
      {showOptions && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ⋮
          </button>
          {showDropdown && (
            <div className="mt-2 bg-white border border-gray-200 shadow-md rounded absolute right-0 w-28 z-30">
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => onDeleteCard(card.id)}
                className="block w-full text-left px-3 py-2 hover:bg-red-100 text-sm text-red-600"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Título de la columna (editable) ─── */}
      <div className="flex justify-between items-center mb-4">
        {editingTitle ? (
          <div className="flex items-center gap-2 w-full">
            <input
              className="border px-2 py-1 rounded flex-1"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
            />
            <button
              onClick={() => {
                onUpdateCardTitle(card.id, tempTitle.trim() || card.title);
                setEditingTitle(false);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Guardar
            </button>
          </div>
        ) : (
          <h3
            className="text-lg font-semibold cursor-text"
            onClick={() => setEditingTitle(true)}
          >
            {card.title}
          </h3>
        )}
      </div>

      {/* ─── Lista de tareas (cada una es “DraggableTask”) ─── */}
      <div className="space-y-2 mb-4">
        {card.tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            cardId={card.id}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {/* ─── Botón de añadir tarea ─── */}
      {showTaskInput ? (
        <div className="flex flex-col space-y-2">
          <input
            className="border px-2 py-1 rounded"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="py-1 bg-blue-600 text-white rounded">
            Añadir
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowTaskInput(true)}
          className="w-full py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          + Añadir tarea
        </button>
      )}
    </div>
  );
}

// Componente auxiliar para cada que cada tarea sea un draggable
interface DraggableTaskProps {
  task: TaskType;
  cardId: number;
  onClick: () => void;
}

function DraggableTask({ task, cardId, onClick }: DraggableTaskProps) {
  //Configuramos este elemento como draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(task.id),
    data: { type: 'task', fromCol: cardId }, // guardamos en data la columna origen
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    boxShadow: isDragging ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
    backgroundColor: isDragging ? 'white' : undefined,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={style}
      className="rounded bg-white p-2 border"
    >
      <TaskItem task={task} />
    </div>
  );
}
