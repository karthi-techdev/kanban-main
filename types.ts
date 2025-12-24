export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export type TaskType = 'Task' | 'Bug' | 'Story' | 'Spike' | 'Tech Debt';

export interface Comment {
  id: string;
  text: string;
  user: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Link {
  id: string;
  type: 'blocks' | 'blocked-by' | 'relates-to' | 'duplicate';
  targetTaskId: string;
  targetTaskTitle: string;
  targetTaskStatus: string;
}

export interface ActivityEvent {
  id: string;
  type: 'status' | 'assignee' | 'comment' | 'field' | 'creation' | 'subtask' | 'attachment' | 'link';
  user: string;
  timestamp: string;
  details: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  type?: TaskType;
  tags: string[];
  assignee?: string; // Storing ID or Name for simplicity in this mock
  reporter?: string;
  dueDate?: string;
  sprintId?: string;
  epicId?: string;
  storyPoints?: number;
  subtasks?: Subtask[];
  comments?: Comment[];
  updatedAt?: string;
  
  // Extended fields for Issue Details View
  key?: string; // e.g. BL-101
  acceptanceCriteria?: string;
  area?: string;
  environment?: string; // Dev, Stage, Prod
  attachments?: Attachment[];
  links?: Link[];
  activity?: ActivityEvent[];
}

export interface ColumnType {
  id: TaskStatus;
  title: string;
}

export interface Sprint {
  id: string;
  name: string;
  status: 'Active' | 'Planned' | 'Completed';
  startDate: string;
  endDate: string;
  goal: string;
}

export interface Release {
  version: string;
  date: string;
  status: 'Planned' | 'Staging' | 'Production';
  notes: string;
}

export interface Epic {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: 'Planning' | 'In Progress' | 'Done';
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
}

export interface DiagramItem {
  id: string;
  name: string;
  type: string;
}

// --- DIAGRAM TYPES ---

export type DiagramType = 'Flowchart' | 'ER Diagram' | 'Class Diagram' | 'Mind Map' | 'Sequence' | 'Architecture' | 'Network';

export type DiagramShapeType = 'Rectangle' | 'Circle' | 'Diamond' | 'Start' | 'End' | 'Process' | 'Decision' | 'Database' | 'Document' | 'Text' | 'Terminator' | 'Triangle' | 'Server' | 'Cloud' | 'API';

export interface DiagramNode {
  id: string;
  type: string; // Maps to DiagramShapeType but flexible for custom types
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string; // Fill color
  border: string; // Border color
  icon?: string; // Icon name reference
  tags?: string[];
  linkedIssueId?: string;
}

export interface DiagramEdge {
  id: string;
  from: string; // Node ID
  to: string; // Node ID
  label?: string;
  arrowStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

export interface DiagramComment {
  id: string;
  text: string;
  user: string;
  x?: number; // Optional pinned location
  y?: number;
  timestamp: string;
}

export interface DiagramVersion {
  id: string;
  timestamp: string;
  snapshot: string; // JSON string of state
}

export interface Diagram {
  id: string;
  title: string;
  type: DiagramType;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  history: DiagramVersion[];
  linkedIssues: string[];
  comments: DiagramComment[];
  createdAt: string;
  updatedAt: string;
}