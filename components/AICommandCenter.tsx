
import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCommand, FiSend, FiCpu, FiActivity, FiClock, FiSearch, 
  FiMoreHorizontal, FiArrowRight, FiCheck, FiX, FiTerminal, 
  FiLayers, FiZap, FiTrendingUp, FiAlertCircle, FiFileText,
  FiCornerDownLeft, FiRefreshCw, FiUser, FiBarChart2, FiCheckCircle,
  FiFilter, FiTarget
} from 'react-icons/fi';
import { TbSparkles, TbPrompt, TbRobot, TbListSearch, TbChartBar, TbBrain } from 'react-icons/tb';

// --- TYPES ---

type MessageType = 'text' | 'task-preview' | 'analysis' | 'suggestion' | 'search-results' | 'confirmation';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type: MessageType;
  data?: any; 
  timestamp: Date;
}

interface CommandSuggestion {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  prompt: string;
}

interface Task {
  id: string;
  key: string;
  title: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee?: string;
}

// --- MOCK DB & INITIAL STATE ---

const MOCK_TASKS: Task[] = [
  { id: 't1', key: 'FLX-101', title: 'Design System Architecture', status: 'Done', priority: 'High', assignee: 'Alex' },
  { id: 't2', key: 'FLX-102', title: 'Implement Authentication', status: 'In Progress', priority: 'Critical', assignee: 'Sam' },
  { id: 't3', key: 'FLX-103', title: 'Refactor Sidebar Component', status: 'Todo', priority: 'Low', assignee: 'Alex' },
  { id: 't4', key: 'FLX-104', title: 'Database Migration Script', status: 'Review', priority: 'High', assignee: 'Jordan' },
  { id: 't5', key: 'FLX-105', title: 'Update API Documentation', status: 'Todo', priority: 'Medium', assignee: 'Sam' },
];

const SUGGESTIONS: CommandSuggestion[] = [
  { id: 's1', icon: FiActivity, label: 'Sprint Analysis', desc: 'Analyze current velocity', prompt: 'Analyze the current sprint status' },
  { id: 's2', icon: FiZap, label: 'Create Task', desc: 'Quickly add item', prompt: 'Create task "Update landing page" priority High' },
  { id: 's3', icon: FiSearch, label: 'Find Issues', desc: 'Search backlog', prompt: 'Find tasks assigned to Alex' },
  { id: 's4', icon: FiAlertCircle, label: 'Show Blockers', desc: 'Identify critical items', prompt: 'Show critical tasks in progress' },
];

// --- HELPER COMPONENTS ---

const TypingIndicator = () => (
  <div className="flex gap-1.5 p-2 items-center">
    <div className="w-1.5 h-1.5 bg-pepper-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-1.5 h-1.5 bg-pepper-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
    <div className="w-1.5 h-1.5 bg-pepper-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
  </div>
);

// Widget: Task Creation / Preview
const TaskPreviewCard = ({ data, onConfirm, onCancel }: { data: any, onConfirm: () => void, onCancel: () => void }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onConfirm();
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mt-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <FiCheck />
        </div>
        <div>
          <p className="text-sm font-bold text-pepper-900 dark:text-white">Task Created Successfully</p>
          <p className="text-xs text-pepper-500 dark:text-pepper-400">{data.key}: {data.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all w-full max-w-md mt-2">
        <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono font-bold text-pepper-500 bg-pepper-100 dark:bg-pepper-900/50 px-2 py-1 rounded">DRAFT-{data.key.split('-')[1]}</span>
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
              data.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
              data.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
              'bg-blue-50 text-blue-600 border-blue-200'
            } dark:bg-opacity-10`}>{data.priority}</span>
        </div>
        <h4 className="font-bold text-sm text-pepper-900 dark:text-white mb-1">{data.title}</h4>
        <p className="text-xs text-pepper-500 dark:text-pepper-400 mb-4">{data.desc || 'No description provided.'}</p>
        <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 text-xs font-bold py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <FiCheck /> Confirm
            </button>
            <button onClick={onCancel} className="flex-1 bg-pepper-100 dark:bg-pepper-700 text-pepper-600 dark:text-pepper-300 text-xs font-bold py-2 rounded-lg hover:bg-pepper-200 dark:hover:bg-pepper-600 transition-colors">
              Discard
            </button>
        </div>
    </div>
  );
};

// Widget: Search Results
const SearchResultsWidget = ({ results }: { results: Task[] }) => (
  <div className="bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-xl overflow-hidden mt-2 w-full">
    <div className="bg-pepper-50 dark:bg-pepper-900/50 px-4 py-2 border-b border-pepper-200 dark:border-pepper-700 flex justify-between items-center">
      <span className="text-xs font-bold text-pepper-500 uppercase flex items-center gap-2"><FiSearch /> Found {results.length} items</span>
    </div>
    <div className="max-h-60 overflow-y-auto custom-scrollbar">
      {results.length === 0 ? (
        <div className="p-4 text-center text-xs text-pepper-400">No tasks found matching your criteria.</div>
      ) : (
        results.map(task => (
          <div key={task.id} className="p-3 border-b border-pepper-100 dark:border-pepper-700/50 last:border-0 hover:bg-pepper-50 dark:hover:bg-pepper-700/30 transition-colors flex justify-between items-center group cursor-pointer">
             <div className="flex flex-col">
               <span className="text-xs font-bold text-pepper-900 dark:text-white group-hover:text-blue-500 transition-colors">{task.title}</span>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-mono text-pepper-400">{task.key}</span>
                 <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${task.status === 'Done' ? 'bg-emerald-100 text-emerald-600' : 'bg-pepper-100 text-pepper-600'} dark:bg-opacity-20`}>{task.status}</span>
               </div>
             </div>
             <div className="text-right">
                <span className={`text-[10px] font-bold ${task.priority === 'Critical' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : 'text-pepper-400'}`}>{task.priority}</span>
                {task.assignee && <div className="text-[10px] text-pepper-400 mt-0.5 flex items-center justify-end gap-1"><FiUser className="w-2 h-2" /> {task.assignee}</div>}
             </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Widget: Sprint Analysis
const AnalysisWidget = ({ data }: { data: { total: number, done: number, critical: number, velocity: number } }) => {
  const percentage = Math.round((data.done / data.total) * 100) || 0;
  
  return (
    <div className="bg-pepper-50 dark:bg-pepper-800/50 border border-pepper-200 dark:border-pepper-700 rounded-xl p-4 w-full mt-2">
        <div className="flex items-center gap-2 mb-4">
            <TbChartBar className="text-pepper-900 dark:text-white text-lg" />
            <h4 className="font-bold text-sm text-pepper-900 dark:text-white">Real-time Sprint Analysis</h4>
        </div>
        
        <div className="flex gap-4 mb-4">
           <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                 <span className="font-bold text-pepper-600 dark:text-pepper-300">Completion</span>
                 <span className="font-bold text-pepper-900 dark:text-white">{percentage}%</span>
              </div>
              <div className="w-full bg-pepper-200 dark:bg-pepper-700 h-2 rounded-full overflow-hidden">
                 <div className="bg-pepper-900 dark:bg-white h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-pepper-900 p-3 rounded-lg border border-pepper-100 dark:border-pepper-800 text-center">
                <span className="block text-[10px] text-pepper-500 uppercase tracking-wider mb-1">Velocity</span>
                <span className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                   <FiTrendingUp size={14} /> {data.velocity}
                </span>
            </div>
            <div className="bg-white dark:bg-pepper-900 p-3 rounded-lg border border-pepper-100 dark:border-pepper-800 text-center">
                <span className="block text-[10px] text-pepper-500 uppercase tracking-wider mb-1">Tasks</span>
                <span className="block text-lg font-bold text-pepper-900 dark:text-white">{data.done}/{data.total}</span>
            </div>
            <div className="bg-white dark:bg-pepper-900 p-3 rounded-lg border border-pepper-100 dark:border-pepper-800 text-center">
                <span className="block text-[10px] text-pepper-500 uppercase tracking-wider mb-1">Critical</span>
                <span className={`block text-lg font-bold ${data.critical > 0 ? 'text-red-500' : 'text-pepper-900 dark:text-white'}`}>{data.critical}</span>
            </div>
        </div>
        
        <div className="text-xs text-pepper-600 dark:text-pepper-300 bg-white dark:bg-pepper-900/50 p-3 rounded-lg border border-pepper-100 dark:border-pepper-800/50 flex gap-2 items-start">
            <TbBrain className="text-purple-500 shrink-0 text-base" />
            <div>
              <p className="font-bold mb-1 text-pepper-900 dark:text-white">AI Recommendation:</p>
              {data.critical > 0 
                ? `Focus immediate attention on the ${data.critical} critical items. Consider reallocating resources from low-priority tasks.`
                : `Progress is steady. You are on track to meet the sprint goal if current velocity is maintained.`
              }
            </div>
        </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const AICommandCenter: React.FC = () => {
  // State
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS); // Local "DB"
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'm0', 
      role: 'ai', 
      content: 'Hello Alex. I am ready to assist with your project management tasks. Choose a quick action or type a command.', 
      type: 'text', 
      timestamp: new Date() 
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // --- LOGIC: Command Parser ---

  const handleTaskCreation = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const processCommand = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    setIsTyping(true);

    // Simulate network delay
    setTimeout(() => {
      let responseMsg: Message;
      const newId = `ai-${Date.now()}`;

      // 1. ANALYZE
      if (lowerInput.includes('analyze') || lowerInput.includes('report') || lowerInput.includes('status')) {
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'Done').length;
        const critical = tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;
        
        responseMsg = {
          id: newId,
          role: 'ai',
          content: 'Here is the analysis of your current sprint context:',
          type: 'analysis',
          data: { total, done, critical, velocity: 24 },
          timestamp: new Date()
        };
      } 
      // 2. CREATE
      else if (lowerInput.startsWith('create') || lowerInput.startsWith('add task')) {
        // Simple regex to extract details: "Create task 'Fix Bug' priority High"
        const titleMatch = input.match(/["']([^"']+)["']/) || input.match(/task\s+(.+?)(?:\s+priority|$)/i);
        const priorityMatch = input.match(/priority\s+(low|medium|high|critical)/i);
        
        const title = titleMatch ? titleMatch[1] : 'Untitled Task';
        const priority = priorityMatch ? (priorityMatch[1].charAt(0).toUpperCase() + priorityMatch[1].slice(1)) : 'Medium';
        
        const nextId = 100 + tasks.length + 1;
        const draftTask = {
          key: `FLX-${nextId}`,
          title: title,
          desc: 'Created via AI Command Center. Please review details.',
          priority: priority,
          status: 'Todo'
        };

        responseMsg = {
          id: newId,
          role: 'ai',
          content: 'I have drafted a new task based on your request. Please confirm to add it to the board.',
          type: 'task-preview',
          data: draftTask,
          timestamp: new Date()
        };
      }
      // 3. SEARCH / FIND
      else if (lowerInput.startsWith('find') || lowerInput.startsWith('search') || lowerInput.startsWith('show')) {
        const searchTerm = input.replace(/^(find|search|show)\s+/i, '').replace(/tasks|issues/i, '').trim();
        
        let results = tasks;
        if (searchTerm.toLowerCase().includes('critical')) {
           results = results.filter(t => t.priority === 'Critical');
        } else if (searchTerm.toLowerCase().includes('assign')) {
           // Mock extraction of name
           const name = searchTerm.split(' ').pop();
           results = results.filter(t => t.assignee?.toLowerCase().includes(name?.toLowerCase() || ''));
        } else {
           results = results.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        responseMsg = {
          id: newId,
          role: 'ai',
          content: `I found ${results.length} tasks matching "${searchTerm}":`,
          type: 'search-results',
          data: results,
          timestamp: new Date()
        };
      }
      // 4. DEFAULT / HELP
      else {
        responseMsg = {
          id: newId,
          role: 'ai',
          content: "I didn't quite catch that. Try commands like:\n• Create task \"Title\" priority High\n• Analyze sprint\n• Find tasks assigned to Alex\n• Show critical bugs",
          type: 'text',
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, responseMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleSend = (text: string = query) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      type: 'text',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    
    // Process
    processCommand(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* --- HEADER --- */}
      <div className="h-16 px-6 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pepper-900 dark:bg-white flex items-center justify-center text-white dark:text-pepper-900 shadow-sm">
             <TbSparkles className="text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-pepper-900 dark:text-white leading-none">
              AI Command Center
            </h1>
            <p className="text-[10px] text-pepper-500 font-medium uppercase tracking-wider mt-0.5">Automated Project Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-pepper-500">
               <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-500"/> {tasks.length} Active Tasks</span>
            </div>
            <div className="h-4 w-px bg-pepper-200 dark:bg-pepper-800 hidden md:block"></div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-pepper-100 dark:bg-pepper-800 rounded-full text-xs font-bold text-pepper-600 dark:text-pepper-300 border border-pepper-200 dark:border-pepper-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Engine Online
            </span>
        </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* CENTER: FEED & INPUT */}
          <div className="flex-1 flex flex-col relative max-w-4xl mx-auto w-full">
              
              {/* FEED */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                  {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                              msg.role === 'ai' 
                              ? 'bg-white dark:bg-pepper-800 border-pepper-200 dark:border-pepper-700 text-pepper-900 dark:text-white' 
                              : 'bg-pepper-900 dark:bg-white border-transparent text-white dark:text-pepper-900'
                          }`}>
                              {msg.role === 'ai' ? <TbRobot /> : 'AM'}
                          </div>

                          {/* Bubble */}
                          <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                                  msg.role === 'user'
                                  ? 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-tr-none'
                                  : 'bg-white dark:bg-pepper-800 text-pepper-800 dark:text-pepper-200 border border-pepper-200 dark:border-pepper-700 rounded-tl-none'
                              }`}>
                                  {msg.content}
                              </div>
                              
                              {/* Dynamic Widgets */}
                              {msg.type === 'task-preview' && msg.data && (
                                <TaskPreviewCard 
                                  data={msg.data} 
                                  onConfirm={() => {
                                    handleTaskCreation({
                                      id: `t-${Date.now()}`,
                                      key: msg.data.key,
                                      title: msg.data.title,
                                      status: 'Todo',
                                      priority: msg.data.priority,
                                      assignee: 'Unassigned'
                                    });
                                  }} 
                                  onCancel={() => {/* no-op for visual demo */}} 
                                />
                              )}
                              
                              {msg.type === 'search-results' && msg.data && (
                                <SearchResultsWidget results={msg.data} />
                              )}

                              {msg.type === 'analysis' && msg.data && (
                                <AnalysisWidget data={msg.data} />
                              )}
                              
                              <span className="text-[10px] text-pepper-400 mt-1 px-1">
                                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                          </div>
                      </div>
                  ))}
                  
                  {isTyping && (
                      <div className="flex gap-4 animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 flex items-center justify-center text-pepper-900 dark:text-white shrink-0">
                              <TbRobot />
                          </div>
                          <div className="px-4 py-3 bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-2xl rounded-tl-none shadow-sm">
                              <TypingIndicator />
                          </div>
                      </div>
                  )}
              </div>

              {/* INPUT AREA */}
              <div className="p-6 pt-2 shrink-0">
                  {/* Suggestions Chips */}
                  {messages.length < 3 && !isTyping && (
                      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                          {SUGGESTIONS.map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => handleSend(s.prompt)}
                                className="flex-none flex items-center gap-2 px-4 py-2 bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 hover:border-pepper-400 dark:hover:border-pepper-500 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 group"
                              >
                                  <div className="p-1.5 bg-pepper-50 dark:bg-pepper-900 rounded-lg text-pepper-500 group-hover:text-pepper-900 dark:group-hover:text-white transition-colors">
                                      <s.icon />
                                  </div>
                                  <div className="text-left">
                                      <span className="block text-xs font-bold text-pepper-900 dark:text-white">{s.label}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}

                  <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-pepper-200 to-pepper-400 dark:from-pepper-700 dark:to-pepper-500 rounded-2xl opacity-20 group-focus-within:opacity-50 transition duration-500 blur"></div>
                      <div className="relative flex items-end gap-2 bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-xl p-2 shadow-lg">
                          <div className="p-3 text-pepper-400">
                              <FiCommand className="text-lg" />
                          </div>
                          <textarea
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Type a command (e.g., 'Create task', 'Analyze sprint')..."
                              className="flex-1 max-h-32 min-h-[44px] py-3 bg-transparent border-none outline-none text-sm text-pepper-900 dark:text-white placeholder-pepper-400 resize-none"
                              rows={1}
                          />
                          <button 
                              onClick={() => handleSend()}
                              disabled={!query.trim() || isTyping}
                              className={`p-3 rounded-lg transition-all ${
                                  query.trim() 
                                  ? 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 shadow-md hover:shadow-lg' 
                                  : 'bg-pepper-100 dark:bg-pepper-800 text-pepper-400 cursor-not-allowed'
                              }`}
                          >
                              <FiCornerDownLeft className="text-lg" />
                          </button>
                      </div>
                  </div>
                  <p className="text-center text-[10px] text-pepper-400 mt-3 flex items-center justify-center gap-1">
                      <FiTerminal className="text-xs" /> AI operates on local mock data for demonstration.
                  </p>
              </div>
          </div>

          {/* RIGHT RAIL: CONTEXT */}
          <div className="w-80 bg-white/50 dark:bg-pepper-900/50 border-l border-pepper-200 dark:border-pepper-800 hidden xl:flex flex-col p-6 backdrop-blur-sm">
              <div className="mb-8">
                  <h3 className="text-xs font-bold text-pepper-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FiLayers /> Active Context
                  </h3>
                  <div className="space-y-3">
                      <div className="bg-white dark:bg-pepper-800 p-3 rounded-xl border border-pepper-200 dark:border-pepper-700 shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <FiActivity />
                          </div>
                          <div>
                              <span className="block text-xs text-pepper-500">Current Sprint</span>
                              <span className="block text-sm font-bold text-pepper-900 dark:text-white">Sprint 4</span>
                          </div>
                      </div>
                      <div className="bg-white dark:bg-pepper-800 p-3 rounded-xl border border-pepper-200 dark:border-pepper-700 shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <FiUser />
                          </div>
                          <div>
                              <span className="block text-xs text-pepper-500">User Role</span>
                              <span className="block text-sm font-bold text-pepper-900 dark:text-white">Product Owner</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-bold text-pepper-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FiTarget /> Recently Created
                  </h3>
                  {tasks.length > 5 ? (
                    <div className="space-y-2">
                      {tasks.slice(0, 5).map((t) => (
                          <div key={t.id} className="p-2 bg-white dark:bg-pepper-800 border border-pepper-100 dark:border-pepper-700 rounded-lg flex justify-between items-center group cursor-pointer hover:border-pepper-300 transition-colors">
                              <div>
                                <span className="block text-[10px] font-mono text-pepper-400">{t.key}</span>
                                <span className="block text-xs font-medium text-pepper-800 dark:text-pepper-200 truncate max-w-[140px]">{t.title}</span>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${t.priority === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-pepper-400 italic">No recent tasks.</p>
                  )}

                  <h3 className="text-xs font-bold text-pepper-400 uppercase tracking-wider mt-6 mb-4 flex items-center gap-2">
                      <TbListSearch /> Recent Prompts
                  </h3>
                  <div className="space-y-2">
                      {['Summarize backlog issues', 'Generate release notes v2.4', 'Check team capacity'].map((p, i) => (
                          <button key={i} onClick={() => handleSend(p)} className="w-full text-left p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-xs font-medium text-pepper-600 dark:text-pepper-300 transition-colors flex items-center gap-2 group">
                              <FiClock className="text-pepper-400 group-hover:text-pepper-900 dark:group-hover:text-white" />
                              <span className="truncate">{p}</span>
                          </button>
                      ))}
                  </div>
              </div>

              <div className="mt-auto bg-pepper-50 dark:bg-pepper-800 p-4 rounded-xl border border-pepper-200 dark:border-pepper-700">
                  <h4 className="font-bold text-xs text-pepper-900 dark:text-white mb-1 flex items-center gap-2">
                      <FiCpu /> System Status
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-pepper-500 mt-2">
                      <span>Model: Gemini 2.5</span>
                      <span className="flex items-center gap-1 text-emerald-500"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> 98% Uptime</span>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};
