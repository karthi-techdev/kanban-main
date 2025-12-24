import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiFilter, FiPlus, FiMoreHorizontal, FiChevronDown, FiChevronRight,
  FiCheckCircle, FiUser, FiCalendar, FiTag, FiLayout, FiTrash2, FiMove,
  FiArchive, FiLayers, FiList, FiGrid, FiArrowUp, FiArrowDown, FiZap, FiLoader,
  FiLink, FiX, FiCheck, FiMessageSquare
} from 'react-icons/fi';
import { 
  TbTargetArrow, TbBug, TbBulb, TbBolt, TbCheckbox, TbSquare, 
  TbCircleCheck, TbAlertTriangle, TbDotsVertical, TbArrowMerge, TbTrash,
  TbSparkles
} from 'react-icons/tb';
import Tippy from '@tippyjs/react';
import { Task, TaskStatus, Priority, TaskType, Epic, Sprint, Comment } from '../types';
import { Modal } from './Modal';

// --- MOCK DATA ---

const MOCK_EPICS: Epic[] = [
  { id: 'e1', name: 'Authentication Overhaul', description: 'Revamp login/signup', owner: 'Alex', status: 'In Progress' },
  { id: 'e2', name: 'Mobile Responsiveness', description: 'Fix mobile UI issues', owner: 'Sam', status: 'Planning' },
  { id: 'e3', name: 'Performance Optimization', description: 'Improve load times', owner: 'Jordan', status: 'In Progress' },
];

const MOCK_SPRINTS: Sprint[] = [
  { id: 's1', name: 'Sprint 4', status: 'Active', startDate: 'Oct 24', endDate: 'Nov 07', goal: 'Auth' },
  { id: 's2', name: 'Sprint 5', status: 'Planned', startDate: 'Nov 08', endDate: 'Nov 22', goal: 'Mobile' },
];

const INITIAL_BACKLOG: Task[] = Array.from({ length: 25 }, (_, i) => ({
  id: `BL-${100 + i}`,
  title: [
    "Refactor Login Component", "Fix CSS Grid on Safari", "API Rate Limiting", 
    "User Profile Settings", "Dark Mode Flicker", "Update Documentation",
    "Database Migration", "Unit Tests for Auth", "Accessibility Audit", "Mobile Menu Bug"
  ][i % 10] + ` ${Math.floor(i / 10) + 1}`,
  description: "Detailed description of the task goes here...",
  status: i % 5 === 0 ? TaskStatus.DONE : i % 3 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
  priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL][i % 4],
  type: ['Task', 'Bug', 'Story', 'Spike', 'Tech Debt'][i % 5] as TaskType,
  tags: i % 2 === 0 ? ['Frontend'] : ['Backend', 'API'],
  assignee: i % 3 === 0 ? 'Alex' : i % 3 === 1 ? 'Sam' : 'Unassigned',
  epicId: i % 4 === 0 ? 'e1' : i % 4 === 1 ? 'e2' : undefined,
  sprintId: i < 5 ? 's1' : i < 10 ? 's2' : undefined,
  storyPoints: [1, 2, 3, 5, 8][i % 5],
  dueDate: '2023-11-15',
  subtasks: [],
  comments: [],
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
}));

const TEAM_MEMBERS = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'];

// --- HELPERS ---

const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.CRITICAL: return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case Priority.HIGH: return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case Priority.MEDIUM: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default: return 'text-pepper-600 bg-pepper-100 dark:text-pepper-400 dark:bg-pepper-800';
    }
};

const getTypeIcon = (t: TaskType) => {
    switch(t) {
        case 'Bug': return <TbBug className="text-red-500" />;
        case 'Story': return <TbTargetArrow className="text-green-500" />;
        case 'Spike': return <TbBolt className="text-yellow-500" />;
        case 'Tech Debt': return <TbAlertTriangle className="text-orange-500" />;
        default: return <TbCheckbox className="text-blue-500" />;
    }
};

// --- COMPONENTS ---

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return (
        <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 bg-pepper-900 text-white dark:bg-white dark:text-pepper-900 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up">
            <FiCheckCircle />
            <span className="text-sm font-bold">{message}</span>
        </div>
    );
};

export const Backlog: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_BACKLOG);
  const [epics, setEpics] = useState<Epic[]>(MOCK_EPICS);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [activeEpicFilter, setActiveEpicFilter] = useState<string | 'ALL' | 'Unassigned'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [groupBy, setGroupBy] = useState<'None' | 'Epic' | 'Assignee' | 'Priority'>('None');
  const [activeDetailTask, setActiveDetailTask] = useState<Task | null>(null);
  const [isAiGroomingOpen, setIsAiGroomingOpen] = useState(false);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  
  // Detail Panel Actions State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Subtask & Comment State
  const [newComment, setNewComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // New States for Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateEpicModalOpen, setIsCreateEpicModalOpen] = useState(false);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  
  // Inline Create State
  const [inlineCreateTitle, setInlineCreateTitle] = useState('');
  const [isInlineCreating, setIsInlineCreating] = useState(false);

  // Derived State
  const filteredTasks = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEpic = activeEpicFilter === 'ALL' ? true : 
                          activeEpicFilter === 'Unassigned' ? !t.epicId : 
                          t.epicId === activeEpicFilter;
      return matchesSearch && matchesEpic;
  });

  const issuesWithoutEpicCount = tasks.filter(t => !t.epicId).length;

  // --- Handlers ---

  const toggleSelectTask = (id: string) => {
      const newSet = new Set(selectedTaskIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedTaskIds(newSet);
      setBulkActionOpen(newSet.size > 0);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      if (activeDetailTask && activeDetailTask.id === id) {
          setActiveDetailTask(prev => prev ? { ...prev, ...updates } : null);
      }
  };

  // --- Header Action Handlers ---
  const handleCopyLink = () => {
      if (!activeDetailTask) return;
      const url = `${window.location.origin}/task/${activeDetailTask.id}`;
      navigator.clipboard.writeText(url);
      setToastMsg("Link copied to clipboard");
  };

  const handleDeleteTask = () => {
      if (!activeDetailTask) return;
      if (window.confirm("Are you sure you want to delete this issue?")) {
          setTasks(prev => prev.filter(t => t.id !== activeDetailTask.id));
          setActiveDetailTask(null);
          setShowMenu(false);
          setToastMsg("Issue deleted successfully");
      }
  };

  // --- Subtask Handlers ---
  const handleAddSubtask = () => {
      if (!subtaskTitle.trim() || !activeDetailTask) return;
      const newSubtask = {
          id: crypto.randomUUID(),
          title: subtaskTitle,
          completed: false
      };
      const updatedSubtasks = [...(activeDetailTask.subtasks || []), newSubtask];
      updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
      setSubtaskTitle('');
      setIsAddingSubtask(false);
      setToastMsg("Subtask added");
  };

  const handleToggleSubtask = (subId: string) => {
      if (!activeDetailTask) return;
      const updatedSubtasks = (activeDetailTask.subtasks || []).map(s => 
          s.id === subId ? { ...s, completed: !s.completed } : s
      );
      updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subId: string) => {
      if (!activeDetailTask) return;
      const updatedSubtasks = (activeDetailTask.subtasks || []).filter(s => s.id !== subId);
      updateTask(activeDetailTask.id, { subtasks: updatedSubtasks });
  };

  // --- Comment Handlers ---
  const handleAddComment = () => {
      if (!newComment.trim() || !activeDetailTask) return;
      const comment: Comment = {
          id: crypto.randomUUID(),
          text: newComment,
          user: 'You',
          createdAt: new Date().toISOString()
      };
      const updatedComments = [...(activeDetailTask.comments || []), comment];
      updateTask(activeDetailTask.id, { comments: updatedComments });
      setNewComment('');
      setToastMsg("Comment posted");
  };

  // --- Create Handlers ---

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      
      const newTask: Task = {
          id: `BL-${Math.floor(Math.random() * 10000)}`,
          title: data.get('title') as string,
          type: (data.get('type') as TaskType) || 'Task',
          priority: (data.get('priority') as Priority) || Priority.MEDIUM,
          status: TaskStatus.TODO,
          description: data.get('description') as string || '',
          assignee: (data.get('assignee') as string) || 'Unassigned',
          epicId: (data.get('epicId') as string) || undefined,
          sprintId: (data.get('sprintId') as string) || undefined,
          storyPoints: data.get('storyPoints') ? Number(data.get('storyPoints')) : undefined,
          dueDate: (data.get('dueDate') as string) || undefined,
          tags: [],
          subtasks: [],
          comments: [],
          updatedAt: new Date().toISOString()
      };

      setTasks(prev => [newTask, ...prev]);
      setIsCreateModalOpen(false);
      setToastMsg("Issue created successfully");
  };

  const handleInlineCreate = () => {
      if (!inlineCreateTitle.trim()) return;
      const newTask: Task = {
          id: `BL-${Math.floor(Math.random() * 10000)}`,
          title: inlineCreateTitle,
          type: 'Task',
          priority: Priority.MEDIUM,
          status: TaskStatus.TODO,
          description: '',
          assignee: 'Unassigned',
          epicId: activeEpicFilter !== 'ALL' && activeEpicFilter !== 'Unassigned' ? activeEpicFilter : undefined,
          tags: [],
          subtasks: [],
          comments: [],
          updatedAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
      setInlineCreateTitle('');
      setIsInlineCreating(false);
      setToastMsg("Issue created");
  };

  const handleCreateEpicSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const newEpic: Epic = {
          id: `e-${Math.floor(Math.random() * 1000)}`,
          name: (new FormData(form).get('name') as string),
          description: (new FormData(form).get('description') as string) || '',
          owner: 'Unassigned',
          status: 'Planning'
      };
      setEpics(prev => [...prev, newEpic]);
      setActiveEpicFilter(newEpic.id);
      setIsCreateEpicModalOpen(false);
      setToastMsg("Epic created");
  };

  // --- Bulk Actions ---

  const handleBulkMoveSprint = (sprintId: string) => {
      setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, sprintId } : t));
      setSelectedTaskIds(new Set());
      setBulkActionOpen(false);
      setIsBulkMoveModalOpen(false);
      setToastMsg("Issues moved to sprint");
  };

  const handleBulkAssign = (assignee: string) => {
      setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, assignee } : t));
      setSelectedTaskIds(new Set());
      setBulkActionOpen(false);
      setIsBulkAssignModalOpen(false);
      setToastMsg("Issues assigned");
  };

  const handleBulkArchive = () => {
      if (window.confirm(`Archive ${selectedTaskIds.size} issues?`)) {
          setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
          setSelectedTaskIds(new Set());
          setBulkActionOpen(false);
          setToastMsg("Issues archived");
      }
  };

  // --- Drag & Drop ---
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedTaskId(id);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnter = (targetId: string) => {
      if (!draggedTaskId || draggedTaskId === targetId) return;

      setTasks(prev => {
          const list = [...prev];
          const sourceIdx = list.findIndex(t => t.id === draggedTaskId);
          const targetIdx = list.findIndex(t => t.id === targetId);
          
          if (sourceIdx < 0 || targetIdx < 0) return prev;

          // Swap Items for Stackable Effect
          const [item] = list.splice(sourceIdx, 1);
          list.splice(targetIdx, 0, item);
          
          return list;
      });
  };

  const handleDrop = (e: React.DragEvent, targetId?: string, targetGroupId?: string) => {
      e.preventDefault();
      
      if (draggedTaskId) {
          // If grouping is active and we dropped on a group header, update the task property
          if (targetGroupId && groupBy !== 'None') {
              const updates: Partial<Task> = {};
              if (groupBy === 'Epic') updates.epicId = targetGroupId === 'Unassigned' ? undefined : targetGroupId;
              else if (groupBy === 'Priority') updates.priority = targetGroupId as Priority;
              else if (groupBy === 'Assignee') updates.assignee = targetGroupId;
              
              if (Object.keys(updates).length > 0) {
                  updateTask(draggedTaskId, updates);
              }
          }
      }
      setDraggedTaskId(null);
  };

  // Detail Panel AI Assist
  const [aiGenerating, setAiGenerating] = useState(false);
  const handleAiAssist = () => {
      setAiGenerating(true);
      setTimeout(() => {
          if (activeDetailTask) {
              updateTask(activeDetailTask.id, { 
                  description: activeDetailTask.description + "\n\n**AI Generated Acceptance Criteria:**\n- [ ] User must be logged in\n- [ ] Response time < 200ms\n- [ ] Error handling for 4xx/5xx" 
              });
          }
          setAiGenerating(false);
      }, 1500);
  };

  // AI Grooming Actions
  const handleAiGroomingAction = (action: string) => {
      if (action === 'duplicates') {
          // Mock merge
          setToastMsg("Duplicates merged");
      } else if (action === 'estimate') {
          setTasks(prev => prev.map(t => (!t.storyPoints && t.priority === Priority.HIGH) ? { ...t, storyPoints: 5 } : t));
          setToastMsg("Estimates applied");
      }
  };

  // --- Renderers ---

  const renderTaskRow = (task: Task, isGrouped = false) => (
      <div 
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnter(task.id)}
        onDrop={(e) => handleDrop(e, task.id)}
        className={`
           group flex items-center gap-4 p-3 bg-white dark:bg-pepper-900 border-b border-pepper-100 dark:border-pepper-800 
           hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-all cursor-pointer relative duration-200 ease-in-out
           ${draggedTaskId === task.id ? 'opacity-50 bg-pepper-50 dark:bg-pepper-800' : ''}
        `}
        onClick={() => setActiveDetailTask(task)}
      >
          {/* Drag Handle & Checkbox */}
          <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
              <div className="text-pepper-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiGrid /> 
              </div>
              <input 
                type="checkbox" 
                checked={selectedTaskIds.has(task.id)}
                onChange={() => toggleSelectTask(task.id)}
                className="rounded border-pepper-300 text-pepper-900 focus:ring-pepper-500"
              />
          </div>

          {/* ID & Type */}
          <div className="w-20 shrink-0 flex items-center gap-2 text-xs font-mono text-pepper-500">
              {getTypeIcon(task.type || 'Task')}
              <span>{task.id}</span>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0 font-medium text-sm text-pepper-900 dark:text-pepper-100 truncate">
              {task.title}
              {task.tags.map(tag => (
                  <span key={tag} className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-pepper-100 dark:bg-pepper-800 text-pepper-600 dark:text-pepper-300">
                      {tag}
                  </span>
              ))}
          </div>

          {/* Meta Columns */}
          <div className="hidden md:flex items-center gap-6 text-xs text-pepper-500 shrink-0">
              {!isGrouped && task.epicId && (
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded truncate max-w-[100px]">
                      {epics.find(e => e.id === task.epicId)?.name}
                  </span>
              )}
              <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                  {task.priority}
              </span>
              <div className="flex items-center gap-2 w-28">
                  {task.assignee === 'Unassigned' ? (
                      <div className="w-6 h-6 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center"><FiUser /></div>
                  ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{task.assignee?.[0]}</div>
                  )}
                  <span className="truncate">{task.assignee}</span>
              </div>
              <div className="w-8 text-center font-mono font-bold bg-pepper-100 dark:bg-pepper-800 rounded px-1">
                  {task.storyPoints || '-'}
              </div>
              <span className="w-20 text-right">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}</span>
          </div>
          
          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-pepper-200 dark:hover:bg-pepper-700 rounded"><FiMoreHorizontal /></button>
          </div>
      </div>
  );

  const renderTaskCard = (task: Task) => (
      <div 
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnter(task.id)}
        onDrop={(e) => handleDrop(e, task.id)}
        onClick={() => setActiveDetailTask(task)}
        className={`
            bg-white dark:bg-pepper-900 p-4 rounded-xl border border-pepper-200 dark:border-pepper-800 
            shadow-sm hover:shadow-md hover:border-pepper-300 dark:hover:border-pepper-600 transition-all 
            cursor-grab active:cursor-grabbing group flex flex-col gap-3 relative animate-fade-in duration-200 ease-in-out
            ${draggedTaskId === task.id ? 'opacity-40 border-dashed border-pepper-400 dark:border-pepper-500 scale-95' : ''}
        `}
      >
          {/* Header */}
          <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-pepper-400">{task.id}</span>
                  {task.epicId && (
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                          {epics.find(e => e.id === task.epicId)?.name}
                      </span>
                  )}
              </div>
              <input 
                type="checkbox" 
                checked={selectedTaskIds.has(task.id)}
                onChange={(e) => { e.stopPropagation(); toggleSelectTask(task.id); }}
                className="rounded border-pepper-300 text-pepper-900 focus:ring-pepper-500 w-4 h-4 cursor-pointer"
              />
          </div>

          {/* Content */}
          <div>
              <div className="flex items-start gap-2 mb-2">
                   <div className="mt-0.5 shrink-0">{getTypeIcon(task.type || 'Task')}</div>
                   <h4 className="font-bold text-sm text-pepper-900 dark:text-pepper-100 leading-snug line-clamp-2">{task.title}</h4>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                   {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-pepper-100 dark:bg-pepper-800 text-pepper-500 dark:text-pepper-400">
                            {tag}
                        </span>
                    ))}
              </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-pepper-50 dark:border-pepper-800 flex items-center justify-between">
               <div className="flex items-center gap-3">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                   </span>
                   {task.storyPoints && (
                      <span className="text-xs font-mono font-bold text-pepper-500">{task.storyPoints} pts</span>
                  )}
               </div>
               
               <div className="flex items-center gap-2">
                   {task.dueDate && (
                       <span className={`text-[10px] ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-pepper-400'}`}>
                           {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                       </span>
                   )}
                   {task.assignee && task.assignee !== 'Unassigned' ? (
                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-white dark:border-pepper-900 shadow-sm">
                           {task.assignee[0]}
                       </div>
                   ) : (
                       <div className="w-6 h-6 rounded-full bg-pepper-100 dark:bg-pepper-800 text-pepper-400 flex items-center justify-center text-[10px]">
                           <FiUser />
                       </div>
                   )}
               </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-full bg-pepper-50 dark:bg-pepper-950 overflow-hidden relative">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        
        {/* --- LEFT SIDEBAR (EPICS) --- */}
        <div className="w-64 shrink-0 bg-white dark:bg-pepper-900 border-r border-pepper-200 dark:border-pepper-800 flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center">
                <h3 className="font-bold text-sm text-pepper-900 dark:text-white uppercase tracking-wider">Epics</h3>
                <button 
                    onClick={() => setIsCreateEpicModalOpen(true)}
                    className="text-pepper-400 hover:text-pepper-900 p-1 rounded hover:bg-pepper-100 dark:hover:bg-pepper-800 transition-colors"
                >
                    <FiPlus />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button 
                    onClick={() => setActiveEpicFilter('ALL')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeEpicFilter === 'ALL' ? 'bg-pepper-100 dark:bg-pepper-800 text-pepper-900 dark:text-white' : 'text-pepper-500 hover:bg-pepper-50 dark:hover:bg-pepper-800/50'}`}
                >
                    All Issues
                </button>
                {epics.map(epic => {
                    const epicTasks = tasks.filter(t => t.epicId === epic.id);
                    const doneCount = epicTasks.filter(t => t.status === TaskStatus.DONE).length;
                    const progress = epicTasks.length ? Math.round((doneCount / epicTasks.length) * 100) : 0;
                    
                    return (
                        <button 
                            key={epic.id}
                            onClick={() => setActiveEpicFilter(epic.id)}
                            className={`w-full text-left px-3 py-3 rounded-lg border transition-all group ${activeEpicFilter === epic.id ? 'bg-white dark:bg-pepper-800 border-pepper-300 dark:border-pepper-600 shadow-sm' : 'border-transparent hover:bg-pepper-50 dark:hover:bg-pepper-800/50'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-bold truncate ${activeEpicFilter === epic.id ? 'text-pepper-900 dark:text-white' : 'text-pepper-600 dark:text-pepper-400'}`}>{epic.name}</span>
                            </div>
                            <div className="w-full bg-pepper-200 dark:bg-pepper-700 h-1.5 rounded-full overflow-hidden mb-1">
                                <div className="bg-blue-500 h-full transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-pepper-400">
                                <span>{progress}% done</span>
                                <span>{epicTasks.length} issues</span>
                            </div>
                        </button>
                    );
                })}
                <button 
                    onClick={() => setActiveEpicFilter('Unassigned')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${activeEpicFilter === 'Unassigned' ? 'bg-pepper-100 dark:bg-pepper-800 text-pepper-900 dark:text-white' : 'text-pepper-500 hover:bg-pepper-50 dark:hover:bg-pepper-800/50'}`}
                >
                    <span>Issues without Epic</span>
                    <span className="text-xs bg-pepper-200 dark:bg-pepper-700 px-1.5 rounded-full">{issuesWithoutEpicCount}</span>
                </button>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/50 dark:bg-pepper-900/50 relative">
            
            {/* Header / Toolbar */}
            <div className="px-6 py-4 border-b border-pepper-200 dark:border-pepper-800 bg-white dark:bg-pepper-900 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-pepper-900 dark:text-white font-display">Backlog</h1>
                        <p className="text-xs text-pepper-500">{filteredTasks.length} issues • {activeEpicFilter === 'ALL' ? 'All Epics' : activeEpicFilter === 'Unassigned' ? 'No Epic' : 'Filtered'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsAiGroomingOpen(!isAiGroomingOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
                        >
                            <TbSparkles /> AI Grooming
                        </button>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            <FiPlus /> Add Item
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..." 
                            className="pl-9 pr-4 py-1.5 bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg text-sm w-64 focus:ring-2 focus:ring-pepper-500/20 outline-none"
                        />
                    </div>
                    
                    <div className="h-6 w-px bg-pepper-200 dark:bg-pepper-700 mx-1"></div>

                    <select 
                        value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}
                        className="px-3 py-1.5 bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg text-sm font-medium text-pepper-600 dark:text-pepper-300 outline-none focus:border-pepper-400"
                    >
                        <option value="None">No Grouping</option>
                        <option value="Epic">Group by Epic</option>
                        <option value="Priority">Group by Priority</option>
                        <option value="Assignee">Group by Assignee</option>
                    </select>

                    <div className="flex bg-pepper-100 dark:bg-pepper-800 p-0.5 rounded-lg">
                        <button onClick={() => setViewMode('List')} className={`p-1.5 rounded-md ${viewMode === 'List' ? 'bg-white dark:bg-pepper-600 shadow-sm' : 'text-pepper-500'}`}><FiList /></button>
                        <button onClick={() => setViewMode('Grid')} className={`p-1.5 rounded-md ${viewMode === 'Grid' ? 'bg-white dark:bg-pepper-600 shadow-sm' : 'text-pepper-500'}`}><FiLayers /></button>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
                
                {/* AI Grooming Panel (Inline) */}
                {isAiGroomingOpen && (
                    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-xl animate-slide-up">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2"><TbBulb /> AI Suggestions</h4>
                            <button onClick={() => setIsAiGroomingOpen(false)} className="text-purple-400 hover:text-purple-800"><FiX /></button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-white dark:bg-pepper-900 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50">
                                <span className="text-sm text-pepper-600 dark:text-pepper-300">Found <strong>3</strong> tasks that appear to be duplicates in "Authentication".</span>
                                <button onClick={() => handleAiGroomingAction('duplicates')} className="text-xs font-bold text-purple-600 hover:underline">Merge Duplicates</button>
                            </div>
                            <div className="flex items-center justify-between bg-white dark:bg-pepper-900 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50">
                                <span className="text-sm text-pepper-600 dark:text-pepper-300"><strong>5</strong> high-priority tasks are missing story point estimates.</span>
                                <button onClick={() => handleAiGroomingAction('estimate')} className="text-xs font-bold text-purple-600 hover:underline">Auto-Estimate</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inline Quick Create */}
                {isInlineCreating ? (
                    <div className="mb-4 flex items-center gap-3 p-3 bg-white dark:bg-pepper-900 border border-pepper-300 dark:border-pepper-600 rounded-xl shadow-sm">
                        <input 
                            autoFocus
                            value={inlineCreateTitle}
                            onChange={(e) => setInlineCreateTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInlineCreate()}
                            onBlur={() => !inlineCreateTitle && setIsInlineCreating(false)}
                            placeholder="What needs to be done?"
                            className="flex-1 bg-transparent outline-none text-sm font-medium"
                        />
                        <button onClick={handleInlineCreate} className="text-xs font-bold bg-pepper-900 text-white px-3 py-1 rounded">Create</button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsInlineCreating(true)}
                        className="w-full mb-4 flex items-center gap-3 p-3 border-2 border-dashed border-pepper-200 dark:border-pepper-700 rounded-xl hover:border-pepper-400 transition-colors cursor-text group opacity-70 hover:opacity-100"
                    >
                        <FiPlus className="text-pepper-400" />
                        <span className="text-sm font-medium text-pepper-500">Create new issue...</span>
                    </button>
                )}

                {/* TASKS LIST */}
                <div className={`${viewMode === 'List' ? 'bg-white dark:bg-pepper-900 rounded-xl border border-pepper-200 dark:border-pepper-800 shadow-sm overflow-hidden' : ''}`}>
                    {/* Header Row - Only for List View */}
                    {viewMode === 'List' && (
                        <div className="flex items-center gap-4 p-3 bg-pepper-50 dark:bg-pepper-950 border-b border-pepper-200 dark:border-pepper-800 text-xs font-bold text-pepper-500 uppercase tracking-wider">
                            <div className="w-6 shrink-0"></div>
                            <div className="w-20">ID</div>
                            <div className="flex-1">Title</div>
                            <div className="hidden md:flex items-center gap-6 w-auto shrink-0">
                                <span className="w-20">Epic</span>
                                <span className="w-20">Priority</span>
                                <span className="w-28">Assignee</span>
                                <span className="w-8 text-center">Pts</span>
                                <span className="w-20 text-right">Due</span>
                            </div>
                            <div className="w-6"></div>
                        </div>
                    )}

                    {/* Grouped Rendering */}
                    {groupBy !== 'None' ? (
                        Object.entries(filteredTasks.reduce((acc, task) => {
                            let key = '';
                            if (groupBy === 'Epic') key = task.epicId || 'Unassigned';
                            else if (groupBy === 'Priority') key = task.priority;
                            else if (groupBy === 'Assignee') key = task.assignee || 'Unassigned';
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(task);
                            return acc;
                        }, {} as Record<string, Task[]>)).map(([group, groupTasks]) => (
                            <div key={group} onDrop={(e) => handleDrop(e, undefined, group)} onDragOver={(e) => e.preventDefault()} className="mb-6">
                                <div className={`px-4 py-2 bg-pepper-50 dark:bg-pepper-800/50 border-y border-pepper-100 dark:border-pepper-800 font-bold text-sm text-pepper-700 dark:text-pepper-200 flex justify-between sticky top-0 z-10 backdrop-blur-sm ${viewMode === 'Grid' ? 'rounded-lg mb-4 border-x' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <FiChevronDown /> 
                                        {groupBy === 'Epic' ? (epics.find(e => e.id === group)?.name || 'Unassigned') : group}
                                        <span className="bg-pepper-200 dark:bg-pepper-700 text-xs px-2 py-0.5 rounded-full ml-2">{groupTasks.length}</span>
                                    </div>
                                    <div className="text-xs text-pepper-400 font-mono">{groupTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts</div>
                                </div>
                                <div className={viewMode === 'List' ? '' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2'}>
                                    {groupTasks.map(t => viewMode === 'List' ? renderTaskRow(t, true) : renderTaskCard(t))}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Flat Rendering
                        <div className={viewMode === 'List' ? '' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}>
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(t => viewMode === 'List' ? renderTaskRow(t) : renderTaskCard(t))
                            ) : (
                                <div className="p-10 text-center text-pepper-400 col-span-full">
                                    <p>No issues found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {bulkActionOpen && (
                <div className="absolute bottom-6 right-[10px] -translate-x-1/2 bg-pepper-900 text-white px-4 sm:px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 sm:gap-6 animate-slide-up z-30 max-w-[95vw] overflow-x-auto no-scrollbar">
                    <span className="font-bold text-sm whitespace-nowrap shrink-0">{selectedTaskIds.size} selected</span>
                    <div className="h-4 w-px bg-pepper-700 shrink-0"></div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => setIsBulkMoveModalOpen(true)} className="flex items-center gap-2 hover:bg-pepper-800 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                            <FiArrowUp /> 
                            <span className="hidden sm:inline">Move to Sprint</span>
                            <span className="inline sm:hidden">Move</span>
                        </button>
                        <button onClick={() => setIsBulkAssignModalOpen(true)} className="flex items-center gap-2 hover:bg-pepper-800 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                            <FiUser /> Assign
                        </button>
                        <button onClick={handleBulkArchive} className="flex items-center gap-2 hover:bg-red-600 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-red-200 hover:text-white whitespace-nowrap">
                            <FiTrash2 /> Archive
                        </button>
                    </div>
                    <button onClick={() => { setSelectedTaskIds(new Set()); setBulkActionOpen(false); }} className="ml-1 sm:ml-2 hover:text-pepper-300 shrink-0"><FiX /></button>
                </div>
            )}
        </div>

        {/* --- MODALS (Portals basically) --- */}

        {/* 1. Create Task Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
            <div 
                className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden animate-slide-up relative z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                    <h3 className="font-bold text-lg">Create New Issue</h3>
                    <button onClick={() => setIsCreateModalOpen(false)}><FiX /></button>
                </div>
                <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Title *</label>
                        <input name="title" required className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Type</label>
                            <select name="type" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                <option value="Task">Task</option>
                                <option value="Bug">Bug</option>
                                <option value="Story">Story</option>
                                <option value="Spike">Spike</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Priority</label>
                            <select name="priority" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Low">Low</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Epic</label>
                            <select name="epicId" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                <option value="">None</option>
                                {epics.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Assignee</label>
                            <select name="assignee" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                <option value="Unassigned">Unassigned</option>
                                {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Create Issue</button>
                    </div>
                </form>
            </div>
        </Modal>

        {/* 2. Create Epic Modal */}
        <Modal isOpen={isCreateEpicModalOpen} onClose={() => setIsCreateEpicModalOpen(false)}>
            <div 
                className="bg-white dark:bg-pepper-900 w-full max-w-md rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 animate-slide-up relative z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                    <h3 className="font-bold text-lg">Create Epic</h3>
                    <button onClick={() => setIsCreateEpicModalOpen(false)}><FiX /></button>
                </div>
                <form onSubmit={handleCreateEpicSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Epic Name *</label>
                        <input name="name" required className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsCreateEpicModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all">Create Epic</button>
                    </div>
                </form>
            </div>
        </Modal>

        {/* 3. Bulk Move Modal */}
        <Modal isOpen={isBulkMoveModalOpen} onClose={() => setIsBulkMoveModalOpen(false)}>
            <div 
                className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-xl p-6 shadow-2xl relative z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold mb-4">Move {selectedTaskIds.size} items to:</h3>
                <div className="space-y-2">
                    {MOCK_SPRINTS.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => handleBulkMoveSprint(s.id)}
                            className="w-full text-left p-3 border rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800 font-medium text-sm flex justify-between"
                        >
                            {s.name} <span className="text-pepper-400">{s.status}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsBulkMoveModalOpen(false)} className="mt-4 w-full text-sm text-pepper-500 hover:text-pepper-900">Cancel</button>
            </div>
        </Modal>

        {/* 4. Bulk Assign Modal */}
        <Modal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)}>
            <div 
                className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-xl p-6 shadow-2xl relative z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold mb-4">Assign {selectedTaskIds.size} items to:</h3>
                <div className="space-y-2">
                    {TEAM_MEMBERS.map(m => (
                        <button 
                            key={m} 
                            onClick={() => handleBulkAssign(m)}
                            className="w-full text-left p-3 border rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800 font-medium text-sm"
                        >
                            {m}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsBulkAssignModalOpen(false)} className="mt-4 w-full text-sm text-pepper-500 hover:text-pepper-900">Cancel</button>
            </div>
        </Modal>

        {/* --- DETAIL PANEL (SLIDE OVER) --- */}
        {activeDetailTask && (
            <div className="w-[480px] bg-white dark:bg-pepper-900 border-l border-pepper-200 dark:border-pepper-800 shadow-2xl flex flex-col animate-fade-in absolute right-0 top-0 h-full z-40">
                {/* Header */}
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50/50 dark:bg-pepper-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 text-xs text-pepper-500">
                        <span className="font-mono">{activeDetailTask.id}</span>
                        <span className="h-3 w-px bg-pepper-300"></span>
                        <span className="flex items-center gap-1">Created {new Date(activeDetailTask.updatedAt || Date.now()).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <Tippy content="Copy Link">
                             <button onClick={handleCopyLink} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500 dark:text-pepper-400 hover:text-pepper-900 dark:hover:text-pepper-100 transition-colors">
                                <FiLink />
                             </button>
                        </Tippy>
                        
                        <div className="relative">
                             <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500 dark:text-pepper-400 hover:text-pepper-900 dark:hover:text-pepper-100 transition-colors">
                                <FiMoreHorizontal />
                             </button>
                             {showMenu && (
                                 <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-pepper-800 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1 z-50 animate-slide-up origin-top-right">
                                     <button onClick={handleDeleteTask} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2">
                                         <FiTrash2 /> Delete Issue
                                     </button>
                                 </div>
                             )}
                        </div>

                        <button onClick={() => setActiveDetailTask(null)} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500 dark:text-pepper-400 hover:text-pepper-900 dark:hover:text-pepper-100 transition-colors">
                            <FiX />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <input 
                            value={activeDetailTask.title}
                            onChange={(e) => updateTask(activeDetailTask.id, { title: e.target.value })}
                            className="text-xl font-bold text-pepper-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-pepper-400 uppercase tracking-wider mb-1 block">Status</label>
                            <select 
                                value={activeDetailTask.status} 
                                onChange={(e) => updateTask(activeDetailTask.id, { status: e.target.value as TaskStatus })}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm"
                            >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-pepper-400 uppercase tracking-wider mb-1 block">Priority</label>
                            <select 
                                value={activeDetailTask.priority} 
                                onChange={(e) => updateTask(activeDetailTask.id, { priority: e.target.value as Priority })}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm"
                            >
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-pepper-400 uppercase tracking-wider mb-1 block">Sprint</label>
                            <select 
                                value={activeDetailTask.sprintId || ''} 
                                onChange={(e) => updateTask(activeDetailTask.id, { sprintId: e.target.value })}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Backlog</option>
                                {MOCK_SPRINTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-pepper-400 uppercase tracking-wider mb-1 block">Story Points</label>
                            <input 
                                type="number" 
                                value={activeDetailTask.storyPoints || ''} 
                                onChange={(e) => updateTask(activeDetailTask.id, { storyPoints: parseInt(e.target.value) })}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-pepper-500 uppercase">Description</label>
                            <button 
                                onClick={handleAiAssist}
                                disabled={aiGenerating}
                                className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline"
                            >
                                {aiGenerating ? <FiLoader className="animate-spin" /> : <TbSparkles />} 
                                {aiGenerating ? 'Generating...' : 'AI Assist'}
                            </button>
                        </div>
                        <textarea 
                            value={activeDetailTask.description}
                            onChange={(e) => updateTask(activeDetailTask.id, { description: e.target.value })}
                            className="w-full h-32 bg-pepper-50 dark:bg-pepper-800/50 border border-pepper-200 dark:border-pepper-700 rounded-xl p-3 text-sm leading-relaxed focus:ring-2 focus:ring-pepper-900 resize-none"
                        />
                    </div>

                    {/* Subtasks Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-pepper-500 uppercase">Subtasks</label>
                            <button onClick={() => setIsAddingSubtask(true)} className="text-xs text-blue-500 font-bold hover:underline">+ Add</button>
                        </div>
                        
                        <div className="space-y-2">
                            {(activeDetailTask.subtasks || []).map(sub => (
                                <div key={sub.id} className="group flex items-center gap-3 p-2 hover:bg-pepper-50 dark:hover:bg-pepper-800 rounded-lg transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={sub.completed}
                                        onChange={() => handleToggleSubtask(sub.id)}
                                        className="rounded border-pepper-300 dark:border-pepper-600"
                                    />
                                    <span className={`text-sm flex-1 ${sub.completed ? 'text-pepper-400 line-through' : 'text-pepper-700 dark:text-pepper-300'}`}>
                                        {sub.title}
                                    </span>
                                    <button 
                                        onClick={() => handleDeleteSubtask(sub.id)}
                                        className="text-pepper-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Inline Add Subtask Input */}
                            {isAddingSubtask && (
                                <div className="flex items-center gap-2 p-2 bg-pepper-50 dark:bg-pepper-800 rounded-lg animate-fade-in">
                                    <input
                                        autoFocus
                                        value={subtaskTitle}
                                        onChange={(e) => setSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddSubtask();
                                            if (e.key === 'Escape') { setIsAddingSubtask(false); setSubtaskTitle(''); }
                                        }}
                                        placeholder="Subtask title..."
                                        className="flex-1 bg-transparent text-sm outline-none text-pepper-900 dark:text-white"
                                    />
                                    <div className="flex gap-1">
                                        <button onClick={handleAddSubtask} className="p-1 text-emerald-500 hover:bg-emerald-100 rounded"><FiCheck /></button>
                                        <button onClick={() => { setIsAddingSubtask(false); setSubtaskTitle(''); }} className="p-1 text-pepper-400 hover:bg-pepper-200 rounded"><FiX /></button>
                                    </div>
                                </div>
                            )}
                            
                            {(!activeDetailTask.subtasks?.length && !isAddingSubtask) && (
                                <p className="text-sm text-pepper-400 italic">No subtasks yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Activity Stream Section */}
                    <div className="border-t border-pepper-100 dark:border-pepper-800 pt-6">
                        <h4 className="font-bold text-sm text-pepper-900 dark:text-white mb-4">Activity</h4>
                        <div className="flex gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-pepper-900 text-white flex items-center justify-center text-xs font-bold shrink-0">You</div>
                            <div className="flex-1">
                                <textarea 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..." 
                                    className="w-full border border-pepper-200 dark:border-pepper-700 rounded-lg p-2 text-sm bg-transparent focus:ring-1 focus:ring-pepper-500 min-h-[80px] resize-y"
                                ></textarea>
                                <div className="flex justify-end mt-2">
                                    <button 
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="px-3 py-1.5 bg-pepper-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-pepper-800 transition-colors"
                                    >
                                        Comment
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Real Comments */}
                            {(activeDetailTask.comments || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(comment => (
                                <div key={comment.id} className="flex gap-3 animate-fade-in">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 border border-purple-200">
                                        {comment.user[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-bold text-sm text-pepper-900 dark:text-white">{comment.user}</span>
                                            <span className="text-[10px] text-pepper-400">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-sm text-pepper-600 dark:text-pepper-300 bg-pepper-50 dark:bg-pepper-800/50 p-3 rounded-xl rounded-tl-none">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Mock History (Static) */}
                            <div className="relative pl-4 ml-3 border-l-2 border-pepper-100 dark:border-pepper-800 pb-2">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-pepper-900"></div>
                                <p className="text-xs text-pepper-500 mb-1"><span className="font-bold text-pepper-900 dark:text-white">Alex</span> changed status to <span className="font-bold text-blue-600">In Progress</span></p>
                                <span className="text-[10px] text-pepper-400">2 hours ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};