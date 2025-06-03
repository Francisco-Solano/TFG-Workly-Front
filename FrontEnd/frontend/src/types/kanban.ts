export interface Task {
  id: number;
  title: string;
}

export interface Card {
  id: number;
  title: string;
  tasks: Task[];
}
