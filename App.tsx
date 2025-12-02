
import React, { useState, useEffect, useRef } from 'react';
import { Role, User, VisitRecord, GeoLocation, MapMarker, MarkerConfig, MarkerStyle, Gamification, LeadTemperature } from './types';
import MapView from './components/MapView';
import PhotoUpload from './components/PhotoUpload';
import Login from './components/Login';
import { analyzeLocationContext, generateReport } from './services/geminiService';
import { getCurrentUser, logout } from './services/authService';
import { IconSolarPanel, IconMap, IconUser, IconMenu, IconSparkles, IconLogout, IconWifi, IconWifiOff, IconCloudCheck, IconCloudOff, IconRefresh, IconTrophy, IconFlame, IconStar, IconMedal, IconHistory, IconCamera, IconDollar, IconChart, IconTrendingUp, IconCalendar, IconUsers, IconTarget, IconCheck, IconChevronLeft, IconChevronRight, IconX } from './components/ui/Icons';

// --- MOCK DATA & CONSTANTS ---
const INITIAL_LOCATION: GeoLocation = {
  lat: -8.047562, // Recife center approx
  lng: -34.877000,
};

const AVAILABLE_COLORS = [
  'blue', 'gold', 'red', 'green', 'orange', 'yellow', 'violet', 'grey', 'black'
];

const DEFAULT_MARKER_CONFIG: MarkerConfig = {
  'PROSPECTION_PENDING': { color: 'blue', label: 'Prospecção (Pendente)' },
  'PROSPECTION_SUCCESS': { color: 'gold', label: 'Prospecção (Interessado)' },
  'PROSPECTION_FAILED': { color: 'grey', label: 'Prospecção (Sem Interesse)' },
  'SALE_ATTEMPT_PENDING': { color: 'orange', label: 'Venda (Em andamento)' },
  'SALE_ATTEMPT_SUCCESS': { color: 'green', label: 'Venda (Fechada)' },
  'SALE_ATTEMPT_FAILED': { color: 'red', label: 'Venda (Perdida)' },
  'INSTALLATION_DEFAULT': { color: 'black', label: 'Instalação' },
  'INSPECTION_DEFAULT': { color: 'violet', label: 'Vistoria' },
};

// --- GAMIFICATION CONFIG ---
const POINTS_CONFIG = {
    [LeadTemperature.HOT]: 5,
    [LeadTemperature.WARM]: 2,
    [LeadTemperature.COLD]: 1
};

// --- STORAGE HELPER ---
const saveToStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("LocalStorage Limit Reached or Error", e);
        // Alert user only if it's a quota error or similar critical failure
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            alert("⚠️ Memória cheia! O dispositivo não tem mais espaço para salvar fotos ou dados offline. Tente sincronizar ou limpar dados antigos.");
        }
    }
};

// --- AI REPORT RENDERER ---
const AiReportRenderer = ({ reportText }: { reportText: string }) => {
    let reportData = null;
    try {
        // Attempt to extract JSON if the model wrapped it in code blocks
        const jsonMatch = reportText.match(/```json\n([\s\S]*?)\n```/) || reportText.match(/```([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : reportText;
        reportData = JSON.parse(jsonString);
    } catch (e) {
        // Fallback to text rendering
        console.log("Could not parse AI JSON, rendering as text.");
    }

    if (!reportData || !reportData.executiveSummary) {
        return (
             <div className="mt-6 p-4 bg-indigo-900/50 rounded-lg text-sm text-indigo-50 border border-indigo-500/30 shadow-inner whitespace-pre-line max-h-80 overflow-y-auto custom-scrollbar">
                <h4 className="font-bold text-amber-300 mb-2 text-xs uppercase">Análise Gerada</h4>
                {reportText}
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {/* Executive Summary */}
            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                <h4 className="font-bold text-amber-300 text-xs uppercase mb-2 flex items-center gap-2">
                    <IconChart className="w-4 h-4"/> Resumo Executivo
                </h4>
                <p className="text-sm text-indigo-50 leading-relaxed">{reportData.executiveSummary}</p>
            </div>

            {/* Efficiency & Bottlenecks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/20">
                    <h5 className="font-bold text-emerald-300 text-xs uppercase mb-2">Padrões de Eficiência</h5>
                    <ul className="list-disc list-inside text-xs text-emerald-50 space-y-1">
                        {reportData.efficiencyPatterns?.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-red-900/30 p-3 rounded-lg border border-red-500/20">
                    <h5 className="font-bold text-red-300 text-xs uppercase mb-2">Gargalos Detectados</h5>
                    <ul className="list-disc list-inside text-xs text-red-50 space-y-1">
                        {reportData.bottlenecks?.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Strategic Actions Table */}
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <h4 className="font-bold text-amber-300 text-xs uppercase p-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                    <IconTarget className="w-4 h-4"/> Plano de Ação Estratégico
                </h4>
                <table className="w-full text-left text-xs text-indigo-50">
                    <thead className="bg-black/20 text-indigo-200 uppercase font-semibold">
                        <tr>
                            <th className="px-3 py-2">Ação Sugerida</th>
                            <th className="px-3 py-2">Impacto Esperado</th>
                            <th className="px-3 py-2 text-center">Prioridade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {reportData.strategicActions?.map((action: any, idx: number) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-3 py-2 font-medium">{action.action}</td>
                                <td className="px-3 py-2 text-indigo-200">{action.impact}</td>
                                <td className="px-3 py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        action.priority === 'Alta' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                        action.priority === 'Média' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    }`}>
                                        {action.priority}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }: any) => {
    const baseStyle = "px-4 py-3 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
    const variants = {
        primary: "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-md shadow-amber-500/20",
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
        success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20",
        purple: "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20",
        dark: "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20",
        ghost: "bg-transparent hover:bg-slate-50 text-slate-600"
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};

const Input = ({ label, ...props }: any) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        <input 
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
            {...props}
        />
    </div>
);

const Select = ({ label, children, ...props }: any) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        <div className="relative">
            <select 
                className="w-full px-4 py-2.5 appearance-none rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 invalid:text-slate-400"
                {...props}
            >
                {children}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);

const TextArea = ({ label, ...props }: any) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        <textarea 
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 resize-none"
            {...props}
        />
    </div>
);

const StatCard = ({ title, value, icon, color, trend }: { title: string, value: string | number, icon: React.ReactNode, color: string, trend?: string }) => (
    <div className={`bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
        <div className={`absolute top-0 right-0 w-16 h-16 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {trend && <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center"><IconTrendingUp className="w-3 h-3 mr-1" /> {trend}</p>}
            </div>
            <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                {icon}
            </div>
        </div>
    </div>
);

const ProgressBar = ({ progress, color = "amber" }: { progress: number, color?: string }) => (
    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
        <div className={`bg-${color}-500 h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}></div>
    </div>
);

const GalleryModal = ({ images, initialIndex, onClose }: { images: string[], initialIndex: number, onClose: () => void }) => {
    const [index, setIndex] = useState(initialIndex);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null; // Reset
        touchStartX.current = e.targetTouches[0].clientX;
    }

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    }

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            next();
        } else if (isRightSwipe) {
            prev();
        }
    }

    useEffect(() => {
        setIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setIndex(prev => (prev - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight') setIndex(prev => (prev + 1) % images.length);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, onClose]);

    if (!images || images.length === 0) return null;

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all z-20"
            >
                <IconX className="w-6 h-6" />
            </button>
            
            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10 hidden sm:block">
                        <IconChevronLeft className="w-8 h-8" />
                    </button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10 hidden sm:block">
                        <IconChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            <div 
                className="w-full h-full flex items-center justify-center"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img 
                    src={images[index]} 
                    alt={`View ${index + 1}`} 
                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain select-none" 
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm backdrop-blur-md">
                {index + 1} / {images.length}
            </div>

            {/* Mobile Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 sm:hidden">
                 {images.map((_, i) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`}></div>
                 ))}
            </div>
        </div>
    );
};

const HistoryModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-50 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 relative">
        <button 
            onClick={onClose} 
            className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors z-10 shadow-sm border border-slate-100"
            title="Fechar"
        >
            <IconX className="w-5 h-5" />
        </button>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-white rounded-t-2xl">
           <h3 className="font-bold text-slate-800 text-lg pr-8 flex items-center gap-2">
               <div className="bg-violet-100 p-1.5 rounded-lg text-violet-600">
                   <IconHistory className="w-5 h-5"/>
               </div>
               {title}
           </h3>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
            {children}
        </div>
      </div>
    </div>
  );
};

// --- GAMIFICATION COMPONENTS ---

const Leaderboard = ({ users }: { users: User[] }) => {
    // Sort users by points
    const sorted = [...users].sort((a,b) => (b.points || 0) - (a.points || 0));

    return (
        <div className="space-y-3">
             {sorted.slice(0, 5).map((u, idx) => (
                 <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                     <div className="flex items-center space-x-3">
                         <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                             {idx + 1}
                         </div>
                         <div className="text-sm font-medium text-slate-700">{u.name.split(' ')[0]}</div>
                     </div>
                     <div className="flex items-center space-x-1 text-amber-500">
                         <IconStar className="w-3 h-3" />
                         <span className="font-bold text-sm">{u.points || 0}</span>
                     </div>
                 </div>
             ))}
        </div>
    )
}

const SalesRanking = ({ records }: { records: VisitRecord[] }) => {
    // Calculate total sales per user
    const salesCount: Record<string, number> = {};
    const salesMap: Record<string, string> = {}; // id -> name

    records.filter(r => r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').forEach(r => {
        salesCount[r.userId] = (salesCount[r.userId] || 0) + 1;
        salesMap[r.userId] = r.userName;
    });

    // Add mock users for competition if not present
    if (!salesCount['user-3']) { salesCount['user-3'] = 0; salesMap['user-3'] = 'Ana Líder'; }
    if (!salesCount['user-3b']) { salesCount['user-3b'] = 3; salesMap['user-3b'] = 'Bruno Fechador'; } // Mock opponent

    const ranking = Object.entries(salesCount)
        .sort(([, a], [, b]) => b - a)
        .map(([id, count]) => ({ id, name: salesMap[id], count }));

    return (
        <div className="space-y-3">
             {ranking.slice(0, 5).map((u, idx) => (
                 <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                     <div className="flex items-center space-x-3">
                         <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                             {idx + 1}
                         </div>
                         <div className="text-sm font-medium text-slate-700">{u.name.split(' ')[0]}</div>
                     </div>
                     <div className="flex items-center space-x-1 text-emerald-600">
                         <span className="font-bold text-sm">{u.count}</span>
                         <span className="text-[10px] uppercase font-bold text-emerald-600/60">Vendas</span>
                     </div>
                 </div>
             ))}
        </div>
    )
}

const Header = ({ user, onLogout, isOnline, isSyncing }: { user: User, onLogout: () => void, isOnline: boolean, isSyncing: boolean }) => {
    return (
        <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 p-2 rounded-lg shadow-lg shadow-amber-500/20">
                        <IconSolarPanel className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight leading-none text-slate-100">CBC Energias</h1>
                        <p className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mt-0.5 opacity-90">{user.role}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* Status Indicator */}
                    <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        {isSyncing ? (
                            <>
                                <IconRefresh className="w-4 h-4 text-amber-400 animate-spin" />
                                <span className="text-xs text-amber-400 font-medium hidden sm:inline">Sincronizando...</span>
                            </>
                        ) : isOnline ? (
                             <>
                                <IconWifi className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-medium hidden sm:inline">Online</span>
                            </>
                        ) : (
                            <>
                                <IconWifiOff className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-400 font-medium hidden sm:inline">Offline</span>
                            </>
                        )}
                    </div>

                    <div className="hidden md:flex flex-col items-end mr-2 border-l border-slate-700 pl-4">
                        <span className="text-sm font-medium text-slate-200">{user.name}</span>
                        {user.points !== undefined && (
                            <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                                <IconStar className="w-3 h-3" />
                                <span>{user.points} pts</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onLogout}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2"
                        title="Sair do Sistema"
                    >
                        <span className="text-xs font-bold uppercase hidden md:inline">Sair</span>
                        <IconLogout className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}

// --- MAIN APP ---

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State
  const [showInspectorHistory, setShowInspectorHistory] = useState(false);
  // Inspector Date Filter
  const [inspectorFilterDate, setInspectorFilterDate] = useState<string>('');
  // Inspector Vendor Filter
  const [inspectorFilterVendor, setInspectorFilterVendor] = useState<string>('');

  useEffect(() => {
      const storedUser = getCurrentUser();
      if (storedUser) {
          setUser(storedUser);
      }
      setLoadingAuth(false);
  }, []);

  const getTodayKey = () => new Date().toLocaleDateString('pt-BR');

  const [currentLocation, setCurrentLocation] = useState<GeoLocation>(INITIAL_LOCATION);
  const [isGpsActive, setIsGpsActive] = useState(false);
  
  // Load records from LocalStorage
  const [records, setRecords] = useState<VisitRecord[]>(() => {
      try {
          const saved = localStorage.getItem('cbc_records');
          return saved ? JSON.parse(saved) : [];
      } catch(e) {
          console.error("Failed to load records from storage", e);
          return [];
      }
  });

  const [aiContext, setAiContext] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  
  // Gallery State logic
  const [galleryState, setGalleryState] = useState<{ images: string[], index: number } | null>(null);

  // Route Archive: { "dd/mm/yyyy": GeoLocation[] }
  const [routeArchives, setRouteArchives] = useState<Record<string, GeoLocation[]>>(() => {
    try {
        const saved = localStorage.getItem('cbc_route_archives');
        const parsed = saved ? JSON.parse(saved) : {};
        const today = getTodayKey();
        if (!parsed[today]) parsed[today] = [];
        return parsed;
    } catch (e) {
        console.error("Error parsing route archives", e);
        const today = getTodayKey();
        return { [today]: [] };
    }
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [markerConfig, setMarkerConfig] = useState<MarkerConfig>(DEFAULT_MARKER_CONFIG);
  const [formData, setFormData] = useState<Partial<VisitRecord>>({});
  
  // New state for Lead Temperature in form
  const [leadTemp, setLeadTemp] = useState<LeadTemperature | null>(null);

  // Persist Records to LocalStorage
  useEffect(() => {
      saveToStorage('cbc_records', records);
  }, [records]);

  // Persist Routes
  useEffect(() => {
      saveToStorage('cbc_route_archives', routeArchives);
  }, [routeArchives]);

  useEffect(() => {
    const savedConfig = localStorage.getItem('cbc_marker_config');
    if (savedConfig) {
      try {
        setMarkerConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  // Network Listeners
  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // Sync Logic
  useEffect(() => {
      if (isOnline) {
          const pendingRecords = records.filter(r => r.syncStatus === 'PENDING');
          if (pendingRecords.length > 0 && !isSyncing) {
              setIsSyncing(true);
              console.log(`Syncing ${pendingRecords.length} records...`);
              
              // Simulate API upload delay
              const timer = setTimeout(() => {
                  setRecords(prev => prev.map(r => 
                      r.syncStatus === 'PENDING' ? { ...r, syncStatus: 'SYNCED' } : r
                  ));
                  setIsSyncing(false);
              }, 2000);

              return () => clearTimeout(timer);
          }
      }
  }, [isOnline, records, isSyncing]);

  const updateMarkerConfig = (key: string, color: string) => {
    const newConfig = {
      ...markerConfig,
      [key]: { ...markerConfig[key], color }
    };
    setMarkerConfig(newConfig);
    saveToStorage('cbc_marker_config', newConfig);
  };

  const resetMarkerConfig = () => {
    setMarkerConfig(DEFAULT_MARKER_CONFIG);
    saveToStorage('cbc_marker_config', DEFAULT_MARKER_CONFIG);
  };

  useEffect(() => {
    if (navigator.geolocation && user) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setIsGpsActive(true);
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLoc);

          if ((user.role === Role.PROSPECTOR || user.role === Role.INSTALLER || user.role === Role.SALES_LEADER)) {
             setRouteArchives(prev => {
                const today = getTodayKey();
                const currentDayRoutes = prev[today] || [];
                const lastPoint = currentDayRoutes[currentDayRoutes.length - 1];
                
                let shouldAdd = true;
                if (lastPoint) {
                    const dist = Math.sqrt(Math.pow(newLoc.lat - lastPoint.lat, 2) + Math.pow(newLoc.lng - lastPoint.lng, 2));
                    // Simple threshold to avoid jitter (approx 10m)
                    if (dist < 0.0001) shouldAdd = false;
                }

                if (shouldAdd) {
                    return {
                        ...prev,
                        [today]: [...currentDayRoutes, newLoc]
                    };
                }
                return prev;
             });
          }
        },
        (error) => {
            console.error("Geo error", error);
            setIsGpsActive(false);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user]);

  const handleLogout = () => {
      logout();
      setUser(null);
      setAiContext("");
      setFormData({});
      setLeadTemp(null);
      setInspectorFilterDate('');
      setInspectorFilterVendor('');
  };

  const handleAiAnalysis = async (query: string) => {
    if (!isOnline) {
        setAiContext("Você está offline. A IA Gemini requer conexão com a internet.");
        return;
    }
    setAiLoading(true);
    const result = await analyzeLocationContext(currentLocation.lat, currentLocation.lng, query);
    setAiContext(result);
    setAiLoading(false);
  };

  const handleAiReport = async () => {
    if (!isOnline) {
        setAiContext("Funcionalidade indisponível offline.");
        return;
    }
    setAiLoading(true);
    const result = await generateReport(records);
    setAiContext(result);
    setAiLoading(false);
  }

  const addRecord = (data: Partial<VisitRecord>) => {
    if (!user) return;
    
    // Gamification Logic for Prospector
    let earnedPoints = 0;
    let finalTemp = leadTemp;

    if (user.role === Role.PROSPECTOR && data.type === 'PROSPECTION' && leadTemp) {
        earnedPoints = POINTS_CONFIG[leadTemp];
        // Update user points locally
        const updatedUser = { ...user, points: (user.points || 0) + earnedPoints };
        setUser(updatedUser);
        saveToStorage('cbc_auth_user', updatedUser); // Update session storage
    }

    // Merge metadata from formData and the passed data to ensure we capture Facade Photo and other details
    const mergedMetadata = {
        ...formData.metadata,
        ...(data.metadata || {})
    };

    const newRecord: VisitRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      location: currentLocation,
      type: 'PROSPECTION', 
      status: 'PENDING',
      notes: formData.notes || '', // Capture notes from form
      photos: formData.photos || [], // Capture photos from form
      metadata: mergedMetadata, // Use merged metadata
      syncStatus: isOnline ? 'SYNCED' : 'PENDING',
      gamification: user.role === Role.PROSPECTOR && finalTemp ? {
          points: earnedPoints,
          temperature: finalTemp
      } : undefined,
      ...data // Override with specific properties if any
    } as VisitRecord;

    setRecords(prev => [newRecord, ...prev]);
    setFormData({});
    setLeadTemp(null);
    
    if (isOnline) {
        alert(earnedPoints > 0 ? `Registro salvo! Você ganhou +${earnedPoints} pontos!` : "Registro salvo com sucesso!");
    } else {
        alert("Registro salvo localmente. Será sincronizado automaticamente quando houver conexão.");
    }
  };

  const markers: MapMarker[] = records.map(r => {
    const specificKey = `${r.type}_${r.status}`;
    const defaultKey = `${r.type}_DEFAULT`;
    const config = markerConfig[specificKey] || markerConfig[defaultKey];
    const color = config ? config.color : 'blue';
    const typeLabel = config ? config.label : r.type;
    return {
      id: r.id,
      lat: r.location.lat,
      lng: r.location.lng,
      title: `${typeLabel} - ${r.userName}`,
      type: typeLabel,
      color: color,
      isCompleted: r.status === 'COMPLETED' || r.status === 'SUCCESS'
    };
  });

  const getMapCenter = () => {
      const today = getTodayKey();
      if (selectedDate === today) return currentLocation;
      
      const route = routeArchives[selectedDate];
      if (route && route.length > 0) {
          return route[route.length - 1];
      }
      return currentLocation;
  };

  const activeRoute = routeArchives[selectedDate] || [];

  const RouteControl = () => {
    const sortedDates = Object.keys(routeArchives).sort((a,b) => {
         const [da, ma, ya] = a.split('/').map(Number);
         const [db, mb, yb] = b.split('/').map(Number);
         return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
    });

    const currentIndex = sortedDates.indexOf(selectedDate);
    
    const handlePrev = () => {
        if (currentIndex > 0) setSelectedDate(sortedDates[currentIndex - 1]);
    };
    
    const handleNext = () => {
        if (currentIndex < sortedDates.length - 1) setSelectedDate(sortedDates[currentIndex + 1]);
    };

    return (
        <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={handlePrev} 
                disabled={currentIndex <= 0}
                className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Dia Anterior"
            >
                <IconChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative px-1">
                 <select 
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer appearance-none text-center min-w-[90px]"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                >
                    {sortedDates.map(date => (
                        <option key={date} value={date}>{date === getTodayKey() ? 'Hoje (Ao Vivo)' : date}</option>
                    ))}
                </select>
            </div>

            <button 
                onClick={handleNext} 
                disabled={currentIndex >= sortedDates.length - 1}
                className="p-1 hover:bg-white rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Próximo Dia"
            >
                <IconChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
  };

  const renderContent = () => {
    if (!user) return null;

    switch (user.role) {
      case Role.PROSPECTOR:
        // Mock daily goal
        const dailyGoal = 15;
        const dailyProgress = records.filter(r => r.role === Role.PROSPECTOR && r.timestamp > Date.now() - 86400000).length;
        const progressPct = (dailyProgress / dailyGoal) * 100;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                
                {/* Goal Tracker */}
                <Card className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">Meta Diária</p>
                            <h3 className="text-2xl font-bold">{dailyProgress} <span className="text-sm font-normal text-slate-400">/ {dailyGoal} visitas</span></h3>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                            <IconTarget className="w-6 h-6 text-amber-400" />
                        </div>
                    </div>
                    <ProgressBar progress={progressPct} color="amber" />
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card className="p-0 overflow-hidden lg:col-span-2">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Mapa de Prospecção</h3>
                            <div className="flex items-center space-x-3">
                                <RouteControl />
                            </div>
                        </div>
                        <MapView markers={markers} center={getMapCenter()} routeHistory={activeRoute} className="h-64 w-full rounded-none" />
                    </Card>

                    <Card className="p-6 lg:col-span-2">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                                    <IconUser className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Nova Visita</h2>
                                    <p className="text-sm text-slate-500">Registre o lead no CRM</p>
                                </div>
                            </div>
                            <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-medium shadow-sm">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                Rastreamento Ativo
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            <div className="md:col-span-2">
                                <Input 
                                    label="Cliente / Local" 
                                    placeholder="Ex: Residência Sr. Carlos"
                                    value={formData.metadata?.clientName || ''}
                                    onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, clientName: e.target.value}})}
                                />
                            </div>
                            
                            <div className="md:col-span-2 mb-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Classificação do Lead</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => {
                                            setLeadTemp(LeadTemperature.HOT);
                                            setFormData({...formData, status: 'SUCCESS'});
                                        }}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${leadTemp === LeadTemperature.HOT ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-white text-slate-500 hover:border-amber-200'}`}
                                    >
                                        <IconFlame className={`w-6 h-6 mb-1 ${leadTemp === LeadTemperature.HOT ? 'text-amber-500' : 'text-slate-300'}`} />
                                        <span className="text-xs font-bold">Quente (+5)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLeadTemp(LeadTemperature.WARM);
                                            setFormData({...formData, status: 'PENDING'});
                                        }}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${leadTemp === LeadTemperature.WARM ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'}`}
                                    >
                                        <IconStar className={`w-6 h-6 mb-1 ${leadTemp === LeadTemperature.WARM ? 'text-blue-500' : 'text-slate-300'}`} />
                                        <span className="text-xs font-bold">Morno (+2)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLeadTemp(LeadTemperature.COLD);
                                            setFormData({...formData, status: 'FAILED'});
                                        }}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${leadTemp === LeadTemperature.COLD ? 'border-slate-400 bg-slate-50 text-slate-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                    >
                                        <div className={`w-6 h-6 mb-1 rounded-full border-2 border-current ${leadTemp === LeadTemperature.COLD ? 'text-slate-400' : 'text-slate-300'}`}></div>
                                        <span className="text-xs font-bold">Frio (+1)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Contact Fields */}
                            <div>
                                <Input 
                                    label="Telefone (WhatsApp)" 
                                    placeholder="(81) 9..."
                                    value={formData.metadata?.contactInfo || ''}
                                    onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, contactInfo: e.target.value}})}
                                />
                            </div>
                            <div>
                                <Input 
                                    label="E-mail" 
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={formData.metadata?.email || ''}
                                    onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, email: e.target.value}})}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <TextArea 
                                    label="Notas da Visita"
                                    rows={3}
                                    placeholder="Detalhes importantes..."
                                    value={formData.notes || ''}
                                    onChange={(e: any) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <Button onClick={() => addRecord({ type: 'PROSPECTION' })} className="w-full mt-2" disabled={!leadTemp}>
                            {isOnline ? 'Registrar Visita & Ganhar Pontos' : 'Salvar Localmente (Offline)'}
                        </Button>
                    </Card>
                </div>
            </div>
            
            <div className="space-y-6">
                
                {/* Gamification Card */}
                <Card className="p-5 bg-white border border-slate-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Ranking da Equipe</h3>
                            <p className="text-2xl font-bold text-slate-800">2º Lugar <span className="text-sm font-normal text-slate-400">na região</span></p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <IconTrophy className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    
                    <Leaderboard users={[
                        { id: '1', name: 'João Silva', role: Role.PROSPECTOR, avatarUrl: '', points: 150 },
                        { id: '2', name: 'Maria Souza', role: Role.PROSPECTOR, avatarUrl: '', points: 135 },
                        { ...user }
                    ]} />
                </Card>

                <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <div className="flex items-center space-x-2 text-indigo-900 font-bold mb-3">
                        <IconSparkles className="w-5 h-5 text-indigo-500"/>
                        <h3>Assistente Gemini</h3>
                    </div>
                    <p className="text-sm text-indigo-700/80 mb-4 leading-relaxed">
                        Encontre oportunidades comerciais próximas à sua rota atual.
                    </p>
                    <Button variant="ghost" className="w-full bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 mb-3 text-sm"
                        onClick={() => handleAiAnalysis("Quais empresas ou comércios estão a 500m daqui que poderiam usar energia solar?")}
                        disabled={!isOnline}
                    >
                        {isOnline ? '🔍 Buscar comércios vizinhos' : 'Indisponível Offline'}
                    </Button>
                    
                    {aiLoading && (
                        <div className="flex items-center justify-center py-4 text-indigo-400">
                             <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             Analisando...
                        </div>
                    )}
                    
                    {aiContext && (
                        <div className="mt-2 p-3 bg-white/80 rounded-lg text-sm text-slate-700 text-xs border border-indigo-100 shadow-sm whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">
                            {aiContext}
                        </div>
                    )}
                </Card>

                {/* Recent Activity for Prospector with Sync Status */}
                <Card className="p-4">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Últimas Atividades</h3>
                    <div className="space-y-3">
                        {records.filter(r => r.role === Role.PROSPECTOR).slice(0, 5).map(r => (
                            <div key={r.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                <div>
                                     <p className="text-sm font-bold text-slate-700">{r.metadata?.clientName || 'Cliente sem nome'}</p>
                                     <p className="text-xs text-slate-500">{new Date(r.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === 'SUCCESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                         {r.status === 'SUCCESS' ? 'Quente' : r.status === 'PENDING' ? 'Morno' : 'Frio'}
                                     </span>
                                     {r.syncStatus === 'PENDING' ? (
                                        <span title="Pendente de envio">
                                            <IconCloudOff className="w-4 h-4 text-slate-400" />
                                        </span>
                                     ) : (
                                        <span title="Sincronizado">
                                            <IconCloudCheck className="w-4 h-4 text-sky-500" />
                                        </span>
                                     )}
                                </div>
                            </div>
                        ))}
                        {records.filter(r => r.role === Role.PROSPECTOR).length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">Nenhuma atividade recente.</p>
                        )}
                    </div>
                </Card>
            </div>
          </div>
        );

      case Role.SALES_LEADER:
        const mySalesCount = records.filter(r => r.userId === user.id && r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').length;
        // Simple logic: if sales > 0, we consider them a top performer for this demo context
        const isTopPerformer = mySalesCount > 0;
        
        // Funnel metrics
        const leads = records.filter(r => r.type === 'PROSPECTION').length;
        const proposals = records.filter(r => r.type === 'SALE_ATTEMPT').length;
        const sales = records.filter(r => r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').length;
        const conversionRate = proposals > 0 ? Math.round((sales / proposals) * 100) : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                
                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard title="Vendas" value={sales} icon={<IconDollar className="w-5 h-5"/>} color="emerald" trend="+12%"/>
                    <StatCard title="Conversão" value={`${conversionRate}%`} icon={<IconChart className="w-5 h-5"/>} color="blue" trend="+2%"/>
                    <StatCard title="Propostas" value={proposals} icon={<IconCalendar className="w-5 h-5"/>} color="violet"/>
                    <StatCard title="Leads" value={leads} icon={<IconUsers className="w-5 h-5"/>} color="slate"/>
                </div>

                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl">
                            <IconSolarPanel className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Fechamento de Venda</h2>
                            <p className="text-sm text-slate-500">Formalize o contrato com o cliente</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        <div className="md:col-span-2">
                            <Input 
                                label="Nome do Cliente" 
                                placeholder="Nome completo"
                                value={formData.metadata?.clientName || ''}
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, clientName: e.target.value}})}
                            />
                        </div>
                        <Select 
                            label="Status da Negociação"
                            value={formData.status || "SUCCESS"}
                            onChange={(e: any) => setFormData({...formData, status: e.target.value as any})}
                        >
                            <option value="SUCCESS">Venda Fechada</option>
                            <option value="PENDING">Em Análise de Crédito</option>
                            <option value="FAILED">Recusada</option>
                        </Select>
                        <Input 
                            label="Valor do Sistema (kWp)" 
                            placeholder="Ex: 5.5 kWp"
                        />
                         <div className="md:col-span-2">
                             <TextArea 
                                label="Detalhes Técnicos / Observações"
                                rows={3}
                                value={formData.notes || ''}
                                onChange={(e: any) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>
                    </div>

                     <Button variant="success" onClick={() => addRecord({ type: 'SALE_ATTEMPT', status: formData.status || 'SUCCESS' })} className="w-full mt-4">
                        {isOnline ? 'Registrar Venda' : 'Salvar Localmente'}
                    </Button>
                </Card>
                 <Card className="p-0 overflow-hidden">
                     <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                         <h3 className="font-semibold text-slate-700">Equipe em Campo</h3>
                         <RouteControl />
                     </div>
                    <MapView markers={markers} center={getMapCenter()} routeHistory={activeRoute} className="h-80 w-full rounded-none" />
                </Card>
            </div>
             <div className="space-y-6">
                
                {/* Funnel Visualization */}
                <Card className="p-5">
                    <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-4">Funil de Vendas</h3>
                    <div className="space-y-4">
                        <div className="relative">
                             <div className="flex justify-between mb-1 text-sm font-bold text-slate-700">
                                 <span>Prospecções</span>
                                 <span>{leads}</span>
                             </div>
                             <div className="w-full bg-slate-100 rounded h-2">
                                 <div className="bg-slate-400 h-2 rounded" style={{width: '100%'}}></div>
                             </div>
                        </div>
                        <div className="relative px-2">
                             <div className="flex justify-between mb-1 text-sm font-bold text-slate-700">
                                 <span>Propostas</span>
                                 <span>{proposals}</span>
                             </div>
                             <div className="w-full bg-slate-100 rounded h-2">
                                 <div className="bg-blue-500 h-2 rounded" style={{width: `${(proposals/leads)*100}%`}}></div>
                             </div>
                        </div>
                        <div className="relative px-4">
                             <div className="flex justify-between mb-1 text-sm font-bold text-emerald-600">
                                 <span>Fechamentos</span>
                                 <span>{sales}</span>
                             </div>
                             <div className="w-full bg-slate-100 rounded h-2">
                                 <div className="bg-emerald-500 h-2 rounded" style={{width: `${(sales/leads)*100}%`}}></div>
                             </div>
                        </div>
                    </div>
                </Card>

                {/* Sales Gamification Card */}
                <Card className={`p-5 text-white shadow-lg relative overflow-hidden ${isTopPerformer ? 'bg-gradient-to-br from-emerald-600 to-teal-800' : 'bg-slate-800'}`}>
                    {isTopPerformer && (
                         <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rotate-45 opacity-20"></div>
                    )}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                         <div>
                             <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Ranking de Vendas</h3>
                             <div className="flex items-baseline space-x-2">
                                 <span className="text-3xl font-bold">{mySalesCount}</span>
                                 <span className="text-sm font-medium opacity-80">fechamentos</span>
                             </div>
                         </div>
                         <div className={`p-2 rounded-lg ${isTopPerformer ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white/10'}`}>
                             {isTopPerformer ? <IconMedal className="w-6 h-6" /> : <IconTrophy className="w-6 h-6" />}
                         </div>
                    </div>
                    
                    {isTopPerformer && (
                         <div className="mb-4 bg-white/10 rounded px-2 py-1 text-xs font-medium text-emerald-50 inline-block">
                             🏆 Top Performer
                         </div>
                    )}

                    <div className="bg-black/20 rounded-lg p-1 border border-white/5 relative z-10">
                         <SalesRanking records={records} />
                    </div>
                </Card>
            </div>
          </div>
        );

      case Role.INSTALLER:
        const installedToday = records.filter(r => r.type === 'INSTALLATION' && r.status === 'COMPLETED').length;
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Status Overview */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="Instalações Hoje" value={installedToday} icon={<IconCheck className="w-5 h-5"/>} color="emerald"/>
                        <StatCard title="Pendentes" value={3 - installedToday} icon={<IconCalendar className="w-5 h-5"/>} color="slate"/>
                    </div>

                    <Card className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Ordem de Serviço</h2>
                            <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-medium">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                Rastreando
                            </div>
                        </div>

                        <div className="space-y-6">
                             <PhotoUpload 
                                label="Documentação Fotográfica" 
                                onPhotosChange={(photos) => setFormData({...formData, photos})}
                            />
                             <TextArea 
                                label="Relatório Técnico"
                                rows={4}
                                placeholder="Descreva os procedimentos realizados e materiais utilizados..."
                                value={formData.notes || ''}
                                onChange={(e: any) => setFormData({...formData, notes: e.target.value})}
                            />
                            <Button 
                                variant="dark"
                                onClick={() => addRecord({ type: 'INSTALLATION', status: 'COMPLETED' })}
                                className="w-full"
                            >
                                {isOnline ? 'Finalizar Instalação' : 'Salvar Localmente'}
                            </Button>
                        </div>
                    </Card>
                     <Card className="p-0 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Mapa de Instalações</h3>
                            <RouteControl />
                        </div>
                        <MapView markers={markers} center={getMapCenter()} routeHistory={activeRoute} className="h-64 w-full rounded-none" />
                    </Card>
                </div>

                <div className="space-y-6">
                     <Card className="p-5">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cronograma do Dia</h3>
                        <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
                            <div className="pl-4 relative">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm ring-4 ring-emerald-50"></div>
                                <p className="text-xs text-emerald-600 font-bold mb-0.5 uppercase tracking-wide">08:00 - Concluído</p>
                                <p className="text-sm font-bold text-slate-800">João Silva (Recife)</p>
                                <p className="text-xs text-slate-500">Instalação 12 placas</p>
                            </div>
                            <div className="pl-4 relative">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white rounded-full border-2 border-slate-300"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-0.5">14:00 - Próximo</p>
                                <p className="text-sm font-bold text-slate-600">Padaria Central</p>
                                <p className="text-xs text-slate-500">Manutenção Inversor</p>
                            </div>
                            <div className="pl-4 relative">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-200 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-0.5">16:30</p>
                                <p className="text-sm font-bold text-slate-400">Retorno à Base</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );

      case Role.INSPECTOR:
        // Extract unique vendors for the filter
        const uniqueVendors = Array.from(new Set(
            records
                .filter(r => r.type === 'INSPECTION' && r.metadata?.contactInfo)
                .map(r => r.metadata!.contactInfo!)
        )).sort();

        const filteredRecords = records
            .filter(r => r.type === 'INSPECTION')
            .filter(r => {
                let matchesDate = true;
                let matchesVendor = true;

                if (inspectorFilterDate) {
                    // Compare with YYYY-MM-DD from input
                    const recordDate = new Date(r.timestamp).toLocaleDateString('en-CA');
                    matchesDate = recordDate === inspectorFilterDate;
                }
                
                if (inspectorFilterVendor) {
                    matchesVendor = r.metadata?.contactInfo === inspectorFilterVendor;
                }

                return matchesDate && matchesVendor;
            })
            .sort((a,b) => b.timestamp - a.timestamp);

        return (
             <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                             <span className="text-sm font-bold text-slate-700">GPS Ativo</span>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={() => setShowInspectorHistory(true)} className="text-sm">
                        <IconHistory className="w-4 h-4 mr-2" />
                        Histórico de Vistorias
                    </Button>
                </div>

                <Card className="p-6 border-t-4 border-t-violet-500">
                    <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
                        <div className="bg-violet-100 text-violet-600 p-2.5 rounded-xl">
                            <IconSolarPanel className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Vistoria Técnica</h2>
                            <p className="text-sm text-slate-500">Avaliação pré-instalação</p>
                        </div>
                    </div>
                    
                    <div className="space-y-5">
                        <Input 
                            label="Vendedor Solicitante" 
                            placeholder="Nome do vendedor" 
                            onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, contactInfo: e.target.value}})}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select 
                                label="Tipo de Telhado"
                                value={formData.metadata?.roofType || ""}
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, roofType: e.target.value}})}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Cerâmica</option>
                                <option>Fibrocimento</option>
                                <option>Metálico</option>
                                <option>Laje</option>
                            </Select>
                            <Select 
                                label="Estrutura do Telhado"
                                value={formData.metadata?.structure || ""}
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, structure: e.target.value}})}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Madeira</option>
                                <option>Metálica</option>
                                <option>Concreto/Laje</option>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Select 
                                label="Padrão de Entrada"
                                value={formData.metadata?.electricalStandard || ""}
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, electricalStandard: e.target.value}})}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Monofásico</option>
                                <option>Bifásico</option>
                                <option>Trifásico</option>
                            </Select>
                            <Select 
                                label="Condição do Aterramento"
                                value={formData.metadata?.grounding || ""}
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, grounding: e.target.value}})}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Existente (Adequado)</option>
                                <option>Existente (Inadequado)</option>
                                <option>Inexistente</option>
                            </Select>
                        </div>

                        <div className="pt-2 space-y-4">
                            {isGpsActive ? (
                                <>
                                    <PhotoUpload 
                                        label="Foto da Fachada Principal (Obrigatório)" 
                                        maxFiles={1}
                                        onPhotosChange={(photos) => setFormData({
                                            ...formData, 
                                            metadata: {
                                                ...formData.metadata, 
                                                facadePhoto: photos[0]
                                            }
                                        })}
                                    />
                                    <div className="border-t border-slate-100 pt-2"></div>
                                    <PhotoUpload 
                                        label="Fotos Técnicas (Detalhes)" 
                                        onPhotosChange={(photos) => setFormData({...formData, photos})}
                                    />
                                </>
                            ) : (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.75-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Sinal de GPS Necessário</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>Por favor, ative a localização do seu dispositivo para realizar o upload das fotos da vistoria. Isso garante o georreferenciamento das evidências.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button 
                                variant="secondary" 
                                onClick={() => addRecord({ type: 'INSPECTION', status: 'PENDING' })} 
                                className="flex-1"
                                disabled={!isGpsActive}
                            >
                                Salvar Rascunho
                            </Button>
                            <Button 
                                variant="purple" 
                                onClick={() => addRecord({ type: 'INSPECTION', status: 'COMPLETED' })} 
                                className="flex-[2] shadow-violet-500/20 font-bold"
                                disabled={!isGpsActive}
                            >
                                {isOnline ? 'Marcar como Concluída & Enviar' : 'Marcar como Concluída (Offline)'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Inspection History Modal */}
                <HistoryModal 
                    isOpen={showInspectorHistory} 
                    onClose={() => setShowInspectorHistory(false)} 
                    title="Histórico de Vistorias"
                >
                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filtrar por Data</label>
                            <input
                                type="date"
                                className="w-full text-sm p-2 rounded border border-slate-300 outline-none focus:border-violet-500 bg-white"
                                value={inspectorFilterDate}
                                onChange={(e) => setInspectorFilterDate(e.target.value)}
                            />
                        </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Filtrar por Vendedor</label>
                            <select
                                className="w-full text-sm p-2 rounded border border-slate-300 outline-none focus:border-violet-500 bg-white cursor-pointer"
                                value={inspectorFilterVendor}
                                onChange={(e) => setInspectorFilterVendor(e.target.value)}
                            >
                                <option value="">Todos os vendedores</option>
                                {uniqueVendors.map((vendor, idx) => (
                                    <option key={idx} value={vendor}>{vendor}</option>
                                ))}
                            </select>
                        </div>
                        
                        {(inspectorFilterDate || inspectorFilterVendor) && (
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInspectorFilterDate('');
                                        setInspectorFilterVendor('');
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-2 hover:bg-red-50 rounded transition-colors border border-transparent hover:border-red-100 flex items-center"
                                >
                                    <IconX className="w-4 h-4 mr-1" />
                                    Limpar Filtro
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {(inspectorFilterDate || inspectorFilterVendor) && (
                        <div className="mb-2 text-xs text-slate-500 font-medium px-1 flex flex-wrap gap-2">
                            <span>Mostrando resultados para:</span> 
                            {inspectorFilterDate && <span className="text-slate-800 font-bold bg-slate-100 px-1 rounded">{new Date(inspectorFilterDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                            {inspectorFilterVendor && <span className="text-slate-800 font-bold bg-slate-100 px-1 rounded">{inspectorFilterVendor}</span>}
                        </div>
                    )}

                    {filteredRecords.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400 flex flex-col items-center justify-center">
                             <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                                <IconSolarPanel className="w-8 h-8 text-slate-300" />
                             </div>
                             {(inspectorFilterDate || inspectorFilterVendor) ? (
                                 <>
                                    <h4 className="text-slate-700 font-bold text-lg mb-1">Nenhum resultado encontrado</h4>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                                        Não encontramos registros correspondentes aos filtros de Data ou Vendedor selecionados.
                                    </p>
                                    <button 
                                        onClick={() => { setInspectorFilterDate(''); setInspectorFilterVendor(''); }}
                                        className="px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-sm font-bold transition-colors border border-violet-100"
                                    >
                                        Limpar Filtros
                                    </button>
                                 </>
                             ) : (
                                 <>
                                    <h4 className="text-slate-700 font-bold text-lg mb-1">Histórico Vazio</h4>
                                    <p className="text-sm text-slate-500">
                                        Nenhuma vistoria foi registrada ainda. As vistorias salvas aparecerão aqui.
                                    </p>
                                 </>
                             )}
                        </div>
                    ) : (
                        filteredRecords.map((record) => (
                            <Card key={record.id} className={`p-5 hover:shadow-md transition-shadow group border ${record.syncStatus === 'PENDING' ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start gap-4 w-full">
                                        {/* Facade Thumbnail in Header if available */}
                                        {record.metadata?.facadePhoto && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div 
                                                    className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={() => setGalleryState({ images: [record.metadata!.facadePhoto!], index: 0 })}
                                                    title="Ver Fachada Principal"
                                                >
                                                    <img src={record.metadata.facadePhoto} className="w-full h-full object-cover" alt="Fachada" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Fachada</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-lg leading-tight">
                                                        {record.metadata?.clientName || "Cliente não informado"}
                                                    </span>
                                                    {record.syncStatus === 'PENDING' && (
                                                        <span className="relative flex h-2.5 w-2.5" title="Pendente de Sincronização">
                                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Sync Status Badge */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {record.syncStatus === 'PENDING' ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-200 text-amber-800" title="Registro salvo no dispositivo, aguardando internet">
                                                        <IconCloudOff className="w-4 h-4" />
                                                        <span className="text-xs font-bold">Não Sincronizado</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 opacity-80" title="Salvo na nuvem">
                                                        <IconCloudCheck className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-xs font-medium">Sincronizado</span>
                                                    </div>
                                                )}
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    {record.status === 'COMPLETED' ? 'Concluída' : 'Rascunho'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 flex items-center">
                                                <IconUser className="w-3 h-3 mr-1" />
                                                <span className="font-medium mr-1">{record.userName}</span> 
                                                <span className="text-slate-300 mx-1">|</span>
                                                {new Date(record.timestamp).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] font-mono text-slate-300 ml-2 whitespace-nowrap">
                                        #{record.id.slice(-4)}
                                    </div>
                                </div>
                                
                                {record.metadata && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 mt-4">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Telhado</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.roofType || "-"}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Estrutura</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.structure || "-"}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Padrão</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.electricalStandard || "-"}</span>
                                        </div>
                                         <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Aterramento</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.grounding || "-"}</span>
                                        </div>
                                    </div>
                                )}

                                {record.metadata?.contactInfo && (
                                     <div className="text-xs text-slate-500 mb-2">
                                        <span className="font-bold uppercase text-[10px] text-slate-400 mr-1">Vendedor Solicitante:</span>
                                        {record.metadata.contactInfo}
                                     </div>
                                )}

                                {record.notes && (
                                     <div className="text-sm text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 mb-4 flex gap-2">
                                        <span className="text-amber-300 flex-shrink-0">📝</span>
                                        <span className="italic">"{record.notes}"</span>
                                     </div>
                                )}

                                {record.photos && record.photos.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                                <IconCamera className="w-3 h-3" />
                                                Evidências Técnicas ({record.photos.length})
                                            </p>
                                            <span className="text-[10px] text-slate-400 italic">Deslize para ver mais</span>
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                                            {record.photos.map((photo, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="snap-start flex-shrink-0 w-20 h-20 relative group rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all shadow-sm"
                                                    onClick={() => setGalleryState({ images: record.photos!, index: idx })}
                                                    title={`Foto Técnica ${idx + 1}`}
                                                >
                                                    <img src={photo} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </HistoryModal>
                
                {galleryState && (
                    <GalleryModal 
                        images={galleryState.images} 
                        initialIndex={galleryState.index} 
                        onClose={() => setGalleryState(null)} 
                    />
                )}
            </div>
        );

      case Role.ADMIN:
        return (
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Painel de Inteligência</h2>
                        <p className="text-slate-500">Gestão estratégica e análise de performance</p>
                    </div>
                    <Button onClick={handleAiReport} disabled={aiLoading || !isOnline} className="w-full md:w-auto">
                        <IconSparkles className="w-5 h-5 mr-2" />
                        {aiLoading ? 'Analisando Dados...' : 'Gerar Relatório Estratégico (IA)'}
                    </Button>
                </div>

                {/* AI Report Section */}
                {aiContext && (
                    <Card className="p-0 overflow-hidden border-indigo-200 shadow-indigo-100">
                         <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <IconSparkles className="w-5 h-5 text-amber-300"/> 
                                Análise Gemini Business
                            </h3>
                            <span className="text-xs bg-white/20 px-2 py-1 rounded text-indigo-50">Gemini 1.5 Pro</span>
                         </div>
                         <div className="p-4 bg-slate-800">
                            <AiReportRenderer reportText={aiContext} />
                         </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Vendas Totais" 
                        value={records.filter(r => r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').length} 
                        icon={<IconDollar className="w-6 h-6"/>} 
                        color="emerald"
                    />
                     <StatCard 
                        title="Vistorias" 
                        value={records.filter(r => r.type === 'INSPECTION' && r.status === 'COMPLETED').length} 
                        icon={<IconCheck className="w-6 h-6"/>} 
                        color="violet"
                    />
                     <StatCard 
                        title="Equipe em Campo" 
                        value={3} // Mock
                        icon={<IconUsers className="w-6 h-6"/>} 
                        color="blue"
                    />
                </div>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Monitor