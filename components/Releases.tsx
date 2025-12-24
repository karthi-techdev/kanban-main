
import React, { useState, useMemo } from 'react';
import { 
  FiPackage, FiGitCommit, FiTag, FiCalendar, FiCheckCircle, 
  FiClock, FiAlertCircle, FiMoreHorizontal, FiPlus, FiSearch, 
  FiFilter, FiArrowRight, FiExternalLink, FiGithub, FiServer,
  FiBox, FiActivity, FiUser, FiChevronDown, FiChevronUp, FiEdit2, FiTrash2
} from 'react-icons/fi';
import { TbRocket, TbVersions, TbNotes } from 'react-icons/tb';
import { Modal } from './Modal';

// --- TYPES ---

type ReleaseStatus = 'Production' | 'Staging' | 'Draft' | 'Archived';
type ReleaseHealth = 'Stable' | 'At Risk' | 'Critical' | 'Unknown';

interface ReleaseIssue {
  id: string;
  title: string;
  status: 'Done' | 'In Progress' | 'Todo';
}

interface Release {
  id: string;
  version: string;
  title: string;
  status: ReleaseStatus;
  health: ReleaseHealth;
  deployDate: string;
  environment: string;
  branch: string;
  commitHash: string;
  progress: number;
  issues: ReleaseIssue[];
  author: {
    name: string;
    avatar: string;
  };
  description: string;
}

// --- MOCK DATA ---

const INITIAL_RELEASES: Release[] = [
  {
    id: 'r1',
    version: 'v2.4.0',
    title: 'Q4 Core Infrastructure Update',
    status: 'Production',
    health: 'Stable',
    deployDate: '2023-10-24',
    environment: 'production-us-east',
    branch: 'main',
    commitHash: '8a2b9f1',
    progress: 100,
    author: { name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    description: 'Major infrastructure overhaul including database migration to sharded clusters and Redis caching layer upgrades.',
    issues: [
      { id: 'FLX-102', title: 'Migrate User DB', status: 'Done' },
      { id: 'FLX-105', title: 'Update Redis Config', status: 'Done' },
      { id: 'FLX-110', title: 'Security Patch v4', status: 'Done' },
    ]
  },
  {
    id: 'r2',
    version: 'v2.5.0-rc1',
    title: 'Authentication & SSO Refactor',
    status: 'Staging',
    health: 'At Risk',
    deployDate: '2023-11-01',
    environment: 'staging-01',
    branch: 'release/v2.5',
    commitHash: '3c4d5e6',
    progress: 85,
    author: { name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
    description: 'Implementation of OAuth2 providers (Google, GitHub) and session management improvements. Currently testing edge cases in staging.',
    issues: [
      { id: 'FLX-201', title: 'Implement OAuth Flow', status: 'Done' },
      { id: 'FLX-202', title: 'Session Timeout Logic', status: 'In Progress' },
      { id: 'FLX-205', title: 'Update Login UI', status: 'Done' },
    ]
  },
  {
    id: 'r3',
    version: 'v2.5.1',
    title: 'Hotfix: Mobile Navigation',
    status: 'Draft',
    health: 'Unknown',
    deployDate: '2023-11-05',
    environment: 'dev',
    branch: 'hotfix/nav-bug',
    commitHash: 'Pending',
    progress: 30,
    author: { name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
    description: 'Fixing the Z-index issue on the mobile sidebar overlay that prevents menu interaction on iOS devices.',
    issues: [
      { id: 'FLX-301', title: 'Investigate Z-index', status: 'Done' },
      { id: 'FLX-302', title: 'Apply Fix', status: 'Todo' },
    ]
  },
  {
    id: 'r4',
    version: 'v2.3.5',
    title: 'Performance Optimization Patch',
    status: 'Archived',
    health: 'Stable',
    deployDate: '2023-09-15',
    environment: 'production',
    branch: 'release/v2.3',
    commitHash: '1a2b3c4',
    progress: 100,
    author: { name: 'Taylor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' },
    description: 'Reduced bundle size by 20% and optimized image loading strategies.',
    issues: []
  }
];

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }: { status: ReleaseStatus }) => {
  const styles = {
    'Production': 'bg-pepper-900 text-white dark:bg-white dark:text-pepper-900 border-transparent',
    'Staging': 'bg-pepper-200 text-pepper-800 dark:bg-pepper-700 dark:text-pepper-200 border-transparent',
    'Draft': 'bg-white text-pepper-600 border-pepper-300 dark:bg-pepper-900 dark:text-pepper-400 dark:border-pepper-700 border-dashed border',
    'Archived': 'bg-pepper-50 text-pepper-400 dark:bg-pepper-800 dark:text-pepper-500 border-transparent'
  };

  const icons = {
    'Production': <TbRocket className="mr-1.5" />,
    'Staging': <FiServer className="mr-1.5" />,
    'Draft': <FiEdit2 className="mr-1.5" />,
    'Archived': <FiBox className="mr-1.5" />
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const HealthIndicator = ({ health }: { health: ReleaseHealth }) => {
  const styles = {
    'Stable': 'text-pepper-900 dark:text-white',
    'At Risk': 'text-pepper-500',
    'Critical': 'text-pepper-900 dark:text-white underline decoration-wavy decoration-pepper-400',
    'Unknown': 'text-pepper-300'
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <div className={`w-2 h-2 rounded-full ${health === 'Stable' ? 'bg-pepper-900 dark:bg-white' : health === 'At Risk' ? 'bg-pepper-400' : health === 'Critical' ? 'bg-black dark:bg-white animate-pulse' : 'bg-pepper-200'}`}></div>
      <span className={styles[health]}>{health}</span>
    </div>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-pepper-100 dark:bg-pepper-800 rounded-full h-1.5 overflow-hidden">
    <div 
      className="bg-pepper-900 dark:bg-white h-full transition-all duration-500 ease-out" 
      style={{ width: `${progress}%` }}
    />
  </div>
);

// --- MAIN COMPONENT ---

export const Releases: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>(INITIAL_RELEASES);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Derived state
  const filteredReleases = useMemo(() => {
    return releases.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.version.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [releases, searchQuery, filterStatus]);

  const stats = {
    total: releases.length,
    production: releases.filter(r => r.status === 'Production').length,
    staging: releases.filter(r => r.status === 'Staging').length,
    draft: releases.filter(r => r.status === 'Draft').length
  };

  // Handlers
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    const newRelease: Release = {
      id: `r-${Date.now()}`,
      version: data.get('version') as string,
      title: data.get('title') as string,
      status: 'Draft',
      health: 'Unknown',
      deployDate: data.get('date') as string,
      environment: 'dev',
      branch: 'develop',
      commitHash: 'Pending',
      progress: 0,
      issues: [],
      author: { name: 'User', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' },
      description: data.get('description') as string
    };

    setReleases([newRelease, ...releases]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Are you sure you want to remove this release?')) {
      setReleases(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* HEADER */}
      <div className="h-20 px-8 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-pepper-900 dark:text-white flex items-center gap-3">
            <FiPackage className="text-pepper-400" /> Releases
          </h1>
          <p className="text-xs text-pepper-500 dark:text-pepper-400 mt-1 font-medium">Manage deployment cycles and version history</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4 text-xs font-bold text-pepper-500">
             <div className="flex flex-col items-center">
                <span className="text-lg text-pepper-900 dark:text-white">{stats.production}</span>
                <span className="uppercase tracking-wider text-[10px]">Live</span>
             </div>
             <div className="w-px h-8 bg-pepper-100 dark:bg-pepper-800"></div>
             <div className="flex flex-col items-center">
                <span className="text-lg text-pepper-900 dark:text-white">{stats.staging}</span>
                <span className="uppercase tracking-wider text-[10px]">Staging</span>
             </div>
             <div className="w-px h-8 bg-pepper-100 dark:bg-pepper-800"></div>
             <div className="flex flex-col items-center">
                <span className="text-lg text-pepper-900 dark:text-white">{stats.draft}</span>
                <span className="uppercase tracking-wider text-[10px]">Drafts</span>
             </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <FiPlus /> New Release
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-pepper-100 dark:bg-pepper-800/50 p-1 rounded-xl">
          {['All', 'Production', 'Staging', 'Draft'].map(filter => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === filter ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-white'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400 group-focus-within:text-pepper-900 transition-colors" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search releases..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-700 rounded-xl text-sm focus:ring-2 focus:ring-pepper-900/10 outline-none transition-all placeholder-pepper-400 text-pepper-900 dark:text-white"
          />
        </div>
      </div>

      {/* RELEASE LIST */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
        <div className="space-y-4">
          {filteredReleases.map(release => (
            <div 
              key={release.id} 
              className="bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
            >
              {/* Summary Row */}
              <div 
                className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer"
                onClick={() => toggleExpand(release.id)}
              >
                {/* Version & Status */}
                <div className="flex items-center gap-4 min-w-[180px]">
                  <div className="w-12 h-12 bg-pepper-50 dark:bg-pepper-800 rounded-xl flex items-center justify-center text-pepper-900 dark:text-white text-xl shadow-inner">
                    <TbVersions />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-pepper-900 dark:text-white tracking-tight">{release.version}</h3>
                    <StatusBadge status={release.status} />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-pepper-800 dark:text-pepper-100 text-sm truncate">{release.title}</h4>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-pepper-300"></span>
                    <span className="text-xs text-pepper-500 font-mono hidden md:inline-block">{release.commitHash}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-pepper-500 dark:text-pepper-400">
                    <span className="flex items-center gap-1"><FiCalendar /> {new Date(release.deployDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><FiGithub /> {release.branch}</span>
                    <span className="flex items-center gap-1"><FiServer /> {release.environment}</span>
                  </div>
                </div>

                {/* Health & Progress */}
                <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0">
                  <div className="flex flex-col gap-1 w-32">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-pepper-400">
                      <span>Completion</span>
                      <span>{release.progress}%</span>
                    </div>
                    <ProgressBar progress={release.progress} />
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 min-w-[80px]">
                    <span className="text-[10px] font-bold uppercase text-pepper-400">Health</span>
                    <HealthIndicator health={release.health} />
                  </div>

                  <button className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-400 transition-colors">
                    {expandedId === release.id ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === release.id && (
                <div className="px-6 pb-6 pt-0 border-t border-pepper-100 dark:border-pepper-800/50 bg-pepper-50/30 dark:bg-black/10 animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                    {/* Left: Description & Changelog */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h5 className="text-xs font-bold text-pepper-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2"><TbNotes /> Release Notes</h5>
                        <p className="text-sm text-pepper-600 dark:text-pepper-300 leading-relaxed bg-white dark:bg-pepper-800/50 p-4 rounded-xl border border-pepper-100 dark:border-pepper-700/50">
                          {release.description}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-bold text-pepper-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2"><FiTag /> Issues Included</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {release.issues.length > 0 ? release.issues.map(issue => (
                            <div key={issue.id} className="flex items-center justify-between p-3 bg-white dark:bg-pepper-800/50 border border-pepper-100 dark:border-pepper-700/50 rounded-lg">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-mono font-bold text-pepper-400 bg-pepper-100 dark:bg-pepper-900 px-1.5 py-0.5 rounded shrink-0">{issue.id}</span>
                                <span className="text-xs font-medium text-pepper-700 dark:text-pepper-200 truncate">{issue.title}</span>
                              </div>
                              {issue.status === 'Done' ? (
                                <FiCheckCircle className="text-pepper-900 dark:text-white shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border-2 border-pepper-300 shrink-0"></div>
                              )}
                            </div>
                          )) : (
                            <div className="text-sm text-pepper-400 italic col-span-full">No linked issues found.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Meta & Actions */}
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-pepper-800/50 p-4 rounded-xl border border-pepper-100 dark:border-pepper-700/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-pepper-500">Release Manager</span>
                          <div className="flex items-center gap-2">
                            <img src={release.author.avatar} alt={release.author.name} className="w-5 h-5 rounded-full border border-pepper-200" />
                            <span className="text-xs font-bold text-pepper-900 dark:text-white">{release.author.name}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-pepper-500">Time to Deploy</span>
                          <span className="text-xs font-mono font-bold text-pepper-900 dark:text-white">14m 32s</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-pepper-500">Tests Passed</span>
                          <span className="text-xs font-bold text-pepper-900 dark:text-white flex items-center gap-1"><FiCheckCircle /> 142/142</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button className="w-full py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-2">
                          <FiExternalLink /> View Deployment
                        </button>
                        <button onClick={() => handleDelete(release.id)} className="w-full py-2 border border-pepper-200 dark:border-pepper-700 text-pepper-600 dark:text-pepper-300 rounded-lg text-xs font-bold hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-all flex items-center justify-center gap-2">
                          <FiTrash2 /> Delete Release
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredReleases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-pepper-400">
              <FiPackage className="text-4xl mb-4 opacity-20" />
              <p className="text-sm">No releases found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
            <h3 className="font-bold text-lg text-pepper-900 dark:text-white flex items-center gap-2">
              <TbRocket /> Create Release
            </h3>
            <button onClick={() => setIsModalOpen(false)}><FiActivity className="rotate-45" /></button>
          </div>
          
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Release Title</label>
              <input name="title" required className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white" placeholder="e.g. Q4 Performance Update" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Version Tag</label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
                  <input name="version" required placeholder="v1.0.0" className="w-full pl-9 bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Target Date</label>
                <input type="date" name="date" required className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Description / Changelog</label>
              <textarea name="description" rows={4} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Describe the changes in this release..."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Schedule Release</button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};
