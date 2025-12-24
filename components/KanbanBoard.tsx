import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiPlus, FiMoreHorizontal, FiSearch, FiFilter,
  FiCheckCircle, FiLoader, FiZap, FiUser, FiClock,
  FiUsers, FiLink, FiCopy, FiEdit2, FiX, FiList, FiLayout, FiCalendar,
  FiCheck, FiArrowRight, FiTrash2, FiCornerUpLeft, FiBriefcase, FiLayers,
  FiArrowUp, FiArrowDown, FiArrowRightCircle, FiPaperclip, FiAlignLeft, 
  FiMessageSquare, FiActivity, FiEye, FiDownload, FiExternalLink, FiShare2,
  FiGithub, FiUploadCloud, FiTag
} from 'react-icons/fi';
import { BiBot } from 'react-icons/bi';
import Tippy from '@tippyjs/react';
import { Task, TaskStatus, Priority, ColumnType, TaskType, Attachment, Link, ActivityEvent, Subtask, Comment } from '../types';
import { generateTasksFromDescription, getAIInsights } from '../services/gemini';
import { Modal } from './Modal';

// --- MOCK MEMBERS DATA ---
const MEMBERS = [
  { id: 'm1', name: 'Felix', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'm2', name: 'Aneka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'm3', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'm4', name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
  { id: 'm5', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { id: 'm6', name: 'Taylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
  { id: 'm7', name: 'Casey', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey' },
  { id: 'm8', name: 'Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan' },
];

const COLUMNS: ColumnType[] = [
  { id: TaskStatus.TODO, title: 'To Do' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TaskStatus.REVIEW, title: 'Review' },
  { id: TaskStatus.DONE, title: 'Done' },
];

const MOCK_SPRINTS = [
    { id: 'current', name: 'Current Sprint (Sprint 4)' },
    { id: 'next', name: 'Next Sprint (Sprint 5)' },
    { id: 's1', name: 'Sprint 1 (Completed)' },
    { id: 's2', name: 'Sprint 2 (Completed)' },
    { id: 's3', name: 'Sprint 3 (Completed)' },
];

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    key: 'FLX-101',
    title: 'Design System Architecture',
    description: 'Define the core color palette and typography for the new branding guidelines. Ensure accessibility compliance (WCAG 2.1 AA).',
    status: TaskStatus.DONE,
    priority: Priority.HIGH,
    type: 'Task',
    tags: ['Design', 'Core'],
    assignee: 'm1',
    reporter: 'm3',
    dueDate: '2023-10-25',
    storyPoints: 5,
    acceptanceCriteria: '- [x] Color palette defined\n- [x] Typography scale set\n- [ ] Accessibility check passed',
    subtasks: [
      { id: 's1', title: 'Research competitors', completed: true },
      { id: 's2', title: 'Draft initial palette', completed: true },
      { id: 's3', title: 'Review with stakeholders', completed: false },
    ],
    activity: [
        { id: 'a1', type: 'creation', user: 'Alex', timestamp: '2023-10-20T10:00:00Z', details: 'created issue' },
        { id: 'a2', type: 'status', user: 'Felix', timestamp: '2023-10-24T14:30:00Z', details: 'changed status to Done' }
    ],
    attachments: [
        { id: 'att1', name: 'Brand_Guidelines_v1.pdf', size: '2.4 MB', type: 'PDF', url: '#', uploadedBy: 'Alex', uploadedAt: '2023-10-21' }
    ],
    comments: [
        { id: 'c1', text: 'Looks good, but check contrast ratios on the secondary blue.', user: 'Aneka', createdAt: '2023-10-22T09:15:00Z' }
    ],
    sprintId: 's3'
  },
  {
    id: '2',
    key: 'FLX-102',
    title: 'Implement Authentication',
    description: 'Setup JWT based auth using OAuth2 providers.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.CRITICAL,
    type: 'Story',
    tags: ['Backend', 'Security'],
    assignee: 'm2',
    reporter: 'm1',
    dueDate: '2023-11-01',
    sprintId: 'current',
    activity: [],
    subtasks: [],
    comments: [],
    attachments: [],
    links: []
  },
  {
    id: '3',
    key: 'FLX-103',
    title: 'Refactor Sidebar Component',
    description: 'Optimize rendering performance and add collapsible state.',
    status: TaskStatus.TODO,
    priority: Priority.LOW,
    type: 'Tech Debt',
    tags: ['Frontend', 'Refactor'],
    assignee: 'm3',
    reporter: 'm2',
    dueDate: '2023-11-05',
    sprintId: 'current',
    activity: [],
    subtasks: [],
    comments: [],
    attachments: [],
    links: []
  },
  {
    id: '4',
    key: 'FLX-104',
    title: 'Database Migration Script',
    description: 'Migrate legacy data to new schema.',
    status: TaskStatus.REVIEW,
    priority: Priority.HIGH,
    type: 'Task',
    tags: ['DB', 'Backend'],
    assignee: 'm5',
    reporter: 'm2',
    dueDate: '2023-11-03',
    sprintId: 'current',
    activity: [],
    subtasks: [],
    comments: [],
    attachments: [],
    links: []
  }
];

// --- Types for Filters ---
type BoardFilters = {
  statuses: TaskStatus[];
  priorities: Priority[];
  types: TaskType[];
  assigneeIds: string[];
  tags: string[];
  dueFrom?: string;
  dueTo?: string;
  sprintId?: string;
};

const INITIAL_FILTERS: BoardFilters = {
  statuses: [],
  priorities: [],
  types: [],
  assigneeIds: [],
  tags: [],
  dueFrom: '',
  dueTo: '',
  sprintId: ''
};

// --- Functional Task Menu Component ---
interface TaskMenuProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onClone: () => void;
  onEdit: () => void;
  onCopyLink: () => void;
  closeMenu: () => void;
}

const TaskMenu: React.FC<TaskMenuProps> = ({ task, onUpdate, onDelete, onClone, onEdit, onCopyLink, closeMenu }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'assign' | 'status' | 'priority' | 'move'>('main');

  const MenuItem = ({ icon: Icon, label, onClick, hasSubmenu = false, danger = false }: any) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
        danger 
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
          : 'text-pepper-600 dark:text-pepper-300 hover:bg-pepper-100 dark:hover:bg-pepper-800'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className={danger ? 'text-red-500' : 'text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200'} />}
        <span>{label}</span>
      </div>
      {hasSubmenu && <FiArrowRight className="text-pepper-400" />}
    </button>
  );

  const BackButton = () => (
    <button 
      onClick={(e) => { e.stopPropagation(); setActiveSubmenu('main'); }}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white uppercase tracking-wider border-b border-pepper-100 dark:border-pepper-800 mb-1"
    >
      <FiCornerUpLeft /> Back
    </button>
  );

  return (
    <div className="w-56 bg-white dark:bg-pepper-900 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1.5 overflow-hidden ring-1 ring-black/5">
      {activeSubmenu === 'main' && (
        <div className="space-y-0.5">
          <MenuItem icon={FiLayout} label="Open Issue" onClick={() => { onEdit(); closeMenu(); }} />
          <MenuItem icon={FiEdit2} label="Edit" onClick={() => { onEdit(); closeMenu(); }} />
          
          <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1" />
          
          <MenuItem icon={FiUser} label="Assign" hasSubmenu onClick={() => setActiveSubmenu('assign')} />
          <MenuItem icon={FiLayers} label="Change Status" hasSubmenu onClick={() => setActiveSubmenu('status')} />
          <MenuItem icon={FiArrowUp} label="Change Priority" hasSubmenu onClick={() => setActiveSubmenu('priority')} />
          <MenuItem icon={FiArrowRightCircle} label="Move To" hasSubmenu onClick={() => setActiveSubmenu('move')} />
          
          <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1" />
          
          <MenuItem icon={FiCopy} label="Clone" onClick={() => { onClone(); closeMenu(); }} />
          <MenuItem icon={FiLink} label="Copy Link" onClick={() => { onCopyLink(); closeMenu(); }} />
          
          <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1" />
          
          <MenuItem icon={FiTrash2} label="Delete" danger onClick={() => { onDelete(); closeMenu(); }} />
        </div>
      )}

      {activeSubmenu === 'assign' && (
        <div>
          <BackButton />
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            <button onClick={() => { onUpdate({ assignee: 'Unassigned' }); closeMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-pepper-50 dark:hover:bg-pepper-800 rounded-lg text-sm text-pepper-600 dark:text-pepper-300">
                <div className="w-6 h-6 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center"><FiUser /></div>
                Unassigned
            </button>
            {MEMBERS.map(m => (
              <button key={m.id} onClick={() => { onUpdate({ assignee: m.id }); closeMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-pepper-50 dark:hover:bg-pepper-800 rounded-lg text-sm text-pepper-600 dark:text-pepper-300">
                <img src={m.avatar} className="w-6 h-6 rounded-full" alt="" />
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSubmenu === 'status' && (
        <div>
          <BackButton />
          {COLUMNS.map(col => (
             <MenuItem 
                key={col.id} 
                icon={FiCheckCircle} 
                label={col.title} 
                onClick={() => { onUpdate({ status: col.id }); closeMenu(); }} 
             />
          ))}
        </div>
      )}

      {activeSubmenu === 'priority' && (
        <div>
          <BackButton />
          {Object.values(Priority).map(p => (
             <MenuItem 
                key={p} 
                icon={FiZap} 
                label={p} 
                onClick={() => { onUpdate({ priority: p }); closeMenu(); }} 
             />
          ))}
        </div>
      )}

      {activeSubmenu === 'move' && (
        <div>
          <BackButton />
          <MenuItem icon={FiBriefcase} label="Move to Backlog" onClick={() => { onUpdate({ sprintId: undefined }); closeMenu(); }} />
          <MenuItem icon={FiCalendar} label="Move to Next Sprint" onClick={() => { onUpdate({ sprintId: 'next-sprint-id' }); closeMenu(); }} />
        </div>
      )}
    </div>
  );
};

// --- Portal Menu Wrapper for Contextual Positioning ---
const TaskMenuOverlay = ({ anchorRect, onClose, children }: { anchorRect: DOMRect, onClose: () => void, children: React.ReactNode }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', opacity: 0, pointerEvents: 'none' });

    useLayoutEffect(() => {
        if (!anchorRect || !menuRef.current) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const menuWidth = menuRect.width || 224; 
        const menuHeight = menuRect.height || 300; 
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const GAP = 8;

        const btnCenterY = anchorRect.top + (anchorRect.height / 2);

        let left = anchorRect.right + GAP;
        if (left + menuWidth > viewportWidth - GAP) {
            left = anchorRect.left - menuWidth - GAP;
        }

        let top = btnCenterY - (menuHeight / 2);
        if (top < GAP) top = GAP;
        if (top + menuHeight > viewportHeight - GAP) top = viewportHeight - menuHeight - GAP;

        setStyle({
            position: 'fixed',
            top,
            left,
            zIndex: 100, 
            opacity: 1,
            pointerEvents: 'auto',
        });
    }, [anchorRect]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        const handleScroll = () => onClose(); 
        const handleResize = () => onClose();

        window.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        }
    }, [onClose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return createPortal(
        <div ref={menuRef} style={style} className="transition-opacity duration-200">
            {children}
        </div>,
        document.body
    );
};

// --- Filter Panel Component ---
const FilterPanel = ({ 
    filters, 
    onChange, 
    onClear,
    availableTags
}: { 
    filters: BoardFilters, 
    onChange: (updates: Partial<BoardFilters>) => void, 
    onClear: () => void,
    availableTags: string[]
}) => {
    
    const toggleFilter = <K extends keyof BoardFilters>(key: K, value: any) => {
        const current = filters[key] as any[];
        if (current.includes(value)) {
            onChange({ [key]: current.filter(i => i !== value) });
        } else {
            onChange({ [key]: [...current, value] });
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-pepper-900 rounded-2xl shadow-xl border border-pepper-200 dark:border-pepper-700 p-4 flex flex-col max-h-[20rem] animate-slide-up">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-pepper-100 dark:border-pepper-800">
                <h3 className="font-bold text-pepper-900 dark:text-white flex items-center gap-2">
                    <FiFilter /> Filters
                </h3>
                <button onClick={onClear} className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline">
                    Clear All
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1">
                {/* Status */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Status</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(TaskStatus).map(status => (
                            <button
                                key={status}
                                onClick={() => toggleFilter('statuses', status)}
                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    filters.statuses.includes(status)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-white dark:bg-pepper-800 text-pepper-600 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700 hover:border-pepper-300'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Priority</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(Priority).map(priority => (
                            <button
                                key={priority}
                                onClick={() => toggleFilter('priorities', priority)}
                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    filters.priorities.includes(priority)
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                    : 'bg-white dark:bg-pepper-800 text-pepper-600 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700 hover:border-pepper-300'
                                }`}
                            >
                                {priority}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Type */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Type</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Task', 'Bug', 'Story', 'Spike', 'Tech Debt'].map(type => (
                            <button
                                key={type}
                                onClick={() => toggleFilter('types', type as TaskType)}
                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    filters.types.includes(type as TaskType)
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    : 'bg-white dark:bg-pepper-800 text-pepper-600 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700 hover:border-pepper-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assignee */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Assignee</h4>
                    <div className="space-y-1">
                        {MEMBERS.map(m => (
                            <label key={m.id} className="flex items-center gap-2 text-sm text-pepper-700 dark:text-pepper-300 cursor-pointer hover:bg-pepper-50 dark:hover:bg-pepper-800/50 p-1 rounded">
                                <input 
                                    type="checkbox" 
                                    checked={filters.assigneeIds.includes(m.id)}
                                    onChange={() => toggleFilter('assigneeIds', m.id)}
                                    className="rounded border-pepper-300 text-pepper-900 focus:ring-pepper-500"
                                />
                                <img src={m.avatar} className="w-5 h-5 rounded-full" alt="" />
                                {m.name}
                            </label>
                        ))}
                        <label className="flex items-center gap-2 text-sm text-pepper-700 dark:text-pepper-300 cursor-pointer hover:bg-pepper-50 dark:hover:bg-pepper-800/50 p-1 rounded">
                            <input 
                                type="checkbox" 
                                checked={filters.assigneeIds.includes('Unassigned')}
                                onChange={() => toggleFilter('assigneeIds', 'Unassigned')}
                                className="rounded border-pepper-300 text-pepper-900 focus:ring-pepper-500"
                            />
                            <span className="w-5 h-5 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center text-xs"><FiUser /></span>
                            Unassigned
                        </label>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleFilter('tags', tag)}
                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                    filters.tags.includes(tag)
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-white dark:bg-pepper-800 text-pepper-600 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700 hover:border-pepper-300'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Due Date Range</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-pepper-400 block mb-1">From</label>
                            <input 
                                type="date" 
                                value={filters.dueFrom || ''}
                                onChange={(e) => onChange({ dueFrom: e.target.value })}
                                className="w-full bg-white text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-pepper-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-pepper-400 block mb-1">To</label>
                            <input 
                                type="date" 
                                value={filters.dueTo || ''}
                                onChange={(e) => onChange({ dueTo: e.target.value })}
                                className="w-full bg-white text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-pepper-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Sprint */}
                <div>
                    <h4 className="text-xs font-bold text-pepper-500 uppercase mb-2">Sprint</h4>
                    <select 
                        value={filters.sprintId || ''}
                        onChange={(e) => onChange({ sprintId: e.target.value })}
                        className="w-full bg-white text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-pepper-500 outline-none"
                    >
                        <option value="">All Sprints</option>
                        {MOCK_SPRINTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

// --- ISSUE DETAILS COMPONENT ---
const IssueDetailsModal = ({ 
    task, 
    onClose, 
    onSave,
    onDelete,
    allTasks
}: { 
    task: Task, 
    onClose: () => void, 
    onSave: (updates: Partial<Task>) => void,
    onDelete: () => void,
    allTasks: Task[]
}) => {
    const [localTask, setLocalTask] = useState<Task>({...task});
    const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'activity' | 'attachments' | 'links' | 'ai'>('overview');
    const [newComment, setNewComment] = useState('');
    const [subtaskTitle, setSubtaskTitle] = useState('');
    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
    
    // Local state for Tags editing
    const [tagsInput, setTagsInput] = useState((task.tags || []).join(', '));
    
    const logActivity = (type: ActivityEvent['type'], details: string) => {
        const newActivity: ActivityEvent = {
            id: crypto.randomUUID(),
            type,
            user: 'You',
            timestamp: new Date().toISOString(),
            details
        };
        setLocalTask(prev => ({ ...prev, activity: [...(prev.activity || []), newActivity] }));
    };

    const updateLocal = (updates: Partial<Task>, activityType?: ActivityEvent['type'], activityDetails?: string) => {
        setLocalTask(prev => {
            const next = { ...prev, ...updates };
            if (activityType && activityDetails) {
                const newActivity: ActivityEvent = {
                    id: crypto.randomUUID(),
                    type: activityType,
                    user: 'You',
                    timestamp: new Date().toISOString(),
                    details: activityDetails
                };
                next.activity = [...(prev.activity || []), newActivity];
            }
            return next;
        });
    };

    const handleAddSubtask = () => {
        if (!subtaskTitle.trim()) return;
        const newSub: Subtask = { id: crypto.randomUUID(), title: subtaskTitle, completed: false };
        updateLocal({ subtasks: [...(localTask.subtasks || []), newSub] }, 'subtask', `added subtask: "${subtaskTitle}"`);
        setSubtaskTitle('');
    };

    const handleToggleSubtask = (id: string) => {
        const sub = localTask.subtasks?.find(s => s.id === id);
        if (!sub) return;
        const updated = localTask.subtasks?.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
        updateLocal({ subtasks: updated }, 'subtask', `marked subtask "${sub.title}" as ${!sub.completed ? 'completed' : 'incomplete'}`);
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comm: Comment = { id: crypto.randomUUID(), text: newComment, user: 'You', createdAt: new Date().toISOString() };
        const newActivity: ActivityEvent = {
            id: crypto.randomUUID(),
            type: 'comment',
            user: 'You',
            timestamp: new Date().toISOString(),
            details: newComment
        };
        setLocalTask(prev => ({
            ...prev,
            comments: [...(prev.comments || []), comm],
            activity: [...(prev.activity || []), newActivity]
        }));
        setNewComment('');
    };

    const handleUploadAttachment = () => {
        const mockFiles = ['Architecture_Diagram.png', 'Error_Logs.txt', 'Spec_Sheet_v2.pdf'];
        const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
        const newAtt: Attachment = {
            id: crypto.randomUUID(),
            name: randomFile,
            size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
            type: randomFile.split('.')[1].toUpperCase(),
            url: '#',
            uploadedBy: 'You',
            uploadedAt: new Date().toISOString()
        };
        updateLocal({ attachments: [...(localTask.attachments || []), newAtt] }, 'attachment', `uploaded ${randomFile}`);
    };

    const handleAddLink = (targetId: string, type: Link['type']) => {
        const target = allTasks.find(t => t.id === targetId);
        if (!target) return;
        const newLink: Link = {
            id: crypto.randomUUID(),
            type,
            targetTaskId: target.id,
            targetTaskTitle: target.title,
            targetTaskStatus: target.status
        };
        updateLocal({ links: [...(localTask.links || []), newLink] }, 'link', `linked issue ${target.key || target.id} as ${type}`);
        setIsAddLinkOpen(false);
    };

    const handleAiSummarize = () => {
        const summary = `Issue "${localTask.title}" [${localTask.priority}] is currently ${localTask.status}. Assigned to ${MEMBERS.find(m => m.id === localTask.assignee)?.name || 'Unassigned'}. Requires ${localTask.storyPoints || '?'} points.`;
        updateLocal({ description: summary + "\n\n" + localTask.description }, 'field', 'AI summarized the issue');
    };

    const handleAiGenerateSubtasks = () => {
        const aiSubtasks: Subtask[] = [
            { id: crypto.randomUUID(), title: 'Analyze requirements', completed: false },
            { id: crypto.randomUUID(), title: 'Draft solution design', completed: false },
            { id: crypto.randomUUID(), title: 'Implement core logic', completed: false },
        ];
        updateLocal({ subtasks: [...(localTask.subtasks || []), ...aiSubtasks] }, 'subtask', 'AI generated 3 subtasks');
    };

    const handleAiImprove = () => {
        const improved = "Updated Description: " + localTask.description + "\n\n(Enhanced for clarity and conciseness by AI)";
        updateLocal({ description: improved }, 'field', 'AI improved description');
    };

    return (
        <Modal isOpen={true} onClose={() => { onSave(localTask); onClose(); }}>
            <div className="bg-white dark:bg-pepper-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden flex flex-col relative z-50 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-pepper-200 dark:border-pepper-700 bg-pepper-50 dark:bg-pepper-950 flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono font-bold text-pepper-500 dark:text-pepper-400 bg-pepper-100 dark:bg-pepper-800 px-1.5 py-0.5 rounded">{localTask.key || localTask.id}</span>
                            <select value={localTask.type || 'Task'} onChange={(e) => updateLocal({ type: e.target.value as TaskType }, 'field', `changed type to ${e.target.value}`)} className="text-xs font-bold bg-transparent text-pepper-500 uppercase outline-none cursor-pointer hover:text-pepper-900 dark:hover:text-white">
                                <option value="Task">Task</option><option value="Bug">Bug</option><option value="Story">Story</option>
                            </select>
                        </div>
                        <input value={localTask.title} onChange={(e) => setLocalTask(prev => ({ ...prev, title: e.target.value }))} onBlur={() => logActivity('field', 'updated title')} className="text-xl font-bold text-pepper-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full outline-none" />
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={localTask.status} onChange={(e) => updateLocal({ status: e.target.value as TaskStatus }, 'status', `changed status to ${e.target.value}`)} className="bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-1.5 text-sm font-bold text-pepper-700 dark:text-pepper-200 outline-none focus:ring-2 focus:ring-pepper-500/20">
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={localTask.priority} onChange={(e) => updateLocal({ priority: e.target.value as Priority }, 'field', `changed priority to ${e.target.value}`)} className="bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-1.5 text-sm font-bold text-pepper-700 dark:text-pepper-200 outline-none focus:ring-2 focus:ring-pepper-500/20">
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button onClick={() => { onSave(localTask); onClose(); }} className="p-2 hover:bg-pepper-200 dark:hover:bg-pepper-800 rounded-lg transition-colors"><FiX className="text-lg text-pepper-500" /></button>
                    </div>
                </div>
                {/* Meta Bar */}
                <div className="shrink-0 px-6 py-3 border-b border-pepper-100 dark:border-pepper-800 bg-white dark:bg-pepper-900 flex flex-wrap gap-x-8 gap-y-2 items-center text-xs">
                    <div className="flex items-center gap-2"><span className="text-pepper-400 font-bold uppercase">Assignee</span><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center"><FiUser /></div><select value={localTask.assignee || 'Unassigned'} onChange={(e) => updateLocal({ assignee: e.target.value }, 'assignee', `assigned to ${MEMBERS.find(m => m.id === e.target.value)?.name || 'Unassigned'}`)} className="bg-transparent font-medium text-pepper-700 dark:text-pepper-200 outline-none cursor-pointer"><option value="Unassigned">Unassigned</option>{MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div></div>
                    <div className="flex items-center gap-2"><span className="text-pepper-400 font-bold uppercase">Reporter</span><div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div><span className="font-medium text-pepper-700 dark:text-pepper-200">{MEMBERS.find(m => m.id === localTask.reporter)?.name || 'Alex'}</span></div></div>
                    <div className="flex items-center gap-2"><span className="text-pepper-400 font-bold uppercase">Due Date</span><input type="date" value={localTask.dueDate?.split('T')[0] || ''} onChange={(e) => updateLocal({ dueDate: e.target.value }, 'field', `changed due date to ${e.target.value}`)} className="bg-transparent font-medium text-pepper-700 dark:text-pepper-200 outline-none" /></div>
                    <div className="flex items-center gap-2"><span className="text-pepper-400 font-bold uppercase">Points</span><input type="number" value={localTask.storyPoints || ''} onChange={(e) => updateLocal({ storyPoints: parseInt(e.target.value) }, 'field', `changed points to ${e.target.value}`)} className="w-10 bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded px-1 py-0.5 text-center font-medium outline-none" /></div>
                </div>
                {/* Tabs */}
                <div className="shrink-0 px-6 border-b border-pepper-100 dark:border-pepper-800 bg-white dark:bg-pepper-900 flex gap-6">
                    {['Overview', 'Subtasks', 'Activity', 'Attachments', 'Links', 'AI Insights'].map(tab => {
                        const key = tab.toLowerCase().split(' ')[0] as any;
                        return (<button key={key} onClick={() => setActiveTab(key)} className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === key ? 'border-pepper-900 dark:border-white text-pepper-900 dark:text-white' : 'border-transparent text-pepper-400 hover:text-pepper-600 dark:hover:text-pepper-300'}`}>{tab}</button>);
                    })}
                </div>
                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-pepper-50/30 dark:bg-black/20 custom-scrollbar">
                    {activeTab === 'overview' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {/* NEW TAGS SECTION */}
                            <div className="bg-white dark:bg-pepper-900 p-6 rounded-xl border border-pepper-100 dark:border-pepper-800 shadow-sm">
                                <label className="block text-xs font-bold text-pepper-400 uppercase mb-2">Tags</label>
                                <div className="relative">
                                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                                    <input 
                                        value={tagsInput}
                                        onChange={(e) => setTagsInput(e.target.value)}
                                        onBlur={() => {
                                            const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                            if (JSON.stringify(newTags) !== JSON.stringify(localTask.tags)) {
                                                updateLocal({ tags: newTags }, 'field', 'updated tags');
                                            }
                                        }}
                                        className="w-full bg-transparent border border-pepper-200 dark:border-pepper-700 rounded-lg pl-9 pr-3 py-2 text-sm text-pepper-800 dark:text-pepper-200 outline-none focus:ring-2 focus:ring-pepper-500/20 placeholder-pepper-300"
                                        placeholder="e.g. Frontend, Refactor (comma separated)" 
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-pepper-900 p-6 rounded-xl border border-pepper-100 dark:border-pepper-800 shadow-sm">
                                <label className="block text-xs font-bold text-pepper-400 uppercase mb-2">Description</label>
                                <textarea value={localTask.description} onChange={(e) => setLocalTask(prev => ({ ...prev, description: e.target.value }))} onBlur={() => logActivity('field', 'updated description')} className="w-full min-h-[150px] bg-transparent border-none outline-none resize-none text-sm text-pepper-800 dark:text-pepper-200 leading-relaxed placeholder-pepper-300" placeholder="Add a detailed description..." />
                            </div>
                            <div className="bg-white dark:bg-pepper-900 p-6 rounded-xl border border-pepper-100 dark:border-pepper-800 shadow-sm">
                                <label className="block text-xs font-bold text-pepper-400 uppercase mb-2">Acceptance Criteria</label>
                                <textarea value={localTask.acceptanceCriteria || ''} onChange={(e) => setLocalTask(prev => ({ ...prev, acceptanceCriteria: e.target.value }))} onBlur={() => logActivity('field', 'updated acceptance criteria')} className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none text-sm text-pepper-800 dark:text-pepper-200 leading-relaxed placeholder-pepper-300 font-mono" placeholder="- [ ] Criteria 1..." />
                            </div>
                        </div>
                    )}
                    {activeTab === 'subtasks' && (
                        <div className="max-w-3xl mx-auto"><div className="bg-white dark:bg-pepper-900 rounded-xl border border-pepper-200 dark:border-pepper-800 overflow-hidden shadow-sm"><div className="p-4 bg-pepper-50 dark:bg-pepper-950/50 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center"><h4 className="font-bold text-sm">Subtasks ({localTask.subtasks?.filter(s => s.completed).length || 0}/{localTask.subtasks?.length || 0})</h4><div className="w-32 bg-pepper-200 dark:bg-pepper-800 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${localTask.subtasks?.length ? (localTask.subtasks.filter(s => s.completed).length / localTask.subtasks.length) * 100 : 0}%` }}></div></div></div><div className="divide-y divide-pepper-100 dark:divide-pepper-800">{(localTask.subtasks || []).map(sub => (<div key={sub.id} className="flex items-center gap-3 p-3 hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors group"><input type="checkbox" checked={sub.completed} onChange={() => handleToggleSubtask(sub.id)} className="rounded border-pepper-300 text-pepper-900 focus:ring-pepper-500 w-4 h-4 cursor-pointer" /><input value={sub.title} onChange={(e) => { const updated = localTask.subtasks?.map(s => s.id === sub.id ? {...s, title: e.target.value} : s); setLocalTask(prev => ({ ...prev, subtasks: updated })); }} className={`flex-1 bg-transparent border-none outline-none text-sm ${sub.completed ? 'text-pepper-400 line-through' : 'text-pepper-900 dark:text-white'}`} /><button onClick={() => { const updated = localTask.subtasks?.filter(s => s.id !== sub.id); updateLocal({ subtasks: updated }, 'subtask', 'removed a subtask'); }} className="opacity-0 group-hover:opacity-100 text-pepper-400 hover:text-red-500 transition-all"><FiTrash2 /></button></div>))}<div className="p-3 bg-pepper-50/50 dark:bg-pepper-900/50 flex items-center gap-3"><FiPlus className="text-pepper-400" /><input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="Add new subtask..." className="flex-1 bg-transparent border-none outline-none text-sm placeholder-pepper-400" /><button onClick={handleAddSubtask} className="text-xs font-bold text-blue-600 hover:underline">Add</button></div></div></div></div>
                    )}
                    {activeTab === 'activity' && (
                        <div className="max-w-3xl mx-auto space-y-6"><div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-pepper-900 text-white flex items-center justify-center font-bold text-xs shrink-0">Y</div><div className="flex-1 relative"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Leave a comment..." className="w-full bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-xl p-3 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-pepper-500/20 outline-none" /><button onClick={handleAddComment} disabled={!newComment.trim()} className="absolute bottom-3 right-3 px-3 py-1.5 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50">Comment</button></div></div><div className="space-y-6">{(localTask.activity || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(item => { if (item.type === 'comment') { return (<div key={item.id} className="flex gap-3 animate-fade-in"><div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 border border-purple-200">{item.user[0]}</div><div><div className="flex items-baseline gap-2 mb-1"><span className="font-bold text-sm text-pepper-900 dark:text-white">{item.user}</span><span className="text-xs text-pepper-400">{new Date(item.timestamp).toLocaleString()}</span></div><p className="text-sm text-pepper-700 dark:text-pepper-300 bg-pepper-50 dark:bg-pepper-800/50 p-3 rounded-xl rounded-tl-none">{item.details}</p></div></div>); } else { return (<div key={item.id} className="flex gap-4 items-center px-4 opacity-70"><div className="w-8 flex justify-center"><FiActivity className="text-pepper-400" /></div><div className="text-xs text-pepper-500"><span className="font-bold text-pepper-700 dark:text-pepper-300">{item.user}</span> {item.details} <span className="text-pepper-400 ml-2">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>); } })}{(!localTask.activity?.length) && <p className="text-center text-sm text-pepper-400">No activity yet.</p>}</div></div>
                    )}
                    {activeTab === 'attachments' && (
                        <div className="max-w-3xl mx-auto"><div className="grid grid-cols-2 gap-4">{(localTask.attachments || []).map(att => (<div key={att.id} className="flex items-center gap-3 p-3 bg-white dark:bg-pepper-900 rounded-xl border border-pepper-200 dark:border-pepper-800 shadow-sm hover:border-blue-300 transition-colors group relative overflow-hidden"><div className="w-10 h-10 bg-pepper-50 dark:bg-pepper-800 rounded-lg flex items-center justify-center shrink-0"><FiPaperclip className="text-pepper-400" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-pepper-900 dark:text-white truncate">{att.name}</p><p className="text-xs text-pepper-500">{att.size} • {att.uploadedBy}</p></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { const updated = localTask.attachments?.filter(a => a.id !== att.id); updateLocal({ attachments: updated }, 'attachment', `removed attachment ${att.name}`); }} className="p-1.5 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded text-red-500"><FiTrash2 /></button></div></div>))}<button onClick={handleUploadAttachment} className="border-2 border-dashed border-pepper-200 dark:border-pepper-700 rounded-xl p-6 flex flex-col items-center justify-center text-pepper-400 hover:border-pepper-400 hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-all cursor-pointer"><FiUploadCloud className="text-2xl mb-2" /><span className="text-sm font-medium">Click to upload mock file</span></button></div></div>
                    )}
                    {activeTab === 'links' && (
                        <div className="max-w-3xl mx-auto space-y-6"><div><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-pepper-500 uppercase">Linked Issues</h4><button onClick={() => setIsAddLinkOpen(true)} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"><FiPlus /> Add Link</button></div><div className="space-y-2">{(localTask.links || []).map(link => (<div key={link.id} className="flex items-center gap-3 p-3 bg-white dark:bg-pepper-900 rounded-lg border border-pepper-200 dark:border-pepper-700"><div className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{link.type}</div><span className="text-sm font-bold text-pepper-900 dark:text-white">{link.targetTaskTitle}</span><span className="ml-auto text-xs bg-pepper-100 dark:bg-pepper-800 text-pepper-600 dark:text-pepper-400 px-2 py-0.5 rounded-full font-bold">{link.targetTaskStatus}</span><button onClick={() => { const updated = localTask.links?.filter(l => l.id !== link.id); updateLocal({ links: updated }, 'link', 'removed a link'); }} className="text-pepper-400 hover:text-red-500"><FiX /></button></div>))}{(!localTask.links?.length) && <p className="text-sm text-pepper-400 italic">No linked issues.</p>}</div>{isAddLinkOpen && (<div className="mt-4 p-4 bg-pepper-50 dark:bg-pepper-900 rounded-xl border border-pepper-200 dark:border-pepper-700 animate-slide-up"><p className="text-xs font-bold mb-2">Select an issue to link:</p><div className="max-h-40 overflow-y-auto space-y-1 mb-2">{allTasks.filter(t => t.id !== localTask.id).map(t => (<button key={t.id} onClick={() => handleAddLink(t.id, 'relates-to')} className="w-full text-left text-sm p-2 hover:bg-pepper-200 dark:hover:bg-pepper-800 rounded truncate">{t.title}</button>))}</div><button onClick={() => setIsAddLinkOpen(false)} className="text-xs text-pepper-500 hover:underline">Cancel</button></div>)}</div></div>
                    )}
                    {activeTab === 'ai' && (
                        <div className="max-w-3xl mx-auto space-y-6"><div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-pepper-900 p-6 rounded-2xl border border-purple-100 dark:border-purple-800/50 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><BiBot className="text-8xl text-purple-500 rotate-12" /></div><h4 className="font-bold text-purple-900 dark:text-white text-lg mb-4 flex items-center gap-2 relative z-10"><FiZap className="text-purple-500" /> AI Analysis</h4><div className="space-y-4 relative z-10"><div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-purple-100 dark:border-purple-800/30"><h5 className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase mb-1">Summary</h5><p className="text-sm text-pepper-700 dark:text-pepper-200 leading-relaxed">{localTask.description.substring(0, 150)}...</p></div></div><div className="flex flex-wrap gap-3 mt-6 relative z-10"><button onClick={handleAiSummarize} className="px-4 py-2 bg-white dark:bg-pepper-800 hover:bg-purple-50 dark:hover:bg-pepper-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"><FiAlignLeft /> Summarize</button><button onClick={handleAiGenerateSubtasks} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2"><BiBot className="text-lg" /> Generate Subtasks</button><button onClick={handleAiImprove} className="px-4 py-2 bg-white dark:bg-pepper-800 hover:bg-purple-50 dark:hover:bg-pepper-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2"><FiEdit2 /> Improve Description</button></div></div></div>
                    )}
                </div>
                {/* Footer Actions */}
                <div className="shrink-0 p-4 border-t border-pepper-200 dark:border-pepper-700 bg-white dark:bg-pepper-900 flex justify-between items-center">
                    <div className="flex gap-2"><button onClick={() => { if (window.confirm('Are you sure you want to delete this issue?')) onDelete(); }} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><FiTrash2 /> Delete</button></div>
                    <div className="flex gap-3"><button onClick={() => { onSave(localTask); onClose(); }} className="px-6 py-2.5 bg-pepper-100 dark:bg-pepper-800 hover:bg-pepper-200 dark:hover:bg-pepper-700 text-pepper-900 dark:text-white rounded-xl text-sm font-bold transition-colors">Save Changes</button>{localTask.status !== TaskStatus.DONE && (<button onClick={() => { updateLocal({ status: TaskStatus.DONE }, 'status', 'marked as Done'); const finalTask = { ...localTask, status: TaskStatus.DONE }; const newActivity: ActivityEvent = { id: crypto.randomUUID(), type: 'status', user: 'You', timestamp: new Date().toISOString(), details: 'marked as Done' }; finalTask.activity = [...(localTask.activity || []), newActivity]; onSave(finalTask); onClose(); }} className="px-6 py-2.5 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"><FiCheck /> Mark as Done</button>)}</div>
                </div>
            </div>
        </Modal>
    );
};

// --- Task Card Component ---
const TaskCard = ({
    task,
    index,
    advanceTask,
    getPriorityColor,
    onDragStart,
    onDragEnter,
    isDragged,
    onUpdate,
    onDelete,
    onClone,
    onEdit,
    onCopyLink,
    isMenuOpen,
    onToggleMenu,
    onCardClick
}: {
    task: Task;
    index: number;
    advanceTask: (id: string) => void;
    getPriorityColor: (p: Priority) => string;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
    onDragEnter: (id: string, status: TaskStatus) => void;
    isDragged: boolean;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
    onClone: (id: string) => void;
    onEdit: (task: Task) => void;
    onCopyLink: (id: string) => void;
    isMenuOpen: boolean;
    onToggleMenu: (taskId: string, rect: DOMRect) => void;
    onCardClick: (task: Task) => void;
}) => {
    const assignee = MEMBERS.find(m => m.id === task.assignee);
    const cardRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div
            ref={cardRef}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnter={(e) => {
                onDragEnter(task.id, task.status);
            }}
            onDragOver={(e) => {
                e.preventDefault();
            }}
            onClick={() => onCardClick(task)}
            className={`
        bg-white/90 dark:bg-pepper-800/80 backdrop-blur-sm rounded-xl p-4 shadow-sm hover:shadow-lg hover:shadow-pepper-200/50 dark:hover:shadow-black/30 
        border border-transparent hover:border-pepper-200 dark:hover:border-pepper-600 transition-all duration-200 ease-in-out
        group relative cursor-grab active:cursor-grabbing
        ${isDragged ? 'opacity-40 scale-95 border-dashed border-pepper-400 dark:border-pepper-500' : ''}
      `}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                    <button
                        ref={buttonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (buttonRef.current) {
                                onToggleMenu(task.id, buttonRef.current.getBoundingClientRect());
                            }
                        }}
                        className={`text-pepper-300 hover:text-pepper-600 dark:hover:text-pepper-200 transition-opacity p-1 rounded-md hover:bg-pepper-50 dark:hover:bg-pepper-700 ${isMenuOpen ? 'opacity-100 bg-pepper-100 dark:bg-pepper-700 text-pepper-600 dark:text-pepper-200' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <FiMoreHorizontal />
                    </button>
                </div>
            </div>

            <h4
                className="text-pepper-900 dark:text-pepper-100 font-bold text-sm mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
                {task.title}
            </h4>

            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-pepper-100 dark:bg-pepper-700 text-pepper-500 dark:text-pepper-400 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-pepper-50 dark:border-pepper-700/50 mt-2">
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <Tippy content={assignee.name}>
                            <img src={assignee.avatar} className="w-6 h-6 rounded-full border border-pepper-100 dark:border-pepper-700" alt={assignee.name} />
                        </Tippy>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-pepper-100 dark:bg-pepper-700 flex items-center justify-center text-xs text-pepper-500"><FiUser /></div>
                    )}
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-pepper-400'}`}>
                            <FiClock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <div className="flex gap-1">
                    {task.storyPoints && (
                        <span className="text-[10px] font-mono text-pepper-400 bg-pepper-50 dark:bg-pepper-800 px-1.5 rounded">{task.storyPoints} pts</span>
                    )}
                </div>
            </div>
        </div>
    );
};

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

export const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'Board' | 'List' | 'Timeline'>('Board');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Filtering States
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set()); // Quick avatar filters
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
  
  // Search & Advanced Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<BoardFilters>(INITIAL_FILTERS);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Detail View State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Menu State
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);

  // --- Derived State (Filter Logic) ---
  const filteredTasks = tasks.filter(t => {
      // 1. Search Query
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
          t.title.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          (t.key || t.id).toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // 2. Quick Member Filter (Header Avatars)
      const matchesQuickMembers = selectedMemberIds.size === 0 ||
          (selectedMemberIds.has('Unassigned') && (!t.assignee || t.assignee === 'Unassigned')) ||
          (t.assignee && selectedMemberIds.has(t.assignee));

      if (!matchesQuickMembers) return false;

      // 3. Advanced Filters (Panel)
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(t.status);
      const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(t.priority);
      const matchesType = filters.types.length === 0 || (t.type && filters.types.includes(t.type));
      const matchesAssignee = filters.assigneeIds.length === 0 || (t.assignee && filters.assigneeIds.includes(t.assignee)) || (filters.assigneeIds.includes('Unassigned') && (!t.assignee || t.assignee === 'Unassigned'));
      
      const matchesTags = filters.tags.length === 0 || filters.tags.some(tag => t.tags.includes(tag));
      
      const matchesDueDate = (() => {
          if (!t.dueDate) return (!filters.dueFrom && !filters.dueTo);
          const taskDate = new Date(t.dueDate).getTime();
          const from = filters.dueFrom ? new Date(filters.dueFrom).getTime() : -Infinity;
          const to = filters.dueTo ? new Date(filters.dueTo).getTime() : Infinity;
          return taskDate >= from && taskDate <= to;
      })();

      const matchesSprint = !filters.sprintId || filters.sprintId === '' ||
          (filters.sprintId === 'current' && t.sprintId === 'current') || // Mock logic for 'current'
          (filters.sprintId === 'next' && t.sprintId === 'next') || 
          (t.sprintId === filters.sprintId);

      return matchesStatus && matchesPriority && matchesType && matchesAssignee && matchesTags && matchesDueDate && matchesSprint;
  });

  const availableTags = useMemo(() => Array.from(new Set(tasks.flatMap(t => t.tags))), [tasks]);
  
  const activeFilterCount = 
      filters.statuses.length + 
      filters.priorities.length + 
      filters.types.length + 
      filters.assigneeIds.length + 
      filters.tags.length + 
      (filters.dueFrom || filters.dueTo ? 1 : 0) + 
      (filters.sprintId ? 1 : 0);

  const advanceTask = (taskId: string) => {
    if (draggedTaskId) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const nextStatus = getNextStatus(t.status);
      return { ...t, status: nextStatus };
    }));
  };

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    const map = {
      [TaskStatus.TODO]: TaskStatus.IN_PROGRESS,
      [TaskStatus.IN_PROGRESS]: TaskStatus.REVIEW,
      [TaskStatus.REVIEW]: TaskStatus.DONE,
      [TaskStatus.DONE]: TaskStatus.TODO,
      [TaskStatus.BLOCKED]: TaskStatus.TODO
    };
    return map[current];
  };

  const toggleMemberSelection = (id: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMemberIds(newSet);
  };

  // --- Task Action Handlers ---

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // Simulate toast feedback for moves
    if (updates.sprintId === undefined && Object.keys(updates).includes('sprintId')) {
       setToastMsg("Task moved to Backlog");
    } else if (updates.sprintId === 'next-sprint-id') {
       setToastMsg("Task moved to Next Sprint");
    } else if (updates.status) {
       // Optional: Add sound or visual feedback
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setToastMsg("Task deleted");
    if (selectedTask?.id === id) setSelectedTask(null);
  };

  const handleCloneTask = (id: string) => {
    const taskToClone = tasks.find(t => t.id === id);
    if (!taskToClone) return;

    const clonedTask: Task = {
      ...taskToClone,
      id: crypto.randomUUID(),
      title: `Copy of ${taskToClone.title}`,
      status: TaskStatus.TODO, // Reset status usually
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, clonedTask]);
    setToastMsg("Task cloned");
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/task/${id}`;
    navigator.clipboard.writeText(url);
    setToastMsg("Link copied to clipboard");
  };

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const taskData: Partial<Task> = {
        title: data.get('title') as string,
        description: data.get('description') as string,
        priority: data.get('priority') as Priority,
        status: data.get('status') as TaskStatus,
        type: data.get('type') as TaskType,
        assignee: data.get('assignee') as string,
        dueDate: data.get('dueDate') as string,
        tags: (data.get('tags') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
    };

    const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        key: `FLX-${Math.floor(Math.random() * 1000)}`,
        title: taskData.title || 'Untitled',
        description: taskData.description || '',
        priority: taskData.priority || Priority.MEDIUM,
        status: taskData.status || TaskStatus.TODO,
        type: taskData.type || 'Task',
        tags: taskData.tags || [],
        assignee: taskData.assignee || 'Unassigned',
        dueDate: taskData.dueDate || undefined,
        subtasks: [],
        comments: [],
        activity: [],
        updatedAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    setToastMsg("Task created successfully");
    
    setIsTaskModalOpen(false);
  };

  const openCreateModal = () => {
    setIsTaskModalOpen(true);
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTaskId(id);
    handleCloseMenu(); // Close menu if dragging starts
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault(); 
    if (!draggedTaskId) return;
    
    const tasksInColumn = tasks.filter(t => t.status === status);
    if (tasksInColumn.length === 0) {
        setTasks(prev => {
           const list = [...prev];
           const idx = list.findIndex(t => t.id === draggedTaskId);
           if (idx > -1) {
               if (list[idx].status !== status) {
                   const t = list[idx];
                   t.status = status;
                   list.splice(idx, 1);
                   list.push(t);
                   return list;
               }
           }
           return prev;
        });
    }
  };

  const handleCardDragEnter = (targetId: string, status: TaskStatus) => {
    if (!draggedTaskId || draggedTaskId === targetId) return;

    setTasks(prev => {
        const list = [...prev];
        const dragIndex = list.findIndex(t => t.id === draggedTaskId);
        const hoverIndex = list.findIndex(t => t.id === targetId);

        if (dragIndex < 0 || hoverIndex < 0) return prev;

        const dragTask = list[dragIndex];
        if (dragTask.status !== status) {
            dragTask.status = status;
        }

        list.splice(dragIndex, 1);
        list.splice(hoverIndex, 0, dragTask);
        
        return list;
    });
  };

  // --- Menu Handlers ---
  const handleToggleMenu = (taskId: string, rect: DOMRect) => {
    if (activeMenuTaskId === taskId) {
        handleCloseMenu();
    } else {
        setActiveMenuTaskId(taskId);
        setMenuAnchorRect(rect);
    }
  };

  const handleCloseMenu = () => {
    setActiveMenuTaskId(null);
    setMenuAnchorRect(null);
  };

  // --- AI Logic ---
  const handleGenerateTasks = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newTasks = await generateTasksFromDescription(aiPrompt);
      const formattedTasks = newTasks.map((t, idx) => ({
        ...t,
        assignee: MEMBERS[idx % MEMBERS.length].id
      })) as Task[];
      
      setTasks(prev => [...prev, ...formattedTasks]);
      setIsAiModalOpen(false);
      setAiPrompt('');
      setToastMsg("AI generated tasks added");
    } catch (error) {
      alert("Failed to generate tasks. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchInsight = async () => {
      setLoadingInsight(true);
      const res = await getAIInsights(tasks);
      setInsight(res);
      setLoadingInsight(false);
  };

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case Priority.CRITICAL: return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case Priority.HIGH: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      case Priority.MEDIUM: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case Priority.LOW: return 'bg-pepper-200/30 text-pepper-600 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700';
      default: return 'bg-pepper-100 text-pepper-800';
    }
  };

  // --- Render Views ---

  const renderListView = () => {
    return (
      <div className="bg-white dark:bg-pepper-900 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm overflow-hidden animate-fade-in flex-1">
         <div className="grid grid-cols-12 gap-4 p-4 border-b border-pepper-200 dark:border-pepper-800 bg-pepper-50 dark:bg-pepper-950 text-xs font-bold text-pepper-500 uppercase tracking-wider">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-1">Assignee</div>
            <div className="col-span-2 text-right">Due Date</div>
         </div>
         <div className="divide-y divide-pepper-100 dark:divide-pepper-800 overflow-y-auto custom-scrollbar h-full max-h-[calc(100vh-280px)]">
            {filteredTasks.length === 0 ? (
               <div className="p-8 text-center text-pepper-400 text-sm">No tasks matching filters.</div>
            ) : filteredTasks.map(task => {
              const assignee = MEMBERS.find(m => m.id === task.assignee);
              return (
                <div key={task.id} onClick={() => handleOpenDetail(task)} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors group cursor-pointer">
                   <div className="col-span-5">
                      <p className="font-bold text-sm text-pepper-900 dark:text-white truncate">{task.title}</p>
                      <div className="flex gap-1 mt-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-pepper-100 dark:bg-pepper-800 text-pepper-500 rounded">{tag}</span>
                        ))}
                      </div>
                   </div>

                   <div className="col-span-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        task.status === TaskStatus.DONE ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                        task.status === TaskStatus.REVIEW ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-pepper-100 text-pepper-600 border-pepper-200 dark:bg-pepper-800 dark:text-pepper-400 dark:border-pepper-700'
                      }`}>
                        {COLUMNS.find(c => c.id === task.status)?.title || task.status}
                      </span>
                   </div>

                   <div className="col-span-2">
                      <span className={`text-[10px] font-bold uppercase ${
                        task.priority === 'Critical' ? 'text-red-500' :
                        task.priority === 'High' ? 'text-orange-500' :
                        task.priority === 'Medium' ? 'text-blue-500' :
                        'text-pepper-500'
                      }`}>
                        {task.priority}
                      </span>
                   </div>

                   <div className="col-span-1 flex items-center gap-2">
                      {assignee ? (
                        <Tippy content={assignee.name}>
                            <img src={assignee.avatar} className="w-6 h-6 rounded-full" alt="Assignee" />
                        </Tippy>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center text-xs text-pepper-500"><FiUser /></div>
                      )}
                   </div>

                   <div className="col-span-2 text-right text-xs font-medium text-pepper-500 dark:text-pepper-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const startDate = new Date(); 
    startDate.setDate(startDate.getDate() - 2); 
    const dates = Array.from({length: 14}, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="bg-white dark:bg-pepper-900 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm overflow-hidden animate-fade-in flex flex-col h-full flex-1">
        <div className="flex border-b border-pepper-200 dark:border-pepper-800 overflow-x-auto custom-scrollbar no-scrollbar sticky top-0 bg-pepper-50 dark:bg-pepper-950 z-20">
           <div className="w-64 shrink-0 p-4 font-bold text-xs text-pepper-500 uppercase tracking-wider bg-pepper-50 dark:bg-pepper-950 sticky left-0 z-30 border-r border-pepper-200 dark:border-pepper-800">
             Task
           </div>
           {dates.map(date => (
             <div key={date.toISOString()} className="w-32 shrink-0 p-2 text-center border-r border-pepper-100 dark:border-pepper-800 bg-pepper-50 dark:bg-pepper-950">
               <div className="text-xs font-bold text-pepper-900 dark:text-white">{date.toLocaleDateString(undefined, {weekday: 'short'})}</div>
               <div className="text-[10px] text-pepper-500">{date.getDate()}</div>
             </div>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {filteredTasks.length === 0 ? (
               <div className="p-8 text-center text-pepper-400 text-sm">No tasks matching filters.</div>
           ) : filteredTasks.map(task => {
             const due = task.dueDate ? new Date(task.dueDate) : new Date();
             const start = new Date(due);
             start.setDate(due.getDate() - 3);

             return (
               <div key={task.id} onClick={() => handleOpenDetail(task)} className="flex border-b border-pepper-100 dark:border-pepper-800 hover:bg-pepper-50 dark:hover:bg-pepper-800/30 transition-colors relative cursor-pointer">
                  <div className="w-64 shrink-0 p-3 border-r border-pepper-200 dark:border-pepper-800 bg-white dark:bg-pepper-900 sticky left-0 z-10 flex flex-col justify-center">
                      <span className="text-sm font-bold text-pepper-900 dark:text-white truncate">{task.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 rounded-full border ${getPriorityColor(task.priority)} scale-90 origin-left`}>
                            {task.priority}
                        </span>
                      </div>
                  </div>
                  <div className="flex relative">
                      {dates.map(date => (
                        <div key={date.toISOString()} className="w-32 shrink-0 border-r border-pepper-50 dark:border-pepper-800/50 h-14"></div>
                      ))}
                      
                      {(() => {
                         const timelineStart = dates[0].getTime();
                         const dayMs = 86400000;
                         const normStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
                         const normTimelineStart = new Date(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate()).getTime();
                         
                         const offsetDays = (normStart - normTimelineStart) / dayMs;
                         const durationDays = 3; 
                         
                         if (offsetDays + durationDays < 0 || offsetDays > 14) return null;

                         const left = Math.max(0, offsetDays * 128); 
                         const visibleWidth = Math.min((offsetDays + durationDays) * 128, 14 * 128) - left;

                         return (
                           <div 
                             className={`absolute top-3 h-8 rounded-lg shadow-sm border border-white/20 flex items-center px-3 text-xs font-bold text-white whitespace-nowrap overflow-hidden z-0
                               ${task.priority === 'Critical' ? 'bg-red-500' : task.priority === 'High' ? 'bg-orange-500' : task.priority === 'Medium' ? 'bg-blue-500' : 'bg-pepper-400'}
                             `}
                             style={{ left: `${left + 10}px`, width: `${Math.max(visibleWidth - 20, 20)}px` }}
                           >
                             <span className="truncate">{task.title}</span>
                           </div>
                         );
                      })()}
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  }

  const MembersListDropdown = () => (
    <div className="w-56 bg-white/90 dark:bg-pepper-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-2 overflow-hidden ring-1 ring-black/5 origin-top-right">
        <div className="px-2 py-1.5 text-[10px] font-bold text-pepper-400 uppercase tracking-wider border-b border-pepper-50 dark:border-pepper-800 mb-1">
            Team Members
        </div>
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {MEMBERS.slice(3).map(m => (
                <button 
                    key={m.id}
                    onClick={() => {
                        toggleMemberSelection(m.id);
                        setIsMembersDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all ${
                        selectedMemberIds.has(m.id) 
                            ? 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 shadow-md' 
                            : 'text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-800'
                    }`}
                >
                    <div className="relative">
                        <img src={m.avatar} className="w-8 h-8 rounded-full border border-pepper-100 dark:border-pepper-700" alt={m.name} />
                        {selectedMemberIds.has(m.id) && (
                            <div className="absolute -right-1 -bottom-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-pepper-900">
                                <FiCheck className="w-2.5 h-2.5" />
                            </div>
                        )}
                    </div>
                    <span className="font-bold">{m.name}</span>
                </button>
            ))}
            
            <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1"></div>
            
            <button 
                onClick={() => {
                    toggleMemberSelection('Unassigned');
                    setIsMembersDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all ${
                    selectedMemberIds.has('Unassigned') 
                        ? 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 shadow-md' 
                        : 'text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-800'
                }`}
            >
                <div className="relative">
                    <div className="w-8 h-8 rounded-full border border-pepper-200 dark:border-pepper-700 bg-pepper-100 dark:bg-pepper-800 flex items-center justify-center text-pepper-400">
                        <FiUser />
                    </div>
                    {selectedMemberIds.has('Unassigned') && (
                        <div className="absolute -right-1 -bottom-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-pepper-900">
                            <FiCheck className="w-2.5 h-2.5" />
                        </div>
                    )}
                </div>
                <span className="font-bold">Unassigned</span>
            </button>
        </div>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden relative">
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-pepper-900 dark:text-pepper-50 mb-2 font-display">
            Kanban Board
          </h1>
          <p className="text-pepper-500 dark:text-pepper-400 text-sm flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Sprint 4 • Oct 24 - Nov 07
          </p>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center transition-all duration-300">
                {!insight ? (
                    <button 
                        onClick={fetchInsight}
                        disabled={loadingInsight}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 shadow-sm hover:shadow-md transition-all text-xs font-semibold text-pepper-600 dark:text-pepper-300"
                    >
                       <FiZap className={`text-purple-500 ${loadingInsight ? "animate-spin" : "group-hover:scale-110 transition-transform"}`} /> 
                       {loadingInsight ? "Analyzing Board..." : "Get AI Insights"}
                    </button>
                ) : (
                    <div className="bg-gradient-to-r from-pepper-100 to-white dark:from-pepper-800 dark:to-pepper-900 px-5 py-3 rounded-2xl text-xs text-pepper-700 dark:text-pepper-200 border border-pepper-200 dark:border-pepper-700 shadow-sm flex items-start gap-3 animate-fade-in max-w-xl" title={insight}>
                        <FiZap className="text-purple-500 shrink-0 text-base mt-0.5" /> 
                        <span className="leading-relaxed font-medium">{insight}</span>
                        <button onClick={() => setInsight(null)} className="ml-1 hover:text-red-500 text-lg leading-none opacity-50 hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                )}
             </div>

          {/* Members Avatars with Selection */}
          <div className="flex -space-x-3 mr-2 items-center">
            {MEMBERS.slice(0, 3).map(m => (
                <Tippy content={m.name} key={m.id}>
                    <button 
                        onClick={() => toggleMemberSelection(m.id)}
                        className={`relative w-9 h-9 rounded-full border-2 transition-all duration-200 transform hover:scale-110 hover:z-20 ${
                            selectedMemberIds.has(m.id) 
                            ? 'border-pepper-900 dark:border-white z-10 scale-105 shadow-md ring-2 ring-offset-2 ring-pepper-200 dark:ring-pepper-700 ring-offset-pepper-50 dark:ring-offset-pepper-900' 
                            : 'border-pepper-50 dark:border-pepper-900 opacity-80 hover:opacity-100'
                        }`}
                    >
                        <img src={m.avatar} className="w-full h-full rounded-full" alt={m.name} />
                        {selectedMemberIds.has(m.id) && (
                            <div className="absolute inset-0 bg-pepper-900/20 dark:bg-white/20 rounded-full flex items-center justify-center">
                                <FiCheck className="text-white font-bold drop-shadow-md" />
                            </div>
                        )}
                    </button>
                </Tippy>
            ))}
            
            {/* Overflow Button */}
            <Tippy 
                content={<MembersListDropdown />} 
                interactive={true}
                visible={isMembersDropdownOpen}
                onClickOutside={() => setIsMembersDropdownOpen(false)}
                placement="bottom-end"
                offset={[0, 10]}
                animation="scale"
                theme="clean"
                appendTo={() => document.body}
            >
                <button 
                  onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all hover:scale-105 shadow-sm ${
                    MEMBERS.slice(3).some(m => selectedMemberIds.has(m.id)) || selectedMemberIds.has('Unassigned')
                    ? 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 border-pepper-900 dark:border-white z-10 ring-2 ring-offset-2 ring-pepper-200 dark:ring-pepper-700'
                    : 'bg-pepper-200 dark:bg-pepper-800 text-pepper-600 dark:text-pepper-300 border-pepper-50 dark:border-pepper-900'
                }`}>
                   {MEMBERS.slice(3).some(m => selectedMemberIds.has(m.id)) || selectedMemberIds.has('Unassigned') ? (
                       <FiCheck className="text-lg" />
                   ) : (
                       `+${MEMBERS.length - 3}`
                   )}
                </button>
            </Tippy>
          </div>
          
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="group flex items-center gap-2 bg-pepper-900 hover:bg-pepper-800 dark:bg-pepper-100 dark:hover:bg-pepper-200 text-white dark:text-pepper-900 px-5 py-2.5 rounded-xl font-bold text-sm shadow-glass hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <BiBot className="text-lg group-hover:rotate-12 transition-transform" />
            <span>Generate Tasks</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 animate-slide-up shrink-0" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-1 bg-pepper-50/80 dark:bg-pepper-800/50 p-1 rounded-xl border border-pepper-200 dark:border-pepper-700/50 backdrop-blur-sm">
          <button 
            onClick={() => setViewMode('Board')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'Board' ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-white hover:bg-pepper-100 dark:hover:bg-pepper-700/50'}`}
          >
            <FiLayout /> Board
          </button>
          <button 
            onClick={() => setViewMode('List')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'List' ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-white hover:bg-pepper-100 dark:hover:bg-pepper-700/50'}`}
          >
            <FiList /> List
          </button>
          <button 
            onClick={() => setViewMode('Timeline')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'Timeline' ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-white hover:bg-pepper-100 dark:hover:bg-pepper-700/50'}`}
          >
            <FiCalendar /> Timeline
          </button>
        </div>

        <div className="flex gap-3">
             <div className="relative group">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400 group-focus-within:text-pepper-600 dark:group-focus-within:text-pepper-200 transition-colors" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..." 
                    className="pl-10 pr-4 py-2 bg-pepper-50/80 dark:bg-pepper-800/50 border border-pepper-200 dark:border-pepper-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pepper-500/20 focus:border-pepper-400 dark:focus:border-pepper-500 text-pepper-800 dark:text-pepper-200 w-48 transition-all focus:w-64 placeholder-pepper-400 shadow-sm backdrop-blur-sm"
                />
            </div>
            
            <Tippy 
                content={<FilterPanel filters={filters} onChange={(u) => setFilters(prev => ({...prev, ...u}))} onClear={() => setFilters(INITIAL_FILTERS)} availableTags={availableTags} />}
                interactive={true}
                trigger="click"
                visible={isFilterOpen}
                onClickOutside={() => setIsFilterOpen(false)}
                placement="bottom-end"
                offset={[0, 10]}
                animation="scale"
                theme="clean"
                appendTo={() => document.body}
            >
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-4 py-2 bg-pepper-50/80 dark:bg-pepper-800/50 border border-pepper-200 dark:border-pepper-700 rounded-xl text-pepper-600 dark:text-pepper-300 hover:bg-pepper-100 dark:hover:bg-pepper-700 text-sm font-medium transition-colors shadow-sm backdrop-blur-sm ${activeFilterCount > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800' : ''}`}
                >
                    <FiFilter /> Filter
                    {activeFilterCount > 0 && (
                        <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                    )}
                </button>
            </Tippy>
        </div>
      </div>

      {/* View Content Area */}
      {viewMode === 'Board' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
            <div className="flex gap-6 h-full min-w-[1200px] px-1">
            {COLUMNS.map((column, colIndex) => (
                <div 
                    key={column.id} 
                    className="w-[300px] flex flex-col h-full rounded-2xl bg-pepper-50/60 dark:bg-pepper-800/30 border border-pepper-200/50 dark:border-pepper-800/50 p-3 animate-slide-up backdrop-blur-sm transition-colors"
                    style={{ animationDelay: `${colIndex * 0.1 + 0.2}s` }}
                    onDragOver={(e) => handleColumnDragOver(e, column.id)}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDragEnd();
                    }}
                >
                <div className="flex justify-between items-center mb-4 px-2 pt-1">
                    <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-pepper-700 dark:text-pepper-200 text-sm tracking-tight">
                        {column.title}
                    </h3>
                    <span className="bg-white/80 dark:bg-pepper-700/80 text-pepper-500 dark:text-pepper-300 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-pepper-100 dark:border-pepper-600 backdrop-blur-sm">
                        {filteredTasks.filter(t => t.status === column.id).length}
                    </span>
                    </div>
                    <button 
                      onClick={openCreateModal}
                      className="text-pepper-400 hover:text-pepper-700 dark:hover:text-pepper-200 p-1 hover:bg-white dark:hover:bg-pepper-700 rounded-lg transition-all"
                    >
                        <FiPlus />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-2 min-h-[100px]">
                    {filteredTasks.filter(t => t.status === column.id).map((task, index) => (
                    <TaskCard 
                        key={task.id}
                        task={task}
                        index={index}
                        advanceTask={advanceTask}
                        getPriorityColor={getPriorityColor}
                        onDragStart={handleDragStart}
                        onDragEnter={handleCardDragEnter}
                        isDragged={draggedTaskId === task.id}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                        onClone={handleCloneTask}
                        onEdit={handleOpenDetail}
                        onCopyLink={handleCopyLink}
                        isMenuOpen={activeMenuTaskId === task.id}
                        onToggleMenu={(id, rect) => handleToggleMenu(id, rect)}
                        onCardClick={handleOpenDetail}
                    />
                    ))}
                    
                    <button 
                      onClick={openCreateModal}
                      className="w-full py-2.5 border border-dashed border-pepper-300 dark:border-pepper-600 rounded-xl text-pepper-400 hover:text-pepper-700 dark:hover:text-pepper-200 hover:bg-pepper-50 dark:hover:bg-pepper-700/30 hover:border-pepper-400 dark:hover:border-pepper-500 text-xs font-semibold transition-all flex items-center justify-center gap-2 group/add opacity-60 hover:opacity-100"
                    >
                        <FiPlus className="group-hover/add:scale-110 transition-transform"/> Add New Task
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
      )}

      {viewMode === 'List' && renderListView()}
      
      {viewMode === 'Timeline' && renderTimelineView()}

      {/* Task Menu Portal Overlay */}
      {activeMenuTaskId && menuAnchorRect && (() => {
        const task = tasks.find(t => t.id === activeMenuTaskId);
        if (!task) return null;
        return (
            <TaskMenuOverlay anchorRect={menuAnchorRect} onClose={handleCloseMenu}>
                <TaskMenu 
                   task={task}
                   onUpdate={(updates) => { handleUpdateTask(task.id, updates); handleCloseMenu(); }}
                   onDelete={() => { handleDeleteTask(task.id); handleCloseMenu(); }}
                   onClone={() => { handleCloneTask(task.id); handleCloseMenu(); }}
                   onEdit={() => { handleOpenDetail(task); handleCloseMenu(); }}
                   onCopyLink={() => { handleCopyLink(task.id); handleCloseMenu(); }}
                   closeMenu={handleCloseMenu}
                />
            </TaskMenuOverlay>
        );
      })()}

      {/* Full Issue Details Modal */}
      {selectedTask && (
          <IssueDetailsModal 
              task={selectedTask}
              allTasks={tasks}
              onClose={() => setSelectedTask(null)}
              onSave={(updates) => handleUpdateTask(selectedTask.id, updates)}
              onDelete={() => handleDeleteTask(selectedTask.id)}
          />
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}>
            <div 
                className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden animate-slide-up relative z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                    <h3 className="font-bold text-lg">Create New Issue</h3>
                    <button onClick={() => setIsTaskModalOpen(false)}><FiX /></button>
                </div>
                <form onSubmit={handleCreateTask} className="p-6 space-y-4">
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
                            <label className="block text-xs font-bold uppercase mb-1">Status</label>
                            <select name="status" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Assignee</label>
                            <select name="assignee" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none">
                                <option value="Unassigned">Unassigned</option>
                                {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Tags</label>
                        <div className="relative">
                            <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                            <input 
                                name="tags" 
                                className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none" 
                                placeholder="e.g. Frontend, Refactor (comma separated)"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Create Issue</button>
                    </div>
                </form>
            </div>
      </Modal>

      {/* AI Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)}>
          <div 
            className="bg-white dark:bg-pepper-900 w-full max-w-xl rounded-2xl shadow-2xl border border-pepper-100 dark:border-pepper-800 overflow-hidden transform transition-all animate-slide-up relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-8">
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setIsAiModalOpen(false)} className="text-pepper-400 hover:text-pepper-800 dark:hover:text-pepper-100 transition-colors">
                        &times;
                    </button>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pepper-800 to-black dark:from-pepper-100 dark:to-pepper-300 flex items-center justify-center text-white dark:text-pepper-900 shadow-lg">
                        <BiBot className="text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-pepper-900 dark:text-pepper-50 font-display">AI Task Generator</h3>
                        <p className="text-sm text-pepper-500 dark:text-pepper-400">Describe your project needs and let Gemini organize it.</p>
                    </div>
                </div>
              
              <div className="mb-6">
                  <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase tracking-wider mb-2">Project Description</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Build a responsive landing page for a coffee shop with a menu gallery, location map, and contact form..."
                    className="w-full h-32 p-4 bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-800 rounded-xl resize-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-pepper-100 focus:outline-none transition-all text-pepper-800 dark:text-pepper-200 text-sm leading-relaxed"
                  />
              </div>

              <div className="flex justify-end gap-3">
                 <button 
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-5 py-2.5 text-pepper-600 dark:text-pepper-400 text-sm font-bold hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerateTasks}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className={`px-6 py-2.5 bg-pepper-900 dark:bg-pepper-100 text-white dark:text-pepper-900 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95 ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  >
                    {isGenerating ? <FiLoader className="animate-spin" /> : <FiZap />}
                    {isGenerating ? 'Processing...' : 'Generate Plan'}
                  </button>
              </div>
            </div>
            {isGenerating && (
                <div className="h-1 w-full bg-pepper-100 dark:bg-pepper-800 overflow-hidden">
                    <div className="h-full bg-pepper-900 dark:bg-pepper-100 animate-progress"></div>
                </div>
            )}
          </div>
      </Modal>
    </div>
  );
};