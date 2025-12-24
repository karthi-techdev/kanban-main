
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FiPlus, FiChevronLeft, FiChevronRight, FiCalendar, FiFilter, 
  FiMoreHorizontal, FiX, FiCheck, FiClock, FiFlag, FiSearch,
  FiArrowRight, FiLayers, FiActivity
} from 'react-icons/fi';
import { TbRoute, TbTimeline, TbTargetArrow } from 'react-icons/tb';
import { Modal } from './Modal';

// --- TYPES ---

type RoadmapStatus = 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
type RoadmapTrack = 'Platform' | 'Marketing' | 'Mobile' | 'Design' | 'Backend';

interface RoadmapItem {
  id: string;
  title: string;
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  status: RoadmapStatus;
  track: RoadmapTrack;
  progress: number;
  owner?: string;
  dependencies?: string[];
}

const TRACKS: RoadmapTrack[] = ['Platform', 'Backend', 'Mobile', 'Design', 'Marketing'];

// --- MOCK DATA ---

const INITIAL_ITEMS: RoadmapItem[] = [
  { 
    id: 'r1', title: 'Q4 Strategic Planning', startDate: '2023-10-01', endDate: '2023-10-15', 
    status: 'Completed', track: 'Platform', progress: 100 
  },
  { 
    id: 'r2', title: 'Authentication Service v2', startDate: '2023-10-10', endDate: '2023-11-20', 
    status: 'In Progress', track: 'Backend', progress: 45 
  },
  { 
    id: 'r3', title: 'Dark Mode Rollout', startDate: '2023-11-01', endDate: '2023-11-30', 
    status: 'Planned', track: 'Design', progress: 0 
  },
  { 
    id: 'r4', title: 'Mobile App Beta', startDate: '2023-11-15', endDate: '2023-12-31', 
    status: 'Planned', track: 'Mobile', progress: 0 
  },
  { 
    id: 'r5', title: 'Holiday Marketing Campaign', startDate: '2023-12-01', endDate: '2023-12-25', 
    status: 'Planned', track: 'Marketing', progress: 0 
  },
  { 
    id: 'r6', title: 'Infrastructure Migration', startDate: '2023-10-20', endDate: '2023-11-10', 
    status: 'Delayed', track: 'Platform', progress: 30 
  },
];

// --- HELPERS ---

const getStatusStyles = (status: RoadmapStatus) => {
  switch (status) {
    case 'Completed': return 'bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 border-transparent';
    case 'In Progress': return 'bg-white dark:bg-pepper-800 text-pepper-900 dark:text-white border-pepper-300 dark:border-pepper-600 border-2 border-dashed';
    case 'Delayed': return 'bg-white dark:bg-pepper-900 text-pepper-500 dark:text-pepper-400 border-pepper-200 dark:border-pepper-700 borderhatch'; // Custom class for hatch handled via style if needed, simplistic fallback here
    case 'Planned': return 'bg-pepper-100 dark:bg-pepper-800/50 text-pepper-600 dark:text-pepper-300 border-transparent';
    default: return 'bg-pepper-200 text-pepper-800';
  }
};

const getDaysDiff = (start: Date, end: Date) => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// --- COMPONENT ---

export const Roadmap: React.FC = () => {
  // State
  const [items, setItems] = useState<RoadmapItem[]>(INITIAL_ITEMS);
  const [viewMode, setViewMode] = useState<'Quarter' | 'Year'>('Quarter');
  const [currentDate, setCurrentDate] = useState(new Date('2023-10-01')); // Fixed start for demo consistency
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  // Time Window Calculations
  const timelineStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const timelineEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + (viewMode === 'Quarter' ? 3 : 12), 0);
  const totalDays = getDaysDiff(timelineStart, timelineEnd);

  // Month Headers
  const months = useMemo(() => {
    const ms = [];
    let curr = new Date(timelineStart);
    while (curr <= timelineEnd) {
      ms.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }
    return ms;
  }, [timelineStart, timelineEnd]);

  // Derived
  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.track.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // --- HANDLERS ---

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    
    const newItem: RoadmapItem = {
      id: editingItem ? editingItem.id : `r-${Date.now()}`,
      title: data.get('title') as string,
      startDate: data.get('startDate') as string,
      endDate: data.get('endDate') as string,
      track: data.get('track') as RoadmapTrack,
      status: data.get('status') as RoadmapStatus,
      progress: Number(data.get('progress') || 0),
    };

    if (editingItem) {
      setItems(prev => prev.map(i => i.id === newItem.id ? newItem : i));
    } else {
      setItems(prev => [...prev, newItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if(window.confirm('Delete this milestone?')) {
        setItems(prev => prev.filter(i => i.id !== id));
        setIsModalOpen(false);
    }
  };

  const getItemStyle = (item: RoadmapItem) => {
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    
    // Clip to view
    const effectiveStart = start < timelineStart ? timelineStart : start;
    const effectiveEnd = end > timelineEnd ? timelineEnd : end;

    if (effectiveEnd < timelineStart || effectiveStart > timelineEnd) return { display: 'none' };

    const offsetDays = getDaysDiff(timelineStart, effectiveStart);
    const durationDays = getDaysDiff(effectiveStart, effectiveEnd) + 1; // +1 to include end date

    const leftPct = (offsetDays / totalDays) * 100;
    const widthPct = (durationDays / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPct)}%`,
      width: `${Math.min(100, widthPct)}%`
    };
  };

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* --- HEADER --- */}
      <div className="h-16 px-6 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display font-bold text-pepper-900 dark:text-white flex items-center gap-2">
            <TbRoute className="text-pepper-400" /> Roadmap
          </h1>
          <div className="h-6 w-px bg-pepper-200 dark:bg-pepper-800"></div>
          <div className="flex bg-pepper-100 dark:bg-pepper-800 p-1 rounded-lg">
             {['Quarter', 'Year'].map(mode => (
               <button 
                 key={mode}
                 onClick={() => setViewMode(mode as any)}
                 className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === mode ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-200'}`}
               >
                 {mode}
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-xl px-3 py-2">
              <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })} className="text-pepper-500 hover:text-pepper-900 dark:hover:text-white"><FiChevronLeft /></button>
              <span className="mx-3 text-xs font-mono font-bold text-pepper-700 dark:text-pepper-200 w-24 text-center">
                {timelineStart.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })} className="text-pepper-500 hover:text-pepper-900 dark:hover:text-white"><FiChevronRight /></button>
           </div>
           
           <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-pepper-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..." 
                className="pl-9 pr-4 py-2 bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-xl text-sm focus:ring-2 focus:ring-pepper-900/20 outline-none w-48 transition-all"
              />
           </div>

           <button 
             onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
             className="flex items-center gap-2 px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
           >
             <FiPlus /> Add Milestone
           </button>
        </div>
      </div>

      {/* --- TIMELINE BODY --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Timeline Header (Months) */}
        <div className="flex border-b border-pepper-200 dark:border-pepper-800 bg-pepper-50/50 dark:bg-pepper-950/50 backdrop-blur-sm shrink-0">
           <div className="w-48 shrink-0 p-4 border-r border-pepper-200 dark:border-pepper-800 font-bold text-xs text-pepper-400 uppercase tracking-wider bg-white/50 dark:bg-pepper-900/50 sticky left-0 z-10">
             Track
           </div>
           <div className="flex-1 flex relative">
              {months.map(m => (
                <div key={m.toISOString()} className="flex-1 border-r border-pepper-100 dark:border-pepper-800 p-2 text-center min-w-[100px]">
                   <span className="text-xs font-bold text-pepper-600 dark:text-pepper-300">{m.toLocaleDateString(undefined, { month: 'long' })}</span>
                   <span className="block text-[10px] text-pepper-400">{m.getFullYear()}</span>
                </div>
              ))}
              
              {/* Today Marker */}
              {(() => {
                 const today = new Date();
                 if (today >= timelineStart && today <= timelineEnd) {
                    const offset = getDaysDiff(timelineStart, today);
                    const left = (offset / totalDays) * 100;
                    return (
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-0 opacity-50"
                            style={{ left: `${left}%` }}
                        >
                            <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[8px] px-1 rounded">Today</div>
                        </div>
                    )
                 }
                 return null;
              })()}
           </div>
        </div>

        {/* Tracks & Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           {TRACKS.map(track => {
             const trackItems = filteredItems.filter(i => i.track === track);
             
             return (
               <div key={track} className="flex border-b border-pepper-100 dark:border-pepper-800 min-h-[120px] group relative">
                  {/* Track Header */}
                  <div className="w-48 shrink-0 p-4 border-r border-pepper-200 dark:border-pepper-800 bg-white dark:bg-pepper-900 sticky left-0 z-10 flex flex-col justify-center">
                      <h3 className="font-bold text-sm text-pepper-800 dark:text-white">{track}</h3>
                      <span className="text-[10px] text-pepper-400">{trackItems.length} items</span>
                  </div>

                  {/* Lane Content */}
                  <div className="flex-1 relative bg-pepper-50/20 dark:bg-pepper-900/20">
                      {/* Vertical Grid Lines (Background) */}
                      <div className="absolute inset-0 flex pointer-events-none">
                          {months.map((m, i) => (
                              <div key={i} className="flex-1 border-r border-pepper-100/50 dark:border-pepper-800/50"></div>
                          ))}
                      </div>

                      {/* Items */}
                      <div className="relative w-full h-full py-4">
                          {trackItems.map((item, idx) => {
                              const style = getItemStyle(item);
                              return (
                                  <div 
                                    key={item.id}
                                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                    className={`
                                        absolute h-8 rounded-full border px-3 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all
                                        ${getStatusStyles(item.status)}
                                    `}
                                    style={{ 
                                        ...style,
                                        top: `${(idx * 40) + 20}px` 
                                    }}
                                  >
                                      {/* Status Dot */}
                                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-white' : 'bg-pepper-900 dark:bg-white'}`}></div>
                                      
                                      <span className="text-[10px] font-bold truncate flex-1">{item.title}</span>
                                      
                                      {item.status === 'In Progress' && (
                                          <span className="text-[9px] font-mono opacity-70">{item.progress}%</span>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
               </div>
             );
           })}
           
           {/* Empty State */}
           {filteredItems.length === 0 && (
               <div className="p-12 text-center text-pepper-400">
                   <FiFilter className="mx-auto text-3xl mb-2 opacity-30" />
                   <p className="text-sm">No items found for this period.</p>
               </div>
           )}
        </div>
      </div>

      {/* --- CREATE/EDIT MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }}>
          <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl border border-pepper-200 dark:border-pepper-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-pepper-100 dark:border-pepper-800 flex justify-between items-center bg-pepper-50 dark:bg-pepper-950">
                  <h3 className="font-bold text-lg text-pepper-900 dark:text-white flex items-center gap-2">
                      {editingItem ? <FiActivity /> : <FiPlus />}
                      {editingItem ? 'Edit Milestone' : 'New Milestone'}
                  </h3>
                  <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }}><FiX /></button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Title *</label>
                      <input name="title" required defaultValue={editingItem?.title} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pepper-900 dark:focus:ring-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Track</label>
                          <select name="track" defaultValue={editingItem?.track || 'Platform'} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none">
                              {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Status</label>
                          <select name="status" defaultValue={editingItem?.status || 'Planned'} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none">
                              <option value="Planned">Planned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Delayed">Delayed</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">Start Date</label>
                          <input type="date" name="startDate" required defaultValue={editingItem?.startDate} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-pepper-500 uppercase mb-1">End Date</label>
                          <input type="date" name="endDate" required defaultValue={editingItem?.endDate} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-sm outline-none" />
                      </div>
                  </div>

                  <div>
                      <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-pepper-500 uppercase">Progress</label>
                          <span className="text-xs font-mono text-pepper-400">{editingItem?.progress || 0}%</span>
                      </div>
                      <input type="range" name="progress" min="0" max="100" defaultValue={editingItem?.progress || 0} className="w-full h-2 bg-pepper-200 dark:bg-pepper-700 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                      {editingItem && (
                          <button type="button" onClick={() => deleteItem(editingItem.id)} className="mr-auto px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Delete</button>
                      )}
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all">Save Milestone</button>
                  </div>
              </form>
          </div>
      </Modal>

    </div>
  );
};
    