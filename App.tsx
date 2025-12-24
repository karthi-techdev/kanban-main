
import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { 
  FiChevronLeft, FiChevronRight, FiBell, FiCpu, FiLogOut, 
  FiUser, FiPenTool, FiCheck, FiLock, FiArrowUpRight
} from 'react-icons/fi';
import { BiAccessibility } from 'react-icons/bi';
import { 
  TbSquareRoundedLetterF,
  TbLayoutDashboard, TbListCheck, TbLayoutKanban, TbClock, TbRoute, TbRocket, TbChartBar,
  TbSparkles, TbBulb, TbWand, TbUsers, TbUsersGroup, TbGauge, TbHierarchy2, TbBook,
  TbPencil, TbFlask, TbGitBranch, TbPlug, TbHistory, TbSettings, TbCreditCard,
  TbBell, TbFolder, TbServer, TbTerminal2, TbFileDescription, TbInfinity, TbShieldLock,
  TbCloudUpload
} from 'react-icons/tb';
import Tippy from '@tippyjs/react';
import { DashboardOverview } from './components/DashboardOverview';
import { KanbanBoard } from './components/KanbanBoard';
import { Backlog } from './components/Backlog';
import { DiagramStudio } from './components/DiagramStudio';
import { Sprints } from './components/Sprints';
import { Roadmap } from './components/Roadmap';
import { Releases } from './components/Releases';
import { AICommandCenter } from './components/AICommandCenter';
import { AIInsights } from './components/AIInsights';
import { AIAutomations } from './components/AIAutomations';
import { ChangelogGenerator } from './components/ChangelogGenerator';

// --- Notifications Data & Component ---
const NOTIFICATIONS = [
  {
    id: 1,
    text: "Your password has been successfully changed.",
    date: "Aug 24, 2021 at 08:32 AM",
    type: "security",
    read: false
  },
  {
    id: 2,
    text: "Thank you for booking a meeting with us.",
    subText: "Jane Dock",
    date: "Aug 29, 2021 at 04:30 PM",
    type: "meeting",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    read: false
  },
  {
    id: 3,
    text: "Great news! We are launching our 7th fund: BDE Senior Living.",
    subText: "Mark Hammond",
    date: "Aug 30, 2021 at 01:36 PM",
    type: "news",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mark",
    read: false
  }
];

const NotificationMenu = () => (
  <div className="w-80 sm:w-96 bg-white/90 dark:bg-pepper-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-pepper-100 dark:border-pepper-700 overflow-hidden ring-1 ring-black/5 flex flex-col transition-all">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-pepper-50 dark:border-pepper-800/50">
          <h3 className="font-display font-bold text-lg text-pepper-900 dark:text-pepper-50">Notifications</h3>
          <button className="text-pepper-500 hover:text-pepper-900 dark:text-pepper-400 dark:hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">
              <FiCheck className="text-sm" /> Mark as read
          </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-transparent">
          {NOTIFICATIONS.map((notif) => (
              <div key={notif.id} className="group flex gap-4 p-5 hover:bg-pepper-50/50 dark:hover:bg-pepper-800/50 transition-colors border-b border-pepper-50 dark:border-pepper-800/50 last:border-0 cursor-pointer relative items-start">
                  {/* Left Dot */}
                  <div className="mt-1.5 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-pepper-900 dark:bg-white ring-2 ring-pepper-100 dark:ring-pepper-700"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                       <p className={`text-sm font-bold text-pepper-800 dark:text-pepper-100 leading-snug mb-1 group-hover:text-pepper-600 dark:group-hover:text-pepper-300 transition-colors`}>
                          {notif.text}
                       </p>
                       {notif.subText && (
                           <p className="text-xs text-pepper-500 dark:text-pepper-400 mb-1.5 font-medium">
                              {notif.subText}
                           </p>
                       )}
                       <p className="text-[10px] text-pepper-400 dark:text-pepper-500 font-medium uppercase tracking-wide">
                          {notif.date}
                       </p>
                  </div>

                  {/* Right Icon/Avatar */}
                  <div className="shrink-0 self-center pl-2">
                      {notif.type === 'security' ? (
                          <div className="w-10 h-10 rounded-full bg-pepper-100 dark:bg-pepper-800 flex items-center justify-center text-pepper-900 dark:text-pepper-100 shadow-sm border border-pepper-200 dark:border-pepper-700">
                              <FiLock className="text-lg" />
                          </div>
                      ) : (
                          <img src={notif.avatar} alt="User" className="w-10 h-10 rounded-full border border-pepper-100 dark:border-pepper-700 object-cover shadow-sm" />
                      )}
                  </div>
              </div>
          ))}
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-pepper-50 dark:border-pepper-800/50 bg-pepper-50/30 dark:bg-pepper-900/30">
          <button className="text-pepper-600 dark:text-pepper-400 text-sm font-bold hover:text-pepper-900 dark:hover:text-white transition-colors">
              View all notifications
          </button>
      </div>
  </div>
);

// --- Profile Menu Component ---
const ProfileMenu = () => (
  <div className="w-56 bg-white/90 dark:bg-pepper-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1.5 text-left ring-1 ring-black/5 flex flex-col gap-0.5">
    <div className="px-3 py-2 mb-1 border-b border-pepper-100 dark:border-pepper-800/50">
       <p className="text-xs font-bold text-pepper-400 uppercase tracking-wider">User Settings</p>
    </div>
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50/80 dark:hover:bg-pepper-800/80 rounded-lg transition-colors group">
      <FiUser className="text-lg text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200" />
      <span>Public profile</span>
    </button>
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50/80 dark:hover:bg-pepper-800/80 rounded-lg transition-colors group">
      <TbSettings className="text-lg text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200" />
      <span>Account</span>
    </button>
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50/80 dark:hover:bg-pepper-800/80 rounded-lg transition-colors group">
      <FiPenTool className="text-lg text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200" />
      <span>Appearance</span>
    </button>
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50/80 dark:hover:bg-pepper-800/80 rounded-lg transition-colors group">
      <BiAccessibility className="text-lg text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200" />
      <span>Accessibility</span>
    </button>
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-pepper-600 dark:text-pepper-300 hover:bg-pepper-50/80 dark:hover:bg-pepper-800/80 rounded-lg transition-colors group">
      <FiBell className="text-lg text-pepper-400 group-hover:text-pepper-600 dark:group-hover:text-pepper-200" />
      <span>Notifications</span>
    </button>
    
    <div className="h-px bg-pepper-100 dark:bg-pepper-800/50 my-1 mx-1" />
    
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
      <FiLogOut className="text-lg" />
      <span>Log out</span>
    </button>
  </div>
);

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  // Optimistic mode for the toggle switch to animate instantly
  const [optimisticMode, setOptimisticMode] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use a Label ref because the input is inside
  const toggleRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync optimistic mode if darkMode changes externally (though unlikely here)
  useEffect(() => {
    setOptimisticMode(darkMode);
  }, [darkMode]);

  const handleThemeToggle = async () => {
    const toggle = toggleRef.current;
    
    // Fallback if browser doesn't support View Transitions
    if (!(document as any).startViewTransition || !toggle) {
        setOptimisticMode(prev => !prev);
        setDarkMode(prev => !prev);
        return;
    }

    // Calculate center of the toggle button
    const rect = toggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate distance to the furthest corner of the viewport
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // Start the View Transition
    const transition = (document as any).startViewTransition(() => {
        // Use flushSync to ensure the DOM is updated immediately 
        // before the browser captures the "new" state snapshot.
        flushSync(() => {
            setOptimisticMode(prev => !prev);
            setDarkMode(prev => !prev);
        });
    });

    // Wait for the pseudo-elements to be created
    await transition.ready;

    // Animate the 'new' view (the incoming theme) expanding from the toggle
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        // We target the new view, so the new theme "grows" on top of the old one
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const NavItem = ({ icon: Icon, label, id, active }: { icon: any, label: string, id: string, active?: boolean }) => (
    <Tippy content={label} placement="right" animation="scale" disabled={!sidebarCollapsed}>
      <button 
        onClick={() => setActiveTab(id)}
        className={`
          relative w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden
          ${active 
            ? 'bg-pepper-900 dark:bg-pepper-50 text-white dark:text-pepper-900 shadow-md shadow-pepper-900/10 dark:shadow-white/5' 
            : 'text-pepper-500 dark:text-pepper-400 hover:bg-pepper-50 dark:hover:bg-pepper-800/50 hover:text-pepper-900 dark:hover:text-pepper-100'}
          ${sidebarCollapsed ? 'justify-center px-0 py-3' : ''}
        `}
      >
        <Icon className={`text-[1.2rem] relative z-10 ${active ? '' : 'group-hover:scale-110 transition-transform duration-300'}`} />
        {!sidebarCollapsed && (
            <span className={`font-medium text-sm relative z-10 tracking-wide truncate ${active ? '' : ''}`}>{label}</span>
        )}
        {active && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </Tippy>
  );

  return (
    <div className="flex h-screen bg-pepper-50 dark:bg-pepper-950 text-pepper-900 dark:text-pepper-100 font-sans selection:bg-pepper-900 selection:text-white dark:selection:bg-pepper-100 dark:selection:text-black">
      
      {/* Sidebar - Enhanced with backdrop blur for light mode too */}
      <aside 
        className={`
          relative bg-white/80 dark:bg-pepper-900/90 backdrop-blur-xl border-r border-pepper-200/60 dark:border-pepper-800/60
          transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex flex-col z-30
          ${sidebarCollapsed ? 'w-24' : 'w-72'}
          shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        `}
      >
        {/* Logo Area */}
        <div className={`h-24 flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-8'} shrink-0`}>
           <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                 <div className="absolute inset-0 bg-pepper-900/20 dark:bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div className="w-10 h-10 bg-pepper-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg relative z-10 transform group-hover:rotate-6 transition-transform duration-500">
                    <TbSquareRoundedLetterF className="text-white dark:text-pepper-900 text-2xl" />
                 </div>
              </div>
              {!sidebarCollapsed && (
                  <div className="flex flex-col animate-fade-in">
                      <h1 className="font-display font-extrabold text-2xl tracking-tight text-pepper-900 dark:text-white uppercase leading-none">
                        Flownyx
                      </h1>
                      <span className="text-[10px] tracking-[0.2em] text-pepper-400 font-bold uppercase mt-1">Workspace</span>
                  </div>
              )}
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Workspace */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-2 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Workspace</div>
          <NavItem icon={TbLayoutDashboard} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} />
          <NavItem icon={TbListCheck} label="Backlog" id="backlog" active={activeTab === 'backlog'} />
          <NavItem icon={TbLayoutKanban} label="Kanban Board" id="board" active={activeTab === 'board'} />
          <NavItem icon={TbClock} label="Sprints" id="sprints" active={activeTab === 'sprints'} />
          <NavItem icon={TbRoute} label="Roadmap" id="roadmap" active={activeTab === 'roadmap'} />
          <NavItem icon={TbRocket} label="Releases" id="releases" active={activeTab === 'releases'} />

          {/* Intelligence */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Intelligence</div>
          <NavItem icon={TbSparkles} label="AI Command Center" id="ai-command" active={activeTab === 'ai-command'} />
          <NavItem icon={TbBulb} label="AI Insights" id="ai-insights" active={activeTab === 'ai-insights'} />
          <NavItem icon={TbWand} label="AI Automations" id="ai-automations" active={activeTab === 'ai-automations'} />
          <NavItem icon={TbFileDescription} label="Changelog Generator" id="ai-changelog" active={activeTab === 'ai-changelog'} />

          {/* Engineering */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Engineering</div>
          <NavItem icon={TbTerminal2} label="API Playground" id="api" active={activeTab === 'api'} />
          <NavItem icon={TbInfinity} label="DevOps Pipelines" id="devops" active={activeTab === 'devops'} />
          <NavItem icon={TbServer} label="Environment Manager" id="env" active={activeTab === 'env'} />
          <NavItem icon={TbFlask} label="Test Management" id="test" active={activeTab === 'test'} />
          <NavItem icon={TbGitBranch} label="Dependencies" id="deps" active={activeTab === 'deps'} />
          <NavItem icon={TbHierarchy2} label="Diagram Studio" id="diagram" active={activeTab === 'diagram'} />
          <NavItem icon={TbPencil} label="Whiteboard" id="whiteboard" active={activeTab === 'whiteboard'} />

          {/* Knowledge */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Knowledge</div>
          <NavItem icon={TbBook} label="Project Wiki" id="wiki" active={activeTab === 'wiki'} />
          <NavItem icon={TbFolder} label="File Manager" id="files" active={activeTab === 'files'} />

          {/* Team & Data */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Team & Data</div>
          <NavItem icon={TbUsers} label="Team Members" id="team" active={activeTab === 'team'} />
          <NavItem icon={TbUsersGroup} label="Departments" id="depts" active={activeTab === 'depts'} />
          <NavItem icon={TbGauge} label="Workload" id="workload" active={activeTab === 'workload'} />
          <NavItem icon={TbChartBar} label="Analytics" id="analytics" active={activeTab === 'analytics'} />
          <NavItem icon={TbHistory} label="Activity Log" id="activity" active={activeTab === 'activity'} />

          {/* System */}
          <div className={`text-xs font-bold text-pepper-400 uppercase tracking-widest mb-2 px-4 mt-6 ${sidebarCollapsed ? 'hidden' : 'block'}`}>System</div>
          <NavItem icon={TbPlug} label="Integrations" id="integrations" active={activeTab === 'integrations'} />
          <NavItem icon={TbCloudUpload} label="Migration Hub" id="migration" active={activeTab === 'migration'} />
          <NavItem icon={TbShieldLock} label="Audit & Security" id="audit" active={activeTab === 'audit'} />
          <NavItem icon={TbCreditCard} label="Billing" id="billing" active={activeTab === 'billing'} />
          <NavItem icon={TbSettings} label="Project Settings" id="settings" active={activeTab === 'settings'} />
          <NavItem icon={TbBell} label="Notifications" id="notifications" active={activeTab === 'notifications'} />
        </nav>

        {/* Upgrade Card */}
        {!sidebarCollapsed && (
          <div className="px-4 mb-3 animate-fade-in shrink-0">
             <div className="bg-pepper-100 dark:bg-pepper-800/50 rounded-2xl p-3 flex items-center justify-between group cursor-pointer hover:bg-pepper-200/50 dark:hover:bg-pepper-800 transition-colors">
                <div className="flex items-center gap-2">
                   <span className="text-sm font-medium text-pepper-600 dark:text-pepper-300">Upgrade to</span>
                   <span className="bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 text-[10px] font-black px-1.5 py-0.5 rounded-md">PRO</span>
                </div>
                <div className="w-8 h-8 bg-white dark:bg-pepper-700 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <FiArrowUpRight className="text-pepper-900 dark:text-white" />
                </div>
             </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-pepper-100 dark:border-pepper-800 space-y-3 bg-pepper-50/50 dark:bg-pepper-900/50 backdrop-blur-sm shrink-0">
             {/* Logout - minimal */}
             <button className={`w-full flex items-center gap-3 px-4 py-2 text-pepper-400 hover:text-red-500 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
                 <FiLogOut />
                 {!sidebarCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Log out</span>}
             </button>
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-28 w-6 h-6 bg-white dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-600 rounded-full flex items-center justify-center text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-100 shadow-md transition-all hover:scale-110 z-50 group"
        >
          {sidebarCollapsed ? <FiChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" /> : <FiChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-pepper-50 dark:bg-pepper-950">
        {/* Navbar */}
        <header className="h-20 px-8 flex items-center justify-between z-20 transition-all duration-300">
            {/* Breadcrumbs / Title Context */}
            <div className="flex items-center gap-2 text-sm font-medium text-pepper-400">
               <span className="hover:text-pepper-900 dark:hover:text-pepper-100 cursor-pointer transition-colors">Workspace</span>
               <FiChevronRight className="text-xs" />
               <span className="text-pepper-900 dark:text-pepper-100 font-bold bg-white/80 dark:bg-pepper-800/80 px-3 py-1 rounded-lg shadow-sm border border-pepper-100 dark:border-pepper-700 backdrop-blur-md">Flownyx Design System</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                
                {/* Advanced Theme Switch */}
                <label className="switch" ref={toggleRef}>
                  <input 
                    id="input" 
                    type="checkbox" 
                    checked={optimisticMode}
                    onChange={handleThemeToggle}
                  />
                  <div className="slider round">
                    <div className="sun-moon">
                      <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>

                      <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                      <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50"></circle>
                      </svg>
                    </div>
                    <div className="stars">
                      <svg id="star-1" className="star" viewBox="0 0 20 20">
                        <path
                          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                      </svg>
                      <svg id="star-2" className="star" viewBox="0 0 20 20">
                        <path
                          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                      </svg>
                      <svg id="star-3" className="star" viewBox="0 0 20 20">
                        <path
                          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                      </svg>
                      <svg id="star-4" className="star" viewBox="0 0 20 20">
                        <path
                          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </label>

                <div className="h-6 w-px bg-pepper-200 dark:bg-pepper-800 mx-1"></div>

                <Tippy 
                    content={<NotificationMenu />} 
                    interactive={true}
                    trigger="click"
                    placement="bottom-end"
                    offset={[0, 10]}
                    animation="scale"
                    theme="clean"
                    appendTo={() => document.body}
                >
                    <button className="relative p-2 text-pepper-400 hover:text-pepper-900 dark:hover:text-pepper-100 transition-colors bg-white/80 dark:bg-pepper-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-pepper-100 dark:border-pepper-800 hover:shadow-md">
                        <FiBell className="text-xl" />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-pepper-900"></span>
                    </button>
                </Tippy>
                
                <Tippy 
                    content={<ProfileMenu />} 
                    interactive={true}
                    trigger="click"
                    placement="bottom-end"
                    offset={[0, 10]}
                    animation="scale"
                    theme="clean"
                    appendTo={() => document.body}
                >
                    <div className="flex items-center gap-3 pl-4 border-l border-pepper-200 dark:border-pepper-800 cursor-pointer group">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-pepper-900 dark:text-pepper-50 leading-none group-hover:text-pepper-600 dark:group-hover:text-pepper-300 transition-colors">Alex Morgan</p>
                            <p className="text-[10px] text-pepper-500 font-bold uppercase tracking-wider mt-1">Admin</p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-pepper-900 rounded-xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <img 
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
                            alt="Profile" 
                            className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-pepper-800 shadow-sm relative z-10"
                            />
                        </div>
                    </div>
                </Tippy>
            </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative p-4">
           <div className="w-full h-full bg-white/60 dark:bg-pepper-900/50 rounded-3xl shadow-xl shadow-pepper-200/50 dark:shadow-black/20 border border-pepper-200 dark:border-pepper-800/50 overflow-hidden relative backdrop-blur-sm">
              {activeTab === 'dashboard' ? (
                 <DashboardOverview />
              ) : activeTab === 'board' ? (
                 <KanbanBoard />
              ) : activeTab === 'backlog' ? (
                 <Backlog />
              ) : activeTab === 'diagram' ? (
                 <DiagramStudio />
              ) : activeTab === 'sprints' ? (
                 <Sprints />
              ) : activeTab === 'roadmap' ? (
                 <Roadmap />
              ) : activeTab === 'releases' ? (
                 <Releases />
              ) : activeTab === 'ai-command' ? (
                 <AICommandCenter />
              ) : activeTab === 'ai-insights' ? (
                 <AIInsights />
              ) : activeTab === 'ai-automations' ? (
                 <AIAutomations />
              ) : activeTab === 'ai-changelog' ? (
                 <ChangelogGenerator />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-pepper-400 bg-pepper-50/30 dark:bg-pepper-900/30">
                    <div className="w-24 h-24 rounded-full bg-pepper-100 dark:bg-pepper-800 flex items-center justify-center mb-6 animate-pulse">
                        <FiCpu className="text-5xl opacity-30" />
                    </div>
                    <h2 className="text-2xl font-bold text-pepper-900 dark:text-pepper-100 mb-2">Work in Progress</h2>
                    <p className="text-sm opacity-60 max-w-md text-center">The <span className="font-bold text-pepper-900 dark:text-white capitalize">{activeTab}</span> module is currently under development by the engineering team.</p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
