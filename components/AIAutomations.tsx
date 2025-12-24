
import React, { useState } from 'react';
import { 
  FiZap, FiActivity, FiClock, FiCheckCircle, FiAlertCircle, 
  FiPlus, FiMoreHorizontal, FiSettings, FiPlay, FiPause, 
  FiTrash2, FiSearch, FiToggleRight, FiToggleLeft, FiArrowRight,
  FiCommand, FiLayers, FiCpu, FiBell, FiUser, FiX, FiEdit2, FiCheck,
  FiDownloadCloud, FiFilter, FiRefreshCw
} from 'react-icons/fi';
import { TbRobot, TbWand, TbArrowMerge, TbHistory, TbChartDots, TbBolt } from 'react-icons/tb';
import { Modal } from './Modal';

// --- TYPES ---

type Category = 'Triage' | 'Maintenance' | 'Notification' | 'Workflow';

interface AutomationRule {
  id: string;
  title: string;
  description: string;
  trigger: string;
  action: string;
  category: Category;
  active: boolean;
  executions: number;
  lastRun: string;
}

interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  actionTaken: string;
  status: 'success' | 'failed';
}

interface AiSuggestion {
  id: string;
  title: string;
  reason: string;
  impact: 'High' | 'Medium' | 'Low';
  suggestedRule: Partial<AutomationRule>;
}

// --- MOCK DATA ---

const INITIAL_RULES: AutomationRule[] = [
  { 
    id: '1', title: 'Auto-Assign Critical Bugs', description: 'Assign P1 bugs to Tech Lead immediately', 
    trigger: 'Issue Created (Bug, Critical)', action: 'Assign to @Jordan', 
    category: 'Triage', active: true, executions: 12, lastRun: '10m ago' 
  },
  { 
    id: '2', title: 'Stale Task Alert', description: 'Notify assignee if task is In Progress > 3 days', 
    trigger: 'Status Duration > 3d', action: 'Send Notification', 
    category: 'Notification', active: true, executions: 45, lastRun: '2h ago' 
  },
  { 
    id: '3', title: 'Code Review Pipeline', description: 'Move to Review when PR is opened', 
    trigger: 'GitHub PR Open', action: 'Set Status: Review', 
    category: 'Workflow', active: true, executions: 8, lastRun: '1h ago' 
  },
];

const TEMPLATE_RULES: AutomationRule[] = [
  { 
    id: 't1', title: 'Sprint Rollover', description: 'Move unfinished tasks to next sprint automatically', 
    trigger: 'Sprint Completed', action: 'Move to Next Sprint', 
    category: 'Maintenance', active: false, executions: 0, lastRun: 'Never' 
  },
  { 
    id: 't2', title: 'Welcome New User', description: 'Send onboarding email when user added', 
    trigger: 'User Created', action: 'Send Email: Welcome', 
    category: 'Notification', active: false, executions: 0, lastRun: 'Never' 
  },
  { 
    id: 't3', title: 'Archive Done Tasks', description: 'Archive tasks after 30 days of inactivity', 
    trigger: 'Status: Done > 30d', action: 'Archive Task', 
    category: 'Maintenance', active: false, executions: 0, lastRun: 'Never' 
  },
];

const INITIAL_LOGS: AutomationLog[] = [
  { id: 'l1', ruleId: '1', ruleName: 'Auto-Assign Critical Bugs', timestamp: '10:42 AM', actionTaken: 'Assigned FLX-302 to Jordan', status: 'success' },
  { id: 'l2', ruleId: '4', ruleName: 'Code Review Pipeline', timestamp: '09:15 AM', actionTaken: 'Moved FLX-299 to Review', status: 'success' },
  { id: 'l3', ruleId: '2', ruleName: 'Stale Task Alert', timestamp: 'Yesterday', actionTaken: 'Notified Sam about FLX-105', status: 'success' },
  { id: 'l4', ruleId: '4', ruleName: 'Code Review Pipeline', timestamp: 'Yesterday', actionTaken: 'Failed to link PR: Auth Error', status: 'failed' },
];

const INITIAL_SUGGESTIONS: AiSuggestion[] = [
  { 
    id: 's1', 
    title: 'Archive Done Tasks', 
    reason: 'The "Done" column has 45+ items slowing down board load.', 
    impact: 'High',
    suggestedRule: {
        title: 'Auto-Archive Done Tasks',
        description: 'Archive tasks that have been Done for > 14 days',
        trigger: 'Status: Done > 14d',
        action: 'Archive Task',
        category: 'Maintenance'
    }
  },
  { 
    id: 's2', 
    title: 'Auto-Label Frontend', 
    reason: 'You manually tagged 15 tasks as "Frontend" based on description keywords.', 
    impact: 'Medium',
    suggestedRule: {
        title: 'Auto-Label Frontend Tasks',
        description: 'Add "Frontend" tag if description contains "css", "ui", or "react"',
        trigger: 'Description contains keywords',
        action: 'Add Tag: Frontend',
        category: 'Triage'
    }
  },
];

// --- CUSTOM CHART COMPONENT (Replaces Recharts for CSP Safety) ---
const ExecutionChart = () => {
  const data = [12, 18, 10, 24, 16, 5, 2];
  const max = Math.max(...data);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="h-24 w-full flex items-end justify-between gap-2 pt-4">
      {data.map((val, i) => {
        const heightPct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
            <div className="w-full relative h-16 flex items-end bg-pepper-100 dark:bg-pepper-800 rounded-sm overflow-hidden">
               <div 
                 className={`w-full transition-all duration-500 rounded-sm ${i === 3 ? 'bg-emerald-500' : 'bg-blue-500 group-hover:bg-blue-400'}`} 
                 style={{ height: `${heightPct}%` }}
               ></div>
               {/* Tooltip */}
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-pepper-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                 {val} runs
               </div>
            </div>
            <span className="text-[9px] font-bold text-pepper-400">{days[i]}</span>
          </div>
        )
      })}
    </div>
  );
};

// --- MAIN COMPONENT ---

export const AIAutomations: React.FC = () => {
  // State
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [logs, setLogs] = useState<AutomationLog[]>(INITIAL_LOGS);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>(INITIAL_SUGGESTIONS);
  const [activeTab, setActiveTab] = useState<'rules' | 'library' | 'logs'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- Handlers ---

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDeleteRule = (id: string) => {
      if (window.confirm("Are you sure you want to delete this rule?")) {
          setRules(prev => prev.filter(r => r.id !== id));
      }
  };

  const handleRunNow = (id: string) => {
      setProcessingId(id);
      setTimeout(() => {
        const rule = rules.find(r => r.id === id);
        if (rule) {
            const newLog: AutomationLog = {
                id: `l-${Date.now()}`,
                ruleId: rule.id,
                ruleName: rule.title,
                timestamp: 'Just now',
                actionTaken: `Manually executed: ${rule.action}`,
                status: 'success'
            };
            setLogs(prev => [newLog, ...prev]);
            setRules(prev => prev.map(r => r.id === id ? { ...r, executions: r.executions + 1, lastRun: 'Just now' } : r));
        }
        setProcessingId(null);
      }, 1000); // Simulate network delay
  };

  const handleApplySuggestion = (suggestion: AiSuggestion) => {
      const newRule: AutomationRule = {
          id: `r-${Date.now()}`,
          title: suggestion.suggestedRule.title || 'New Rule',
          description: suggestion.suggestedRule.description || '',
          trigger: suggestion.suggestedRule.trigger || '',
          action: suggestion.suggestedRule.action || '',
          category: (suggestion.suggestedRule.category as Category) || 'Workflow',
          active: true,
          executions: 0,
          lastRun: 'Never'
      };
      setRules(prev => [newRule, ...prev]);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setActiveTab('rules');
  };

  const handleInstallTemplate = (template: AutomationRule) => {
      const newRule = { ...template, id: `r-${Date.now()}`, active: true };
      setRules(prev => [newRule, ...prev]);
      setActiveTab('rules');
  };

  const handleSaveRule = (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      
      const newRuleData = {
          title: data.get('title') as string,
          description: data.get('description') as string,
          category: data.get('category') as Category,
          trigger: data.get('trigger') as string,
          action: data.get('action') as string,
      };

      if (editingRule) {
          setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...newRuleData } : r));
      } else {
          const newRule: AutomationRule = {
              id: `r-${Date.now()}`,
              ...newRuleData,
              active: true,
              executions: 0,
              lastRun: 'Never'
          };
          setRules(prev => [newRule, ...prev]);
      }
      setIsModalOpen(false);
      setEditingRule(null);
  };

  const filteredRules = rules.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- RENDER HELPERS ---

  const StatCard = ({ label, value, subtext, icon: Icon }: any) => (
    <div className="bg-white dark:bg-pepper-900 p-4 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-pepper-50 dark:bg-pepper-800 flex items-center justify-center text-pepper-900 dark:text-white text-xl">
        <Icon />
      </div>
      <div>
        <p className="text-xs font-bold text-pepper-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-pepper-900 dark:text-white">{value}</span>
          <span className="text-[10px] text-pepper-400 font-medium">{subtext}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* HEADER */}
      <div className="h-20 px-8 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-pepper-900 dark:text-white flex items-center gap-3">
            <TbWand className="text-pepper-400" /> AI Automations
          </h1>
          <p className="text-xs text-pepper-500 dark:text-pepper-400 mt-1 font-medium">Workflow optimization and intelligent triggers</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search..." 
               className="pl-9 pr-4 py-2 bg-pepper-100 dark:bg-pepper-800 border-none rounded-xl text-sm w-48 focus:ring-2 focus:ring-pepper-900/20 outline-none transition-all focus:w-64 focus:bg-white dark:focus:bg-pepper-900 border border-transparent focus:border-pepper-200 dark:focus:border-pepper-700 text-pepper-900 dark:text-white placeholder-pepper-400"
             />
          </div>
          <button 
            onClick={() => { setEditingRule(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <FiPlus /> New Rule
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-hidden p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
          
          {/* LEFT COLUMN: MAIN CONTENT (2/3) */}
          <div className="xl:col-span-2 flex flex-col h-full gap-6 overflow-hidden">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <StatCard label="Active Rules" value={rules.filter(r => r.active).length} subtext={`of ${rules.length} total`} icon={FiLayers} />
              <StatCard label="Time Saved" value="14h" subtext="this week" icon={FiClock} />
              <StatCard label="Actions Run" value="128" subtext="+12% vs last wk" icon={FiCpu} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-pepper-200/50 dark:bg-pepper-800/50 p-1 rounded-xl shrink-0 self-start">
                {[
                    { id: 'rules', label: 'My Rules', icon: FiZap },
                    { id: 'library', label: 'Template Library', icon: FiDownloadCloud },
                    { id: 'logs', label: 'Execution Logs', icon: TbHistory },
                ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-200'}`}
                    >
                      <tab.icon /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white/50 dark:bg-pepper-900/50 border border-pepper-200 dark:border-pepper-800 rounded-2xl p-1 relative">
               
               {/* --- MY RULES TAB --- */}
               {activeTab === 'rules' && (
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                      {filteredRules.length > 0 ? (
                          filteredRules.map(rule => (
                            <div key={rule.id} className={`group bg-white dark:bg-pepper-900 border ${rule.active ? 'border-pepper-200 dark:border-pepper-700' : 'border-pepper-100 dark:border-pepper-800 opacity-70'} rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.active ? 'bg-pepper-900 dark:bg-white' : 'bg-transparent'} transition-colors`}></div>
                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${rule.active ? 'bg-pepper-100 dark:bg-pepper-800 text-pepper-900 dark:text-white' : 'bg-pepper-50 dark:bg-pepper-800/50 text-pepper-400'}`}>
                                            {rule.category === 'Triage' && <FiArrowRight />}
                                            {rule.category === 'Notification' && <FiBell />}
                                            {rule.category === 'Maintenance' && <FiTrash2 />}
                                            {rule.category === 'Workflow' && <TbArrowMerge />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${rule.active ? 'text-pepper-900 dark:text-white' : 'text-pepper-500 dark:text-pepper-400'}`}>{rule.title}</h3>
                                            <p className="text-xs text-pepper-500 dark:text-pepper-500 line-clamp-1">{rule.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleRule(rule.id)} className={`text-2xl transition-colors ${rule.active ? 'text-emerald-500' : 'text-pepper-300 dark:text-pepper-600'}`}>
                                            {rule.active ? <FiToggleRight /> : <FiToggleLeft />}
                                        </button>
                                    </div>
                                </div>
                                <div className="pl-2 mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-pepper-50 dark:bg-pepper-800/50 rounded-lg p-2 border border-pepper-100 dark:border-pepper-800/50 flex items-center gap-2">
                                        <FiZap className="text-pepper-400 shrink-0" />
                                        <span className="text-xs font-bold text-pepper-700 dark:text-pepper-200 truncate">{rule.trigger}</span>
                                    </div>
                                    <div className="bg-pepper-50 dark:bg-pepper-800/50 rounded-lg p-2 border border-pepper-100 dark:border-pepper-800/50 flex items-center gap-2">
                                        <FiCommand className="text-pepper-400 shrink-0" />
                                        <span className="text-xs font-bold text-pepper-700 dark:text-pepper-200 truncate">{rule.action}</span>
                                    </div>
                                </div>
                                <div className="pl-2 mt-4 pt-3 border-t border-pepper-100 dark:border-pepper-800 flex justify-between items-center text-[10px] text-pepper-400 font-medium">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><FiActivity /> {rule.executions} runs</span>
                                        <span className="flex items-center gap-1"><FiClock /> {rule.lastRun}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleRunNow(rule.id)} 
                                            disabled={processingId === rule.id}
                                            className={`flex items-center gap-1 px-2 py-1 bg-pepper-100 dark:bg-pepper-800 hover:bg-pepper-200 dark:hover:bg-pepper-700 rounded text-pepper-600 dark:text-pepper-300 transition-colors ${processingId === rule.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FiPlay size={10} className={processingId === rule.id ? 'animate-spin' : ''} /> {processingId === rule.id ? 'Running...' : 'Run Now'}
                                        </button>
                                        <button onClick={() => { setEditingRule(rule); setIsModalOpen(true); }} className="p-1.5 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded text-pepper-500 hover:text-pepper-900 dark:hover:text-white transition-colors"><FiEdit2 size={12} /></button>
                                        <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded text-pepper-500 hover:text-red-500 transition-colors"><FiTrash2 size={12} /></button>
                                    </div>
                                </div>
                            </div>
                          ))
                      ) : (
                          <div className="text-center py-20 flex flex-col items-center">
                              <div className="w-16 h-16 bg-pepper-100 dark:bg-pepper-800 rounded-full flex items-center justify-center text-pepper-400 mb-4"><FiSearch size={24} /></div>
                              <p className="text-pepper-500 font-medium">No rules found.</p>
                              <button onClick={() => { setEditingRule(null); setIsModalOpen(true); }} className="mt-2 text-xs font-bold text-blue-500 hover:underline">Create a new rule</button>
                          </div>
                      )}
                   </div>
               )}

               {/* --- LIBRARY TAB --- */}
               {activeTab === 'library' && (
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                       <h3 className="text-xs font-bold text-pepper-500 uppercase tracking-wider px-2">Popular Templates</h3>
                       {TEMPLATE_RULES.map(template => (
                           <div key={template.id} className="bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-800 rounded-xl p-4 flex items-center gap-4 hover:border-pepper-300 dark:hover:border-pepper-600 transition-all">
                               <div className="w-12 h-12 bg-pepper-50 dark:bg-pepper-800 rounded-lg flex items-center justify-center text-pepper-500 text-xl">
                                   <TbBolt />
                               </div>
                               <div className="flex-1">
                                   <h4 className="font-bold text-sm text-pepper-900 dark:text-white">{template.title}</h4>
                                   <p className="text-xs text-pepper-500 dark:text-pepper-400 mt-0.5">{template.description}</p>
                                   <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-pepper-400">
                                       <span className="bg-pepper-100 dark:bg-pepper-800 px-1.5 py-0.5 rounded">IF: {template.trigger}</span>
                                       <FiArrowRight />
                                       <span className="bg-pepper-100 dark:bg-pepper-800 px-1.5 py-0.5 rounded">THEN: {template.action}</span>
                                   </div>
                               </div>
                               <button 
                                 onClick={() => handleInstallTemplate(template)}
                                 className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 text-xs font-bold rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2"
                               >
                                   <FiDownloadCloud /> Install
                               </button>
                           </div>
                       ))}
                   </div>
               )}

               {/* --- LOGS TAB --- */}
               {activeTab === 'logs' && (
                   <div className="flex-1 overflow-hidden flex flex-col">
                       <div className="p-3 border-b border-pepper-100 dark:border-pepper-800 flex justify-end gap-2">
                           <button className="text-xs font-bold text-pepper-500 hover:text-pepper-900 px-2 py-1 bg-pepper-50 dark:bg-pepper-800 rounded">All</button>
                           <button className="text-xs font-bold text-emerald-600 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded">Success</button>
                           <button className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">Failed</button>
                       </div>
                       <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                           {logs.map(log => (
                               <div key={log.id} className="flex gap-3 p-3 bg-white dark:bg-pepper-900 border border-pepper-100 dark:border-pepper-800 rounded-lg text-sm">
                                   <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                   <div className="flex-1">
                                       <div className="flex justify-between">
                                           <span className="font-bold text-pepper-900 dark:text-white">{log.ruleName}</span>
                                           <span className="text-xs text-pepper-400 font-mono">{log.timestamp}</span>
                                       </div>
                                       <p className="text-pepper-600 dark:text-pepper-400 text-xs mt-1">{log.actionTaken}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
            </div>
          </div>

          {/* RIGHT COLUMN: INTELLIGENCE & STATS (1/3) */}
          <div className="xl:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-gradient-to-br from-pepper-900 to-black dark:from-white dark:to-pepper-200 rounded-2xl p-6 text-white dark:text-pepper-900 shadow-lg relative overflow-hidden shrink-0">
                <TbRobot className="absolute top-0 right-0 p-4 text-7xl opacity-10 rotate-12" />
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10 opacity-90">
                    <TbWand /> AI Suggestions
                </h3>
                
                <div className="space-y-3 relative z-10">
                    {suggestions.map(sugg => (
                    <div key={sugg.id} className="bg-white/10 dark:bg-black/5 backdrop-blur-md rounded-xl p-3 border border-white/10 dark:border-black/5 hover:bg-white/20 dark:hover:bg-black/10 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{sugg.title}</h4>
                            <span className="text-[9px] bg-white/20 dark:bg-black/10 px-1.5 py-0.5 rounded font-bold uppercase">{sugg.impact} Impact</span>
                        </div>
                        <p className="text-xs opacity-70 leading-relaxed">{sugg.reason}</p>
                        <button 
                            onClick={() => handleApplySuggestion(sugg)}
                            className="mt-2 text-[10px] font-bold bg-white dark:bg-pepper-900 text-pepper-900 dark:text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all w-full flex items-center justify-center gap-1"
                        >
                            <FiCheck /> Review & Enable
                        </button>
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Performance Chart Widget */}
            <div className="bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-800 rounded-2xl flex flex-col shadow-sm p-5">
                <h3 className="font-bold text-sm text-pepper-900 dark:text-white mb-2">Execution Trend</h3>
                <p className="text-xs text-pepper-500 mb-4">Total automated actions over the last 7 days.</p>
                <ExecutionChart />
                <div className="mt-4 pt-4 border-t border-pepper-100 dark:border-pepper-800 flex justify-between items-center text-xs text-pepper-500">
                    <span>Total Runs: <strong className="text-pepper-900 dark:text-white">87</strong></span>
                    <span className="text-emerald-500 font-bold">+12% vs last week</span>
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- CREATE/EDIT MODAL (STRUCTURED BUILDER) --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                  <h3 className="font-bold text-lg text-pepper-900 dark:text-white flex items-center gap-2">
                      {editingRule ? <FiEdit2 /> : <FiPlus />}
                      {editingRule ? 'Edit Rule' : 'New Automation Rule'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-pepper-500 hover:text-pepper-800 dark:hover:text-white"><FiX /></button>
              </div>
              
              <form onSubmit={handleSaveRule} className="p-6 space-y-5">
                  <div>
                      <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Rule Name</label>
                      <input 
                        name="title" 
                        required 
                        defaultValue={editingRule?.title}
                        className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white text-pepper-900 dark:text-white" 
                        placeholder="e.g. Auto-Assign Bugs"
                      />
                  </div>

                  {/* Logic Builder UI */}
                  <div className="space-y-3">
                      <div className="p-3 bg-pepper-50 dark:bg-pepper-800/50 rounded-xl border border-pepper-200 dark:border-pepper-700">
                          <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-2 flex items-center gap-1"><FiZap /> When this happens (Trigger)</label>
                          <select 
                            name="trigger" 
                            defaultValue={editingRule?.trigger || 'Issue Created'}
                            className="w-full bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none font-medium"
                          >
                              <option value="Issue Created">Issue Created</option>
                              <option value="Status Changed">Status Changed</option>
                              <option value="Due Date Approaching">Due Date Approaching</option>
                              <option value="Sprint Completed">Sprint Completed</option>
                              <option value="GitHub PR Open">GitHub PR Open</option>
                          </select>
                      </div>

                      <div className="flex justify-center -my-4 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-pepper-200 dark:bg-pepper-700 flex items-center justify-center text-pepper-500 dark:text-pepper-300 border-4 border-white dark:border-pepper-900">
                              <FiArrowRight size={14} />
                          </div>
                      </div>

                      <div className="p-3 bg-pepper-50 dark:bg-pepper-800/50 rounded-xl border border-pepper-200 dark:border-pepper-700">
                          <label className="block text-[10px] font-bold text-pepper-400 uppercase mb-2 flex items-center gap-1"><FiCommand /> Do this (Action)</label>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                              <select 
                                name="category" 
                                defaultValue={editingRule?.category || 'Triage'} 
                                className="w-full bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none"
                              >
                                  <option value="Triage">Triage</option>
                                  <option value="Notification">Notification</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Workflow">Workflow</option>
                              </select>
                              <input 
                                name="action" 
                                defaultValue={editingRule?.action}
                                placeholder="e.g. Assign to Tech Lead"
                                className="w-full bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none"
                              />
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Description</label>
                      <textarea 
                        name="description" 
                        rows={2}
                        defaultValue={editingRule?.description}
                        className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 resize-none text-pepper-900 dark:text-white"
                        placeholder="Explain what this rule does..."
                      />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Save Rule</button>
                  </div>
              </form>
          </div>
      </Modal>

    </div>
  );
};
