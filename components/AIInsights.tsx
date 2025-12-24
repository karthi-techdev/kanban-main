
import React, { useState, useMemo } from 'react';
import { 
  FiActivity, FiTrendingUp, FiAlertTriangle, FiUsers, FiCheckCircle, 
  FiClock, FiZap, FiRefreshCw, FiFilter, FiArrowRight, FiMoreHorizontal,
  FiTarget, FiCpu, FiBarChart2, FiPieChart, FiLayers
} from 'react-icons/fi';
import { TbBrain, TbChartBubble, TbReportAnalytics, TbSparkles } from 'react-icons/tb';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

// --- TYPES ---

interface InsightMetric {
  id: string;
  label: string;
  value: string | number;
  trend: number;
  trendLabel: string;
  status: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

interface RiskItem {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Timeline' | 'Resource' | 'Technical' | 'Scope';
  probability: number;
  impact: string;
}

interface Recommendation {
  id: string;
  type: 'optimization' | 'automation' | 'resource';
  title: string;
  description: string;
  impactScore: number; // 1-100
}

// --- MOCK DATA ---

const MOCK_METRICS: InsightMetric[] = [
  { id: 'm1', label: 'Sprint Velocity', value: '42 pts', trend: 12, trendLabel: 'vs last sprint', status: 'positive', icon: FiTrendingUp },
  { id: 'm2', label: 'Cycle Time', value: '3.2 days', trend: -8, trendLabel: 'faster than avg', status: 'positive', icon: FiClock },
  { id: 'm3', label: 'Scope Creep', value: '15%', trend: 5, trendLabel: 'increase detected', status: 'negative', icon: FiTarget },
  { id: 'm4', label: 'Team Efficiency', value: '89%', trend: 2, trendLabel: 'stable', status: 'neutral', icon: FiActivity },
];

const VELOCITY_DATA = [
  { name: 'Sprint 1', actual: 30, ideal: 32 },
  { name: 'Sprint 2', actual: 35, ideal: 34 },
  { name: 'Sprint 3', actual: 32, ideal: 36 },
  { name: 'Sprint 4', actual: 42, ideal: 38 },
  { name: 'Sprint 5', actual: 38, ideal: 40 },
  { name: 'Current', actual: 45, ideal: 42 },
];

const WORKLOAD_DATA = [
  { name: 'Design', value: 30, color: '#3B82F6' }, // Blue
  { name: 'Frontend', value: 45, color: '#10B981' }, // Emerald
  { name: 'Backend', value: 25, color: '#F59E0B' }, // Amber
  { name: 'QA', value: 15, color: '#EF4444' }, // Red
];

const MOCK_RISKS: RiskItem[] = [
  { id: 'r1', title: 'Backend API Latency', severity: 'Critical', category: 'Technical', probability: 85, impact: 'Blocks frontend integration' },
  { id: 'r2', title: 'Q4 Deadline at Risk', severity: 'High', category: 'Timeline', probability: 60, impact: 'Potential launch delay' },
  { id: 'r3', title: 'Frontend Resource Gap', severity: 'Medium', category: 'Resource', probability: 40, impact: 'Slower UI polish' },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: 'rec1', type: 'optimization', title: 'Split "Auth Refactor" Epic', description: 'The epic "Auth Refactor" has a complexity score of 95. Splitting it into 3 smaller stories could improve flow efficiency by 25%.', impactScore: 85 },
  { id: 'rec2', type: 'resource', title: 'Rebalance QA Workload', description: 'QA workload is 140% of capacity for the next 3 days. Suggest assigning Alex to assist with unit testing.', impactScore: 78 },
  { id: 'rec3', type: 'automation', title: 'Automate Deployment Scripts', description: 'Manual deployment is consuming 4h/week. An automated pipeline is suggested based on your repo structure.', impactScore: 92 },
];

// --- COMPONENTS ---

const InsightCard = ({ 
  children, 
  title, 
  icon: Icon, 
  action, 
  className = '',
  contentClassName = ''
}: { 
  children: React.ReactNode, 
  title: string, 
  icon?: React.ElementType, 
  action?: React.ReactNode, 
  className?: string,
  contentClassName?: string
}) => (
  <div className={`bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative group overflow-hidden ${className}`}>
    <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-pepper-50 dark:bg-pepper-800 flex items-center justify-center text-pepper-600 dark:text-pepper-300 border border-pepper-100 dark:border-pepper-700">
            <Icon />
          </div>
        )}
        <h3 className="font-bold text-pepper-900 dark:text-white text-sm uppercase tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className={`flex-1 relative z-10 ${contentClassName}`}>
      {children}
    </div>
    {/* Subtle gradient background effect */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pepper-50 to-transparent dark:from-pepper-800/20 dark:to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
  </div>
);

const MetricBadge = ({ status, value, label }: { status: string, value: number, label: string }) => {
  const colors = {
    positive: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
    negative: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    neutral: 'text-pepper-600 bg-pepper-50 dark:text-pepper-400 dark:bg-pepper-800',
  };
  const Icon = status === 'positive' ? FiTrendingUp : status === 'negative' ? FiTrendingUp : FiActivity;
  
  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${colors[status as keyof typeof colors]}`}>
      <Icon className={status === 'negative' ? 'rotate-180' : ''} />
      <span>{Math.abs(value)}%</span>
      <span className="opacity-70 font-medium">{label}</span>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const AIInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'strategy'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRefresh = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
      
      {/* --- HEADER --- */}
      <div className="h-20 px-8 border-b border-pepper-200 dark:border-pepper-800 flex justify-between items-center bg-white dark:bg-pepper-900 shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-pepper-900 dark:text-white flex items-center gap-3">
            <TbSparkles className="text-pepper-400" /> AI Insights
          </h1>
          <p className="text-xs text-pepper-500 dark:text-pepper-400 mt-1 font-medium">Predictive analytics and intelligent project recommendations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-pepper-100 dark:bg-pepper-800 p-1 rounded-xl">
            {['overview', 'risks', 'strategy'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-pepper-700 text-pepper-900 dark:text-white shadow-sm' 
                    : 'text-pepper-500 hover:text-pepper-900 dark:hover:text-pepper-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2.5 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
          >
            <FiRefreshCw className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      {/* --- CONTENT SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        
        {/* KEY METRICS ROW - Uniform Height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {MOCK_METRICS.map((metric) => (
            <div key={metric.id} className="bg-white dark:bg-pepper-900 p-6 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm flex flex-col justify-between h-32 group hover:border-pepper-300 dark:hover:border-pepper-600 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-pepper-500 uppercase tracking-wider">{metric.label}</span>
                <div className={`p-2 rounded-lg ${metric.status === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : metric.status === 'negative' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                  <metric.icon />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-display font-extrabold text-pepper-900 dark:text-white">{metric.value}</span>
                <MetricBadge status={metric.status} value={metric.trend} label={metric.trendLabel} />
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* VELOCITY CHART - Fixed Height for Alignment */}
            <InsightCard title="Sprint Velocity Trend" icon={TbChartBubble} action={<button className="text-pepper-400 hover:text-pepper-900 dark:hover:text-white"><FiMoreHorizontal /></button>} className="h-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={VELOCITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ padding: 0 }}
                      />
                      <Area type="monotone" dataKey="ideal" stroke="#94A3B8" strokeDasharray="5 5" fill="url(#colorIdeal)" strokeWidth={2} name="Ideal Velocity" />
                      <Area type="monotone" dataKey="actual" stroke="#10B981" fill="url(#colorActual)" strokeWidth={3} name="Actual Velocity" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="pt-4 mt-auto">
                    <p className="text-xs text-pepper-500 text-center bg-pepper-50 dark:bg-pepper-800/50 py-2 rounded-lg">
                        Current velocity is <span className="font-bold text-emerald-600">7% higher</span> than the rolling average of the last 3 sprints.
                    </p>
                </div>
              </div>
            </InsightCard>

            {/* RECOMMENDATIONS LIST */}
            <div className="space-y-4">
              <h3 className="font-bold text-pepper-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <TbBrain className="text-purple-500 text-lg" /> AI Recommendations
              </h3>
              {MOCK_RECOMMENDATIONS.map(rec => (
                <div key={rec.id} className="bg-white dark:bg-pepper-900 p-5 rounded-2xl border border-pepper-200 dark:border-pepper-800 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center hover:border-purple-200 dark:hover:border-purple-900 transition-colors">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    rec.type === 'optimization' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                    rec.type === 'resource' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' :
                    'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                  }`}>
                    {rec.type === 'optimization' ? <FiZap className="text-xl" /> : 
                     rec.type === 'resource' ? <FiUsers className="text-xl" /> : 
                     <FiCpu className="text-xl" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-pepper-900 dark:text-white">{rec.title}</h4>
                      <span className="text-[10px] font-bold text-pepper-400 bg-pepper-50 dark:bg-pepper-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Impact: {rec.impactScore}</span>
                    </div>
                    <p className="text-sm text-pepper-600 dark:text-pepper-400 leading-relaxed">{rec.description}</p>
                  </div>
                  <button className="px-4 py-2 border border-pepper-200 dark:border-pepper-700 text-pepper-600 dark:text-pepper-300 text-xs font-bold rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-colors whitespace-nowrap">
                    Apply Fix
                  </button>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-8">
            
            {/* WORKLOAD DISTRIBUTION - Fixed Height to Match Velocity */}
            <InsightCard title="Workload Distribution" icon={FiPieChart} className="h-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex-1 relative w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={WORKLOAD_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {WORKLOAD_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="block text-3xl font-display font-black text-pepper-900 dark:text-white">115</span>
                      <span className="text-[10px] text-pepper-400 uppercase font-bold tracking-wider">Total Tasks</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                  {WORKLOAD_DATA.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-xs text-pepper-600 dark:text-pepper-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-medium flex-1 truncate">{item.name}</span>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </InsightCard>

            {/* RISK RADAR */}
            <InsightCard title="Risk Radar" icon={FiAlertTriangle}>
              <div className="space-y-4">
                {MOCK_RISKS.map(risk => (
                  <div key={risk.id} className="relative p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 overflow-hidden group">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                      <h5 className="font-bold text-xs text-pepper-900 dark:text-white">{risk.title}</h5>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${risk.severity === 'Critical' ? 'bg-red-600' : risk.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-pepper-600 dark:text-pepper-400 mb-2 relative z-10">{risk.impact}</p>
                    <div className="flex justify-between items-center text-[9px] font-mono text-pepper-500 relative z-10">
                      <span>Cat: {risk.category}</span>
                      <span>Prob: {risk.probability}%</span>
                    </div>
                    {/* Background Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-red-100 dark:bg-red-900/50">
                        <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${risk.probability}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-xs font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors border border-pepper-100 dark:border-pepper-800 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800">
                View Full Risk Report <FiArrowRight />
              </button>
            </InsightCard>

            {/* BOTTLENECK ALERT (Mini) */}
            <div className="bg-gradient-to-br from-pepper-900 to-black dark:from-white dark:to-pepper-200 rounded-2xl p-6 text-white dark:text-pepper-900 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FiLayers className="text-6xl rotate-12" />
                </div>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80 flex items-center gap-2">
                    <FiActivity /> System Alert
                </h4>
                <p className="text-lg font-bold mb-4 leading-tight">
                    Bottleneck detected in <br/> <span className="text-emerald-400 dark:text-purple-600">Review Column</span>
                </p>
                <div className="flex items-end gap-2 mb-4">
                    <div className="text-4xl font-black">5</div>
                    <div className="text-xs font-medium opacity-80 mb-1.5">tasks stuck  48h</div>
                </div>
                <button className="w-full py-2 bg-white/20 dark:bg-black/10 backdrop-blur-sm rounded-lg text-xs font-bold hover:bg-white/30 dark:hover:bg-black/20 transition-all">
                    Investigate
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
