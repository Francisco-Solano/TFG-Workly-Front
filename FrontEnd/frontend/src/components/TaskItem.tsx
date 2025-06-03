import React from 'react';
import { Task } from '../types/kanban';

interface Props {
  task: Task;
}

const TaskItem: React.FC<Props> = ({ task }) => (
  <div className="bg-white rounded-md p-3 shadow-sm mb-2">
    <p className="text-gray-700">{task.title}</p>
  </div>
);

export default TaskItem;
