import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiPlus, FiMinus, FiSearch, FiDownload, FiShare2, 
  FiMoreHorizontal, FiTrash2, FiZoomIn, FiZoomOut, FiGrid, FiLayout, 
  FiCornerUpLeft, FiCornerUpRight, FiType, FiSquare, FiCircle, 
  FiTriangle, FiDatabase, FiServer, FiCloud, FiFileText, FiHexagon, 
  FiPlay, FiCode, FiArrowRight, FiX, FiCheck, FiLink, FiEdit3, FiFolder, 
  FiCopy, FiImage, FiExternalLink, FiRotateCw, FiDroplet, FiBold, FiMove, FiSettings,
  FiClock, FiAlertCircle, FiItalic, FiList, FiAlignLeft, FiUnderline,
  FiHardDrive, FiCpu, FiMonitor, FiWifi, FiShield, FiLayers, FiPackage, FiZap, FiUser, FiBox, FiMessageSquare, FiTag, FiCreditCard, FiFile
} from 'react-icons/fi';
import { 
  TbHierarchy2, TbArrowsMaximize, TbBinaryTree, TbSchema, 
  TbChartDots, TbSitemap, TbBoxModel, TbBrandGraphql, TbArrowAutofitRight,
  TbArrowMerge, TbWand, TbLayoutDashboard, TbListNumbers, TbStrikethrough, TbEraser,
  TbRouter, TbSwitchHorizontal, TbApi, TbBuildingArch, TbArrowRightCircle, TbTimeline, TbFolder, TbBrackets
} from 'react-icons/tb';
import { BiBot } from 'react-icons/bi';
import Tippy from '@tippyjs/react';
import { Modal } from './Modal';

// --- ROBUST TYPE DEFINITIONS ---

type ShapeKind = 
  // Basic
  | 'Rectangle' | 'Circle' | 'Triangle' | 'Text' | 'Line' | 'Arrow' | 'StickyNote'
  // Flowchart
  | 'Start' | 'Process' | 'Decision' | 'Document' | 'InputOutput' | 'PredefinedProcess' | 'Connector' | 'DataStore' | 'Note'
  // UML
  | 'Class' | 'Interface' | 'Actor' | 'Package' | 'UseCase'
  // Data & Integration
  | 'Queue' | 'APIGateway' | 'Cache' | 'EventStream' | 'FileStorage' | 'Database' | 'API'
  // Network
  | 'Router' | 'Switch' | 'Firewall' | 'LoadBalancer' | 'ClientDevice' | 'Server' | 'Cloud'
  // Annotations
  | 'Callout' | 'Tag' | 'GroupBox' | 'Swimlane'
  // Architecture (Legacy/Others)
  | 'Terminator';

type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

interface DiagramNode {
  id: string;
  type: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string; // Now stores HTML
  fillColor: string;
  borderColor: string;
  textColor: string;
  rotation: number; // degrees
  borderRadius: number;
  fontSize: number;
  icon?: string;
  tags?: string[];
  linkedIssueId?: string | null;
}

interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  fromHandle?: HandlePosition;
  toHandle?: HandlePosition;
  label?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  arrowStyle?: 'none' | 'arrow' | 'double';
  color?: string;
  strokeWidth?: number;
}

interface DiagramComment {
  id: string;
  authorId: string;
  text: string;
  nodeId?: string | null;
  createdAt: string;
}

interface DiagramVersion {
  id: string;
  timestamp: string;
  label?: string;
  snapshot: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    meta?: {
        zoom: number;
        panX: number;
        panY: number;
    }
  };
}

interface DiagramPreview {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  thumbnailUrl?: string;
}

interface Diagram {
  id: string;
  title: string;
  type: string;
  folderId?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  preview?: DiagramPreview; // New Field
  history: DiagramVersion[];
  comments: DiagramComment[];
  linkedIssueIds: string[];
  createdAt: string;
  updatedAt: string;
}

// --- MASTER SHAPE LIBRARY ---
// (Using existing definitions)
interface ShapeDef {
    type: ShapeKind;
    label: string;
    icon: React.ElementType;
    category: string;
    defaultProps: Partial<DiagramNode>;
}

const MASTER_SHAPE_LIBRARY: ShapeDef[] = [
    // BASIC
    { type: 'Rectangle', label: 'Box', icon: FiSquare, category: 'Basic', defaultProps: { width: 100, height: 100, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'Circle', label: 'Circle', icon: FiCircle, category: 'Basic', defaultProps: { width: 100, height: 100, borderRadius: 50, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'Triangle', label: 'Triangle', icon: FiTriangle, category: 'Basic', defaultProps: { width: 100, height: 100, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'Text', label: 'Text', icon: FiType, category: 'Basic', defaultProps: { width: 100, height: 40, fillColor: 'transparent', borderColor: 'transparent', textColor: '#1E293B', label: 'Text' } },
    { type: 'StickyNote', label: 'Sticky Note', icon: FiFile, category: 'Basic', defaultProps: { width: 120, height: 120, fillColor: '#FEF3C7', borderColor: '#F59E0B', borderRadius: 2, textColor: '#78350F' } },
    
    // FLOWCHART
    { type: 'Start', label: 'Start/End', icon: FiPlay, category: 'Flowchart', defaultProps: { width: 120, height: 60, borderRadius: 30, fillColor: '#ECFDF5', borderColor: '#059669', textColor: '#065F46' } },
    { type: 'Process', label: 'Process', icon: FiSettings, category: 'Flowchart', defaultProps: { width: 120, height: 80, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'Decision', label: 'Decision', icon: FiHexagon, category: 'Flowchart', defaultProps: { width: 100, height: 100, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'Document', label: 'Document', icon: FiFileText, category: 'Flowchart', defaultProps: { width: 100, height: 80, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'InputOutput', label: 'Input/Output', icon: TbArrowRightCircle, category: 'Flowchart', defaultProps: { width: 120, height: 60, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'PredefinedProcess', label: 'Subprocess', icon: FiLayout, category: 'Flowchart', defaultProps: { width: 120, height: 80, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },
    { type: 'DataStore', label: 'Data Store', icon: FiDatabase, category: 'Flowchart', defaultProps: { width: 100, height: 60, fillColor: '#FFFFFF', borderColor: '#94A3B8' } },

    // UML
    { type: 'Class', label: 'Class', icon: TbBoxModel, category: 'UML', defaultProps: { width: 120, height: 140, borderRadius: 2, fillColor: '#FFFFFF', borderColor: '#64748B' } },
    { type: 'Interface', label: 'Interface', icon: TbBrackets, category: 'UML', defaultProps: { width: 100, height: 100, borderRadius: 50, fillColor: '#FFFFFF', borderColor: '#64748B' } },
    { type: 'Actor', label: 'Actor', icon: FiUser, category: 'UML', defaultProps: { width: 60, height: 100, fillColor: 'transparent', borderColor: '#64748B' } },
    { type: 'UseCase', label: 'Use Case', icon: FiCircle, category: 'UML', defaultProps: { width: 140, height: 70, borderRadius: 35, fillColor: '#FFFFFF', borderColor: '#64748B' } },
    { type: 'Package', label: 'Package', icon: FiPackage, category: 'UML', defaultProps: { width: 140, height: 100, fillColor: '#FFFFFF', borderColor: '#64748B' } },

    // DATA & INTEGRATION
    { type: 'Queue', label: 'Queue', icon: FiLayers, category: 'Data & Integration', defaultProps: { width: 120, height: 60, fillColor: '#FFFFFF', borderColor: '#8B5CF6' } },
    { type: 'APIGateway', label: 'API Gateway', icon: TbApi, category: 'Data & Integration', defaultProps: { width: 80, height: 80, fillColor: '#FFFFFF', borderColor: '#8B5CF6' } },
    { type: 'Database', label: 'Database', icon: FiDatabase, category: 'Data & Integration', defaultProps: { width: 80, height: 100, fillColor: '#FFFFFF', borderColor: '#8B5CF6' } },
    { type: 'Cache', label: 'Cache', icon: FiZap, category: 'Data & Integration', defaultProps: { width: 100, height: 60, borderRadius: 10, fillColor: '#F3E8FF', borderColor: '#8B5CF6' } },
    { type: 'FileStorage', label: 'Storage', icon: FiHardDrive, category: 'Data & Integration', defaultProps: { width: 80, height: 100, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#8B5CF6' } },

    // NETWORK
    { type: 'Router', label: 'Router', icon: TbRouter, category: 'Network', defaultProps: { width: 80, height: 80, borderRadius: 40, fillColor: '#FFFFFF', borderColor: '#0EA5E9' } },
    { type: 'Switch', label: 'Switch', icon: TbSwitchHorizontal, category: 'Network', defaultProps: { width: 80, height: 60, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#0EA5E9' } },
    { type: 'Firewall', label: 'Firewall', icon: FiShield, category: 'Network', defaultProps: { width: 80, height: 80, borderRadius: 10, fillColor: '#FFE4E6', borderColor: '#F43F5E' } },
    { type: 'LoadBalancer', label: 'Load Balancer', icon: TbArrowMerge, category: 'Network', defaultProps: { width: 100, height: 60, borderRadius: 30, fillColor: '#E0F2FE', borderColor: '#0EA5E9' } },
    { type: 'ClientDevice', label: 'Client', icon: FiMonitor, category: 'Network', defaultProps: { width: 80, height: 70, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#0EA5E9' } },
    { type: 'Cloud', label: 'Cloud', icon: FiCloud, category: 'Network', defaultProps: { width: 120, height: 80, fillColor: '#FFFFFF', borderColor: '#0EA5E9' } },
    { type: 'Server', label: 'Server', icon: FiServer, category: 'Network', defaultProps: { width: 80, height: 100, borderRadius: 4, fillColor: '#FFFFFF', borderColor: '#64748B' } },

    // ANNOTATIONS
    { type: 'Callout', label: 'Callout', icon: FiMessageSquare, category: 'Annotations', defaultProps: { width: 120, height: 60, borderRadius: 8, fillColor: '#FEF9C3', borderColor: '#EAB308', textColor: '#854D0E' } },
    { type: 'Tag', label: 'Tag', icon: FiTag, category: 'Annotations', defaultProps: { width: 100, height: 40, borderRadius: 20, fillColor: '#F1F5F9', borderColor: '#94A3B8', textColor: '#475569' } },
    { type: 'GroupBox', label: 'Group', icon: FiBox, category: 'Annotations', defaultProps: { width: 200, height: 200, borderRadius: 8, fillColor: 'transparent', borderColor: '#CBD5E1', textColor: '#94A3B8' } },
    { type: 'Swimlane', label: 'Swimlane', icon: TbTimeline, category: 'Annotations', defaultProps: { width: 400, height: 150, borderRadius: 0, fillColor: 'transparent', borderColor: '#94A3B8' } },
];

const SHAPE_CATEGORIES = Array.from(new Set(MASTER_SHAPE_LIBRARY.map(s => s.category)));

// --- MOCK INITIAL DIAGRAM ---
const initialNodes: DiagramNode[] = [
      { id: 'n1', type: 'Start', x: 400, y: 50, width: 120, height: 50, label: 'Start', fillColor: '#ECFDF5', borderColor: '#059669', textColor: '#059669', rotation: 0, borderRadius: 25, fontSize: 14, icon: 'FiPlay' },
      { id: 'n2', type: 'Process', x: 400, y: 150, width: 140, height: 70, label: 'Login Request', fillColor: '#EFF6FF', borderColor: '#2563EB', textColor: '#2563EB', rotation: 0, borderRadius: 4, fontSize: 14, icon: 'FiUser' },
      { id: 'n3', type: 'Decision', x: 400, y: 280, width: 120, height: 100, label: 'Valid?', fillColor: '#FFFBEB', borderColor: '#D97706', textColor: '#D97706', rotation: 0, borderRadius: 0, fontSize: 14, icon: 'FiHelpCircle' },
      { id: 'n4', type: 'Terminator', x: 400, y: 450, width: 120, height: 50, label: 'Dashboard', fillColor: '#ECFDF5', borderColor: '#059669', textColor: '#059669', rotation: 0, borderRadius: 25, fontSize: 14, icon: 'TbLayoutDashboard' },
      { id: 'n5', type: 'Process', x: 650, y: 295, width: 140, height: 70, label: 'Show Error', fillColor: '#FEF2F2', borderColor: '#DC2626', textColor: '#DC2626', rotation: 0, borderRadius: 4, fontSize: 14, icon: 'FiAlertCircle' }
];
const initialEdges: DiagramEdge[] = [
      { id: 'e1', from: 'n1', to: 'n2', fromHandle: 'bottom', toHandle: 'top', arrowStyle: 'arrow', color: '#94A3B8', lineStyle: 'solid', strokeWidth: 2 },
      { id: 'e2', from: 'n2', to: 'n3', fromHandle: 'bottom', toHandle: 'top', arrowStyle: 'arrow', color: '#94A3B8', lineStyle: 'solid', strokeWidth: 2 },
      { id: 'e3', from: 'n3', to: 'n4', fromHandle: 'bottom', toHandle: 'top', label: 'Yes', arrowStyle: 'arrow', color: '#10B981', lineStyle: 'solid', strokeWidth: 2 },
      { id: 'e4', from: 'n3', to: 'n5', fromHandle: 'right', toHandle: 'left', label: 'No', arrowStyle: 'arrow', color: '#EF4444', lineStyle: 'solid', strokeWidth: 2 },
      { id: 'e5', from: 'n5', to: 'n2', fromHandle: 'top', toHandle: 'right', label: 'Retry', arrowStyle: 'arrow', color: '#94A3B8', lineStyle: 'dashed', strokeWidth: 2 }
];

const INITIAL_DIAGRAMS: Diagram[] = [
  {
    id: 'd1', title: 'Authentication Flow', type: 'Flowchart',
    nodes: initialNodes,
    edges: initialEdges,
    preview: { nodes: initialNodes, edges: initialEdges }, // Initial preview
    history: [], linkedIssueIds: [], comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
];

const DIAGRAM_TYPES = [
  'Flowchart', 'ER Diagram', 'Class Diagram', 'Sequence', 
  'Architecture', 'Mind Map', 'State', 'Network', 'Org Chart', 'Whiteboard'
];

// --- THUMBNAIL COMPONENT ---

const DiagramThumbnail = ({ preview }: { preview?: DiagramPreview }) => {
    if (preview?.thumbnailUrl) {
        return <img src={preview.thumbnailUrl} alt="Diagram Thumbnail" className="w-full h-full object-contain" />;
    }

    if (!preview?.nodes || preview.nodes.length === 0) {
         // Fallback placeholder (Existing Design)
         return (
             <div className="opacity-30 flex gap-2">
                 <div className="w-6 h-6 border rounded bg-current"></div>
                 <div className="w-6 h-6 border rounded bg-current"></div>
                 <div className="w-6 h-6 border rounded bg-current"></div>
             </div>
         );
    }

    // Calculate Bounding Box
    const xs = preview.nodes.map(n => n.x);
    const ys = preview.nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...preview.nodes.map(n => n.x + n.width));
    const maxY = Math.max(...preview.nodes.map(n => n.y + n.height));
    
    const padding = 50;
    const width = maxX - minX + (padding * 2);
    const height = maxY - minY + (padding * 2);
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

    return (
        <svg 
            viewBox={viewBox} 
            className="w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
        >
             {preview.edges.map(e => {
                const from = preview.nodes.find(n => n.id === e.from);
                const to = preview.nodes.find(n => n.id === e.to);
                if(!from || !to) return null;
                const p1 = {x: from.x + from.width/2, y: from.y + from.height/2};
                const p2 = {x: to.x + to.width/2, y: to.y + to.height/2};
                return <path key={e.id} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke="#94A3B8" strokeWidth="4" fill="none" />;
             })}
             {preview.nodes.map(n => (
                 <g key={n.id} transform={`translate(${n.x},${n.y}) rotate(${n.rotation || 0}, ${n.width/2}, ${n.height/2})`}>
                     {['Circle','Start'].includes(n.type) ? (
                         <circle cx={n.width/2} cy={n.height/2} r={Math.min(n.width, n.height)/2} fill={n.fillColor === 'transparent' ? 'none' : n.fillColor} stroke={n.borderColor} strokeWidth="4" />
                     ) : ['Triangle'].includes(n.type) ? (
                         <polygon points={`${n.width/2},0 ${n.width},${n.height} 0,${n.height}`} fill={n.fillColor === 'transparent' ? 'none' : n.fillColor} stroke={n.borderColor} strokeWidth="4" />
                     ) : (
                         <rect width={n.width} height={n.height} rx={n.borderRadius || 4} fill={n.fillColor === 'transparent' ? 'none' : n.fillColor} stroke={n.borderColor} strokeWidth="4" />
                     )}
                 </g>
             ))}
        </svg>
    );
};

// --- MENU COMPONENTS ---

const MenuOverlay = ({ anchorRect, onClose, children }: { anchorRect: DOMRect, onClose: () => void, children: React.ReactNode }) => {
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!anchorRect || !menuRef.current) return;

        const menu = menuRef.current;
        const { width, height } = menu.getBoundingClientRect();
        const GAP = 8;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        let top = anchorRect.bottom + GAP;
        let left = anchorRect.left; 

        // Auto-correct for viewport overflow
        // Flip above if bottom overflows
        if (top + height > viewportH && anchorRect.top > height) {
            top = anchorRect.top - height - GAP;
        }

        // Shift left if right side overflows
        if (left + width > viewportW) {
            left = anchorRect.right - width;
        }
        // Safe guard if still overflowing left
        if (left < GAP) {
            left = GAP;
        }

        setMenuPosition({ top, left });
    }, [anchorRect]);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEsc);
        document.addEventListener('scroll', onClose, true);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEsc);
            document.removeEventListener('scroll', onClose, true);
        };
    }, [onClose]);

    return createPortal(
        <div 
            ref={menuRef}
            style={{ 
                position: 'fixed', 
                top: menuPosition?.top ?? -9999, 
                left: menuPosition?.left ?? -9999, 
                opacity: menuPosition ? 1 : 0,
                zIndex: 9999 
            }}
            className="transition-opacity duration-200"
        >
            {children}
        </div>,
        document.body
    );
};

const DiagramMenu = ({ 
    diagram, 
    onClose,
    onOpen, 
    onRename, 
    onDuplicate, 
    onExport, 
    onShare, 
    onMove, 
    onDelete 
}: { 
    diagram: Diagram, 
    onClose: () => void, 
    onOpen: () => void, 
    onRename: () => void, 
    onDuplicate: () => void, 
    onExport: (fmt: string) => void, 
    onShare: () => void, 
    onMove: () => void, 
    onDelete: () => void 
}) => {
    const [activeSubmenu, setActiveSubmenu] = useState<'main' | 'export'>('main');

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

    return (
        <div className="w-56 bg-white dark:bg-pepper-900 rounded-xl shadow-xl border border-pepper-100 dark:border-pepper-700 p-1.5 overflow-hidden ring-1 ring-black/5 animate-fade-in">
            {activeSubmenu === 'main' && (
                <div className="space-y-0.5">
                    <MenuItem icon={FiLayout} label="Open" onClick={onOpen} />
                    <MenuItem icon={FiEdit3} label="Rename" onClick={onRename} />
                    <MenuItem icon={FiCopy} label="Duplicate" onClick={onDuplicate} />
                    <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1" />
                    <MenuItem icon={FiDownload} label="Export" hasSubmenu onClick={() => setActiveSubmenu('export')} />
                    <MenuItem icon={FiShare2} label="Share" onClick={onShare} />
                    <MenuItem icon={FiFolder} label="Move to Folder" onClick={onMove} />
                    <div className="h-px bg-pepper-100 dark:bg-pepper-800 my-1" />
                    <MenuItem icon={FiTrash2} label="Delete" danger onClick={onDelete} />
                </div>
            )}
            {activeSubmenu === 'export' && (
                <div className="space-y-0.5">
                    <button onClick={() => setActiveSubmenu('main')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white uppercase tracking-wider border-b border-pepper-100 dark:border-pepper-800 mb-1">
                      <FiCornerUpLeft /> Back
                    </button>
                    <MenuItem icon={FiImage} label="Export as PNG" onClick={() => onExport('png')} />
                    <MenuItem icon={FiCode} label="Export as SVG" onClick={() => onExport('svg')} />
                    <MenuItem icon={FiFileText} label="Export as JSON" onClick={() => onExport('json')} />
                </div>
            )}
        </div>
    );
};

// --- RICH TEXT EDITOR COMPONENT ---

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const [linkPopover, setLinkPopover] = useState<{ open: boolean, url: string, isUpdate: boolean } | null>(null);
    const selectionRange = useRef<Range | null>(null);

    // Sync external value to internal contentEditable on mount or external change (if not focused)
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
             if (document.activeElement !== editorRef.current) {
                 editorRef.current.innerHTML = value;
             }
        }
    }, [value]);

    const checkFormats = () => {
        const formats = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        if (document.queryCommandState('strikeThrough')) formats.push('strikeThrough');
        if (document.queryCommandState('insertUnorderedList')) formats.push('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) formats.push('insertOrderedList');
        // Check for link
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const node = selection.anchorNode?.parentElement;
            if (node?.closest('a')) formats.push('link');
        }
        setActiveFormats(formats);
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
        checkFormats();
        editorRef.current?.focus();
    };

    const toggleLink = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        // Save selection
        selectionRange.current = selection.getRangeAt(0);

        // Check if we are already in a link
        let currentLink = '';
        const anchorNode = selection.anchorNode?.parentElement?.closest('a');
        if (anchorNode) {
            currentLink = anchorNode.getAttribute('href') || '';
        }

        setLinkPopover({ 
            open: true, 
            url: currentLink, 
            isUpdate: !!anchorNode 
        });
    };

    const applyLink = () => {
        if (!linkPopover || !selectionRange.current) return;
        
        // Restore selection
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(selectionRange.current);

        if (linkPopover.url.trim()) {
            exec('createLink', linkPopover.url);
        } else {
            exec('unlink');
        }
        setLinkPopover(null);
    };

    const removeLink = () => {
        // Restore selection first
        if (selectionRange.current) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(selectionRange.current);
        }
        exec('unlink');
        setLinkPopover(null);
    };

    const ToolbarButton = ({ icon: Icon, format, onClick, title }: any) => (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick ? onClick() : exec(format); }}
            className={`p-1 rounded transition-colors ${activeFormats.includes(format) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-pepper-100 dark:hover:bg-pepper-800 text-pepper-500 dark:text-pepper-400'}`}
            title={title}
        >
            <Icon size={12} />
        </button>
    );

    return (
        <div className="flex flex-col gap-2 relative">
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase text-pepper-400">Label</label>
                <div className="flex gap-0.5 bg-pepper-50 dark:bg-pepper-800/50 p-0.5 rounded-md border border-pepper-100 dark:border-pepper-700/50">
                    <ToolbarButton icon={FiBold} format="bold" title="Bold" />
                    <ToolbarButton icon={FiItalic} format="italic" title="Italic" />
                    <ToolbarButton icon={FiUnderline} format="underline" title="Underline" />
                    <ToolbarButton icon={TbStrikethrough} format="strikeThrough" title="Strikethrough" />
                    <div className="w-px bg-pepper-200 dark:bg-pepper-700 mx-0.5 my-1" />
                    <ToolbarButton icon={FiList} format="insertUnorderedList" title="Bullet List" />
                    <ToolbarButton icon={TbListNumbers} format="insertOrderedList" title="Numbered List" />
                    <div className="w-px bg-pepper-200 dark:bg-pepper-700 mx-0.5 my-1" />
                    <ToolbarButton icon={FiLink} format="link" onClick={toggleLink} title="Link" />
                    <ToolbarButton icon={TbEraser} format="removeFormat" title="Clear Formatting" />
                </div>
            </div>
            
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                className="w-full h-24 bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 overflow-y-auto leading-relaxed empty:before:content-[attr(placeholder)] empty:before:text-pepper-400"
                style={{ whiteSpace: 'pre-wrap' }}
            />

            {/* Link Popover */}
            {linkPopover?.open && (
                <div className="absolute top-8 right-0 z-50 w-64 bg-white dark:bg-pepper-900 shadow-xl border border-pepper-200 dark:border-pepper-700 rounded-xl p-3 animate-fade-in">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase text-pepper-500">Enter URL</label>
                        <input 
                            autoFocus
                            value={linkPopover.url}
                            onChange={(e) => setLinkPopover({ ...linkPopover, url: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                            placeholder="https://..."
                            className="w-full bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2 mt-1">
                            {linkPopover.isUpdate && (
                                <button onClick={removeLink} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Remove Link">
                                    <FiTrash2 size={12} />
                                </button>
                            )}
                            <button onClick={() => setLinkPopover(null)} className="px-3 py-1 text-xs font-bold text-pepper-500 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded">Cancel</button>
                            <button onClick={applyLink} className="px-3 py-1 text-xs font-bold bg-blue-500 text-white rounded hover:bg-blue-600">Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- HELPERS ---

const generateSvgString = (diagram: Diagram) => {
    // A simplified SVG generator for export
    const nodesSvg = diagram.nodes.map(n => {
        let shapeHtml = '';
        const common = `stroke="${n.borderColor}" stroke-width="2" fill="${n.fillColor === 'transparent' ? 'none' : n.fillColor}"`;
        const center = { x: n.x + n.width/2, y: n.y + n.height/2 };
        
        switch(n.type) {
            case 'Circle': shapeHtml = `<circle cx="${n.x + 50}" cy="${n.y + 50}" r="49" ${common} />`; break;
            case 'Triangle': shapeHtml = `<polygon points="${n.x+50},${n.y} ${n.x+100},${n.y+100} ${n.x},${n.y+100}" ${common} />`; break;
            case 'Decision': shapeHtml = `<polygon points="${n.x+50},${n.y} ${n.x+100},${n.y+50} ${n.x+50},${n.y+100} ${n.x},${n.y+50}" ${common} />`; break;
            // Add other shapes as needed, fallback to rect
            default: shapeHtml = `<rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${n.borderRadius}" ry="${n.borderRadius}" ${common} />`;
        }

        // SVG export doesn't handle full HTML well without foreignObject, 
        // but foreignObject support in exported images can be flaky. 
        // For a basic export, we strip tags. For advanced, we'd need html-to-image lib.
        const plainText = n.label.replace(/<[^>]+>/g, '');
        const textLines = plainText.split('\n'); // Very rough approximation
        const textYStart = n.y + (n.height/2) - ((textLines.length - 1) * n.fontSize * 0.6);
        const textSvg = textLines.map((line, i) => 
            `<text x="${center.x}" y="${textYStart + (i * n.fontSize * 1.2)}" font-family="sans-serif" font-size="${n.fontSize}" fill="${n.textColor}" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${line}</text>`
        ).join('');

        return `<g transform="rotate(${n.rotation}, ${center.x}, ${center.y})">${shapeHtml}${textSvg}</g>`;
    }).join('\n');

    const edgesSvg = diagram.edges.map(e => {
        const from = diagram.nodes.find(n => n.id === e.from);
        const to = diagram.nodes.find(n => n.id === e.to);
        if(!from || !to) return '';
        // Simplified path for export (straight line mock)
        const p1 = {x: from.x + from.width/2, y: from.y + from.height/2};
        const p2 = {x: to.x + to.width/2, y: to.y + to.height/2};
        return `<path d="M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}" stroke="${e.color || '#94A3B8'}" stroke-width="${e.strokeWidth || 2}" fill="none" stroke-dasharray="${e.lineStyle === 'dashed' ? '5,5' : 'none'}" />`;
    }).join('\n');

    // Calculate bounds
    const allX = diagram.nodes.map(n => n.x);
    const allY = diagram.nodes.map(n => n.y);
    const minX = Math.min(...allX) - 50;
    const minY = Math.min(...allY) - 50;
    const maxX = Math.max(...allX.map((v, i) => v + diagram.nodes[i].width)) + 50;
    const maxY = Math.max(...allY.map((v, i) => v + diagram.nodes[i].height)) + 50;
    const width = maxX - minX;
    const height = maxY - minY;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" style="background-color: white;">
        ${edgesSvg}
        ${nodesSvg}
    </svg>`;
};

// --- GEOMETRY HELPERS ---

const getAnchorPoint = (node: DiagramNode, handle?: HandlePosition) => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const w = node.width;
    const h = node.height;
    const angle = (node.rotation || 0) * (Math.PI / 180);

    let dx = 0, dy = 0;

    switch (handle) {
        case 'top': dy = -h / 2; break;
        case 'right': dx = w / 2; break;
        case 'bottom': dy = h / 2; break;
        case 'left': dx = -w / 2; break;
        default: break;
    }

    // Rotate point around center
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);

    return { x: cx + rx, y: cy + ry };
};

const getEdgePath = (
  x1: number, y1: number, 
  x2: number, y2: number, 
  h1?: HandlePosition, 
  h2?: HandlePosition
) => {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const factor = Math.min(dist * 0.5, 150); 

  let cp1x = x1, cp1y = y1;
  switch(h1) {
    case 'top': cp1y -= factor; break;
    case 'bottom': cp1y += factor; break;
    case 'left': cp1x -= factor; break;
    case 'right': cp1x += factor; break;
  }

  let cp2x = x2, cp2y = y2;
  if (h2) {
      switch(h2) {
        case 'top': cp2y -= factor; break;
        case 'bottom': cp2y += factor; break;
        case 'left': cp2x -= factor; break;
        case 'right': cp2x += factor; break;
      }
  } else {
      if (h1 === 'right') cp2x -= factor;
      else if (h1 === 'left') cp2x += factor;
      else if (h1 === 'bottom') cp2y -= factor;
      else if (h1 === 'top') cp2y += factor;
  }

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
};

// --- HELPER UTILITIES FOR SNAPPING & GUIDES ---

interface AlignmentGuide {
    id: string;
    type: 'vertical' | 'horizontal';
    pos: number; // X or Y coordinate
}

const SNAP_IN_THRESHOLD = 5;  // Stricter threshold to snap in
const SNAP_OUT_THRESHOLD = 9; // Looser threshold to snap out (hysteresis)

const calculateSnap = (
    activeNode: DiagramNode, 
    otherNodes: DiagramNode[]
): { snappedX: number, snappedY: number, guides: AlignmentGuide[] } => {
    
    let snappedX = activeNode.x;
    let snappedY = activeNode.y;
    const guides: AlignmentGuide[] = [];

    const activeCenterX = activeNode.x + activeNode.width / 2;
    const activeCenterY = activeNode.y + activeNode.height / 2;
    const activeRight = activeNode.x + activeNode.width;
    const activeBottom = activeNode.y + activeNode.height;

    let snappedXAxis = false;
    let snappedYAxis = false;

    // PRIORITIZE CENTER ALIGNMENT
    // First pass: check centers
    for (const other of otherNodes) {
        const otherCenterX = other.x + other.width / 2;
        const otherCenterY = other.y + other.height / 2;

        if (!snappedXAxis) {
             if (Math.abs(activeCenterX - otherCenterX) < SNAP_IN_THRESHOLD) {
                 snappedX = otherCenterX - activeNode.width / 2;
                 guides.push({ id: `v-cc-${other.id}`, type: 'vertical', pos: otherCenterX });
                 snappedXAxis = true;
             }
        }
        if (!snappedYAxis) {
            if (Math.abs(activeCenterY - otherCenterY) < SNAP_IN_THRESHOLD) {
                snappedY = otherCenterY - activeNode.height / 2;
                guides.push({ id: `h-cc-${other.id}`, type: 'horizontal', pos: otherCenterY });
                snappedYAxis = true;
            }
        }
    }

    // Second pass: check edges (only if not already snapped by center)
    if (!snappedXAxis || !snappedYAxis) {
        for (const other of otherNodes) {
            const otherRight = other.x + other.width;
            const otherBottom = other.y + other.height;

            // --- VERTICAL ALIGNMENT (X-Axis) ---
            if (!snappedXAxis) {
                // Left - Left
                if (Math.abs(activeNode.x - other.x) < SNAP_IN_THRESHOLD) {
                    snappedX = other.x;
                    guides.push({ id: `v-ll-${other.id}`, type: 'vertical', pos: other.x });
                    snappedXAxis = true;
                }
                // Right - Right
                else if (Math.abs(activeRight - otherRight) < SNAP_IN_THRESHOLD) {
                    snappedX = otherRight - activeNode.width;
                    guides.push({ id: `v-rr-${other.id}`, type: 'vertical', pos: otherRight });
                    snappedXAxis = true;
                }
                // Left - Right
                else if (Math.abs(activeNode.x - otherRight) < SNAP_IN_THRESHOLD) {
                    snappedX = otherRight;
                    guides.push({ id: `v-lr-${other.id}`, type: 'vertical', pos: otherRight });
                    snappedXAxis = true;
                }
                // Right - Left
                else if (Math.abs(activeRight - other.x) < SNAP_IN_THRESHOLD) {
                    snappedX = other.x - activeNode.width;
                    guides.push({ id: `v-rl-${other.id}`, type: 'vertical', pos: other.x });
                    snappedXAxis = true;
                }
            }

            // --- HORIZONTAL ALIGNMENT (Y-Axis) ---
            if (!snappedYAxis) {
                // Top - Top
                if (Math.abs(activeNode.y - other.y) < SNAP_IN_THRESHOLD) {
                    snappedY = other.y;
                    guides.push({ id: `h-tt-${other.id}`, type: 'horizontal', pos: other.y });
                    snappedYAxis = true;
                }
                // Bottom - Bottom
                else if (Math.abs(activeBottom - otherBottom) < SNAP_IN_THRESHOLD) {
                    snappedY = otherBottom - activeNode.height;
                    guides.push({ id: `h-bb-${other.id}`, type: 'horizontal', pos: otherBottom });
                    snappedYAxis = true;
                }
                // Top - Bottom
                else if (Math.abs(activeNode.y - otherBottom) < SNAP_IN_THRESHOLD) {
                    snappedY = otherBottom;
                    guides.push({ id: `h-tb-${other.id}`, type: 'horizontal', pos: otherBottom });
                    snappedYAxis = true;
                }
                // Bottom - Top
                else if (Math.abs(activeBottom - other.y) < SNAP_IN_THRESHOLD) {
                    snappedY = other.y - activeNode.height;
                    guides.push({ id: `h-bt-${other.id}`, type: 'horizontal', pos: other.y });
                    snappedYAxis = true;
                }
            }
        }
    }

    return { snappedX, snappedY, guides };
};

// --- CANVAS COMPONENTS ---

const AlignmentGuidesLayer = ({ guides, scale, pan }: { guides: AlignmentGuide[], scale: number, pan: {x: number, y: number} }) => {
    if (!guides.length) return null;

    // We render lines across the whole virtual canvas space, simplified
    const EXTENT = 50000; 
    
    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-[60]">
             {guides.map(g => {
                 if (g.type === 'vertical') {
                     // Transform x to screen space if needed, but here we are inside the transformed container
                     // Actually, if this layer is inside the transformed container, we just use raw pos.
                     // If it's screen level overlay, we transform. 
                     // Let's assume this is rendered INSIDE the pan/zoom container for simplicity.
                     return (
                         <line 
                            key={g.id} 
                            x1={g.pos} y1={-EXTENT} 
                            x2={g.pos} y2={EXTENT} 
                            stroke="#3B82F6" strokeWidth={1 / scale} strokeDasharray={`${4/scale},${4/scale}`} 
                         />
                     );
                 } else {
                     return (
                        <line 
                            key={g.id} 
                            x1={-EXTENT} y1={g.pos} 
                            x2={EXTENT} y2={g.pos} 
                            stroke="#3B82F6" strokeWidth={1 / scale} strokeDasharray={`${4/scale},${4/scale}`} 
                         />
                     );
                 }
             })}
        </svg>
    );
};

const ConnectionHandle = ({ 
  position, 
  onMouseDown,
  onMouseUp
}: { 
  position: HandlePosition, 
  onMouseDown: (e: React.MouseEvent, pos: HandlePosition) => void,
  onMouseUp: (e: React.MouseEvent, pos: HandlePosition) => void
}) => {
  const getStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top': return { top: -5, left: '50%', transform: 'translateX(-50%)' };
      case 'right': return { top: '50%', right: -5, transform: 'translateY(-50%)' };
      case 'bottom': return { bottom: -5, left: '50%', transform: 'translateX(-50%)' };
      case 'left': return { top: '50%', left: -5, transform: 'translateY(-50%)' };
    }
  };

  return (
    <div 
      className="absolute w-2.5 h-2.5 bg-white border border-pepper-400 rounded-full hover:bg-blue-500 hover:border-blue-600 transition-colors z-50 opacity-0 group-hover:opacity-100 cursor-crosshair"
      style={getStyle()}
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, position); }}
      onMouseUp={(e) => { e.stopPropagation(); onMouseUp(e, position); }}
    />
  );
};

const ShapeRenderer = ({ type, borderRadius }: { type: ShapeKind, borderRadius: number }) => {
    const commonProps = { vectorEffect: 'non-scaling-stroke', strokeWidth: '2', stroke: 'currentColor' };
    
    switch (type) {
        // --- BASIC ---
        case 'Rectangle':
        case 'Process':
        case 'Text': 
        case 'Tag':
        case 'Callout':
        case 'GroupBox':
        case 'Swimlane':
            return <rect x="0" y="0" width="100" height="100" rx={borderRadius} ry={borderRadius} {...commonProps} strokeDasharray={type === 'GroupBox' ? '5,5' : 'none'} />;
        
        case 'StickyNote':
            return (
                <g {...commonProps}>
                    <rect x="0" y="0" width="100" height="100" rx={borderRadius} fill="currentColor" stroke="none" />
                    <path d="M70,100 L100,100 L100,70 L70,100 Z" fill="rgba(0,0,0,0.1)" stroke="none" />
                </g>
            );

        case 'Circle':
        case 'UseCase':
        case 'Interface':
        case 'Start':
            return <circle cx="50" cy="50" r="49" {...commonProps} />;
            
        case 'Triangle':
            return <polygon points="50,0 100,100 0,100" {...commonProps} />;
            
        case 'Decision':
            return <polygon points="50,0 100,50 50,100 0,50" {...commonProps} />;
            
        case 'InputOutput':
            return <polygon points="20,0 100,0 80,100 0,100" {...commonProps} />;

        case 'PredefinedProcess':
            return (
                <g {...commonProps}>
                    <rect x="0" y="0" width="100" height="100" />
                    <line x1="15" y1="0" x2="15" y2="100" />
                    <line x1="85" y1="0" x2="85" y2="100" />
                </g>
            );

        case 'DataStore':
            return (
                <g {...commonProps}>
                    <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="none" />
                    <path d="M10,0 L100,0 C80,20 80,80 100,100 L10,100 C-10,80 -10,20 10,0" fill="currentColor" stroke="currentColor" />
                </g>
            );

        case 'Terminator':
            return <rect x="0" y="0" width="100" height="100" rx={Math.max(borderRadius, 15)} ry={Math.max(borderRadius, 15)} {...commonProps} />;

        // --- UML ---
        case 'Class':
            return (
                <g {...commonProps}>
                    <rect x="0" y="0" width="100" height="100" rx={borderRadius} />
                    <line x1="0" y1="25" x2="100" y2="25" />
                    <line x1="0" y1="50" x2="100" y2="50" />
                </g>
            );
        case 'Package':
            return (
                <g {...commonProps}>
                    <path d="M0,15 L35,15 L40,0 L100,0 L100,100 L0,100 Z" />
                </g>
            );
        case 'Actor':
            return (
                <g {...commonProps} fill="none">
                    <circle cx="50" cy="15" r="10" />
                    <line x1="50" y1="25" x2="50" y2="60" />
                    <line x1="20" y1="35" x2="80" y2="35" />
                    <line x1="50" y1="60" x2="20" y2="100" />
                    <line x1="50" y1="60" x2="80" y2="100" />
                </g>
            );

        // --- DATA ---
        case 'Database':
            return (
                <g {...commonProps}>
                    <path d="M0,15 L0,85 A50,15 0 0,0 100,85 L100,15 A50,15 0 0,0 0,15" />
                    <ellipse cx="50" cy="15" rx="50" ry="15" />
                    <path d="M0,15 A50,15 0 0,0 100,15" fill="none" />
                </g>
            );
        case 'Queue':
            return (
                <g {...commonProps}>
                    <rect x="0" y="20" width="100" height="60" rx="0" />
                    <line x1="20" y1="20" x2="20" y2="80" />
                    <line x1="40" y1="20" x2="40" y2="80" />
                    <line x1="60" y1="20" x2="60" y2="80" />
                    <line x1="80" y1="20" x2="80" y2="80" />
                </g>
            );
        case 'FileStorage':
            return <path d="M10,10 L90,10 L90,90 L10,90 Z M10,10 L30,30 M90,10 L70,30 M90,90 L70,70 M10,90 L30,70 M30,30 L70,30 L70,70 L30,70 Z" {...commonProps} />;

        case 'Document':
            return (
                <path d="M0,0 L100,0 L100,80 Q75,100 50,80 Q25,60 0,80 Z" {...commonProps} />
            );
        case 'Cloud':
            return (
                 <path d="M25,60 A20,20 0 0,1 25,20 A20,20 0 0,1 55,20 A20,20 0 0,1 85,40 A20,20 0 0,1 85,80 L25,80 Z" {...commonProps} />
            );
        case 'Server':
            return (
                <g {...commonProps}>
                    <rect x="0" y="0" width="100" height="30" rx={Math.min(borderRadius, 4)} />
                    <rect x="0" y="35" width="100" height="30" rx={Math.min(borderRadius, 4)} />
                    <rect x="0" y="70" width="100" height="30" rx={Math.min(borderRadius, 4)} />
                    <circle cx="10" cy="15" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="10" cy="50" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="10" cy="85" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
                </g>
            );
        case 'API':
        case 'APIGateway':
            return (
                <g {...commonProps}>
                   <rect x="0" y="0" width="100" height="100" rx={borderRadius} />
                   <path d="M20,50 L40,50 M60,50 L80,50 M50,20 L50,40 M50,60 L50,80" strokeWidth="4" />
                   <circle cx="50" cy="50" r="15" fill="none" strokeWidth="3" />
                </g>
            );
        
        // --- NETWORK / GENERIC ICONS ---
        // For simpler shapes, just render a box/circle container. 
        // The icon is rendered separately in CanvasNode to keep it upright.
        default:
            if (['Router', 'Switch', 'Firewall', 'LoadBalancer', 'ClientDevice', 'Cache', 'EventStream'].includes(type)) {
                 return <rect x="0" y="0" width="100" height="100" rx={borderRadius} {...commonProps} />;
            }
            return <rect x="0" y="0" width="100" height="100" rx={borderRadius} {...commonProps} />;
    }
};

const CanvasNode = ({ 
    node, 
    isSelected, 
    onSelect, 
    onDragStart,
    onHandleMouseDown,
    onHandleMouseUp,
    onResizeStart,
    onRotateStart
}: { 
    node: DiagramNode, 
    isSelected: boolean, 
    onSelect: (id: string, shift: boolean) => void, 
    onDragStart: (e: React.MouseEvent, id: string) => void, 
    onHandleMouseDown: (e: React.MouseEvent, nodeId: string, handle: HandlePosition) => void, 
    onHandleMouseUp: (e: React.MouseEvent, nodeId: string, handle: HandlePosition) => void, 
    onResizeStart: (e: React.MouseEvent, id: string, handle: string) => void, 
    onRotateStart: (e: React.MouseEvent, id: string) => void 
}) => {
    // Directly use HTML content
    const htmlContent = useMemo(() => ({ __html: node.label }), [node.label]);
    
    // Find icon if available
    const ShapeDef = MASTER_SHAPE_LIBRARY.find(s => s.type === node.type);
    const Icon = ShapeDef?.icon;
    const isIconShape = ['Router', 'Switch', 'Firewall', 'LoadBalancer', 'ClientDevice', 'Cache', 'EventStream', 'Actor'].includes(node.type);

    return (
        <div 
            style={{ 
                left: node.x, 
                top: node.y, 
                width: node.width, 
                height: node.height,
                transform: `rotate(${node.rotation || 0}deg)`,
                color: node.borderColor
            }}
            onMouseDown={(e) => { e.stopPropagation(); onSelect(node.id, e.shiftKey); onDragStart(e, node.id); }}
            className={`absolute group select-none`}
        >
            {/* Shape SVG Layer */}
            <div className={`w-full h-full absolute inset-0 ${isSelected ? 'drop-shadow-lg' : ''}`}>
                 <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none" 
                    className="overflow-visible"
                    style={{ fill: node.fillColor }}
                 >
                    <ShapeRenderer type={node.type} borderRadius={node.borderRadius} />
                 </svg>
            </div>

            {/* Central Icon for specific shapes */}
            {isIconShape && Icon && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20" style={{ color: node.borderColor }}>
                    <Icon size={Math.min(node.width, node.height) * 0.5} />
                </div>
            )}

            {/* Content Layer (Label) with Proper Wrapping */}
            <div className="absolute inset-0 pointer-events-none">
                <foreignObject width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <div 
                        className={`w-full h-full flex flex-col items-center justify-center p-3 text-center overflow-hidden break-words whitespace-pre-wrap leading-snug ${node.type === 'Actor' ? 'pt-16' : ''}`}
                        style={{ color: node.textColor, fontSize: `${node.fontSize || 14}px` }}
                        dangerouslySetInnerHTML={htmlContent}
                    />
                </foreignObject>
            </div>
            
            {/* Selection Outline & Controls */}
            {isSelected && (
                <>
                    <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" style={{ margin: -2 }}></div>
                    {/* Resize Handles (8 points) */}
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => (
                        <div 
                            key={h}
                            className={`absolute w-2.5 h-2.5 bg-white border border-blue-500 z-30
                                ${h === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                                ${h === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize' : ''}
                                ${h === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                                ${h === 'e' ? 'top-1/2 -translate-y-1/2 -right-1.5 cursor-e-resize' : ''}
                                ${h === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                                ${h === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize' : ''}
                                ${h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                                ${h === 'w' ? 'top-1/2 -translate-y-1/2 -left-1.5 cursor-w-resize' : ''}
                            `}
                            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, node.id, h); }}
                        />
                    ))}
                    {/* Rotate Handle */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-blue-500" />
                    <div 
                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-30 shadow-sm"
                        onMouseDown={(e) => { e.stopPropagation(); onRotateStart(e, node.id); }}
                    >
                        <FiRotateCw size={10} className="text-blue-500" />
                    </div> 
                </>
            )}

            {/* Connection Handles */}
            <ConnectionHandle position="top" onMouseDown={(e, h) => onHandleMouseDown(e, node.id, h)} onMouseUp={(e, h) => onHandleMouseUp(e, node.id, h)} />
            <ConnectionHandle position="right" onMouseDown={(e, h) => onHandleMouseDown(e, node.id, h)} onMouseUp={(e, h) => onHandleMouseUp(e, node.id, h)} />
            <ConnectionHandle position="bottom" onMouseDown={(e, h) => onHandleMouseDown(e, node.id, h)} onMouseUp={(e, h) => onHandleMouseUp(e, node.id, h)} />
            <ConnectionHandle position="left" onMouseDown={(e, h) => onHandleMouseDown(e, node.id, h)} onMouseUp={(e, h) => onHandleMouseUp(e, node.id, h)} />
        </div>
    );
};

const CanvasEdge = ({ edge, from, to, isSelected, onSelect }: { edge: DiagramEdge, from: DiagramNode, to: DiagramNode, isSelected: boolean, onSelect: (id: string) => void }) => {
    if (!from || !to) return null;

    const start = getAnchorPoint(from, edge.fromHandle);
    const end = getAnchorPoint(to, edge.toHandle);
    const pathD = getEdgePath(start.x, start.y, end.x, end.y, edge.fromHandle, edge.toHandle);

    return (
        <g onClick={(e) => { e.stopPropagation(); onSelect(edge.id); }} className="group cursor-pointer pointer-events-auto">
            <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />
            {isSelected && <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth={(edge.strokeWidth || 2) + 4} opacity="0.3" />}
            <path 
                d={pathD}
                fill="none"
                stroke={isSelected ? '#3B82F6' : (edge.color || '#94A3B8')}
                strokeWidth={edge.strokeWidth || 2}
                strokeDasharray={edge.lineStyle === 'dashed' ? '5,5' : edge.lineStyle === 'dotted' ? '2,2' : 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#arrow-${edge.id})`}
                className="transition-colors group-hover:stroke-blue-400 pointer-events-none"
            />
             <defs>
                <marker id={`arrow-${edge.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={isSelected ? '#3B82F6' : (edge.color || '#94A3B8')} />
                </marker>
            </defs>
            {edge.label && (
                <foreignObject x={(start.x + end.x) / 2 - 30} y={(start.y + end.y) / 2 - 12} width={60} height={24} style={{ overflow: 'visible' }}>
                     <div className="flex items-center justify-center w-full h-full pointer-events-none">
                        <span className="bg-white/95 dark:bg-pepper-900/95 text-[10px] px-1.5 py-0.5 rounded border border-pepper-200 dark:border-pepper-700 shadow-sm text-pepper-700 dark:text-pepper-200 whitespace-nowrap font-medium">
                            {edge.label}
                        </span>
                     </div>
                </foreignObject>
            )}
        </g>
    );
};

// --- MAIN COMPONENT ---

export const DiagramStudio: React.FC = () => {
    // --- State ---
    const [diagrams, setDiagrams] = useState<Diagram[]>(INITIAL_DIAGRAMS);
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [rightPanel, setRightPanel] = useState<'properties' | 'history'>('properties');
    
    // UI States
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGridVisible, setIsGridVisible] = useState(true);
    const [connectingState, setConnectingState] = useState<{ sourceId: string, sourceHandle: HandlePosition, currentX: number, currentY: number } | null>(null);
    const [resizeState, setResizeState] = useState<{ nodeId: string, handle: string, startX: number, startY: number, startW: number, startH: number, startNodeX: number, startNodeY: number, rotation: number } | null>(null);
    const [rotateState, setRotateState] = useState<{ nodeId: string, startAngle: number, startRotation: number, cx: number, cy: number } | null>(null);
    const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [shapeSearchQuery, setShapeSearchQuery] = useState('');
    
    // Alignment Guides State
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

    // Modals
    const [activeMenu, setActiveMenu] = useState<{ id: string, rect: DOMRect } | null>(null);
    const [createModal, setCreateModal] = useState<{ open: boolean, type: string }>({ open: false, type: 'Flowchart' });
    const [renameModal, setRenameModal] = useState<{ open: boolean, id: string | null, title: string }>({ open: false, id: null, title: '' });
    const [shareModal, setShareModal] = useState<{ open: boolean, link: string }>({ open: false, link: '' });
    const [moveModal, setMoveModal] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
    const [toast, setToast] = useState<string | null>(null);
    const [saveVersionModal, setSaveVersionModal] = useState<{ open: boolean, name: string }>({ open: false, name: '' });
    const [restoreVersionModal, setRestoreVersionModal] = useState<{ open: boolean, version: DiagramVersion | null }>({ open: false, version: null });
    
    // New Export Modal
    const [exportModal, setExportModal] = useState<{ open: boolean, formats: string[] }>({ open: false, formats: ['png'] });

    // History & Auto-save
    const [undoStack, setUndoStack] = useState<Diagram[]>([]);
    const [redoStack, setRedoStack] = useState<Diagram[]>([]);

    const canvasRef = useRef<HTMLDivElement>(null);
    const activeDiagram = useMemo(() => diagrams.find(d => d.id === activeDiagramId) || null, [diagrams, activeDiagramId]);

    // --- Auto Save Hook ---
    useEffect(() => {
        if (!activeDiagram) return;

        const timeout = setTimeout(() => {
            // Simulate auto-save logic: Update timestamp
            setDiagrams(prev => prev.map(d => 
                d.id === activeDiagram.id 
                ? { 
                    ...d, 
                    updatedAt: new Date().toISOString(),
                    // Update preview on auto-save
                    preview: { nodes: d.nodes, edges: d.edges, thumbnailUrl: d.preview?.thumbnailUrl } 
                  } 
                : d
            ));
            // In a real app, we'd invoke an API here
        }, 1000); // 1s debounce

        return () => clearTimeout(timeout);
    }, [activeDiagram]); // Dependency on activeDiagram triggers on any change

    // --- Undo/Redo Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undoStack, redoStack, activeDiagram]);


    // --- Search Filter ---
    const filteredShapeCategories = useMemo(() => {
        if (!shapeSearchQuery.trim()) {
            return SHAPE_CATEGORIES.map(cat => ({
                name: cat,
                items: MASTER_SHAPE_LIBRARY.filter(s => s.category === cat)
            }));
        }
        
        const lowerQuery = shapeSearchQuery.toLowerCase();
        
        return SHAPE_CATEGORIES.map(cat => {
            const catMatches = cat.toLowerCase().includes(lowerQuery);
            const matchingItems = MASTER_SHAPE_LIBRARY.filter(s => 
                s.category === cat && 
                (catMatches || s.label.toLowerCase().includes(lowerQuery))
            );
            return { name: cat, items: matchingItems };
        }).filter(group => group.items.length > 0);
        
    }, [shapeSearchQuery]);

    // --- Actions ---

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const updateActiveDiagram = (updater: (d: Diagram) => Diagram, pushToHistory = true) => {
        if (!activeDiagram) return;
        if (pushToHistory) {
             setUndoStack(prev => [...prev.slice(-49), activeDiagram]); // Cap history at 50
             setRedoStack([]);
        }
        setDiagrams(prev => prev.map(d => d.id === activeDiagram.id ? updater(d) : d));
    };

    // --- Handle Manual Save (Updates Preview) ---
    const handleManualSave = () => {
        if (!activeDiagram) return;
        
        // Create a fresh preview snapshot
        const currentPreview: DiagramPreview = {
            nodes: JSON.parse(JSON.stringify(activeDiagram.nodes)),
            edges: JSON.parse(JSON.stringify(activeDiagram.edges))
        };

        updateActiveDiagram(d => ({ ...d, preview: currentPreview }), true);
        showToast('Diagram saved');
    };


    const handleUndo = () => {
        if (undoStack.length === 0 || !activeDiagram) return;
        const previous = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, activeDiagram]);
        setUndoStack(prev => prev.slice(0, -1));
        setDiagrams(prev => prev.map(d => d.id === activeDiagram.id ? previous : d));
    };

    const handleRedo = () => {
        if (redoStack.length === 0 || !activeDiagram) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, activeDiagram]);
        setRedoStack(prev => prev.slice(0, -1));
        setDiagrams(prev => prev.map(d => d.id === activeDiagram.id ? next : d));
    };

    const deleteSelection = useCallback(() => {
        if (!activeDiagram || selectedIds.size === 0) return;
        updateActiveDiagram(d => ({
            ...d,
            nodes: d.nodes.filter(n => !selectedIds.has(n.id)),
            edges: d.edges.filter(e => !selectedIds.has(e.id) && !selectedIds.has(e.from) && !selectedIds.has(e.to))
        }));
        setSelectedIds(new Set());
        showToast('Selection deleted');
    }, [activeDiagram, selectedIds]);

    // --- Export Handler (Global for Menu) ---
    const handleGlobalExport = (diagram: Diagram, formats: string[]) => {
        if (formats.includes('json')) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diagram));
            const a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `${diagram.title}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        } 
        
        if (formats.includes('svg') || formats.includes('png')) {
            const svgString = generateSvgString(diagram);
            
            if (formats.includes('svg')) {
                const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${diagram.title}.svg`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }

            if (formats.includes('png')) {
                const img = new Image();
                const svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if(ctx) {
                        ctx.drawImage(img, 0, 0);
                        const pngUrl = canvas.toDataURL("image/png");
                        const a = document.createElement('a');
                        a.href = pngUrl;
                        a.download = `${diagram.title}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    }
                };
                img.src = url;
            }
        }
        setExportModal({ ...exportModal, open: false });
        showToast('Export successful');
    };

    // --- Export Handler (Active Diagram) ---
    const handleExport = (formats: string[]) => {
        if (!activeDiagram) return;
        handleGlobalExport(activeDiagram, formats);
    };

    // --- Diagram Management Handlers ---

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!renameModal.id || !renameModal.title.trim()) return;
        setDiagrams(prev => prev.map(d => d.id === renameModal.id ? { ...d, title: renameModal.title, updatedAt: new Date().toISOString() } : d));
        setRenameModal({ open: false, id: null, title: '' });
        showToast('Diagram renamed');
    };

    const handleDuplicate = (id: string) => {
        const source = diagrams.find(d => d.id === id);
        if (!source) return;
        const newDiagram: Diagram = {
            ...source,
            id: crypto.randomUUID(),
            title: `${source.title} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setDiagrams(prev => [...prev, newDiagram]);
        showToast('Diagram duplicated');
    };

    const handleDeleteConfirm = () => {
        if (!deleteModal.id) return;
        setDiagrams(prev => prev.filter(d => d.id !== deleteModal.id));
        setDeleteModal({ open: false, id: null });
        showToast('Diagram deleted');
    };

    const handleShare = (id: string) => {
        const link = `https://flownyx.app/diagram/${id}`;
        setShareModal({ open: true, link });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareModal.link);
        setShareModal({ ...shareModal, open: false });
        showToast('Link copied to clipboard');
    };

    const handleMove = (id: string) => {
        setMoveModal({ open: true, id });
    };

    const handleMoveConfirm = (folderId: string) => {
        if (!moveModal.id) return;
        setDiagrams(prev => prev.map(d => d.id === moveModal.id ? { ...d, folderId } : d));
        setMoveModal({ open: false, id: null });
        showToast('Diagram moved');
    };

    // --- Standard Interactions ---
    
    // --- Helper for update prop ---
    const updateSelectedNodeProp = (key: keyof DiagramNode, value: any) => {
        if (selectedIds.size === 0) return;
        updateActiveDiagram(d => ({
            ...d,
            nodes: d.nodes.map(n => selectedIds.has(n.id) ? { ...n, [key]: value } : n)
        }));
    };

    const updateSelectedEdgeProp = (key: keyof DiagramEdge, value: any) => {
        if (selectedIds.size === 0) return;
        updateActiveDiagram(d => ({
            ...d,
            edges: d.edges.map(e => selectedIds.has(e.id) ? { ...e, [key]: value } : e)
        }));
    };

    // Interaction hooks
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.getAttribute('contenteditable')) return;
                deleteSelection();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteSelection]);

    const handleResizeStart = (e: React.MouseEvent, id: string, handle: string) => {
        if(!activeDiagram) return;
        const node = activeDiagram.nodes.find(n => n.id === id);
        if(!node) return;
        setResizeState({
            nodeId: id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startW: node.width,
            startH: node.height,
            startNodeX: node.x,
            startNodeY: node.y,
            rotation: node.rotation || 0
        });
    };

    const handleRotateStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!activeDiagram || !canvasRef.current) return;
        const node = activeDiagram.nodes.find(n => n.id === id);
        if(!node) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = rect.left + pan.x + (node.x + node.width / 2) * scale;
        const cy = rect.top + pan.y + (node.y + node.height / 2) * scale;
        const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
        setRotateState({ nodeId: id, startAngle, startRotation: node.rotation || 0, cx, cy });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        } else if (e.button === 0) {
            setSelectedIds(new Set());
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current || !activeDiagram) return;
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (isDraggingNode) {
            const rawDx = (e.clientX - lastMousePos.x) / scale;
            const rawDy = (e.clientY - lastMousePos.y) / scale;
            
            // --- SNAPPING LOGIC ---
            let finalDx = rawDx;
            let finalDy = rawDy;
            
            // We calculate snapping only for the currently dragged node
            // Since multiple can be selected, we just use the 'isDraggingNode' id if possible.
            // However, current state `isDraggingNode` stores ID string.
            
            const draggingNode = activeDiagram.nodes.find(n => n.id === isDraggingNode);
            let newGuides: AlignmentGuide[] = [];

            if (draggingNode) {
                // Simulate tentative position
                const tentativeNode = { 
                    ...draggingNode, 
                    x: draggingNode.x + rawDx, 
                    y: draggingNode.y + rawDy 
                };
                
                // Compare against all OTHER nodes
                const otherNodes = activeDiagram.nodes.filter(n => n.id !== draggingNode.id);
                const snapResult = calculateSnap(tentativeNode, otherNodes);
                
                // If snapped, adjust the delta
                if (snapResult.snappedX !== tentativeNode.x) {
                    finalDx = snapResult.snappedX - draggingNode.x;
                }
                if (snapResult.snappedY !== tentativeNode.y) {
                    finalDy = snapResult.snappedY - draggingNode.y;
                }
                
                newGuides = snapResult.guides;
            }
            
            setAlignmentGuides(newGuides);

            setDiagrams(prev => prev.map(d => {
                if(d.id !== activeDiagram.id) return d;
                return {
                    ...d,
                    nodes: d.nodes.map(n => selectedIds.has(n.id) ? { ...n, x: n.x + finalDx, y: n.y + finalDy } : n)
                }
            }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (resizeState) {
            const rawDx = (e.clientX - resizeState.startX) / scale;
            const rawDy = (e.clientY - resizeState.startY) / scale;
            const rad = -(resizeState.rotation * Math.PI) / 180;
            const dx = rawDx * Math.cos(rad) - rawDy * Math.sin(rad);
            const dy = rawDx * Math.sin(rad) + rawDy * Math.cos(rad);
            let newW = resizeState.startW;
            let newH = resizeState.startH;
            if (resizeState.handle.includes('e')) newW += dx;
            if (resizeState.handle.includes('w')) { newW -= dx; }
            if (resizeState.handle.includes('s')) newH += dy;
            if (resizeState.handle.includes('n')) { newH -= dy; }
            const validW = Math.max(20, newW);
            const validH = Math.max(20, newH);
            setDiagrams(prev => prev.map(d => d.id === activeDiagram.id ? {
                ...d,
                nodes: d.nodes.map(n => n.id === resizeState.nodeId ? { ...n, width: validW, height: validH } : n)
            } : d));
            
            // Simple guide clearing on resize (or could add resize snapping later)
            setAlignmentGuides([]);

        } else if (rotateState) {
            const currentAngle = Math.atan2(e.clientY - rotateState.cy, e.clientX - rotateState.cx) * 180 / Math.PI;
            const delta = currentAngle - rotateState.startAngle;
            let rawRotation = (rotateState.startRotation + delta) % 360;
            if (rawRotation < 0) rawRotation += 360;

            // --- ROTATION SNAP ---
            const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];
            const ROT_THRESHOLD = 5;
            let finalRotation = rawRotation;

            for (const angle of SNAP_ANGLES) {
                if (Math.abs(rawRotation - angle) < ROT_THRESHOLD) {
                    finalRotation = angle % 360;
                    break;
                }
            }

            setDiagrams(prev => prev.map(d => d.id === activeDiagram.id ? {
                ...d,
                nodes: d.nodes.map(n => n.id === rotateState.nodeId ? { ...n, rotation: Math.round(finalRotation) } : n)
            } : d));
        } else if (connectingState) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / scale;
            const y = (e.clientY - rect.top - pan.y) / scale;
            setConnectingState(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        // Push snapshot to history ONLY if an action actually happened
        if (isDraggingNode || resizeState || rotateState) {
             updateActiveDiagram(d => d, true); // Force push history
        }

        setIsPanning(false);
        setIsDraggingNode(null);
        setResizeState(null);
        setRotateState(null);
        setAlignmentGuides([]); // Clear guides
        if (connectingState) setConnectingState(null);
    };

    const handleNodeDragStart = (e: React.MouseEvent, id: string) => {
        if (connectingState) return;
        if (!selectedIds.has(id)) {
            setSelectedIds(new Set([id]));
        }
        setIsDraggingNode(id);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string, handle: HandlePosition) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;
        setConnectingState({ sourceId: nodeId, sourceHandle: handle, currentX: x, currentY: y });
    };

    const handleHandleMouseUp = (e: React.MouseEvent, nodeId: string, handle: HandlePosition) => {
        e.stopPropagation();
        if (connectingState && connectingState.sourceId !== nodeId) {
            updateActiveDiagram(d => ({
                ...d,
                edges: [...d.edges, {
                    id: crypto.randomUUID(),
                    from: connectingState.sourceId,
                    to: nodeId,
                    fromHandle: connectingState.sourceHandle,
                    toHandle: handle,
                    color: '#94A3B8',
                    arrowStyle: 'arrow',
                    lineStyle: 'solid',
                    strokeWidth: 2
                }]
            }));
            setConnectingState(null);
        }
    };

    const handleDropShape = (e: React.DragEvent, type: string) => {
        e.preventDefault();
        if (!activeDiagram || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / scale;
        const y = (e.clientY - rect.top - pan.y) / scale;
        
        const def = MASTER_SHAPE_LIBRARY.find(s => s.type === type);
        const defaults = def ? def.defaultProps : { width: 100, height: 100, fillColor: '#FFF', borderColor: '#94A3B8' };

        const newNode: DiagramNode = {
            id: crypto.randomUUID(),
            type: type as ShapeKind,
            x: x - (defaults.width || 100) / 2, 
            y: y - (defaults.height || 100) / 2,
            width: defaults.width || 100, 
            height: defaults.height || 100,
            label: def ? def.label : type,
            fillColor: defaults.fillColor || '#FFFFFF',
            borderColor: defaults.borderColor || '#94A3B8',
            textColor: defaults.textColor || '#1E293B',
            rotation: 0,
            borderRadius: defaults.borderRadius || 2,
            fontSize: 14,
            ...defaults
        };
        updateActiveDiagram(d => ({ ...d, nodes: [...d.nodes, newNode] }));
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const title = data.get('title') as string;
        const type = data.get('type') as string;
        const newDiagram: Diagram = {
            id: crypto.randomUUID(),
            title: title || 'Untitled Diagram',
            type: type || 'Flowchart',
            nodes: [],
            edges: [],
            history: [],
            comments: [],
            linkedIssueIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setDiagrams(prev => [...prev, newDiagram]);
        setActiveDiagramId(newDiagram.id);
        setViewMode('editor');
        setCreateModal({ open: false, type: 'Flowchart' });
        showToast('Diagram created');
    };

    const handleGenerateDiagram = () => {
        // AI Logic same as before
        if (!aiPrompt.trim()) return;
        const lines = aiPrompt.split('\n').filter(l => l.trim());
        const newNodes: DiagramNode[] = [];
        const newEdges: DiagramEdge[] = [];
        lines.forEach((line, idx) => {
            const id = crypto.randomUUID();
            newNodes.push({
                id,
                type: 'Process',
                label: line,
                x: 100 + (idx * 180),
                y: 150,
                width: 140, height: 70,
                fillColor: '#EFF6FF', borderColor: '#3B82F6', textColor: '#1E40AF', rotation: 0, borderRadius: 4, fontSize: 14
            });
            if (idx > 0) {
                newEdges.push({
                    id: crypto.randomUUID(),
                    from: newNodes[idx-1].id,
                    to: id,
                    fromHandle: 'right',
                    toHandle: 'left',
                    color: '#94A3B8', arrowStyle: 'arrow', lineStyle: 'solid', strokeWidth: 2
                });
            }
        });
        updateActiveDiagram(d => ({ ...d, nodes: [...d.nodes, ...newNodes], edges: [...d.edges, ...newEdges] }));
        setIsAiModalOpen(false);
        setAiPrompt('');
        showToast('Diagram generated from text');
    };

    // --- Version History (Keep implementation) ---
    const handleSaveVersionClick = () => { if (!activeDiagram) return; const nextVerNum = activeDiagram.history.length + 1; setSaveVersionModal({ open: true, name: `Version ${nextVerNum}` }); };
    const handleConfirmSaveVersion = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!activeDiagram || !saveVersionModal.name.trim()) return; 
        const newVersion: DiagramVersion = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), label: saveVersionModal.name, snapshot: { nodes: JSON.parse(JSON.stringify(activeDiagram.nodes)), edges: JSON.parse(JSON.stringify(activeDiagram.edges)), meta: { zoom: scale, panX: pan.x, panY: pan.y } } };
        updateActiveDiagram(d => ({ ...d, history: [newVersion, ...d.history] }), false);
        setSaveVersionModal({ open: false, name: '' });
        showToast(`Version "${newVersion.label}" saved`);
    };
    const handleRestoreVersionClick = (version: DiagramVersion) => { setRestoreVersionModal({ open: true, version }); };
    const handleConfirmRestoreVersion = () => { 
        const version = restoreVersionModal.version;
        if (!activeDiagram || !version) return; 
        setUndoStack(prev => [...prev.slice(-19), activeDiagram]); 
        setRedoStack([]); 
        setDiagrams(prev => prev.map(d => { if (d.id !== activeDiagram.id) return d; return { ...d, nodes: JSON.parse(JSON.stringify(version.snapshot.nodes)), edges: JSON.parse(JSON.stringify(version.snapshot.edges)) }; })); 
        if (version.snapshot.meta) { setScale(version.snapshot.meta.zoom); setPan({ x: version.snapshot.meta.panX, y: version.snapshot.meta.panY }); }
        setRestoreVersionModal({ open: false, version: null }); 
        showToast(`Restored version "${version.label}"`); 
    };

    // --- RENDER ---

    if (viewMode === 'list') {
        return (
            <div className="h-full flex flex-col p-8 bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in relative">
                {toast && <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 bg-pepper-900 text-white rounded-xl shadow-lg flex items-center gap-3 animate-slide-up"><FiCheck /><span className="text-sm font-bold">{toast}</span></div>}
                <div className="flex justify-between items-center mb-8">
                    <div><h1 className="text-3xl font-display font-extrabold text-pepper-900 dark:text-white mb-2">Diagram Studio</h1><p className="text-sm text-pepper-500 dark:text-pepper-400">Visualize your architecture, flows, and ideas.</p></div>
                    <div className="flex gap-3"><button onClick={() => setCreateModal({ open: true, type: 'Flowchart' })} className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:translate-y-[-1px] transition-transform flex items-center gap-2"><FiPlus /> New Diagram</button></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-10 custom-scrollbar pt-2">
                    <div onClick={() => setCreateModal({ open: true, type: 'Flowchart' })} className="group aspect-[4/3] bg-white dark:bg-pepper-900 border-2 border-dashed border-pepper-200 dark:border-pepper-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-pepper-900 dark:hover:border-pepper-400 transition-colors"><div className="w-16 h-16 rounded-full bg-pepper-50 dark:bg-pepper-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FiPlus className="text-3xl text-pepper-400 dark:text-pepper-500 group-hover:text-pepper-900 dark:group-hover:text-pepper-400" /></div><span className="font-bold text-pepper-500 dark:text-pepper-500 group-hover:text-pepper-900 dark:group-hover:text-pepper-400">Create Blank</span></div>
                    {diagrams.map(d => (
                        <div key={d.id} onClick={() => { setActiveDiagramId(d.id); setViewMode('editor'); }} className="group aspect-[4/3] bg-white dark:bg-pepper-900 border border-pepper-200 dark:border-pepper-800 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:translate-y-[-2px] transition-all relative">
                             <div className="h-full flex flex-col"><div className="flex-1 bg-pepper-50 dark:bg-pepper-800/50 rounded-lg mb-4 border border-pepper-100 dark:border-pepper-800/50 flex items-center justify-center overflow-hidden relative">
                                <DiagramThumbnail preview={d.preview} />
                             </div><div><div className="flex justify-between items-start"><h3 className="font-bold text-sm text-pepper-900 dark:text-white truncate pr-2">{d.title}</h3><button onClick={(e) => { e.stopPropagation(); setActiveMenu({ id: d.id, rect: e.currentTarget.getBoundingClientRect() }); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded text-pepper-400 hover:text-pepper-900 dark:hover:text-white transition-all"><FiMoreHorizontal /></button></div><p className="text-[10px] text-pepper-500 flex justify-between mt-1"><span>{d.type}</span><span>{new Date(d.updatedAt).toLocaleDateString()}</span></p></div></div>
                        </div>
                    ))}
                </div>
                {activeMenu && <MenuOverlay anchorRect={activeMenu.rect} onClose={() => setActiveMenu(null)}>
                    <DiagramMenu 
                        diagram={diagrams.find(d => d.id === activeMenu.id)!} 
                        onClose={() => setActiveMenu(null)} 
                        onOpen={() => { setActiveDiagramId(activeMenu.id); setViewMode('editor'); setActiveMenu(null); }} 
                        onRename={() => { setRenameModal({ open: true, id: activeMenu.id, title: diagrams.find(d => d.id === activeMenu.id)?.title || '' }); setActiveMenu(null); }} 
                        onDuplicate={() => { handleDuplicate(activeMenu.id); setActiveMenu(null); }} 
                        onExport={(fmt) => { handleGlobalExport(diagrams.find(d => d.id === activeMenu.id)!, [fmt]); setActiveMenu(null); }} 
                        onShare={() => { handleShare(activeMenu.id); setActiveMenu(null); }} 
                        onMove={() => { handleMove(activeMenu.id); setActiveMenu(null); }} 
                        onDelete={() => { setDeleteModal({ open: true, id: activeMenu.id }); setActiveMenu(null); }} 
                    />
                </MenuOverlay>}
                
                {/* Modals for Menu Actions */}
                <Modal isOpen={createModal.open} onClose={() => setCreateModal({ ...createModal, open: false })}><div className="bg-white dark:bg-pepper-900 w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}><h3 className="font-bold text-lg mb-4">Create Diagram</h3><form onSubmit={handleCreateSubmit} className="space-y-4"><input name="title" required autoFocus placeholder="Diagram Name" className="w-full border rounded-lg p-2 bg-pepper-50 text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700" /><select name="type" className="w-full border rounded-lg p-2 bg-pepper-50 text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700">{DIAGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><div className="flex justify-end gap-2"><button type="submit" className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg">Create</button></div></form></div></Modal>
                
                <Modal isOpen={renameModal.open} onClose={() => setRenameModal({ ...renameModal, open: false })}>
                    <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Rename Diagram</h3>
                        <form onSubmit={handleRenameSubmit}>
                            <input autoFocus value={renameModal.title} onChange={(e) => setRenameModal({ ...renameModal, title: e.target.value })} className="w-full border rounded-lg p-2 mb-4 bg-pepper-50 text-pepper-800 dark:text-pepper-400 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700" />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setRenameModal({ ...renameModal, open: false })} className="px-4 py-2 text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </Modal>

                <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })}>
                    <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-2 text-red-600">Delete Diagram?</h3>
                        <p className="text-sm text-pepper-500 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteModal({ open: false, id: null })} className="px-4 py-2 text-sm font-bold text-pepper-500">Cancel</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Delete</button>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={shareModal.open} onClose={() => setShareModal({ ...shareModal, open: false })}>
                    <div className="bg-white dark:bg-pepper-900 w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Share Diagram</h3>
                        <div className="flex gap-2">
                            <input readOnly value={shareModal.link} className="flex-1 bg-pepper-50 border rounded-lg p-2 text-sm text-pepper-500" />
                            <button onClick={handleCopyLink} className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold">Copy</button>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={moveModal.open} onClose={() => setMoveModal({ open: false, id: null })}>
                    <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4">Move to Folder</h3>
                        <div className="space-y-2 mb-6">
                            {['All Diagrams', 'Flowcharts', 'Architecture', 'Workflows', 'Archived'].map(f => (
                                <button key={f} onClick={() => handleMoveConfirm(f)} className="w-full text-left p-2 hover:bg-pepper-600 hover:text-pepper-200 rounded-lg text-sm font-medium flex items-center gap-2">
                                    <FiFolder /> {f}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setMoveModal({ open: false, id: null })} className="w-full text-center text-sm text-pepper-500">Cancel</button>
                    </div>
                </Modal>
            </div>
        );
    }

    if (!activeDiagram) return null;

    const selectedNode = activeDiagram.nodes.find(n => selectedIds.has(n.id));
    const selectedEdge = activeDiagram.edges.find(e => selectedIds.has(e.id));

    return (
        <div className="h-full flex flex-col bg-pepper-50 dark:bg-pepper-950 overflow-hidden animate-fade-in select-none">
            {toast && <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 bg-pepper-900 text-white rounded-xl shadow-lg flex items-center gap-3 animate-slide-up"><FiCheck /><span className="text-sm font-bold">{toast}</span></div>}
            
            {/* Toolbar */}
            <div className="h-14 bg-white dark:bg-pepper-900 border-b border-pepper-200 dark:border-pepper-800 flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500 transition-colors"><FiCornerUpLeft /></button>
                    <div className="h-6 w-px bg-pepper-200 dark:bg-pepper-800"></div>
                    <input value={activeDiagram.title} onChange={(e) => updateActiveDiagram(d => ({ ...d, title: e.target.value }), false)} className="font-bold text-sm bg-transparent outline-none text-pepper-900 dark:text-white w-48 focus:border-b border-blue-500" />
                </div>
                <div className="flex items-center gap-2 bg-pepper-100 dark:bg-pepper-800 p-1 rounded-lg">
                    <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-1.5 hover:bg-white dark:hover:bg-pepper-700 rounded-md text-pepper-600 dark:text-pepper-300 disabled:opacity-30"><FiCornerUpLeft /></button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 hover:bg-white dark:hover:bg-pepper-700 rounded-md text-pepper-600 dark:text-pepper-300 disabled:opacity-30"><FiCornerUpRight /></button>
                    <div className="w-px h-4 bg-pepper-300 dark:bg-pepper-600 mx-1"></div>
                    <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-pepper-700 rounded-md"><FiMinus /></button>
                    <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-pepper-700 rounded-md"><FiPlus /></button>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"><BiBot /> AI Tools</button>
                    {/* EXPORT BUTTON */}
                    <button onClick={() => setExportModal({ open: true, formats: ['png'] })} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500"><FiDownload /></button>
                    {/* SAVE BUTTON */}
                    <button onClick={handleManualSave} className="p-2 hover:bg-pepper-100 dark:hover:bg-pepper-800 rounded-lg text-pepper-500"><FiCheck /></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar */}
                <div className="w-60 bg-white dark:bg-pepper-900 border-r border-pepper-200 dark:border-pepper-800 flex flex-col z-20 shadow-sm">
                    <div className="p-3 border-b border-pepper-100 dark:border-pepper-800 relative">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-pepper-400 text-xs" />
                        <input 
                            placeholder="Search shapes..." 
                            value={shapeSearchQuery}
                            onChange={(e) => setShapeSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-pepper-50 dark:bg-pepper-800 border-none rounded-lg text-xs outline-none" 
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {filteredShapeCategories.length === 0 ? (
                            <div className="text-center text-pepper-400 text-xs py-4">No shapes found</div>
                        ) : (
                            filteredShapeCategories.map(cat => (
                                <div key={cat.name}>
                                    <h4 className="text-[10px] font-bold text-pepper-400 uppercase tracking-wider mb-3">{cat.name}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {cat.items.map(shape => (
                                            <div key={shape.type} draggable onDragStart={(e) => e.dataTransfer.setData('shapeType', shape.type)} className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing group" title={shape.label}>
                                                <div className="w-10 h-10 rounded-lg border border-pepper-200 dark:border-pepper-700 bg-pepper-50 dark:bg-pepper-800 flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all shadow-sm text-pepper-600 dark:text-pepper-300">
                                                    <shape.icon />
                                                </div>
                                                <span className="text-[10px] text-pepper-500 truncate w-full text-center">{shape.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Canvas */}
                <div 
                    ref={canvasRef}
                    className="flex-1 relative overflow-hidden bg-pepper-50 dark:bg-pepper-950 cursor-crosshair"
                    onWheel={(e) => {
                        if(e.ctrlKey) { e.preventDefault(); setScale(s => Math.min(Math.max(0.1, s * (e.deltaY > 0 ? 0.9 : 1.1)), 3)); }
                        else setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropShape(e, e.dataTransfer.getData('shapeType'))}
                >
                    {isGridVisible && <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: `${20 * scale}px ${20 * scale}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }} />}

                    <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }} className="absolute inset-0 w-full h-full">
                         {/* ALIGNMENT GUIDES LAYER */}
                         <AlignmentGuidesLayer guides={alignmentGuides} scale={scale} pan={pan} />

                         {connectingState && (
                             <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible">
                                <path 
                                    d={(() => {
                                        const node = activeDiagram.nodes.find(n => n.id === connectingState.sourceId);
                                        if(!node) return '';
                                        const start = getAnchorPoint(node, connectingState.sourceHandle);
                                        return getEdgePath(start.x, start.y, connectingState.currentX, connectingState.currentY, connectingState.sourceHandle, undefined);
                                    })()}
                                    fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" strokeLinecap="round"
                                />
                             </svg>
                         )}
                         <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none overflow-visible z-0">
                            {activeDiagram.edges.map(edge => {
                                const from = activeDiagram.nodes.find(n => n.id === edge.from);
                                const to = activeDiagram.nodes.find(n => n.id === edge.to);
                                if (!from || !to) return null;
                                return <CanvasEdge key={edge.id} edge={edge} from={from} to={to} isSelected={selectedIds.has(edge.id)} onSelect={(id) => setSelectedIds(new Set([id]))} />;
                            })}
                         </svg>
                         {activeDiagram.nodes.map(node => (
                             <CanvasNode 
                                key={node.id} 
                                node={node} 
                                isSelected={selectedIds.has(node.id)}
                                onSelect={(id, shift) => {
                                    if(shift) setSelectedIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });
                                    else setSelectedIds(new Set([id]));
                                }}
                                onDragStart={handleNodeDragStart}
                                onHandleMouseDown={handleHandleMouseDown}
                                onHandleMouseUp={handleHandleMouseUp}
                                onResizeStart={handleResizeStart}
                                onRotateStart={handleRotateStart}
                             />
                         ))}
                    </div>
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 bg-white dark:bg-pepper-900 border-l border-pepper-200 dark:border-pepper-800 flex flex-col z-20 shadow-sm">
                     <div className="flex border-b border-pepper-100 dark:border-pepper-800">
                        <button onClick={() => setRightPanel('properties')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${rightPanel === 'properties' ? 'border-pepper-900 dark:border-white text-pepper-900 dark:text-white' : 'border-transparent text-pepper-400'}`}>Props</button>
                        <button onClick={() => setRightPanel('history')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${rightPanel === 'history' ? 'border-pepper-900 dark:border-white text-pepper-900 dark:text-white' : 'border-transparent text-pepper-400'}`}>History</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                         {rightPanel === 'properties' && (
                             selectedNode ? (
                                <div className="space-y-4 animate-fade-in">
                                    {/* --- RICH LABEL EDITOR --- */}
                                    <div>
                                        <RichTextEditor 
                                            value={selectedNode.label} 
                                            onChange={(val) => updateSelectedNodeProp('label', val)} 
                                        />
                                    </div>

                                    {/* --- TEXT SIZE CONTROL --- */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase text-pepper-400 block">Text Size</label><span className="text-[10px] text-pepper-500 font-mono">{selectedNode.fontSize || 14}px</span></div>
                                        <input type="range" min="10" max="32" value={selectedNode.fontSize || 14} onChange={(e) => updateSelectedNodeProp('fontSize', parseInt(e.target.value))} className="w-full h-1.5 bg-pepper-200 dark:bg-pepper-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Width</label><input type="number" value={Math.round(selectedNode.width)} onChange={(e) => updateSelectedNodeProp('width', parseInt(e.target.value))} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs outline-none" /></div>
                                        <div><label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Height</label><input type="number" value={Math.round(selectedNode.height)} onChange={(e) => updateSelectedNodeProp('height', parseInt(e.target.value))} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs outline-none" /></div>
                                    </div>
                                    
                                    {['Rectangle', 'Process', 'Terminator', 'Server', 'API'].includes(selectedNode.type) && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase text-pepper-400 block">Border Radius</label><span className="text-[10px] text-pepper-500 font-mono">{selectedNode.borderRadius}px</span></div>
                                            <input type="range" min="0" max="40" value={selectedNode.borderRadius} onChange={(e) => updateSelectedNodeProp('borderRadius', parseInt(e.target.value))} className="w-full h-1.5 bg-pepper-200 dark:bg-pepper-700 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                    )}

                                    
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Fill Color</label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {['#FFFFFF', '#EFF6FF', '#ECFDF5', '#FFFBEB', '#FEF2F2', '#F3F4F6', 'transparent'].map(c => <button key={c} onClick={() => updateSelectedNodeProp('fillColor', c)} className={`w-6 h-6 rounded-full border border-pepper-300 relative ${selectedNode.fillColor === c ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`} style={{backgroundColor: c}}>{c === 'transparent' && <span className="absolute inset-0 flex items-center justify-center text-red-500 text-[8px]">/</span>}</button>)}
                                            <div className={`relative w-6 h-6 rounded-full overflow-hidden border border-pepper-300 cursor-pointer ${!['#FFFFFF', '#EFF6FF', '#ECFDF5', '#FFFBEB', '#FEF2F2', '#F3F4F6', 'transparent'].includes(selectedNode.fillColor) ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`}>
                                                <input type="color" value={selectedNode.fillColor === 'transparent' ? '#ffffff' : selectedNode.fillColor} onChange={(e) => updateSelectedNodeProp('fillColor', e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0" />
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300"><FiDroplet className="text-xs" /></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Border Color</label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {['#94A3B8', '#3B82F6', '#10B981', '#D97706', '#EF4444', '#1F2937'].map(c => <button key={c} onClick={() => updateSelectedNodeProp('borderColor', c)} className={`w-6 h-6 rounded-full border-2 border-white relative ${selectedNode.borderColor === c ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`} style={{backgroundColor: c}} />)}
                                            <div className={`relative w-6 h-6 rounded-full overflow-hidden border border-pepper-300 cursor-pointer ${!['#94A3B8', '#3B82F6', '#10B981', '#D97706', '#EF4444', '#1F2937'].includes(selectedNode.borderColor) ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`}>
                                                <input type="color" value={selectedNode.borderColor} onChange={(e) => updateSelectedNodeProp('borderColor', e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0" />
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300"><FiDroplet className="text-xs" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Text Color</label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {['#1E293B', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].map(c => <button key={c} onClick={() => updateSelectedNodeProp('textColor', c)} className={`w-6 h-6 rounded-full border-2 border-white relative ${selectedNode.textColor === c ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`} style={{backgroundColor: c}} />)}
                                            <div className={`relative w-6 h-6 rounded-full overflow-hidden border border-pepper-300 cursor-pointer ${!['#1E293B', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'].includes(selectedNode.textColor) ? 'ring-2 ring-pepper-900 ring-offset-2 dark:ring-offset-pepper-900' : ''}`}>
                                                <input type="color" value={selectedNode.textColor} onChange={(e) => updateSelectedNodeProp('textColor', e.target.value)} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0" />
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300"><FiBold className="text-xs" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             ) : selectedEdge ? (
                                <div className="space-y-4 animate-fade-in">
                                    <div><label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Label</label><input value={selectedEdge.label || ''} onChange={(e) => updateSelectedEdgeProp('label', e.target.value)} className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg px-2 py-1.5 text-xs outline-none" /></div>
                                    <div><label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Line Style</label><div className="flex gap-2"><button onClick={() => updateSelectedEdgeProp('lineStyle', 'solid')} className={`flex-1 py-1 text-xs border rounded ${selectedEdge.lineStyle === 'solid' ? 'bg-blue-100 text-blue-600 border-blue-200' : ''}`}>Solid</button><button onClick={() => updateSelectedEdgeProp('lineStyle', 'dashed')} className={`flex-1 py-1 text-xs border rounded ${selectedEdge.lineStyle === 'dashed' ? 'bg-blue-100 text-blue-600 border-blue-200' : ''}`}>Dashed</button></div></div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase text-pepper-400 block">Stroke Width</label><span className="text-[10px] text-pepper-500 font-mono">{selectedEdge.strokeWidth || 2}px</span></div>
                                        <input type="range" min="1" max="10" value={selectedEdge.strokeWidth || 2} onChange={(e) => updateSelectedEdgeProp('strokeWidth', parseInt(e.target.value))} className="w-full h-1.5 bg-pepper-200 dark:bg-pepper-700 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div><label className="text-[10px] font-bold uppercase text-pepper-400 mb-1 block">Color</label><div className="flex flex-wrap gap-2">{['#94A3B8', '#3B82F6', '#10B981', '#EF4444'].map(c => <button key={c} onClick={() => updateSelectedEdgeProp('color', c)} className={`w-6 h-6 rounded-full border border-pepper-300 ${selectedEdge.color === c ? 'ring-2 ring-pepper-900' : ''}`} style={{backgroundColor: c}} />)}</div></div>
                                </div>
                             ) : (
                                 <div className="text-center py-10 text-pepper-400">
                                     <FiMove className="text-3xl mx-auto mb-2 opacity-30" />
                                     <p className="text-xs">No selection</p>
                                     <div className="mt-8 border-t border-pepper-100 dark:border-pepper-800 pt-4 text-left">
                                         <p className="text-[10px] font-bold uppercase text-pepper-400 mb-2">Diagram Stats</p>
                                         <p className="text-xs">Nodes: {activeDiagram.nodes.length}</p>
                                         <p className="text-xs">Edges: {activeDiagram.edges.length}</p>
                                     </div>
                                 </div>
                             )
                         )}
                         {rightPanel === 'history' && (
                             <div className="space-y-4 animate-fade-in">
                                 <button onClick={handleSaveVersionClick} className="w-full py-2 bg-pepper-100 dark:bg-pepper-800 text-xs font-bold rounded-lg hover:bg-pepper-200 dark:hover:bg-pepper-700 transition-colors flex items-center justify-center gap-2">
                                     <FiPlus /> Save Version
                                 </button>
                                 <div className="space-y-2">
                                     {activeDiagram.history.length === 0 && <p className="text-xs text-pepper-400 text-center py-4">No history yet.</p>}
                                     {activeDiagram.history.map((v, i) => (
                                         <div 
                                            key={v.id} 
                                            onClick={() => handleRestoreVersionClick(v)}
                                            className="p-3 border border-pepper-100 dark:border-pepper-800 rounded-lg hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-all cursor-pointer group"
                                         >
                                             <div className="flex justify-between items-start mb-1">
                                                 <span className="text-xs font-bold text-pepper-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{v.label}</span>
                                                 {i === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Latest</span>}
                                             </div>
                                             <div className="flex justify-between items-center text-[10px] text-pepper-400">
                                                 <span className="flex items-center gap-1"><FiClock className="w-3 h-3"/> {new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                 <span>{v.snapshot.nodes.length} nodes</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>

             {/* AI Modal */}
            {isAiModalOpen && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsAiModalOpen(false)}>
                    <div className="bg-white dark:bg-pepper-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl"><BiBot /></div><div><h3 className="font-bold text-lg text-pepper-900 dark:text-white">AI Diagram Assistant</h3><p className="text-xs text-pepper-500">Generate or optimize your diagram.</p></div></div>
                            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe a process step-by-step (one per line)..." className="w-full h-32 p-3 bg-pepper-50 dark:bg-pepper-950 border border-pepper-200 dark:border-pepper-800 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500/50" />
                            <div className="flex gap-2 mt-4"><button onClick={handleGenerateDiagram} className="flex-1 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">Generate from Text</button></div>
                            <div className="flex justify-end mt-4"><button onClick={() => setIsAiModalOpen(false)} className="text-xs font-bold text-pepper-400 hover:text-pepper-600">Close</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            <Modal isOpen={exportModal.open} onClose={() => setExportModal({ ...exportModal, open: false })}>
                <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 text-pepper-900 dark:text-white flex items-center gap-2"><FiDownload /> Export Diagram</h3>
                    <div className="space-y-3 mb-6">
                        <label className="flex items-center gap-3 p-3 border border-pepper-200 dark:border-pepper-700 rounded-xl cursor-pointer hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-colors">
                            <input type="checkbox" checked={exportModal.formats.includes('png')} onChange={() => { const fs = exportModal.formats.includes('png') ? exportModal.formats.filter(f => f !== 'png') : [...exportModal.formats, 'png']; setExportModal({ ...exportModal, formats: fs }); }} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                            <div><span className="font-bold text-sm block text-pepper-900 dark:text-white">PNG Image</span><span className="text-xs text-pepper-500">Best for sharing and presentations</span></div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-pepper-200 dark:border-pepper-700 rounded-xl cursor-pointer hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-colors">
                            <input type="checkbox" checked={exportModal.formats.includes('svg')} onChange={() => { const fs = exportModal.formats.includes('svg') ? exportModal.formats.filter(f => f !== 'svg') : [...exportModal.formats, 'svg']; setExportModal({ ...exportModal, formats: fs }); }} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                            <div><span className="font-bold text-sm block text-pepper-900 dark:text-white">SVG Vector</span><span className="text-xs text-pepper-500">Scalable vector graphics</span></div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-pepper-200 dark:border-pepper-700 rounded-xl cursor-pointer hover:bg-pepper-50 dark:hover:bg-pepper-800 transition-colors">
                            <input type="checkbox" checked={exportModal.formats.includes('json')} onChange={() => { const fs = exportModal.formats.includes('json') ? exportModal.formats.filter(f => f !== 'json') : [...exportModal.formats, 'json']; setExportModal({ ...exportModal, formats: fs }); }} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                            <div><span className="font-bold text-sm block text-pepper-900 dark:text-white">JSON Data</span><span className="text-xs text-pepper-500">Full diagram state backup</span></div>
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setExportModal({ ...exportModal, open: false })} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                        <button onClick={() => handleExport(exportModal.formats)} disabled={exportModal.formats.length === 0} className="px-6 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold disabled:opacity-50 shadow-md hover:shadow-lg transition-all">Export</button>
                    </div>
                </div>
            </Modal>

            {/* Save Version Modal */}
            <Modal isOpen={saveVersionModal.open} onClose={() => setSaveVersionModal({ ...saveVersionModal, open: false })}>
                <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 text-pepper-900 dark:text-white">Save Version</h3>
                    <form onSubmit={handleConfirmSaveVersion}>
                        <div className="mb-4">
                            <label className="block text-xs font-bold uppercase text-pepper-500 mb-1">Version Name</label>
                            <input 
                                autoFocus
                                value={saveVersionModal.name}
                                onChange={(e) => setSaveVersionModal({ ...saveVersionModal, name: e.target.value })}
                                className="w-full bg-pepper-50 dark:bg-pepper-800 border border-pepper-200 dark:border-pepper-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Initial Draft"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setSaveVersionModal({ ...saveVersionModal, open: false })} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                            <button type="submit" disabled={!saveVersionModal.name.trim()} className="px-4 py-2 bg-pepper-900 dark:bg-white text-white dark:text-pepper-900 rounded-lg text-sm font-bold disabled:opacity-50">Save</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Restore Version Modal */}
            <Modal isOpen={restoreVersionModal.open} onClose={() => setRestoreVersionModal({ open: false, version: null })}>
                <div className="bg-white dark:bg-pepper-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4 text-amber-500">
                        <FiAlertCircle className="text-2xl" />
                        <h3 className="font-bold text-lg text-pepper-900 dark:text-white">Restore Version?</h3>
                    </div>
                    <p className="text-sm text-pepper-600 dark:text-pepper-300 mb-6">
                        Are you sure you want to restore <strong>"{restoreVersionModal.version?.label}"</strong>? 
                        Any unsaved changes will be replaced.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setRestoreVersionModal({ open: false, version: null })} className="px-4 py-2 text-sm font-bold text-pepper-500 hover:text-pepper-900 dark:hover:text-white">Cancel</button>
                        <button onClick={handleConfirmRestoreVersion} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Restore</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};