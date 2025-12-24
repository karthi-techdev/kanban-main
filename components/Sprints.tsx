import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiPlus, FiFilter, FiSearch, FiMoreHorizontal, FiCalendar, 
  FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiChevronDown, FiUser, FiArrowRight, FiEdit2, FiTrash2, FiCopy,
  FiMessageSquare, FiX, FiCheck, FiBarChart2, FiLayers, FiTarget,
  FiChevronUp, FiMaximize2, FiFlag, FiLink, FiAlignLeft, FiTag, FiActivity
} from 'react-icons/fi';
import { 
  TbLayoutBoard, TbListDetails, TbBolt, 
  TbChartLine, TbDotsVertical, TbLayoutKanban, TbTimeline
} from 'react-icons/tb';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import Tippy from '@tippyjs/react';
import { Modal } from './Modal';
import { Priority, TaskStatus } from '../types';

// --- TYPES ---

type SprintStatus = 'Active' | 'Upcoming' | 'Completed';
type StoryType = 'Bug' | 'Feature' | 'Chore';

interface Sprint {
  id: string;
  name: string;
  project: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  goal: string;
  capacity: number;
}

interface Story {
  id: string;
  sprintId: string;
  title: string;
  key: string;
  type: StoryType;
  priority: Priority;
  points: number;
  status: TaskStatus;
  assignee: string; // ID
  comments: Comment[];
  tags?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface Member {
    id: string;
    name: string;
    avatar: string;
}

// --- MOCK DATA ---

const MEMBERS: Member[] = [
  { id: 'AM', name: 'Alex Morgan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'JD', name: 'Jordan Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
  { id: 'TS', name: 'Taylor Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
  { id: 'DK', name: 'Dakota Key', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dakota' },
  { id: 'RK', name: 'Riley K', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley' },
  { id: 'EL', name: 'Elliot L', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elliot' },
];

const MOCK_SPRINTS: Sprint[] = [
  { id: 's1', name: 'Sprint 7', project: 'HRMS', status: 'Active', startDate: '2023-10-24', endDate: '2023-11-07', goal: 'Complete authentication flow and user profile setup.', capacity: 40 },
  { id: 's4', name: 'Sprint 4', project: 'Platform', status: 'Active', startDate: '2023-10-25', endDate: '2023-11-08', goal: 'Infrastructure scaling and security audit.', capacity: 50 },
  { id: 's2', name: 'Sprint 8', project: 'HRMS', status: 'Upcoming', startDate: '2023-11-08', endDate: '2023-11-22', goal: 'Employee dashboard widgets and attendance tracking.', capacity: 45 },
  { id: 's3', name: 'Sprint 6', project: 'CRM', status: 'Completed', startDate: '2023-10-10', endDate: '2023-10-23', goal: 'Lead management table optimization.', capacity: 35 },
];

const INITIAL_STORIES: Story[] = [
  { id: 't1', sprintId: 's1', title: 'Implement OAuth2 Login', key: 'HRMS-101', type: 'Feature', priority: Priority.HIGH, points: 5, status: TaskStatus.IN_PROGRESS, assignee: 'AM', comments: [], tags: ['Auth', 'Security'], createdAt: new Date().toISOString() },
  { id: 't2', sprintId: 's1', title: 'Fix Session Timeout', key: 'HRMS-104', type: 'Bug', priority: Priority.CRITICAL, points: 3, status: TaskStatus.TODO, assignee: 'JD', comments: [], tags: ['Backend'], createdAt: new Date().toISOString() },
  { id: 't3', sprintId: 's1', title: 'User Profile Schema', key: 'HRMS-110', type: 'Chore', priority: Priority.MEDIUM, points: 2, status: TaskStatus.DONE, assignee: 'TS', comments: [], tags: ['DB'], createdAt: new Date().toISOString() },
  { id: 't4', sprintId: 's1', title: 'Reset Password UI', key: 'HRMS-112', type: 'Feature', priority: Priority.LOW, points: 3, status: TaskStatus.REVIEW, assignee: 'AM', comments: [], tags: ['Frontend'], createdAt: new Date().toISOString() },
  { id: 't5', sprintId: 's2', title: 'Dashboard Widget API', key: 'HRMS-201', type: 'Feature', priority: Priority.HIGH, points: 8, status: TaskStatus.TODO, assignee: 'Unassigned', comments: [], tags: ['API'], createdAt: new Date().toISOString() },
  { id: 't6', sprintId: 's4', title: 'Update Docker Images', key: 'PLT-505', type: 'Chore', priority: Priority.MEDIUM, points: 1, status: TaskStatus.IN_PROGRESS, assignee: 'DK', comments: [], tags: ['DevOps'], createdAt: new Date().toISOString() },
];

// --- HELPERS ---

const getStatusColor = (status: SprintStatus) => {
  switch (status) {
    case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'Upcoming': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'Completed': return 'bg-pepper-100 text-pepper-700 border-pepper-200 dark:bg-pepper-800 dark:text-pepper-400 dark:border-pepper-700';
  }
};

const getPriorityColor = (p: Priority) => {
  switch (p) {
    case Priority.CRITICAL: return 'text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30';
    case Priority.HIGH: return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30';
    case Priority.MEDIUM: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30';
    default: return 'text-pepper-500 bg-pepper-100 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700';
  }
};

// --- SUB-COMPONENTS ---

// Portal for Menu
const TaskMenuOverlay = ({ anchorRect, onClose, children }: { anchorRect: DOMRect, onClose: () => void, children: React.ReactNode }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', opacity: 0, pointerEvents: 'none' });

    useEffect(() => {
        if (!anchorRect || !menuRef.current) return;
        const menuRect = menuRef.current.getBoundingClientRect();
        
        let top = anchorRect.bottom + 4;
        let left = anchorRect.left; 

        // Adjust boundaries
        if (left + menuRect.width > window.innerWidth) left = window.innerWidth - menuRect.width - 10;
        if (top + menuRect.height > window.innerHeight) top = anchorRect.top - menuRect.height - 4;

        setStyle({ position: 'fixed', top, left, zIndex: 100, opacity: 1, pointerEvents: 'auto' });
    }, [anchorRect]);

    useEffect(() => {
        const handler = (e: MouseEvent | KeyboardEvent) => {
             if (e instanceof KeyboardEvent && e.key === 'Escape') onClose();
             if (e instanceof MouseEvent && menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        window.addEventListener('mousedown', handler);
        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('mousedown', handler);
            window.removeEventListener('keydown', handler);
        };
    }, [onClose]);

    return createPortal(<div ref={menuRef} style={style} className="transition-opacity duration-200">{children}</div>, document.body);
};

const StoryCard = ({ 
    story, 
    isDragged, 
    onDragStart, 
    onDragEnter,
    onMenuOpen,
    isMenuOpen,
    onClick
}: { 
    story: Story, 
    isDragged: boolean, 
    onDragStart: (e: React.DragEvent, id: string) => void,
    onDragEnter: (id: string, status: TaskStatus) => void,
    onMenuOpen: (id: string, rect: DOMRect) => void,
    isMenuOpen: boolean,
    onClick: (story: Story) => void
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const assignee = MEMBERS.find(m => m.id === story.assignee);

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, story.id)}
            onDragEnter={() => onDragEnter(story.id, story.status)}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => onClick(story)}
            className={`
                bg-white/90 dark:bg-pepper-800/80 backdrop-blur-sm p-4 rounded-xl border transition-all duration-200 ease-in-out cursor-grab active:cursor-grabbing group relative
                ${isDragged 
                    ? 'opacity-40 scale-95 border-dashed border-pepper-400 dark:border-pepper-500 shadow-none' 
                    : 'border-pepper-200 dark:border-pepper-800 shadow-sm hover:shadow-lg hover:shadow-pepper-200/50 dark:hover:shadow-black/30 hover:border-pepper-300 dark:hover:border-pepper-600'
                }
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-pepper-400 bg-pepper-50 dark:bg-pepper-900/50 px-1.5 py-0.5 rounded">{story.key}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getPriorityColor(story.priority)}`}>{story.priority}</span>
                </div>
                <button 
                    ref={buttonRef}
                    onClick={(e) => { e.stopPropagation(); buttonRef.current && onMenuOpen(story.id, buttonRef.current.getBoundingClientRect()); }}
                    className={`p-1 rounded hover:bg-pepper-100 dark:hover:bg-pepper-700 text-pepper-400 hover:text-pepper-700 dark:hover:text-white transition-opacity ${isMenuOpen ? 'opacity-100 bg-pepper-100 dark:bg-pepper-700' : 'opacity-0 group-hover:opacity-100'}`}
                >
                    <FiMoreHorizontal />
                </button>
            </div>

            {/* Title */}
            <p className="text-sm font-bold text-pepper-900 dark:text-white leading-snug mb-3">{story.title}</p>

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {story.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-pepper-100 dark:bg-pepper-700 text-pepper-500 dark:text-pepper-400 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-pepper-50 dark:border-pepper-700/50">
                <div className="flex items-center gap-2">
                    {assignee ? (
                        <Tippy content={assignee.name}>
                            <img src={assignee.avatar} className="w-6 h-6 rounded-full border border-pepper-100 dark:border-pepper-700 shadow-sm" alt={assignee.name} />
                        </Tippy>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-pepper-100 dark:bg-pepper-700 flex items-center justify-center text-[10px] text-pepper-500 border border-pepper-200 dark:border-pepper-600"><FiUser /></div>
                    )}
                    {story.comments.length > 0 && (
                        <span className="text-[10px] text-pepper-400 flex items-center gap-1 hover:text-pepper-600 transition-colors"><FiMessageSquare className="text-[10px]" /> {story.comments.length}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-pepper-100 dark:bg-pepper-700/50 text-pepper-600 dark:text-pepper-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold shadow-sm">{story.points} pts</span>
                </div>
            </div>
        </div>
    );
};

// --- STORY DETAILS MODAL ---

const StoryDetailsModal = ({ 
    story, 
    onClose, 
    onSave,
    sprintName
}: { 
    story: Story, 
    onClose: () => void, 
    onSave: (updatedStory: Story) => void,
    sprintName?: string
}) => {
    const [editData, setEditData] = useState({
        title: story.title,
        description: story.description || '',
        status: story.status,
        type: story.type,
        priority: story.priority,
        assignee: story.assignee,
        points: story.points,
        tags: (story.tags || []).join(', '),
        comment: ''
    });

    const [comments, setComments] = useState<Comment[]>(story.comments || []);

    const handleSave = () => {
        if (!editData.title.trim()) return; // Simple validation

        const updatedTags = editData.tags.split(',').map(t => t.trim()).filter(Boolean);

        const updatedStory: Story = {
            ...story,
            title: editData.title,
            description: editData.description,
            status: editData.status,
            type: editData.type,
            priority: editData.priority,
            assignee: editData.assignee,
            points: Math.max(0, editData.points),
            tags: updatedTags,
            comments: comments,
            updatedAt: new Date().toISOString()
        };

        onSave(updatedStory);
    };

    const handleAddComment = () => {
        if (!editData.comment.trim()) return;
        const newComment: Comment = {
            id: `c${Date.now()}`,
            text: editData.comment,
            author: 'You',
            createdAt: new Date().toISOString()
        };
        setComments(prev => [...prev, newComment]);
        setEditData(prev => ({ ...prev, comment: '' }));
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="bg-white dark:bg-pepper-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-start bg-pepper-50 dark:bg-pepper-950">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono font-bold text-pepper-500 bg-pepper-100 dark:bg-pepper-800 px-1.5 py-0.5 rounded">{story.key}</span>
                            {sprintName && <span className="text-[10px] text-pepper-400 font-medium">in {sprintName}</span>}
                        </div>
                        <input 
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                            className="text-lg font-bold text-pepper-900 dark:text-white bg-transparent border-none outline-none w-full placeholder-pepper-300"
                            placeholder="Story Title"
                        />
                    </div>
                    <button onClick={onClose} className="text-pepper-400 hover:text-pepper-800 dark:hover:text-white p-1 rounded hover:bg-pepper-100 dark:hover:bg-pepper-800 transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Primary Properties Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Status</label>
                            <select 
                                value={editData.status}
                                onChange={(e) => setEditData({...editData, status: e.target.value as TaskStatus})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs font-medium text-pepper-700 dark:text-pepper-200 outline-none focus:ring-1 focus:ring-pepper-400"
                            >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Priority</label>
                            <select 
                                value={editData.priority}
                                onChange={(e) => setEditData({...editData, priority: e.target.value as Priority})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs font-medium text-pepper-700 dark:text-pepper-200 outline-none focus:ring-1 focus:ring-pepper-400"
                            >
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Type</label>
                            <select 
                                value={editData.type}
                                onChange={(e) => setEditData({...editData, type: e.target.value as StoryType})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs font-medium text-pepper-700 dark:text-pepper-200 outline-none focus:ring-1 focus:ring-pepper-400"
                            >
                                <option value="Feature">Feature</option>
                                <option value="Bug">Bug</option>
                                <option value="Chore">Chore</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Points</label>
                            <input 
                                type="number"
                                min="0"
                                value={editData.points}
                                onChange={(e) => setEditData({...editData, points: parseInt(e.target.value)})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs font-medium text-pepper-700 dark:text-pepper-200 outline-none focus:ring-1 focus:ring-pepper-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Assignee</label>
                            <div className="relative">
                                <select 
                                    value={editData.assignee} 
                                    onChange={e => setEditData({...editData, assignee: e.target.value})}
                                    className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium outline-none appearance-none"
                                >
                                    <option value="Unassigned">Unassigned</option>
                                    {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {editData.assignee === 'Unassigned' ? <FiUser className="text-pepper-400 w-3.5 h-3.5" /> : <img src={MEMBERS.find(m => m.id === editData.assignee)?.avatar} className="w-4 h-4 rounded-full" alt="" />}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-1">Tags</label>
                            <div className="relative">
                                <FiTag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pepper-400 w-3.5 h-3.5" />
                                <input 
                                    value={editData.tags}
                                    onChange={(e) => setEditData({...editData, tags: e.target.value})}
                                    className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-pepper-700 dark:text-pepper-200 outline-none focus:ring-1 focus:ring-pepper-400"
                                    placeholder="Comma separated tags"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-2">Description</label>
                        <textarea 
                            value={editData.description}
                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                            className="w-full h-32 bg-pepper-50 dark:bg-pepper-800/50 border border-pepper-200 dark:border-pepper-700 rounded-xl p-3 text-sm leading-relaxed focus:ring-2 focus:ring-pepper-500/20 outline-none resize-none placeholder-pepper-400"
                            placeholder="Add a detailed description..."
                        />
                    </div>

                    {/* Meta Info */}
                    <div className="flex gap-4 text-[10px] text-pepper-400 border-t border-pepper-100 dark:border-pepper-800 pt-4">
                        <span className="flex items-center gap-1"><FiClock /> Created: {new Date(story.createdAt || Date.now()).toLocaleDateString()}</span>
                        {story.updatedAt && <span className="flex items-center gap-1"><FiActivity /> Updated: {new Date(story.updatedAt).toLocaleDateString()}</span>}
                    </div>

                    {/* Comments */}
                    <div className="bg-pepper-50 dark:bg-pepper-800/30 rounded-xl p-4 border border-pepper-100 dark:border-pepper-800">
                        <h4 className="text-xs font-bold text-pepper-500 uppercase mb-3 flex items-center gap-2"><FiMessageSquare /> Comments</h4>
                        
                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                            {comments.length === 0 && <p className="text-xs text-pepper-400 italic">No comments yet.</p>}
                            {comments.map(c => (
                                <div key={c.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">{c.author[0]}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs font-bold text-pepper-800 dark:text-pepper-200">{c.author}</span>
                                            <span className="text-[10px] text-pepper-400">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-pepper-600 dark:text-pepper-300">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input 
                                value={editData.comment}
                                onChange={(e) => setEditData({...editData, comment: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                className="flex-1 bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                placeholder="Write a comment..."
                            />
                            <button onClick={handleAddComment} disabled={!editData.comment.trim()} className="px-3 py-1.5 bg-pepper-200 dark:bg-pepper-700 text-pepper-700 dark:text-pepper-200 text-xs font-bold rounded-lg hover:bg-pepper-300 dark:hover:bg-pepper-600 disabled:opacity-50 transition-colors">Post</button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-pepper-100 dark:border-pepper-800 bg-white dark:bg-pepper-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};

// --- EDIT STORY MODAL ---

const EditStoryModal = ({ story, onClose, onSave }: { story: Story, onClose: () => void, onSave: (updatedStory: Story) => void }) => {
    const [formData, setFormData] = useState({
        title: story.title,
        type: story.type,
        priority: story.priority,
        status: story.status,
        points: story.points,
        assignee: story.assignee,
        tags: (story.tags || []).join(', '),
        description: story.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        const updatedTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

        const updatedStory: Story = {
            ...story,
            title: formData.title,
            type: formData.type,
            priority: formData.priority,
            status: formData.status,
            points: Number(formData.points),
            assignee: formData.assignee,
            tags: updatedTags,
            description: formData.description,
            updatedAt: new Date().toISOString()
        };

        onSave(updatedStory);
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden animate-slide-up relative z-50" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-pepper-900 dark:text-white">Edit Story</h3>
                        <span className="text-xs font-mono font-bold text-pepper-500 bg-pepper-100 dark:bg-pepper-800 px-2 py-0.5 rounded">{story.key}</span>
                    </div>
                    <button onClick={onClose}><FiX className="text-pepper-500 hover:text-pepper-800 dark:hover:text-white" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Title <span className="text-red-500">*</span></label>
                        <input 
                            name="title" 
                            required 
                            autoFocus
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white" 
                        />
                    </div>

                    {/* Row 1: Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Status</label>
                            <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Priority</label>
                            <div className="flex bg-pepper-50 dark:bg-pepper-800 p-1 rounded-lg border border-pepper-200 dark:border-pepper-700">
                                {Object.values(Priority).map(p => (
                                    <button 
                                        key={p} 
                                        type="button"
                                        onClick={() => setFormData({...formData, priority: p})}
                                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${formData.priority === p ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-400 hover:text-pepper-600 dark:hover:text-pepper-300'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Type & Points */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Type</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value as StoryType})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="Feature">Feature</option>
                                <option value="Bug">Bug</option>
                                <option value="Chore">Chore</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Story Points</label>
                            <input 
                                type="number" 
                                min="0" 
                                value={formData.points} 
                                onChange={e => setFormData({...formData, points: parseInt(e.target.value)})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" 
                            />
                        </div>
                    </div>

                    {/* Row 3: Assignee & Tags */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Assignee</label>
                            <div className="relative">
                                <select 
                                    value={formData.assignee} 
                                    onChange={e => setFormData({...formData, assignee: e.target.value})}
                                    className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none appearance-none"
                                >
                                    <option value="Unassigned">Unassigned</option>
                                    {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {formData.assignee === 'Unassigned' ? <FiUser className="text-pepper-400" /> : <img src={MEMBERS.find(m => m.id === formData.assignee)?.avatar} className="w-5 h-5 rounded-full" alt="" />}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Tags</label>
                            <div className="relative">
                                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                                <input 
                                    value={formData.tags}
                                    onChange={e => setFormData({...formData, tags: e.target.value})}
                                    placeholder="e.g. Frontend, Auth"
                                    className="w-full pl-9 bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Description</label>
                        <textarea 
                            rows={3} 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none resize-none" 
                            placeholder="Add details..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={!formData.title.trim()}
                            className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- ADD STORY MODAL ---

const AddStoryModal = ({ 
    sprintId, 
    initialStatus, 
    onClose, 
    onCreate,
    sprintProject
}: { 
    sprintId: string, 
    initialStatus: TaskStatus, 
    onClose: () => void, 
    onCreate: (data: any) => void,
    sprintProject: string
}) => {
    // Generate a mock key for display
    const nextKey = useMemo(() => `${sprintProject}-${Math.floor(Math.random() * 1000) + 1000}`, [sprintProject]);
    
    const [formData, setFormData] = useState({
        title: '',
        type: 'Feature' as StoryType,
        priority: Priority.MEDIUM,
        points: 1,
        assignee: 'Unassigned',
        tags: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        onCreate({
            sprintId,
            status: initialStatus,
            title: formData.title,
            type: formData.type,
            priority: formData.priority,
            points: Number(formData.points),
            assigneeId: formData.assignee,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            description: formData.description
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden animate-slide-up relative z-50" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-pepper-900 dark:text-white">Add Story</h3>
                        <span className="text-xs font-mono font-bold text-pepper-500 bg-pepper-100 dark:bg-pepper-800 px-2 py-0.5 rounded">{nextKey}</span>
                    </div>
                    <button onClick={onClose}><FiX className="text-pepper-500 hover:text-pepper-800 dark:hover:text-white" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Title <span className="text-red-500">*</span></label>
                        <input 
                            name="title" 
                            required 
                            autoFocus
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white" 
                            placeholder="What needs to be done?"
                        />
                    </div>

                    {/* Row 1: Priority & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Priority</label>
                            <div className="flex bg-pepper-50 dark:bg-pepper-800 p-1 rounded-lg border border-pepper-200 dark:border-pepper-700">
                                {Object.values(Priority).map(p => (
                                    <button 
                                        key={p} 
                                        type="button"
                                        onClick={() => setFormData({...formData, priority: p})}
                                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${formData.priority === p ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-400 hover:text-pepper-600 dark:hover:text-pepper-300'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Type</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value as StoryType})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="Feature">Feature</option>
                                <option value="Bug">Bug</option>
                                <option value="Chore">Chore</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Points & Assignee */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Story Points</label>
                            <input 
                                type="number" 
                                min="0" 
                                value={formData.points} 
                                onChange={e => setFormData({...formData, points: parseInt(e.target.value)})}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Assignee</label>
                            <div className="relative">
                                <select 
                                    value={formData.assignee} 
                                    onChange={e => setFormData({...formData, assignee: e.target.value})}
                                    className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none appearance-none"
                                >
                                    <option value="Unassigned">Unassigned</option>
                                    {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {formData.assignee === 'Unassigned' ? <FiUser className="text-pepper-400" /> : <img src={MEMBERS.find(m => m.id === formData.assignee)?.avatar} className="w-5 h-5 rounded-full" alt="" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Tags</label>
                        <div className="relative">
                            <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                            <input 
                                value={formData.tags}
                                onChange={e => setFormData({...formData, tags: e.target.value})}
                                placeholder="e.g. Frontend, Auth (comma separated)"
                                className="w-full pl-9 bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" 
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Description</label>
                        <textarea 
                            rows={3} 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none resize-none" 
                            placeholder="Add details..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={!formData.title.trim()}
                            className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Story
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- MAIN COMPONENT ---

export const Sprints: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');
  const [sprints, setSprints] = useState<Sprint[]>(MOCK_SPRINTS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(MOCK_SPRINTS[0].id);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  // Drag & Drop State
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);

  // Add Story Modal State
  const [addStoryModal, setAddStoryModal] = useState<{
      open: boolean;
      sprintId: string | null;
      status: TaskStatus | null;
  }>({ open: false, sprintId: null, status: null });

  // Story Details Modal State
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  // Edit Story Modal State
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Derived Data
  const filteredSprints = useMemo(() => {
    return sprints.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sprints, searchQuery]);

  const sprintsByStatus = useMemo(() => {
      return {
          Active: filteredSprints.filter(s => s.status === 'Active'),
          Upcoming: filteredSprints.filter(s => s.status === 'Upcoming'),
          Completed: filteredSprints.filter(s => s.status === 'Completed'),
      };
  }, [filteredSprints]);

  const selectedSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];
  const sprintStories = stories.filter(st => st.sprintId === selectedSprint.id);

  // Stats
  const selectedSprintPoints = sprintStories.reduce((acc, curr) => acc + curr.points, 0);
  const selectedSprintCompletedPoints = sprintStories.filter(s => s.status === TaskStatus.DONE).reduce((acc, curr) => acc + curr.points, 0);
  const progress = selectedSprintPoints ? Math.round((selectedSprintCompletedPoints / selectedSprintPoints) * 100) : 0;

  // --- DRAG HANDLERS (STACKABLE) ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedStoryId(id);
    setActiveMenuId(null); // Close any open menu
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      if (!draggedStoryId) return;

      const itemsInCol = sprintStories.filter(s => s.status === status);
      
      // If column is empty or we are dragging over the column container itself (not a card)
      // we append to that status if not already there.
      if (itemsInCol.length === 0) {
          setStories(prev => {
              const list = [...prev];
              const idx = list.findIndex(s => s.id === draggedStoryId);
              if (idx > -1 && list[idx].status !== status) {
                  list[idx] = { ...list[idx], status };
                  return list;
              }
              return prev;
          });
      }
  };

  const handleCardDragEnter = (targetId: string, status: TaskStatus) => {
      if (!draggedStoryId || draggedStoryId === targetId) return;

      setStories(prev => {
          const list = [...prev];
          const dragIndex = list.findIndex(s => s.id === draggedStoryId);
          const hoverIndex = list.findIndex(s => s.id === targetId);

          if (dragIndex < 0 || hoverIndex < 0) return prev;

          const dragStory = list[dragIndex];
          
          // Update status if we moved across columns
          if (dragStory.status !== status) {
              dragStory.status = status;
          }

          // Move the item in the array to create the "stackable" reorder effect
          list.splice(dragIndex, 1);
          list.splice(hoverIndex, 0, dragStory);
          
          return list;
      });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedStoryId(null);
  };

  // --- OTHER ACTIONS ---

  const handleDeleteSprint = (id: string) => {
    if (window.confirm("Are you sure you want to delete this sprint?")) {
      setSprints(prev => prev.filter(s => s.id !== id));
      if (selectedSprintId === id) setSelectedSprintId(sprints[0].id);
    }
  };

  const handleSaveSprint = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    const newSprint: Sprint = {
      id: modalMode === 'create' ? `s${Date.now()}` : editingSprint!.id,
      name: data.get('name') as string,
      project: data.get('project') as string,
      status: data.get('status') as SprintStatus,
      startDate: data.get('startDate') as string,
      endDate: data.get('endDate') as string,
      goal: data.get('goal') as string,
      capacity: Number(data.get('capacity'))
    };

    if (modalMode === 'create') {
      setSprints(prev => [...prev, newSprint]);
      setSelectedSprintId(newSprint.id);
    } else {
      setSprints(prev => prev.map(s => s.id === newSprint.id ? newSprint : s));
    }
    setIsModalOpen(false);
  };

  const updateStory = (id: string, updates: Partial<Story>) => {
      setStories(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveStoryDetails = (updatedStory: Story) => {
      setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
      setSelectedStoryId(null);
  };

  // --- COMPOSER ACTIONS ---

  const handleCreateStory = (data: {
      sprintId: string;
      status: TaskStatus;
      title: string;
      type: StoryType;
      priority: Priority;
      tags: string[];
      assigneeId: string;
      points: number;
      description?: string;
  }) => {
      const sprint = sprints.find(s => s.id === data.sprintId);
      if (!sprint) return;

      const nextIndex = Math.floor(Math.random() * 1000) + 1000; // Mock increment
      const keyPrefix = sprint.project || "FLX";

      const newStory: Story = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          sprintId: data.sprintId,
          key: `${keyPrefix}-${nextIndex}`,
          title: data.title,
          description: data.description,
          status: data.status,
          type: data.type,
          priority: data.priority,
          tags: data.tags,
          assignee: data.assigneeId,
          points: data.points || 1,
          createdAt: new Date().toISOString(),
          comments: []
      };

      setStories(prev => [...prev, newStory]);
      setAddStoryModal({ open: false, sprintId: null, status: null });
  };

  const handleMenuOpen = (id: string, rect: DOMRect) => {
      setActiveMenuId(id);
      setMenuAnchor(rect);
  };

  // Mock Burndown Data Generator
  const burnDownData = useMemo(() => {
    if (!selectedSprint) return [];
    const total = selectedSprintPoints || selectedSprint.capacity;
    const days = 14; 
    const data = [];
    let remaining = total;
    for (let i = 0; i <= days; i++) {
      const ideal = total - (total / days) * i;
      if (i > 0 && Math.random() > 0.6) remaining = Math.max(0, remaining - Math.random() * 5);
      data.push({
        day: `D${i}`,
        Ideal: Math.round(ideal),
        Actual: i > 7 ? null : Math.round(remaining)
      });
    }
    return data;
  }, [selectedSprint, selectedSprintPoints]);

  const selectedStory = stories.find(s => s.id === selectedStoryId);

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* --- GLOBAL HEADER --- */}
      <div className="h-16 px-6 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-pepper-900 dark:text-white">Sprints</h1>
            <div className="h-6 w-px bg-pepper-200 dark:bg-pepper-800"></div>
            <div className="flex bg-pepper-100 dark:bg-pepper-800 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveView('board')} 
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'board' ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-700 dark:hover:text-pepper-300'}`}
                >
                    <TbLayoutBoard /> Board
                </button>
                <button 
                    onClick={() => setActiveView('list')} 
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeView === 'list' ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-700 dark:hover:text-pepper-300'}`}
                >
                    <TbListDetails /> List
                </button>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter sprints..." 
                    className="pl-9 pr-4 py-2 bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-xl text-sm focus:ring-2 focus:ring-pepper-900/20 outline-none w-48 transition-all focus:w-64"
                />
            </div>
            <button 
                onClick={() => { setModalMode('create'); setEditingSprint(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
            >
                <FiPlus /> Create Sprint
            </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeView === 'board' ? (
          <>
             {/* LEFT SIDEBAR: SPRINT NAVIGATOR */}
             <div className="w-72 bg-white dark:bg-pepper-900 border-r border-pepper-200 dark:border-pepper-800 flex flex-col overflow-hidden shrink-0 z-10">
                <div className="p-4 border-b border-pepper-100 dark:border-pepper-800">
                   <h3 className="text-xs font-bold text-pepper-400 uppercase tracking-wider">Sprint Navigator</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
                   {Object.entries(sprintsByStatus).map(([status, groupSprints]) => (
                       groupSprints.length > 0 && (
                           <div key={status}>
                               <div className="flex items-center gap-2 mb-2 px-2">
                                   <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Upcoming' ? 'bg-blue-500' : 'bg-pepper-400'}`}></span>
                                   <h4 className="text-xs font-bold text-pepper-600 dark:text-pepper-300">{status}</h4>
                                   <span className="text-[10px] bg-pepper-100 dark:bg-pepper-800 px-1.5 rounded-full text-pepper-500">{groupSprints.length}</span>
                               </div>
                               <div className="space-y-1">
                                   {groupSprints.map(s => (
                                       <button
                                           key={s.id}
                                           onClick={() => setSelectedSprintId(s.id)}
                                           className={`w-full text-left p-3 rounded-xl border transition-all relative group/item ${selectedSprintId === s.id ? 'bg-pepper-50 dark:bg-pepper-800 border-pepper-200 dark:border-pepper-700 shadow-sm ring-1 ring-pepper-200 dark:ring-pepper-700' : 'bg-transparent border-transparent hover:bg-pepper-50 dark:hover:bg-pepper-800/50'}`}
                                       >
                                           <div className="flex justify-between items-start mb-1 pr-6">
                                               <span className={`font-bold text-sm truncate ${selectedSprintId === s.id ? 'text-pepper-900 dark:text-white' : 'text-pepper-600 dark:text-pepper-400'}`}>{s.name}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-[10px] text-pepper-400">
                                               <span>{s.project}</span>
                                               <span>{new Date(s.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                           </div>
                                           
                                           {/* Edit Button - Fixed Alignment */}
                                           <div 
                                               onClick={(e) => { e.stopPropagation(); setEditingSprint(s); setModalMode('edit'); setIsModalOpen(true); }}
                                               className={`
                                                   absolute top-2 right-2 p-1.5 rounded-lg 
                                                   bg-white dark:bg-pepper-700 border border-pepper-200 dark:border-pepper-600 shadow-sm 
                                                   text-pepper-400 hover:text-blue-600 dark:hover:text-blue-400
                                                   transition-all z-10 cursor-pointer
                                                   ${selectedSprintId === s.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}
                                               `}
                                               title="Edit Sprint"
                                           >
                                               <FiEdit2 size={12} />
                                           </div>
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )
                   ))}
                </div>
             </div>

             {/* MAIN STAGE: BOARD */}
             <div className="flex-1 flex flex-col min-w-0 bg-pepper-50/50 dark:bg-pepper-950/50 overflow-hidden relative">
                
                {/* STAGE HEADER */}
                <div className="bg-white dark:bg-pepper-900 border-b border-pepper-200 dark:border-pepper-800 shrink-0">
                    <div className="px-6 py-4 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-pepper-900 dark:text-white">{selectedSprint.name}</h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusColor(selectedSprint.status)}`}>{selectedSprint.status}</span>
                            </div>
                            <p className="text-sm text-pepper-500 dark:text-pepper-400 max-w-2xl flex items-center gap-2">
                                <FiTarget /> {selectedSprint.goal}
                            </p>
                        </div>
                        <div className="flex gap-3">
                             <div className="text-right hidden md:block">
                                 <div className="text-xs text-pepper-400 font-bold uppercase mb-1">Timeline</div>
                                 <div className="text-sm font-bold text-pepper-900 dark:text-white font-mono bg-pepper-50 dark:bg-pepper-800 px-2 py-1 rounded-lg border border-pepper-100 dark:border-pepper-700">
                                     {new Date(selectedSprint.startDate).toLocaleDateString()} — {new Date(selectedSprint.endDate).toLocaleDateString()}
                                 </div>
                             </div>
                             <button 
                                onClick={() => setShowAnalytics(!showAnalytics)} 
                                className={`p-2 rounded-xl border transition-all ${showAnalytics ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-pepper-200 text-pepper-500 hover:text-pepper-900 dark:bg-pepper-800 dark:border-pepper-700 dark:text-pepper-400'}`}
                                title="Toggle Analytics"
                             >
                                 <FiBarChart2 className="text-xl" />
                             </button>
                        </div>
                    </div>

                    {/* COLLAPSIBLE ANALYTICS SECTION */}
                    {showAnalytics && (
                        <div className="px-6 pb-6 pt-2 animate-slide-up border-t border-pepper-50 dark:border-pepper-800">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-pepper-500 uppercase mb-1">
                                            <span>Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-pepper-100 dark:bg-pepper-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-pepper-50 dark:bg-pepper-800/50 p-3 rounded-xl border border-pepper-100 dark:border-pepper-800">
                                            <div className="text-2xl font-black text-pepper-900 dark:text-white">{selectedSprintPoints}</div>
                                            <div className="text-[10px] font-bold text-pepper-400 uppercase">Total Points</div>
                                        </div>
                                        <div className="flex-1 bg-pepper-50 dark:bg-pepper-800/50 p-3 rounded-xl border border-pepper-100 dark:border-pepper-800">
                                            <div className="text-2xl font-black text-emerald-500">{selectedSprintCompletedPoints}</div>
                                            <div className="text-[10px] font-bold text-pepper-400 uppercase">Completed</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2 h-32 w-full bg-pepper-50 dark:bg-pepper-800/30 rounded-xl border border-pepper-100 dark:border-pepper-800 p-2 relative">
                                    <div className="absolute top-2 left-3 text-[10px] font-bold text-pepper-400 uppercase z-10">Burndown Chart</div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={burnDownData}>
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Tooltip contentStyle={{backgroundColor: '#1F2937', border:'none', borderRadius: '8px', color: '#fff', fontSize: '10px'}} />
                                            <Line type="monotone" dataKey="Ideal" stroke="#9CA3AF" strokeDasharray="3 3" dot={false} strokeWidth={2} />
                                            <Area type="monotone" dataKey="Actual" stroke="#3B82F6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOARD COLUMNS */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                   <div className="flex h-full gap-6 min-w-[1000px]">
                      {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE].map(status => {
                         const colStories = sprintStories.filter(s => s.status === status);
                         return (
                            <div 
                              key={status} 
                              className="flex-1 flex flex-col h-full rounded-2xl bg-pepper-100/50 dark:bg-pepper-800/30 border border-pepper-200/50 dark:border-pepper-800/50 backdrop-blur-sm transition-colors duration-200"
                              onDragOver={(e) => handleColumnDragOver(e, status)}
                              onDrop={(e) => handleDrop(e)}
                            >
                               <div className="p-4 flex justify-between items-center border-b border-pepper-200/50 dark:border-pepper-800/50">
                                  <div className="flex items-center gap-2">
                                     <span className={`w-2.5 h-2.5 rounded-full ${status === 'done' ? 'bg-emerald-500' : status === 'in-progress' ? 'bg-blue-500' : 'bg-pepper-400'}`}></span>
                                     <h3 className="font-bold text-xs text-pepper-700 dark:text-pepper-200 uppercase tracking-wider">{status.replace('-', ' ')}</h3>
                                  </div>
                                  <span className="bg-white dark:bg-pepper-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-pepper-100 dark:border-pepper-700 text-pepper-500">{colStories.length}</span>
                               </div>
                               
                               <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                  {colStories.map(story => (
                                     <StoryCard
                                        key={story.id}
                                        story={story}
                                        isDragged={draggedStoryId === story.id}
                                        onDragStart={handleDragStart}
                                        onDragEnter={handleCardDragEnter}
                                        onMenuOpen={handleMenuOpen}
                                        isMenuOpen={activeMenuId === story.id}
                                        onClick={(s) => setSelectedStoryId(s.id)}
                                     />
                                  ))}
                                  
                                  <button 
                                      onClick={() => setAddStoryModal({ open: true, sprintId: selectedSprintId, status })}
                                      className="w-full py-3 text-xs font-bold text-pepper-400 hover:text-pepper-600 border border-dashed border-pepper-300 dark:border-pepper-700 rounded-xl hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors flex items-center justify-center gap-1 group"
                                  >
                                      <FiPlus className="group-hover:scale-110 transition-transform" /> Add Story
                                  </button>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
             </div>
          </>
        ) : (
          // --- LIST VIEW ---
          <div className="flex-1 bg-white dark:bg-pepper-900 m-6 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm overflow-hidden flex flex-col">
             <div className="grid grid-cols-12 gap-4 p-4 border-b border-pepper-200 dark:border-pepper-800 bg-pepper-50 dark:bg-pepper-950 text-xs font-bold text-pepper-500 uppercase tracking-wider">
                <div className="col-span-3">Sprint Name</div>
                <div className="col-span-2">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Dates</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-1 text-right">Actions</div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredSprints.map(sprint => {
                   const sStories = stories.filter(st => st.sprintId === sprint.id);
                   const total = sStories.reduce((a, b) => a + b.points, 0);
                   const done = sStories.filter(s => s.status === TaskStatus.DONE).reduce((a, b) => a + b.points, 0);
                   const sProgress = total ? Math.round((done / total) * 100) : 0;

                   return (
                      <div key={sprint.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-pepper-100 dark:border-pepper-800 hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors group">
                         <div className="col-span-3 font-bold text-sm text-pepper-900 dark:text-white flex items-center gap-2">
                            {sprint.name}
                            {sprint.id === selectedSprintId && <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 rounded">Current</span>}
                         </div>
                         <div className="col-span-2 text-sm text-pepper-600 dark:text-pepper-300">{sprint.project}</div>
                         <div className="col-span-2">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${getStatusColor(sprint.status)}`}>
                               {sprint.status}
                            </span>
                         </div>
                         <div className="col-span-2 text-xs text-pepper-500 font-mono">
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                         </div>
                         <div className="col-span-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 mb-1">
                               <span>{sProgress}%</span>
                               <span className="font-normal text-pepper-400">({done}/{total} pts)</span>
                            </div>
                            <div className="w-full h-1.5 bg-pepper-100 dark:bg-pepper-800 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sProgress}%` }}></div>
                            </div>
                         </div>
                         <div className="col-span-1 text-right relative group/menu">
                            <button className="p-1.5 text-pepper-400 hover:bg-pepper-100 dark:hover:bg-pepper-700 rounded-lg transition-colors"><TbDotsVertical /></button>
                            <div className="absolute right-0 top-8 w-40 bg-white dark:bg-pepper-800 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1 z-10 hidden group-hover/menu:block hover:block">
                               <button onClick={() => { setSelectedSprintId(sprint.id); setActiveView('board'); }} className="w-full text-left px-3 py-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded flex items-center gap-2"><TbLayoutBoard /> View Board</button>
                               <button onClick={() => { setEditingSprint(sprint); setModalMode('edit'); setIsModalOpen(true); }} className="w-full text-left px-3 py-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded flex items-center gap-2"><FiEdit2 /> Edit</button>
                               <div className="h-px bg-pepper-100 dark:bg-pepper-700 my-1"></div>
                               <button onClick={() => handleDeleteSprint(sprint.id)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"><FiTrash2 /> Delete</button>
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
        )}
      </div>

      {/* --- MENU OVERLAY --- */}
      {activeMenuId && menuAnchor && (
          <TaskMenuOverlay anchorRect={menuAnchor} onClose={() => setActiveMenuId(null)}>
              <div className="w-48 bg-white dark:bg-pepper-900 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1 ring-1 ring-black/5">
                  <button onClick={() => { updateStory(activeMenuId, { status: TaskStatus.DONE }); setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded flex items-center gap-2"><FiCheck /> Mark as Done</button>
                  <button onClick={() => { setEditingStoryId(activeMenuId); setIsEditModalOpen(true); setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded flex items-center gap-2"><FiEdit2 /> Edit</button>
                  <button onClick={() => { setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded flex items-center gap-2"><FiCopy /> Duplicate</button>
                  <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1"></div>
                  <button onClick={() => { setStories(s => s.filter(x => x.id !== activeMenuId)); setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2"><FiTrash2 /> Delete</button>
              </div>
          </TaskMenuOverlay>
      )}

      {/* --- ADD STORY MODAL --- */}
      {addStoryModal.open && addStoryModal.sprintId && addStoryModal.status && (
          <AddStoryModal 
              sprintId={addStoryModal.sprintId}
              initialStatus={addStoryModal.status}
              onClose={() => setAddStoryModal({ open: false, sprintId: null, status: null })}
              onCreate={handleCreateStory}
              sprintProject={sprints.find(s => s.id === addStoryModal.sprintId)?.project || 'FLX'}
          />
      )}

      {/* --- STORY DETAILS MODAL --- */}
      {selectedStory && (
          <StoryDetailsModal 
              story={selectedStory}
              onClose={() => setSelectedStoryId(null)}
              onSave={handleSaveStoryDetails}
              sprintName={sprints.find(s => s.id === selectedStory.sprintId)?.name}
          />
      )}

      {/* --- EDIT STORY MODAL --- */}
      {isEditModalOpen && editingStoryId && (() => {
          const storyToEdit = stories.find(s => s.id === editingStoryId);
          if (!storyToEdit) return null;
          return (
              <EditStoryModal 
                  story={storyToEdit}
                  onClose={() => { setIsEditModalOpen(false); setEditingStoryId(null); }}
                  onSave={(updated) => { 
                      setStories(prev => prev.map(s => s.id === updated.id ? updated : s));
                      setIsEditModalOpen(false);
                      setEditingStoryId(null);
                  }}
              />
          );
      })()}

      {/* --- CREATE / EDIT SPRINT MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
         <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
               <h3 className="font-bold text-lg text-pepper-900 dark:text-white">{modalMode === 'create' ? 'Create New Sprint' : 'Edit Sprint'}</h3>
               <button onClick={() => setIsModalOpen(false)}><FiX className="text-pepper-500" /></button>
            </div>
            <form onSubmit={handleSaveSprint} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Sprint Name *</label>
                  <input name="name" required defaultValue={editingSprint?.name} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Project</label>
                     <select name="project" defaultValue={editingSprint?.project || 'HRMS'} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="HRMS">HRMS</option>
                        <option value="CRM">CRM</option>
                        <option value="Platform">Platform</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Status</label>
                     <select name="status" defaultValue={editingSprint?.status || 'Upcoming'} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="Upcoming">Upcoming</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                     </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Start Date</label>
                     <input type="date" name="startDate" required defaultValue={editingSprint?.startDate} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">End Date</label>
                     <input type="date" name="endDate" required defaultValue={editingSprint?.endDate} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Sprint Goal</label>
                  <textarea name="goal" rows={3} defaultValue={editingSprint?.goal} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none resize-none"></textarea>
               </div>
               <div>
                  <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Capacity (Points)</label>
                  <input type="number" name="capacity" defaultValue={editingSprint?.capacity || 40} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
               <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">{modalMode === 'create' ? 'Create Sprint' : 'Save Changes'}</button>
               </div>
            </form>
         </div>
      </Modal>

    </div>
  );
};