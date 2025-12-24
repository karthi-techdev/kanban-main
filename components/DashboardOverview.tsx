import React, { useState, useEffect, useRef } from 'react';
import { 
  FiCheckCircle, FiAlertCircle, FiClock, FiCalendar, FiArrowUp, FiArrowDown, 
  FiMoreHorizontal, FiFilter, FiPlus, FiZap, FiActivity, FiLayers, FiPaperclip,
  FiGithub, FiSettings, FiMaximize2, FiMinimize2, FiTrash2, FiMove, FiX, FiSend,
  FiUser, FiFlag, FiTag, FiBook, FiEye, FiEyeOff, FiBarChart2, FiPieChart,
  FiTrendingUp, FiAlertTriangle, FiGitCommit, FiServer, FiFile, FiBell
} from 'react-icons/fi';
import { 
  TbTargetArrow, TbLayoutDashboard, TbRocket, TbAlertTriangle, TbChartPie, TbHierarchy,
  TbPinned, TbBellRinging, TbBug, TbFileText, TbChartDots, TbBrandGithub, TbCalendarEvent
} from 'react-icons/tb';
import { BiBot } from 'react-icons/bi';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';
import { Task, TaskStatus, Priority, Sprint, Release, Epic, DocumentItem, DiagramItem, TaskType } from '../types';
import { Modal as BaseModal } from './Modal';

// --- Initial Mock Data ---

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Update Authentication Flow', status: TaskStatus.IN_PROGRESS, dueDate: 'Today', priority: Priority.HIGH, type: 'Task', tags: ['Auth'], assignee: 'Alex', storyPoints: 5, description: 'Refactor login.' },
  { id: '2', title: 'Fix CSS Grid Issue on Mobile', status: TaskStatus.TODO, dueDate: 'Tomorrow', priority: Priority.MEDIUM, type: 'Bug', tags: ['UI'], assignee: 'Sam', storyPoints: 2, description: '' },
  { id: '3', title: 'Review PR #452 for API', status: TaskStatus.REVIEW, dueDate: 'Oct 28', priority: Priority.CRITICAL, type: 'Task', tags: ['API'], assignee: 'Jordan', storyPoints: 3, description: '' },
  { id: '4', title: 'Draft Release Notes v2.1', status: TaskStatus.DONE, dueDate: 'Yesterday', priority: Priority.LOW, type: 'Task', tags: ['Docs'], assignee: 'Alex', storyPoints: 1, description: '' },
  { id: '5', title: 'Optimize Image Assets', status: TaskStatus.IN_PROGRESS, dueDate: 'Oct 30', priority: Priority.MEDIUM, type: 'Task', tags: ['Perf'], assignee: 'Taylor', storyPoints: 3, description: '' },
  { id: '6', title: 'Database Migration Script', status: TaskStatus.TODO, dueDate: 'Nov 02', priority: Priority.HIGH, type: 'Task', tags: ['DB'], assignee: 'Jordan', storyPoints: 8, description: '' },
];

const INITIAL_SPRINTS: Sprint[] = [
  { id: 's1', name: 'Sprint 4', status: 'Active', startDate: '2023-10-24', endDate: '2023-11-07', goal: 'Complete Auth & UI Polish' },
  { id: 's2', name: 'Sprint 5', status: 'Planned', startDate: '2023-11-08', endDate: '2023-11-22', goal: 'Backend Optimization' }
];

const INITIAL_RELEASES: Release[] = [
  { version: 'v2.1.0-beta', date: 'Oct 25', status: 'Staging', notes: 'New dashboard widgets.' },
  { version: 'v2.0.4', date: 'Oct 20', status: 'Production', notes: 'Hotfix for login timeout.' },
];

const INITIAL_DOCS: DocumentItem[] = [];
const INITIAL_DIAGRAMS: DiagramItem[] = [];
const INITIAL_EPICS: Epic[] = [];

// --- Mock Data for Charts ---
const SPRINT_BURNDOWN_DATA = [
  { day: 'Mon', ideal: 100, actual: 98 },
  { day: 'Tue', ideal: 90, actual: 85 },
  { day: 'Wed', ideal: 80, actual: 82 },
  { day: 'Thu', ideal: 70, actual: 65 },
  { day: 'Fri', ideal: 60, actual: 55 },
  { day: 'Sat', ideal: 50, actual: 48 },
  { day: 'Sun', ideal: 40, actual: 45 }, 
  { day: 'Mon', ideal: 30, actual: 35 },
];

const WORKLOAD_DATA = [
  { name: 'Alex', tasks: 12, capacity: 85 },
  { name: 'Sam', tasks: 8, capacity: 60 },
  { name: 'Jordan', tasks: 15, capacity: 95 },
  { name: 'Casey', tasks: 10, capacity: 70 },
  { name: 'Taylor', tasks: 6, capacity: 40 },
];

const TASK_DISTRIBUTION_DATA = [
  { name: 'To Do', value: 8, color: '#94A3B8' },
  { name: 'In Progress', value: 12, color: '#3B82F6' },
  { name: 'Review', value: 5, color: '#F59E0B' },
  { name: 'Done', value: 15, color: '#10B981' },
];

// --- New Mock Data for New Widgets ---

const BUG_TREND_DATA = [
  { day: 'M', count: 2 },
  { day: 'T', count: 4 },
  { day: 'W', count: 1 },
  { day: 'T', count: 3 },
  { day: 'F', count: 2 },
  { day: 'S', count: 0 },
  { day: 'S', count: 1 },
];

const PRODUCTIVITY_DATA = [
    { day: 'M', completed: 5 },
    { day: 'T', completed: 8 },
    { day: 'W', completed: 12 },
    { day: 'T', completed: 7 },
    { day: 'F', completed: 10 },
];

const PINNED_ITEMS = [
    { id: 'p1', title: 'Q4 Roadmap', type: 'Diagram', icon: TbHierarchy },
    { id: 'p2', title: 'Design System', type: 'Epic', icon: TbTargetArrow },
    { id: 'p3', title: 'API Specs', type: 'Document', icon: TbFileText },
    { id: 'p4', title: 'Release Checklist', type: 'Task', icon: FiCheckCircle },
];

const RISKS_DATA = [
    { id: 'r1', title: 'Auth Service Down', impact: 'Critical', blockedBy: 'Infra Team' },
    { id: 'r2', title: 'Missing Assets', impact: 'High', blockedBy: 'Design' },
];

const TIMELINE_DATA = [
    { date: 'Oct 28', title: 'Sprint Review', type: 'Meeting', color: 'bg-blue-500' },
    { date: 'Oct 30', title: 'v2.1 Deployment', type: 'Release', color: 'bg-emerald-500' },
    { date: 'Nov 01', title: 'Marketing Launch', type: 'Milestone', color: 'bg-purple-500' },
];

const RECENT_FILES = [
    { name: 'Architecture_v2.pdf', type: 'PDF', date: '2h ago' },
    { name: 'Onboarding_Flow.fig', type: 'Figma', date: '5h ago' },
    { name: 'Meeting_Notes.docx', type: 'Doc', date: 'Yesterday' },
];

const INTEGRATIONS_DATA = [
    { name: 'GitHub', action: 'Commit #a1b2c3 pushed', time: '10m ago', status: 'success', icon: TbBrandGithub },
    { name: 'Jenkins', action: 'Build #452 failed', time: '1h ago', status: 'failed', icon: FiServer },
    { name: 'Slack', action: 'New mention in #dev', time: '2h ago', status: 'info', icon: FiActivity },
];

const NOTIFICATIONS_PREVIEW = [
    { id: 1, text: 'Alex mentioned you in "Auth Flow"', time: '10m ago', type: 'mention' },
    { id: 2, text: 'Deployment v2.0.4 successful', time: '1h ago', type: 'system' },
    { id: 3, text: '3 tasks blocked in Sprint 4', time: '2h ago', type: 'alert' },
];


// --- UI Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div 
        className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-100 dark:border-pepper-700 overflow-hidden transform transition-all animate-slide-up max-h-[90vh] flex flex-col relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-pepper-100 dark:border-pepper-800 bg-pepper-50/50 dark:bg-pepper-900/50">
          <h3 className="font-display font-bold text-lg text-pepper-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-pepper-100 dark:hover:bg-pepper-800 text-pepper-400 hover:text-pepper-900 dark:hover:text-white transition-colors">
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </BaseModal>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-[120] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up ${type === 'success' ? 'bg-pepper-900 text-white dark:bg-white dark:text-pepper-900' : 'bg-red-500 text-white'}`}>
            <FiCheckCircle className="text-lg" />
            <span className="text-sm font-bold">{message}</span>
        </div>
    );
};

const PriorityBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
        'Low': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        'Medium': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
        'High': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
        'Critical': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[level] || colors['Low']}`}>
            {level}
        </span>
    )
};

const StatCard = ({ icon: Icon, label, value, trend, trendUp, colorClass }: any) => (
  <div className="bg-white/80 dark:bg-pepper-800/40 backdrop-blur-sm p-4 rounded-2xl border border-pepper-100 dark:border-pepper-700/50 shadow-sm hover:translate-y-[-2px] transition-transform group">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon className={`text-lg ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendUp ? <FiArrowUp /> : <FiArrowDown />} {trend}
        </div>
      )}
    </div>
    <div className="text-2xl font-display font-extrabold text-pepper-900 dark:text-white mb-0.5 group-hover:scale-105 transition-transform origin-left">{value}</div>
    <div className="text-xs text-pepper-500 dark:text-pepper-400 font-medium">{label}</div>
  </div>
);

// --- Main Component ---

export const DashboardOverview: React.FC = () => {
  // Data State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS);
  const [releases, setReleases] = useState<Release[]>(INITIAL_RELEASES);
  const [epics, setEpics] = useState<Epic[]>(INITIAL_EPICS);
  const [activeTaskFilter, setActiveTaskFilter] = useState('All');

  // UI State
  const [customizing, setCustomizing] = useState(false);
  const [showNewItemDropdown, setShowNewItemDropdown] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // Widget visibility state
  const [widgets, setWidgets] = useState({
      overview: true,
      aiInsights: true,
      myWork: true,
      sprint: true, // Burndown
      activity: true,
      releases: true,
      workload: false,
      distribution: false,
      // New Widgets
      projectHealth: true,
      sprintSummary: true,
      risks: true,
      pinnedItems: true,
      notificationsWidget: true,
      timeline: true,
      recentFiles: false,
      integrations: true,
      focusMode: true,
      productivity: false
  });

  // Layout State (Column-based)
  const [layout, setLayout] = useState({
      left: ['aiInsights', 'myWork', 'sprint', 'sprintSummary', 'workload', 'projectHealth', 'productivity'],
      right: ['quickActions', 'focusMode', 'activity', 'risks', 'releases', 'distribution', 'pinnedItems', 'timeline', 'recentFiles', 'integrations', 'notificationsWidget']
  });

  // Drag State
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Ensure Copilot is closed on initial mount
  useEffect(() => {
    setShowAICopilot(false);
  }, []);

  // Derived Metrics
  const activeSprint = sprints.find(s => s.status === 'Active');
  const totalTasks = tasks.length;
  const criticalTasks = tasks.filter(t => t.priority === Priority.CRITICAL).length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE).length; // Dynamic calculation
  
  // Health Calculation Logic
  const calculateHealth = () => {
        const total = tasks.length || 1;
        const criticalOpen = tasks.filter(t => t.priority === Priority.CRITICAL && t.status !== TaskStatus.DONE).length;
        
        let score = 100;
        score -= (overdueTasks * 10);
        score -= (criticalOpen * 15);
        
        // Mock completion penalty if almost no tasks are done
        if (total > 0 && (completedTasks / total) < 0.1) score -= 5;

        score = Math.max(0, Math.min(100, score));

        let status = 'Healthy';
        let color: 'emerald' | 'amber' | 'red' = 'emerald';

        if (score < 50) {
            status = 'Critical';
            color = 'red';
        } else if (score < 80) {
            status = 'At Risk';
            color = 'amber';
        }

        return { score, status, color, criticalOpen };
  };

  const healthColorMap = {
        emerald: { text: 'text-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-100', stroke: '#10B981' },
        amber: { text: 'text-amber-500', border: 'border-amber-500', bg: 'bg-amber-100', stroke: '#F59E0B' },
        red: { text: 'text-red-500', border: 'border-red-500', bg: 'bg-red-100', stroke: '#EF4444' }
  };
  
  // AI Copilot Chat State
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
      { sender: 'ai', text: activeSprint ? `Your sprint "${activeSprint.name}" is 68% complete with 12 days remaining.` : 'No active sprint currently.' },
      { sender: 'ai', text: 'The Review column has accumulated items – potential bottleneck.' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAICopilot) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, showAICopilot]);

  // --- Handlers ---

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
  };

  const toggleWidget = (key: keyof typeof widgets) => {
      setWidgets(prev => ({...prev, [key]: !prev[key]}));
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
      if (!customizing) return;
      setDraggedWidget(widgetId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', widgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
      if (!customizing) return;
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: 'left' | 'right', targetIndex?: number) => {
      if (!customizing || !draggedWidget) return;
      e.preventDefault();

      const sourceColumn = layout.left.includes(draggedWidget) ? 'left' : 'right';
      
      const newLayout = { ...layout };
      
      // Remove from source
      newLayout[sourceColumn] = newLayout[sourceColumn].filter(id => id !== draggedWidget);

      // Add to target
      if (targetIndex !== undefined && targetColumn === sourceColumn) {
          // Reorder in same column
           newLayout[targetColumn].splice(targetIndex, 0, draggedWidget);
      } else if (targetIndex !== undefined) {
           // Insert at specific index in different column
           newLayout[targetColumn].splice(targetIndex, 0, draggedWidget);
      } else {
           // Append to end of target column
           newLayout[targetColumn].push(draggedWidget);
      }

      setLayout(newLayout);
      setDraggedWidget(null);
  };


  const handleCreateTask = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      
      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: data.get('title') as string,
          description: data.get('description') as string || '',
          priority: (data.get('priority') as Priority) || Priority.MEDIUM,
          status: (data.get('status') as TaskStatus) || TaskStatus.TODO,
          type: (data.get('type') as TaskType) || 'Task',
          tags: (data.get('tags') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
          assignee: data.get('assignee') as string,
          dueDate: data.get('dueDate') as string || 'Tomorrow',
          storyPoints: Number(data.get('points')) || 0,
          subtasks: []
      };

      setTasks(prev => [newTask, ...prev]);
      showToast('Task created successfully');
      setActiveModal(null);
  };

  const handleCreateEpic = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const newEpic: Epic = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.get('name') as string,
        description: data.get('description') as string,
        owner: data.get('owner') as string,
        status: 'Planning'
    };
    setEpics(prev => [...prev, newEpic]);
    showToast('Epic created successfully');
    setActiveModal(null);
  };

  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const newRel: Release = {
        version: data.get('version') as string,
        date: data.get('date') as string,
        status: data.get('active') ? 'Production' : 'Planned',
        notes: data.get('notes') as string
    };
    setReleases(prev => [newRel, ...prev]);
    showToast('Release created successfully');
    setActiveModal(null);
  };

  const handleStartSprint = (e: React.FormEvent) => {
      e.preventDefault();
      const plannedSprint = sprints.find(s => s.status === 'Planned');
      if (plannedSprint) {
          setSprints(prev => prev.map(s => {
              if (s.id === plannedSprint.id) return { ...s, status: 'Active' };
              if (s.status === 'Active') return { ...s, status: 'Completed' }; 
              return s;
          }));
          showToast(`Started ${plannedSprint.name}`);
          setActiveModal(null);
      }
  };

  const checkStartSprint = () => {
      if (activeSprint) {
          setActiveModal('sprint-active-alert');
      } else if (!sprints.some(s => s.status === 'Planned')) {
          setActiveModal('no-planned-sprint');
      } else {
          setActiveModal('start-sprint');
      }
  };

  // AI Logic
  const handleAISend = () => {
      if (!aiInput.trim()) return;
      
      const userMsg = aiInput;
      setAiMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
      setAiInput('');

      setTimeout(() => {
          let response = "I'm not sure how to help with that yet.";
          const lower = userMsg.toLowerCase();

          if (lower.includes('summarize') && lower.includes('sprint')) {
             if (activeSprint) {
                 response = `${activeSprint.name} started on ${activeSprint.startDate}. Goal: ${activeSprint.goal}. Tasks completed: ${completedTasks}/${totalTasks}.`;
             } else {
                 response = "There is no currently active sprint to summarize.";
             }
          } else if (lower.includes('priority') || lower.includes('priorities')) {
              const myTop = tasks.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 3);
              response = `Your top priorities are: ${myTop.map(t => t.title).join(', ') || 'None found!'}`;
          } else if (lower.includes('create a task') || lower.includes('create task')) {
              const content = userMsg.split(/task:?/i)[1]?.trim();
              if (content) {
                  const newTask: Task = {
                      id: Math.random().toString(), title: content, status: TaskStatus.TODO, priority: Priority.MEDIUM, type: 'Task', tags: ['AI'], dueDate: 'Next Week', description: 'Created via Copilot', subtasks: []
                  };
                  setTasks(prev => [newTask, ...prev]);
                  response = `I've created the task: "${content}" and added it to your backlog.`;
              } else {
                  response = "What should the task be titled? Try 'Create a task: Fix header bug'.";
              }
          } else if (lower.includes('blocking') || lower.includes('blocker')) {
              response = `We have ${criticalTasks} critical tasks. The main bottleneck appears to be the 'Review' column with ${tasks.filter(t => t.status === TaskStatus.REVIEW).length} items pending.`;
          }

          setAiMessages(prev => [...prev, { sender: 'ai', text: response }]);
      }, 600);
  };

  // --- Widget Render Map ---
  const renderWidget = (id: string) => {
      // Don't render if not enabled in toggles
      if (!widgets[id as keyof typeof widgets] && id !== 'quickActions') return null;

      const CommonWrapper = ({ children, title, className = '' }: any) => (
          <div 
             draggable={customizing}
             onDragStart={(e) => handleDragStart(e, id)}
             className={`
                bg-white dark:bg-pepper-800/40 backdrop-blur-md rounded-2xl border 
                ${customizing ? 'border-dashed border-blue-400 cursor-move hover:bg-blue-50 dark:hover:bg-blue-900/10' : 'border-pepper-200/60 dark:border-pepper-700/60'} 
                shadow-sm flex flex-col relative transition-all duration-300 ${customizing ? '' : 'hover:shadow-lg'} mb-6 ${className}
             `}
          >
              {customizing && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white rounded-full p-1 shadow-md z-10">
                      <FiMove />
                  </div>
              )}
              {children}
          </div>
      );

      switch (id) {
         case 'aiInsights':
              return (
                  <div key={id} draggable={customizing} onDragStart={(e) => handleDragStart(e, id)} className={`relative group rounded-2xl p-[1px] bg-gradient-to-r from-pepper-300 via-pepper-500 to-pepper-300 dark:from-pepper-700 dark:via-pepper-500 dark:to-pepper-700 shadow-xl shadow-black/5 animate-fade-in mb-6 ${customizing ? 'cursor-move opacity-90' : ''}`}>
                        <div className="bg-white dark:bg-pepper-900 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <FiZap className="text-9xl text-pepper-900 dark:text-white rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-pepper-900 dark:bg-white flex items-center justify-center text-white dark:text-pepper-900 shadow-lg">
                                            <BiBot className="text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-pepper-900 dark:text-white">AI Project Insights</h3>
                                            <p className="text-xs text-pepper-500 dark:text-pepper-400 font-medium">Analysis based on real-time data</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                                        <FiZap /> Refresh
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Velocity Insight */}
                                    <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors">
                                        <div className="mt-1.5 min-w-[4px] h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                        <div>
                                            <p className="text-sm text-pepper-600 dark:text-pepper-300 leading-relaxed">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><FiTrendingUp className="inline"/> Velocity Increasing:</span> Sprint velocity is up <span className="font-bold text-pepper-900 dark:text-white">12%</span> compared to last week. Team is currently on track.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottleneck Warning */}
                                    <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors">
                                        <div className="mt-1.5 min-w-[4px] h-4 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                                        <div>
                                            <p className="text-sm text-pepper-600 dark:text-pepper-300 leading-relaxed">
                                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><FiAlertTriangle className="inline"/> Bottleneck Detected:</span> The 'Review' column has accumulated <span className="font-bold text-pepper-900 dark:text-white">5 tasks</span> (30% of sprint).
                                            </p>
                                            <div className="mt-1.5 flex gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">Action Required</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workload Risk */}
                                    <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors">
                                        <div className="mt-1.5 min-w-[4px] h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                        <div>
                                            <p className="text-sm text-pepper-600 dark:text-pepper-300 leading-relaxed">
                                                <span className="font-bold text-red-600 dark:text-red-400">Overload Risk:</span> Jordan is at <span className="font-bold text-pepper-900 dark:text-white">120% capacity</span>. Suggest re-assigning 2 tasks to Sam.
                                            </p>
                                            <button className="mt-2 text-[10px] font-bold text-white bg-pepper-900 dark:bg-white dark:text-pepper-900 px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                                Apply Re-assignment
                                            </button>
                                        </div>
                                    </div>

                                    {/* Forecast */}
                                    <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors">
                                        <div className="mt-1.5 min-w-[4px] h-4 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                                        <div>
                                            <p className="text-sm text-pepper-600 dark:text-pepper-300 leading-relaxed">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">Forecast:</span> 95% probability of hitting the release deadline based on current burn rate.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                  </div>
              );
          case 'projectHealth':
              const health = calculateHealth();
              const hColor = healthColorMap[health.color];
          
              return (
                  <CommonWrapper key={id}>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm flex items-center gap-2">
                                <FiActivity className={hColor.text} /> Project Health
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full ${hColor.bg} dark:bg-opacity-20 ${hColor.text} text-xs font-bold border ${hColor.border} border-opacity-20 transition-colors duration-300`}>
                                {health.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-5 mb-6">
                             {/* Circular Progress */}
                             <div className="relative w-16 h-16 shrink-0">
                                 <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <path
                                        className="text-pepper-100 dark:text-pepper-800"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    {/* Progress Circle */}
                                    <path
                                        className={`${hColor.text} transition-all duration-1000 ease-out`}
                                        strokeDasharray={`${health.score}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                 </svg>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <span className={`text-xl font-extrabold ${hColor.text}`}>{health.score}%</span>
                                 </div>
                             </div>
                             
                             <div>
                                 <p className="text-sm font-bold text-pepper-900 dark:text-white leading-tight">
                                     {health.score > 90 ? 'Excellent Condition' : health.score > 75 ? 'Good Progress' : 'Attention Needed'}
                                 </p>
                                 <p className="text-xs text-pepper-500 mt-1">
                                     {health.criticalOpen > 0 ? `${health.criticalOpen} critical issues pending` : 'No critical issues'}
                                 </p>
                                 <button 
                                    onClick={() => {
                                        showToast(`Filtering for ${health.status === 'Healthy' ? 'all tasks' : 'critical issues'}...`, 'success');
                                        if (health.status !== 'Healthy') setActiveTaskFilter('All'); 
                                    }}
                                    className={`text-[10px] font-bold ${hColor.text} hover:underline mt-1.5 flex items-center gap-1`}
                                 >
                                     View Details <FiArrowUp className="rotate-45" />
                                 </button>
                             </div>
                        </div>

                        <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between text-xs mb-1.5">
                                     <span className="text-pepper-500 font-medium">Avg Cycle Time</span>
                                     <span className="font-bold text-pepper-900 dark:text-white">2.4 days</span>
                                 </div>
                                 <div className="w-full bg-pepper-100 dark:bg-pepper-700 h-1.5 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ width: '70%', backgroundColor: hColor.stroke }}
                                     ></div>
                                 </div>
                             </div>
                             
                             <div className="pt-3 border-t border-pepper-50 dark:border-pepper-800">
                                 <div className="flex justify-between items-center mb-2">
                                     <p className="text-xs font-bold text-pepper-500">Bug Trend (7d)</p>
                                     <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                         <FiArrowUp /> 12%
                                     </span>
                                 </div>
                                 <div className="h-16 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={BUG_TREND_DATA}>
                                            <defs>
                                                <linearGradient id={`gradientHealth-${id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={hColor.stroke} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={hColor.stroke} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Tooltip 
                                                cursor={{stroke: hColor.stroke, strokeWidth: 1, strokeDasharray: '3 3'}}
                                                contentStyle={{backgroundColor: '#171717', border: 'none', borderRadius: '8px', fontSize: '10px', padding: '4px 8px'}}
                                                itemStyle={{color: '#fff', padding: 0}}
                                                labelStyle={{display: 'none'}}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke={hColor.stroke} 
                                                fill={`url(#gradientHealth-${id})`} 
                                                strokeWidth={2} 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                 </div>
                             </div>
                        </div>
                    </div>
                </CommonWrapper>
              );
          case 'sprintSummary':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm">Sprint Summary</h3>
                             <span className="text-xs text-pepper-500">{activeSprint?.name}</span>
                          </div>
                          <p className="text-xs text-pepper-500 italic mb-4">"{activeSprint?.goal}"</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-pepper-50 dark:bg-pepper-900/50 p-3 rounded-xl">
                                  <p className="text-[10px] text-pepper-500 uppercase font-bold">Commitment</p>
                                  <p className="text-lg font-bold text-pepper-900 dark:text-white">42 pts</p>
                              </div>
                              <div className="bg-pepper-50 dark:bg-pepper-900/50 p-3 rounded-xl">
                                  <p className="text-[10px] text-pepper-500 uppercase font-bold">Completed</p>
                                  <p className="text-lg font-bold text-emerald-500">28 pts</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-pepper-600 dark:text-pepper-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800">
                               <FiAlertCircle className="text-amber-500" />
                               <span>Scope Creep: <strong>+3 tasks</strong> added mid-sprint.</span>
                          </div>
                      </div>
                  </CommonWrapper>
              );
          case 'risks':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4 flex items-center gap-2">
                              <FiAlertTriangle className="text-red-500" /> Risks & Blockers
                          </h3>
                          <div className="space-y-3">
                              {RISKS_DATA.map(risk => (
                                  <div key={risk.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="text-sm font-bold text-pepper-900 dark:text-white">{risk.title}</p>
                                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">{risk.impact}</span>
                                      </div>
                                      <p className="text-xs text-pepper-600 dark:text-pepper-400">Blocked by: <span className="font-semibold">{risk.blockedBy}</span></p>
                                  </div>
                              ))}
                              <button className="w-full py-1.5 text-xs font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white transition-colors">View all 5 blockers</button>
                          </div>
                      </div>
                  </CommonWrapper>
              );
          case 'pinnedItems':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4 flex items-center gap-2">
                              <TbPinned className="text-pepper-400" /> Pinned Items
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                              {PINNED_ITEMS.map(item => (
                                  <div key={item.id} className="p-3 bg-pepper-50 dark:bg-pepper-900/50 hover:bg-white dark:hover:bg-pepper-800 border border-pepper-100 dark:border-pepper-800 rounded-xl cursor-pointer transition-all hover:shadow-sm group">
                                      <item.icon className="text-pepper-400 group-hover:text-blue-500 mb-2" />
                                      <p className="text-xs font-bold text-pepper-900 dark:text-white truncate">{item.title}</p>
                                      <p className="text-[10px] text-pepper-500">{item.type}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
              );
          case 'notificationsWidget':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm">Notifications</h3>
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                          </div>
                          <div className="space-y-0 relative">
                              {NOTIFICATIONS_PREVIEW.map((notif, idx) => (
                                  <div key={notif.id} className="flex gap-3 py-3 border-b border-pepper-100 dark:border-pepper-800 last:border-0 hover:bg-pepper-50 dark:hover:bg-pepper-800/50 -mx-5 px-5 cursor-pointer transition-colors">
                                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.type === 'alert' ? 'bg-red-500' : notif.type === 'mention' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                      <div>
                                          <p className="text-xs font-medium text-pepper-800 dark:text-pepper-200 leading-snug">{notif.text}</p>
                                          <p className="text-[10px] text-pepper-400 mt-1">{notif.time}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
              );
          case 'timeline':
               return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4 flex items-center gap-2">
                              <TbCalendarEvent /> Timeline
                          </h3>
                          <div className="relative pl-2 space-y-4">
                              {/* Vertical Line */}
                              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-pepper-200 dark:bg-pepper-800"></div>
                              
                              {TIMELINE_DATA.map((event, idx) => (
                                  <div key={idx} className="relative flex items-center gap-3 pl-4 group cursor-pointer">
                                      <div className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white dark:border-pepper-900 ${event.color} shadow-sm z-10`}></div>
                                      <div className="flex-1 p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 transition-colors">
                                          <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-pepper-900 dark:text-white">{event.title}</p>
                                            <span className="text-[10px] text-pepper-400">{event.date}</span>
                                          </div>
                                          <p className="text-[10px] text-pepper-500">{event.type}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
               );
          case 'recentFiles':
               return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Files & Docs</h3>
                          <div className="space-y-2">
                              {RECENT_FILES.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800/50 cursor-pointer group transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-pepper-100 dark:bg-pepper-800 flex items-center justify-center text-pepper-500 group-hover:text-blue-500 transition-colors">
                                              <FiFile />
                                          </div>
                                          <div>
                                              <p className="text-xs font-bold text-pepper-800 dark:text-pepper-200">{file.name}</p>
                                              <p className="text-[10px] text-pepper-500">{file.type}</p>
                                          </div>
                                      </div>
                                      <span className="text-[10px] text-pepper-400">{file.date}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
               );
          case 'integrations':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Integrations</h3>
                          <div className="space-y-3">
                              {INTEGRATIONS_DATA.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                      <div className="mt-0.5">
                                          <item.icon className="text-lg text-pepper-400" />
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex justify-between">
                                              <p className="text-xs font-bold text-pepper-900 dark:text-white">{item.name}</p>
                                              <span className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : item.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                          </div>
                                          <p className="text-[10px] text-pepper-500 truncate">{item.action}</p>
                                          <p className="text-[10px] text-pepper-400">{item.time}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
              );
          case 'focusMode':
               return (
                  <CommonWrapper key={id} className="border-l-4 border-l-blue-500">
                      <div className="p-5">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm flex items-center gap-2">
                                 <TbTargetArrow className="text-blue-500" /> Focus Mode
                             </h3>
                             <span className="text-[10px] font-bold text-pepper-400 uppercase">Top 3 Priorities</span>
                          </div>
                          <div className="space-y-2">
                              {tasks.filter(t => t.priority === Priority.CRITICAL || t.priority === Priority.HIGH).slice(0, 3).map((task, idx) => (
                                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-pepper-50 dark:bg-pepper-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                                      <div className="font-mono text-xs font-bold text-pepper-400 text-opacity-50">0{idx + 1}</div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-pepper-900 dark:text-white truncate">{task.title}</p>
                                          <p className="text-[10px] text-pepper-500">{task.dueDate}</p>
                                      </div>
                                      <input type="checkbox" className="rounded border-pepper-300 text-blue-600 focus:ring-blue-500" />
                                  </div>
                              ))}
                          </div>
                      </div>
                  </CommonWrapper>
               );
          case 'productivity':
               return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                          <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Velocity Trend</h3>
                          <div className="h-32 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={PRODUCTIVITY_DATA}>
                                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none'}} />
                                      <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 4, 4]} barSize={20} />
                                  </BarChart>
                               </ResponsiveContainer>
                          </div>
                      </div>
                  </CommonWrapper>
               );
          case 'myWork':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm tracking-wide flex items-center gap-2">My Work</h3>
                            <div className="flex bg-pepper-100 dark:bg-pepper-700/50 rounded-lg p-0.5">
                                {['All', 'Today', 'Week'].map(filter => (
                                    <button 
                                    key={filter}
                                    onClick={() => setActiveTaskFilter(filter)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTaskFilter === filter ? 'bg-white dark:bg-pepper-600 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 dark:text-pepper-400 hover:text-pepper-800'}`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="group flex items-center justify-between p-3 hover:bg-pepper-50 dark:hover:bg-pepper-700/30 rounded-xl border border-transparent hover:border-pepper-100 dark:hover:border-pepper-700 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${task.status === TaskStatus.DONE ? 'bg-emerald-500' : 'bg-pepper-400'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-pepper-800 dark:text-pepper-100">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <PriorityBadge level={task.priority} />
                                                <span className="text-[10px] text-pepper-400 font-medium">FLX-{task.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-pepper-500 dark:text-pepper-400">{task.dueDate}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                  </CommonWrapper>
              );
          case 'sprint':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                        <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Burndown</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={SPRINT_BURNDOWN_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                                    <Tooltip contentStyle={{backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none'}} itemStyle={{color: '#fff'}} />
                                    <Line type="monotone" dataKey="ideal" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="actual" stroke="#6366F1" strokeWidth={3} dot={{r: 4, fill: '#6366F1'}} activeDot={{r: 6, fill: '#6366F1'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                      </div>
                  </CommonWrapper>
              );
          case 'workload':
               return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                        <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Team Workload</h3>
                        <div className="h-64 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={WORKLOAD_DATA} layout="vertical" barSize={10}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} width={50} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none'}} />
                                    <Bar dataKey="tasks" fill="#6366F1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                             </ResponsiveContainer>
                        </div>
                      </div>
                  </CommonWrapper>
               );
          case 'quickActions':
              return (
                <div key={id} draggable={customizing} onDragStart={(e) => handleDragStart(e, id)} className={`grid grid-cols-2 gap-3 mb-6 ${customizing ? 'cursor-move opacity-90 border border-dashed border-blue-400 p-2 rounded-xl' : ''}`}>
                    <button onClick={() => setActiveModal('quick-task')} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-bold flex flex-col items-center justify-center gap-1">
                        <FiPlus className="text-lg" /> Create Task
                    </button>
                    <button onClick={checkStartSprint} className={`p-3 bg-white dark:bg-pepper-800 hover:bg-pepper-50 dark:hover:bg-pepper-700 text-pepper-800 dark:text-white rounded-xl shadow-sm border border-pepper-200 dark:border-pepper-700 transition-all text-sm font-bold flex flex-col items-center justify-center gap-1 ${activeSprint ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <TbRocket className="text-lg text-pepper-900 dark:text-white" /> Start Sprint
                    </button>
                    <button onClick={() => setShowAICopilot(true)} className="col-span-2 p-3 bg-gradient-to-r from-pepper-900 to-pepper-800 dark:from-white dark:to-pepper-200 text-white dark:text-pepper-900 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-bold flex items-center justify-center gap-2 group">
                        <BiBot className="text-lg group-hover:rotate-12 transition-transform" /> Open AI Copilot
                    </button>
                </div>
              );
          case 'activity':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                        <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Recent Activity</h3>
                        <div className="space-y-4 ml-2 border-l border-pepper-100 dark:border-pepper-700">
                                <div className="relative pl-4">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-pepper-900"></div>
                                    <p className="text-sm text-pepper-600 dark:text-pepper-300"><span className="font-bold text-pepper-900 dark:text-white">Alex</span> created task <span className="text-blue-500">Auth Flow</span></p>
                                    <span className="text-[10px] text-pepper-400">2h ago</span>
                                </div>
                                <div className="relative pl-4">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-pepper-900"></div>
                                    <p className="text-sm text-pepper-600 dark:text-pepper-300"><span className="font-bold text-pepper-900 dark:text-white">System</span> deployed <span className="text-emerald-500">v2.0.4</span></p>
                                    <span className="text-[10px] text-pepper-400">5h ago</span>
                                </div>
                        </div>
                      </div>
                  </CommonWrapper>
              );
          case 'releases':
              return (
                  <CommonWrapper key={id}>
                      <div className="p-5">
                        <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Recent Releases</h3>
                        <div className="space-y-3">
                            {releases.map((rel, i) => (
                                <div key={i} className="p-3 bg-pepper-50 dark:bg-pepper-900/40 rounded-xl border border-pepper-100 dark:border-pepper-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-pepper-900 dark:text-white">{rel.version}</p>
                                        <p className="text-[10px] text-blue-500">{rel.status}</p>
                                    </div>
                                    <span className="text-[10px] font-mono text-pepper-400">{rel.date}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                  </CommonWrapper>
              );
          case 'distribution':
               return (
                   <CommonWrapper key={id}>
                       <div className="p-5">
                           <h3 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm mb-4">Task Distribution</h3>
                           <div className="h-48 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie data={TASK_DISTRIBUTION_DATA} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                           {TASK_DISTRIBUTION_DATA.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={entry.color} />
                                           ))}
                                       </Pie>
                                       <Tooltip contentStyle={{backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none'}} itemStyle={{color: '#fff'}} />
                                   </PieChart>
                               </ResponsiveContainer>
                           </div>
                           <div className="flex justify-center gap-3 text-[10px] font-medium text-pepper-500">
                               {TASK_DISTRIBUTION_DATA.map(d => (
                                   <div key={d.name} className="flex items-center gap-1">
                                       <span className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></span> {d.name}
                                   </div>
                               ))}
                           </div>
                       </div>
                   </CommonWrapper>
               );
          default:
              return null;
      }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pb-24">
            
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 animate-fade-in relative z-10">
                <div>
                    <h1 className="text-3xl font-display font-extrabold text-pepper-900 dark:text-white mb-1">
                        Dashboard
                    </h1>
                    <p className="text-pepper-500 dark:text-pepper-400 text-sm font-medium">
                        {activeSprint ? `Overview of ${activeSprint.name} • 12 days remaining` : 'No Active Sprint • Planning Phase'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setCustomizing(!customizing)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${customizing ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-pepper-800 text-pepper-600 dark:text-pepper-200 border border-pepper-200 dark:border-pepper-700 hover:bg-pepper-50'}`}
                     >
                         {customizing ? <FiCheckCircle /> : <FiSettings />}
                         {customizing ? 'Done' : 'Customize'}
                     </button>
                     
                     <div className="relative">
                        <button 
                            onClick={() => setShowNewItemDropdown(!showNewItemDropdown)}
                            disabled={customizing}
                            className={`flex items-center gap-2 px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ${customizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FiPlus /> New Item
                        </button>
                        
                        {/* New Item Dropdown */}
                        {showNewItemDropdown && !customizing && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowNewItemDropdown(false)}></div>
                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-pepper-800 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1.5 z-20 animate-slide-up origin-top-right">
                                    {[
                                        { label: 'Task', icon: FiCheckCircle, id: 'task' },
                                        { label: 'Epic', icon: TbTargetArrow, id: 'epic' },
                                        { label: 'Bug', icon: TbBug, id: 'bug' },
                                        { label: 'Diagram', icon: TbHierarchy, id: 'diagram' },
                                        { label: 'Document', icon: TbFileText, id: 'doc' },
                                        { label: 'Release', icon: TbRocket, id: 'release' },
                                    ].map((item) => (
                                        <button 
                                            key={item.id}
                                            onClick={() => { setActiveModal(item.id); setShowNewItemDropdown(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50 dark:hover:bg-pepper-700 rounded-lg transition-colors"
                                        >
                                            <item.icon className="text-pepper-400" /> {item.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                     </div>
                </div>
            </div>

            {/* --- Customization Panel --- */}
            {customizing && (
                <div className="mb-8 bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-2xl p-6 shadow-xl animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-pepper-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <FiLayers /> Widget Configuration
                        </h3>
                        <button onClick={() => setCustomizing(false)} className="text-xs font-bold text-pepper-500 hover:text-pepper-900">Close</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.keys(widgets).map((key) => {
                            const labels: Record<string, string> = {
                                overview: 'Key Metrics',
                                aiInsights: 'AI Insights',
                                myWork: 'My Work',
                                sprint: 'Burndown Chart',
                                activity: 'Activity Feed',
                                releases: 'Recent Releases',
                                workload: 'Team Workload',
                                distribution: 'Task Distribution',
                                projectHealth: 'Project Health',
                                sprintSummary: 'Sprint Summary',
                                risks: 'Risks & Blockers',
                                pinnedItems: 'Pinned Items',
                                notificationsWidget: 'Notifications',
                                timeline: 'Timeline',
                                recentFiles: 'Files',
                                integrations: 'Integrations',
                                focusMode: 'Focus Mode',
                                productivity: 'Productivity Trend'
                            };
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleWidget(key as keyof typeof widgets)}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                        widgets[key as keyof typeof widgets]
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300'
                                            : 'bg-pepper-50 border-transparent text-pepper-400 dark:bg-pepper-900 dark:text-pepper-500 hover:bg-pepper-100'
                                    }`}
                                >
                                    {widgets[key as keyof typeof widgets] ? <FiEye className="text-lg" /> : <FiEyeOff className="text-lg" />}
                                    <span className="text-center">{labels[key] || key}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-4 text-xs text-pepper-500 italic text-center">Drag widgets to reorder them on the dashboard.</p>
                </div>
            )}

            {/* --- Key Metrics --- */}
            {widgets.overview && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-slide-up">
                    <StatCard icon={TbTargetArrow} label="Total Tasks" value={totalTasks} trend="12%" trendUp={true} colorClass="bg-blue-500" />
                    <StatCard icon={TbRocket} label="Sprint Progress" value={activeSprint ? "68%" : "0%"} trend={activeSprint ? "4 days left" : "Paused"} trendUp={!!activeSprint} colorClass="bg-emerald-500" />
                    <StatCard icon={TbAlertTriangle} label="Critical Issues" value={criticalTasks} trend={criticalTasks > 0 ? "Needs Action" : "All Good"} trendUp={criticalTasks === 0} colorClass="bg-red-500" />
                    <StatCard icon={FiClock} label="Overdue Tasks" value={overdueTasks} trend="Improved" trendUp={true} colorClass="bg-orange-500" />
                    <StatCard icon={FiCheckCircle} label="Closed (7d)" value={completedTasks} trend="High velocity" trendUp={true} colorClass="bg-purple-500" />
                </div>
            )}

            {/* --- Main Grid (Draggable Layout) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-0">
                
                {/* Left Column Area */}
                <div 
                    className={`lg:col-span-8 flex flex-col ${customizing ? 'min-h-[200px] border-2 border-dashed border-pepper-200 dark:border-pepper-700 rounded-xl p-2' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'left')}
                >
                    {layout.left.map((id, index) => (
                        <div key={id} onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'left', index); }}>
                            {renderWidget(id)}
                        </div>
                    ))}
                    {layout.left.length === 0 && customizing && <div className="text-center text-pepper-400 py-10">Drop Widgets Here</div>}
                </div>

                {/* Right Column Area */}
                <div 
                    className={`lg:col-span-4 flex flex-col ${customizing ? 'min-h-[200px] border-2 border-dashed border-pepper-200 dark:border-pepper-700 rounded-xl p-2' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'right')}
                >
                    {layout.right.map((id, index) => (
                        <div key={id} onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'right', index); }}>
                            {renderWidget(id)}
                        </div>
                    ))}
                    {layout.right.length === 0 && customizing && <div className="text-center text-pepper-400 py-10">Drop Widgets Here</div>}
                </div>

            </div>
        </div>

        {/* --- MODALS --- */}

        {/* Task / Quick Task Modal */}
        <Modal isOpen={activeModal === 'task' || activeModal === 'quick-task' || activeModal === 'bug'} onClose={() => setActiveModal(null)} title={activeModal === 'bug' ? 'Report Bug' : 'Create Task'}>
            <form onSubmit={handleCreateTask} className="space-y-4">
                <input type="hidden" name="type" value={activeModal === 'bug' ? 'Bug' : 'Task'} />
                
                <div>
                    <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase mb-1">Title <span className="text-red-500">*</span></label>
                    <input name="title" required autoFocus className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white outline-none" placeholder="What needs to be done?" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase mb-1">Priority</label>
                        <select name="priority" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm">
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase mb-1">Due Date</label>
                        <input name="dueDate" type="date" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase mb-1">Assignee</label>
                    <select name="assignee" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm">
                        <option value="Unassigned">Unassigned</option>
                        {WORKLOAD_DATA.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                </div>

                {activeModal !== 'quick-task' && (
                    <div>
                        <label className="block text-xs font-bold text-pepper-700 dark:text-pepper-300 uppercase mb-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm resize-none"></textarea>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all">Create</button>
                </div>
            </form>
        </Modal>

        {/* Epic Modal */}
        <Modal isOpen={activeModal === 'epic'} onClose={() => setActiveModal(null)} title="Create Epic">
             <form onSubmit={handleCreateEpic} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">Epic Name *</label>
                    <input name="name" required className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">Description</label>
                    <textarea name="description" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" rows={3}></textarea>
                 </div>
                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-bold text-pepper-500">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">Create Epic</button>
                </div>
             </form>
        </Modal>

        {/* Release Modal */}
        <Modal isOpen={activeModal === 'release'} onClose={() => setActiveModal(null)} title="Create Release">
             <form onSubmit={handleCreateRelease} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1">Version *</label>
                        <input name="version" required placeholder="v1.0.0" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase mb-1">Date</label>
                        <input name="date" type="date" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" />
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <input type="checkbox" name="active" id="activeRel" />
                     <label htmlFor="activeRel" className="text-sm">Mark as Active Release</label>
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">Release Notes</label>
                    <textarea name="notes" className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm" rows={3}></textarea>
                 </div>
                 <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-bold text-pepper-500">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Schedule Release</button>
                </div>
             </form>
        </Modal>

        {/* Start Sprint Confirmation */}
        <Modal isOpen={activeModal === 'start-sprint'} onClose={() => setActiveModal(null)} title="Start Sprint">
            <div className="space-y-4">
                <p className="text-sm text-pepper-600 dark:text-pepper-300">
                    You are about to start <strong>Sprint 5</strong>. This will make it the active sprint on the dashboard.
                </p>
                <div className="bg-pepper-50 dark:bg-pepper-900/50 p-4 rounded-xl border border-pepper-100 dark:border-pepper-800 text-sm space-y-2">
                    <div className="flex justify-between"><span>Tasks:</span> <strong>12</strong></div>
                    <div className="flex justify-between"><span>Total Points:</span> <strong>34</strong></div>
                    <div className="flex justify-between"><span>Dates:</span> <strong>Nov 08 - Nov 22</strong></div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm font-bold text-pepper-500">Cancel</button>
                    <button onClick={handleStartSprint} className="px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold">Start Sprint</button>
                </div>
            </div>
        </Modal>

        {/* Sprint Error Modals */}
        <Modal isOpen={activeModal === 'no-planned-sprint'} onClose={() => setActiveModal(null)} title="No Planned Sprint">
            <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto text-2xl"><FiAlertCircle /></div>
                <p className="text-pepper-600 dark:text-pepper-300 text-sm">No planned sprint found. Please go to the Backlog to create one.</p>
                <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold">Close</button>
            </div>
        </Modal>
        
        <Modal isOpen={activeModal === 'sprint-active-alert'} onClose={() => setActiveModal(null)} title="Sprint in Progress">
            <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl"><FiActivity /></div>
                <p className="text-pepper-600 dark:text-pepper-300 text-sm">There is already an active sprint. Please complete it before starting a new one.</p>
                <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold">Understood</button>
            </div>
        </Modal>

        {/* --- AI Copilot Sidebar (Positioned Absolutely over content) --- */}
        <div 
            className="absolute inset-y-0 right-0 w-96 bg-white dark:bg-pepper-900 border-l border-pepper-200 dark:border-pepper-800 shadow-2xl transition-transform duration-300 ease-in-out z-[100] flex flex-col"
            style={{ transform: showAICopilot ? 'translateX(0)' : 'translateX(100%)' }}
        >
            <div className="p-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                <div className="flex items-center gap-2">
                    <BiBot className="text-xl text-purple-500" />
                    <h3 className="font-bold text-pepper-900 dark:text-white">Flownyx Copilot</h3>
                </div>
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAICopilot(false); }} 
                    className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-full transition-colors"
                >
                    <FiX />
                </button>
            </div>
            
            {/* Context */}
            <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-xs font-bold text-purple-700 dark:text-purple-300 flex flex-wrap gap-2">
                <span className="bg-white/50 px-2 py-0.5 rounded">Project: Flownyx</span>
                {activeSprint && <span className="bg-white/50 px-2 py-0.5 rounded">{activeSprint.name}</span>}
                <span className="bg-white/50 px-2 py-0.5 rounded">User: Alex</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-pepper-50/30 dark:bg-black/20">
                {aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-pepper-900 text-white rounded-br-none' : 'bg-white dark:bg-pepper-800 border border-pepper-100 dark:border-pepper-700 shadow-sm rounded-bl-none text-pepper-800 dark:text-pepper-100'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-pepper-100 dark:border-pepper-800 bg-white dark:bg-pepper-900">
                <div className="relative">
                    <input 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                        placeholder="Ask Copilot..." 
                        className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none"
                    />
                    <button onClick={handleAISend} className="absolute right-2 top-2 p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        <FiSend />
                    </button>
                </div>
                <div className="flex gap-2 mt-2 overflow-x-auto custom-scrollbar pb-1">
                    {['Summarize sprint', 'Create task', 'My priorities', 'Blockers'].map(cmd => (
                        <button key={cmd} onClick={() => setAiInput(cmd)} className="text-[10px] font-bold px-2 py-1 bg-pepper-100 dark:bg-pepper-800 rounded-md whitespace-nowrap hover:bg-pepper-200 dark:hover:bg-pepper-700 transition-colors">
                            {cmd}
                        </button>
                    ))}
                </div>
            </div>
        </div>

    </div>
  );
};