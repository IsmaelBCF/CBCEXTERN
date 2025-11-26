import React, { useState, useEffect } from 'react';
import { Role, User, VisitRecord, GeoLocation, MapMarker, MarkerConfig, MarkerStyle } from './types';
import MapView from './components/MapView';
import PhotoUpload from './components/PhotoUpload';
import Login from './components/Login';
import { analyzeLocationContext, generateReport } from './services/geminiService';
import { getCurrentUser, logout } from './services/authService';
import { IconSolarPanel, IconMap, IconUser, IconMenu, IconSparkles, IconLogout, IconWifi, IconWifiOff, IconCloudCheck, IconCloudOff, IconRefresh } from './components/ui/Icons';

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

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
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
                className="w-full px-4 py-2.5 appearance-none rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
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

const ImageModal = ({ src, onClose }: { src: string | null, onClose: () => void }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <img 
                src={src} 
                alt="Full view" 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain" 
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
    );
};

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
  const [viewImage, setViewImage] = useState<string | null>(null);
  
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

  // Persist Records to LocalStorage
  useEffect(() => {
      localStorage.setItem('cbc_records', JSON.stringify(records));
  }, [records]);

  // Persist Routes
  useEffect(() => {
    localStorage.setItem('cbc_route_archives', JSON.stringify(routeArchives));
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
    localStorage.setItem('cbc_marker_config', JSON.stringify(newConfig));
  };

  const resetMarkerConfig = () => {
    setMarkerConfig(DEFAULT_MARKER_CONFIG);
    localStorage.setItem('cbc_marker_config', JSON.stringify(DEFAULT_MARKER_CONFIG));
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
    const newRecord: VisitRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      location: currentLocation,
      type: 'PROSPECTION', 
      status: 'PENDING',
      notes: '',
      photos: [],
      syncStatus: isOnline ? 'SYNCED' : 'PENDING',
      ...data
    } as VisitRecord;

    setRecords(prev => [newRecord, ...prev]);
    setFormData({});
    
    if (isOnline) {
        alert("Registro salvo com sucesso!");
    } else {
        alert("Registro salvo localmente. Será sincronizado quando houver conexão.");
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
  };

  const renderContent = () => {
    if (!user) return null;

    switch (user.role) {
      case Role.PROSPECTOR:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                                <IconUser className="w-6 h-6"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Nova Prospecção</h2>
                                <p className="text-sm text-slate-500">Registre a visita porta-a-porta</p>
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
                        <Select 
                            label="Status"
                            value={formData.status || "PENDING"}
                            onChange={(e: any) => setFormData({...formData, status: e.target.value as any})}
                        >
                            <option value="PENDING">Selecione...</option>
                            <option value="SUCCESS">Interessado (Chamar Vendedor)</option>
                            <option value="PENDING">Em negociação</option>
                            <option value="FAILED">Não interessado</option>
                        </Select>
                         <Input 
                            label="Telefone / Contato" 
                            placeholder="(81) 9..."
                            value={formData.metadata?.contactInfo || ''}
                            onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, contactInfo: e.target.value}})}
                        />
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
                    
                    <Button onClick={() => addRecord({ type: 'PROSPECTION' })} className="w-full mt-2">
                        {isOnline ? 'Registrar Visita' : 'Salvar Localmente (Offline)'}
                    </Button>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Minha Rota</h3>
                        <div className="flex items-center space-x-3">
                            <RouteControl />
                        </div>
                    </div>
                    <MapView markers={markers} center={getMapCenter()} routeHistory={activeRoute} className="h-64 w-full rounded-none" />
                </Card>
            </div>
            
            <div className="space-y-6">
                <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <div className="flex items-center space-x-2 text-indigo-900 font-bold mb-3">
                        <IconSparkles className="w-5 h-5 text-indigo-500"/>
                        <h3>Assistente Gemini</h3>
                    </div>
                    <p className="text-sm text-indigo-700/80 mb-4 leading-relaxed">
                        Analise a região para encontrar oportunidades comerciais próximas à sua localização atual.
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

                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3">Resumo do Dia</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-sm font-medium text-slate-600">Visitas</span>
                            <span className="text-lg font-bold text-slate-900">{records.filter(r => r.role === Role.PROSPECTOR && r.timestamp > Date.now() - 86400000).length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                             <span className="text-sm font-medium text-slate-600">Interessados</span>
                             <span className="text-lg font-bold text-amber-500">{records.filter(r => r.role === Role.PROSPECTOR && r.status === 'SUCCESS').length}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );

      case Role.SALES_LEADER:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
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
                            value="SUCCESS"
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

                     <Button variant="success" onClick={() => addRecord({ type: 'SALE_ATTEMPT', status: 'SUCCESS' })} className="w-full mt-4">
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
             <div className="space-y-4">
                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Performance do Dia</h3>
                    <div className="flex items-end space-x-2">
                        <span className="text-4xl font-bold text-emerald-400">{records.filter(r => r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').length}</span>
                        <span className="text-sm font-medium mb-2">Vendas</span>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Pipeline</h3>
                     <div className="space-y-4">
                         <div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-slate-700">Prospecções</span>
                                 <span className="font-bold">{records.filter(r => r.type === 'PROSPECTION').length}</span>
                             </div>
                             <div className="w-full bg-slate-100 rounded-full h-2">
                                 <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                             </div>
                         </div>
                         <div>
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-slate-700">Vistorias</span>
                                 <span className="font-bold">{records.filter(r => r.type === 'INSPECTION').length}</span>
                             </div>
                             <div className="w-full bg-slate-100 rounded-full h-2">
                                 <div className="bg-purple-500 h-2 rounded-full" style={{width: '30%'}}></div>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        );

      case Role.INSTALLER:
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
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
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-0.5">08:00</p>
                                <p className="text-sm font-bold text-slate-800">João Silva (Recife)</p>
                                <p className="text-xs text-slate-500">Instalação 12 placas</p>
                            </div>
                            <div className="pl-4 relative">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-200 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-0.5">14:00</p>
                                <p className="text-sm font-bold text-slate-600">Padaria Central</p>
                                <p className="text-xs text-slate-500">Manutenção Inversor</p>
                            </div>
                            <div className="pl-4 relative">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-200 rounded-full border-2 border-white"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-0.5">16:30</p>
                                <p className="text-sm font-bold text-slate-600">Retorno à Base</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );

      case Role.INSPECTOR:
        return (
             <div className="max-w-3xl mx-auto space-y-8">
                <Card className="p-6">
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
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, roofType: e.target.value}})}
                            >
                                <option>Cerâmica</option>
                                <option>Fibrocimento</option>
                                <option>Metálico</option>
                                <option>Laje</option>
                            </Select>
                            <Select 
                                label="Padrão de Entrada"
                                onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, electricalStandard: e.target.value}})}
                            >
                                <option>Monofásico</option>
                                <option>Bifásico</option>
                                <option>Trifásico</option>
                            </Select>
                        </div>
                         <Select 
                            label="Condição do Aterramento"
                            onChange={(e: any) => setFormData({...formData, metadata: {...formData.metadata, grounding: e.target.value}})}
                        >
                            <option>Existente (Adequado)</option>
                            <option>Existente (Inadequado)</option>
                            <option>Inexistente</option>
                        </Select>

                        <div className="pt-2">
                            {isGpsActive ? (
                                <PhotoUpload 
                                    label="Fotos Técnicas (Obrigatório)" 
                                    onPhotosChange={(photos) => setFormData({...formData, photos})}
                                />
                            ) : (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                        
                        <Button 
                            variant="purple" 
                            onClick={() => addRecord({ type: 'INSPECTION', status: 'COMPLETED' })} 
                            className="w-full text-lg"
                            disabled={!isGpsActive}
                        >
                             {isOnline ? 'Enviar Relatório de Vistoria' : 'Salvar Localmente'}
                        </Button>
                    </div>
                </Card>

                {/* Inspection History Section */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider px-1">Vistorias Recentes</h3>
                    {records.filter(r => r.type === 'INSPECTION').length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                             <div className="inline-block p-3 rounded-full bg-slate-50 mb-3">
                                <IconSolarPanel className="w-6 h-6 text-slate-300" />
                             </div>
                             <p>Nenhuma vistoria registrada no histórico.</p>
                        </div>
                    ) : (
                        records
                        .filter(r => r.type === 'INSPECTION')
                        .sort((a,b) => b.timestamp - a.timestamp)
                        .map((record) => (
                            <Card key={record.id} className="p-5 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 text-lg">
                                                {record.metadata?.clientName || "Cliente não informado"}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                                                Concluída
                                            </span>
                                            {/* Sync Status Badge */}
                                            {record.syncStatus === 'PENDING' ? (
                                                <span title="Aguardando Sincronização" className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                                                     <IconCloudOff className="w-3 h-3" />
                                                </span>
                                            ) : (
                                                <span title="Sincronizado" className="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-400">
                                                     <IconCloudCheck className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center">
                                            Vistoriado por {record.userName} • {new Date(record.timestamp).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        ID: #{record.id.slice(-4)}
                                    </div>
                                </div>
                                
                                {record.metadata && (
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase">Telhado</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.roofType || "-"}</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase">Padrão</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.electricalStandard || "-"}</span>
                                        </div>
                                         <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[10px] text-slate-400 uppercase">Aterramento</span>
                                            <span className="text-sm font-medium text-slate-700">{record.metadata.grounding || "-"}</span>
                                        </div>
                                    </div>
                                )}

                                {record.notes && (
                                     <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic border border-slate-100 mb-4">
                                        "{record.notes}"
                                     </p>
                                )}

                                {record.photos && record.photos.length > 0 && (
                                    <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {record.photos.map((photo, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setViewImage(photo)}
                                            >
                                                <img src={photo} alt="Evidência" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
                <ImageModal src={viewImage} onClose={() => setViewImage(null)} />
            </div>
        );

      case Role.ADMIN:
        return (
            <div className="space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                         { title: "Vendas", value: records.filter(r => r.type === 'SALE_ATTEMPT' && r.status === 'SUCCESS').length, color: "emerald", icon: "💰" },
                         { title: "Prospecções", value: records.filter(r => r.type === 'PROSPECTION').length, color: "blue", icon: "🗣️" },
                         { title: "Vistorias", value: records.filter(r => r.type === 'INSPECTION').length, color: "violet", icon: "📋" },
                         { title: "Instalações", value: records.filter(r => r.type === 'INSTALLATION').length, color: "slate", icon: "🔧" },
                     ].map((stat, idx) => (
                         <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                             <div>
                                 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                                 <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                             </div>
                             <div className={`text-2xl opacity-50 bg-${stat.color}-50 p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                                 {stat.icon}
                             </div>
                         </div>
                     ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map & Config Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Mapa Operacional</h3>
                                <div className="flex gap-2 text-xs items-center">
                                     {Object.values(markerConfig).slice(0,3).map((conf, idx) => (
                                         <span key={idx} className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                             <span className={`w-2 h-2 rounded-full mr-1 bg-${(conf as MarkerStyle).color === 'gold' ? 'yellow-500' : (conf as MarkerStyle).color}-500`}></span>
                                             {(conf as MarkerStyle).label}
                                         </span>
                                    ))}
                                    <div className="ml-2 pl-2 border-l border-slate-200">
                                        <RouteControl />
                                    </div>
                                </div>
                            </div>
                            <MapView markers={markers} center={getMapCenter()} routeHistory={activeRoute} className="h-[500px] w-full rounded-none" />
                        </Card>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Configuração Visual dos Marcadores</h3>
                                <button onClick={resetMarkerConfig} className="text-xs text-red-600 hover:text-red-800 font-medium">Restaurar Padrão</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(markerConfig).map(([key, config]) => {
                                    const c = config as MarkerStyle;
                                    return (
                                    <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                                        <div className="flex items-center overflow-hidden mr-2">
                                            <div className={`flex-shrink-0 w-3 h-3 rounded-full mr-2 bg-${c.color === 'gold' ? 'yellow-500' : c.color === 'violet' ? 'purple-500' : c.color + '-500'}`}></div>
                                            <span className="text-xs font-semibold text-slate-700 truncate" title={c.label}>{c.label}</span>
                                        </div>
                                        <select 
                                            value={c.color} 
                                            onChange={(e) => updateMarkerConfig(key, e.target.value)}
                                            className="text-xs border border-slate-200 bg-slate-50 rounded p-1.5 outline-none focus:border-amber-400"
                                        >
                                            {AVAILABLE_COLORS.map(color => (
                                                <option key={color} value={color}>{color}</option>
                                            ))}
                                        </select>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>

                    {/* AI & Reports Column */}
                    <div className="space-y-6">
                         <Card className="p-6 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white border-none shadow-xl shadow-indigo-900/20">
                            <div className="flex items-center space-x-2 mb-4">
                                <IconSparkles className="w-6 h-6 text-amber-300" />
                                <h3 className="text-lg font-bold">Inteligência Gemini</h3>
                            </div>
                            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                                Gere relatórios estratégicos baseados nos dados coletados em campo pela equipe hoje.
                            </p>
                            
                            <Button 
                                onClick={handleAiReport}
                                disabled={aiLoading || !isOnline}
                                className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none font-bold"
                            >
                                {aiLoading ? "Processando..." : isOnline ? "Gerar Relatório Gerencial" : "Indisponível Offline"}
                            </Button>

                            {aiContext && (
                                <div className="mt-6 p-4 bg-indigo-900/50 rounded-lg text-sm text-indigo-50 border border-indigo-500/30 shadow-inner whitespace-pre-line max-h-80 overflow-y-auto custom-scrollbar">
                                    <h4 className="font-bold text-amber-300 mb-2 text-xs uppercase">Análise Gerada</h4>
                                    {aiContext}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        );
      
      default:
        return <div>Selecione um perfil</div>;
    }
  };

  if (loadingAuth) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="animate-pulse text-amber-500">
                  <IconSolarPanel className="w-10 h-10" />
              </div>
          </div>
      );
  }

  if (!user) {
      return <Login onLoginSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900">
      <Header user={user} onLogout={handleLogout} isOnline={isOnline} isSyncing={isSyncing} />
      
      {/* Offline Banner */}
      {!isOnline && (
          <div className="bg-red-500 text-white text-xs font-bold text-center py-2 shadow-md relative z-40">
              MODO OFFLINE ATIVO - Os dados serão salvos localmente e sincronizados quando a conexão retornar.
          </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-end justify-between">
             <div>
                <h2 className="text-2xl font-bold text-slate-900">{user.role === Role.ADMIN ? 'Visão Geral' : 'Meu Painel'}</h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center">
                    <IconMap className="w-4 h-4 mr-1.5"/>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</span>
                </p>
             </div>
        </div>

        {renderContent()}

        {user.role !== Role.ADMIN && (
             <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => handleAiAnalysis("Me fale sobre essa localização e potenciais clientes solares.")}
                    className="bg-slate-900 text-amber-400 p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 hover:rotate-12 flex items-center justify-center border-2 border-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Análise de Local"
                    disabled={!isOnline}
                >
                    <IconSparkles className="w-6 h-6" />
                </button>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;