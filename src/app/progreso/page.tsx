"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Charts from '@/components/progreso/Charts';
import MediaGallery from '@/components/progreso/MediaGallery';
import { ObjetivoIDP } from '@/types/database';
import { Activity, X } from 'lucide-react';

export default function ProgresoPage() {
  const [role, setRole] = useState<'entrenador' | 'jugador' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [objectives, setObjectives] = useState<ObjetivoIDP[]>([]);
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single();
        
      if (userData) {
        const u = userData as { rol: 'entrenador' | 'jugador' };
        setRole(u.rol);
        
        if (u.rol === 'entrenador') {
          // Fetch players
          const { data: playersData } = await supabase
            .from('usuarios')
            .select('id, nombre, apellidos, foto_url, plantilla(equipo, dorsal, posicion)')
            .eq('rol', 'jugador');
            
          if (playersData && playersData.length > 0) {
            const pData = playersData as any[];
            setPlayers(pData);
            setSelectedPlayerId(pData[0].id);
          }
        } else {
          // Jugador solo se ve a sí mismo
          setSelectedPlayerId(user.id);
        }
      }
      setIsLoading(false);
    }
    
    init();
  }, [supabase]);

  // Cargar datos del jugador seleccionado
  useEffect(() => {
    async function loadPlayerData() {
      if (!selectedPlayerId) return;
      
      const { data: objs } = await supabase
        .from('objetivos_idp')
        .select('*, recursos_apoyo(*)')
        .eq('jugador_id', selectedPlayerId)
        .order('created_at', { ascending: false });
        
      if (objs) {
        setObjectives(objs as ObjetivoIDP[]);
      } else {
        setObjectives([]);
      }
    }
    
    loadPlayerData();
  }, [selectedPlayerId, supabase]);

  // Obtener lista única de equipos de los jugadores
  const teams = Array.from(
    new Set(
      players
        .map(p => {
          const pArr = Array.isArray(p.plantilla) ? p.plantilla : [p.plantilla];
          return pArr[0]?.equipo || 'Sin Equipo';
        })
        .filter(Boolean)
    )
  ) as string[];

  const filteredPlayersByTeam = players.filter(p => {
    if (selectedTeam === 'ALL') return true;
    const pArr = Array.isArray(p.plantilla) ? p.plantilla : [p.plantilla];
    const playerTeam = pArr[0]?.equipo || 'Sin Equipo';
    return playerTeam === selectedTeam;
  });

  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
    const filtered = players.filter(p => {
      if (team === 'ALL') return true;
      const pArr = Array.isArray(p.plantilla) ? p.plantilla : [p.plantilla];
      const playerTeam = pArr[0]?.equipo || 'Sin Equipo';
      return playerTeam === team;
    });
    if (filtered.length > 0) {
      const currentIsStillIn = filtered.some(p => p.id === selectedPlayerId);
      if (!currentIsStillIn) {
        setSelectedPlayerId(filtered[0].id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] dark:bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedPlayerInfo = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-background text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Header y Controles */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-border-accent/30 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-2 md:gap-3 flex-wrap">
              <Activity className="text-primary-600 shrink-0" size={28} />
              <span>Progreso <span className="text-primary-600">Individual</span></span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">Análisis estadístico y multimedia de objetivos</p>
          </div>
          
          {role === 'entrenador' && players.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-card p-3 rounded-2xl shadow-sm border border-gray-200 dark:border-border-accent/30">
              {/* Selector 1: Equipo */}
              <div className="flex flex-col px-3 py-1 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-white/10 sm:min-w-[150px]">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipo:</label>
                <select
                  value={selectedTeam}
                  onChange={e => handleTeamChange(e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer text-primary-600 dark:text-primary-400 mt-0.5"
                >
                  <option value="ALL" className="dark:bg-card">Todos los Equipos</option>
                  {teams.map(t => (
                    <option key={t} value={t} className="dark:bg-card">{t}</option>
                  ))}
                </select>
              </div>

              {/* Selector 2: Jugador */}
              <div className="flex items-center gap-3 pl-0 sm:pl-3 pr-2 py-1">
                {selectedPlayerInfo && (
                  <img 
                    src={selectedPlayerInfo.foto_url || `https://i.pravatar.cc/150?u=${selectedPlayerInfo.id}`}
                    alt="Player" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary-500/50 shrink-0"
                  />
                )}
                <div className="flex flex-col sm:min-w-[180px]">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jugador:</label>
                  <select 
                    value={selectedPlayerId}
                    onChange={e => setSelectedPlayerId(e.target.value)}
                    className="bg-transparent text-sm font-bold outline-none cursor-pointer text-primary-600 dark:text-primary-400 mt-0.5"
                  >
                    {filteredPlayersByTeam.map(p => {
                      const pArr = Array.isArray(p.plantilla) ? p.plantilla : [p.plantilla];
                      const dorsal = pArr[0]?.dorsal;
                      return (
                        <option key={p.id} value={p.id} className="dark:bg-card">
                          {p.nombre} {p.apellidos} {dorsal ? `(#${dorsal})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fichas de Objetivos Individuales */}
        {objectives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((obj) => {
              const statusColor = 
                obj.estado === 'completado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                obj.estado === 'en_desarrollo' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20' : 
                'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';

              const statusLabel = 
                obj.estado === 'completado' ? 'Completado' : 
                obj.estado === 'en_desarrollo' ? 'En Curso' : 
                'Pendiente';

              return (
                <div 
                  key={obj.id} 
                  onClick={() => setExpandedObjectiveId(obj.id)}
                  className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer hover:border-primary-500/30"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    obj.estado === 'completado' ? 'bg-emerald-500' : 
                    obj.estado === 'en_desarrollo' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                      {obj.categoria}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 shadow-sm ${
                      obj.estado === 'completado' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                      obj.estado === 'en_desarrollo' ? 'bg-yellow-500 shadow-yellow-500/50' : 
                      'bg-red-500 shadow-red-500/50'
                    }`} />
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                      {obj.titulo}
                    </h3>
                  </div>
                  
                  <div className="mt-auto pt-4 flex flex-col gap-1.5">
                    {obj.fecha_inicio && obj.fecha_fin && (
                      <p className="text-[11px] text-gray-500 font-medium">
                        Plazo: {new Date(obj.fecha_inicio).toLocaleDateString()} - {new Date(obj.fecha_fin).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 line-clamp-2">
                      {obj.descripcion_meta || 'Haz clic para ver más detalles.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-card/50 border border-gray-200 dark:border-white/5 border-dashed rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No hay objetivos registrados para este jugador.</p>
          </div>
        )}

        {/* Modal de Detalle de Objetivo (Premium Overlay) */}
        {expandedObjectiveId && objectives.find(o => o.id === expandedObjectiveId) && (() => {
          const activeObjective = objectives.find(o => o.id === expandedObjectiveId)!;
          return (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setExpandedObjectiveId(null)}
            >
              <div 
                className="bg-[#111424] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del Modal */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-start">
                  <div className="space-y-1.5 pr-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                        {activeObjective.categoria}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        activeObjective.estado === 'completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        activeObjective.estado === 'en_desarrollo' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {activeObjective.estado === 'completado' ? 'Completado' : 
                         activeObjective.estado === 'en_desarrollo' ? 'En Curso' : 
                         'Pendiente'}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
                        activeObjective.estado === 'completado' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                        activeObjective.estado === 'en_desarrollo' ? 'bg-yellow-500 shadow-yellow-500/50' : 
                        'bg-red-500 shadow-red-500/50'
                      }`} />
                      {activeObjective.titulo}
                    </h2>
                    {activeObjective.fecha_inicio && activeObjective.fecha_fin && (
                      <p className="text-[11px] text-gray-400 font-medium">
                        Plazo: {new Date(activeObjective.fecha_inicio).toLocaleDateString()} al {new Date(activeObjective.fecha_fin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setExpandedObjectiveId(null)}
                    className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#0a0a0b]/50 p-5 rounded-xl border border-white/5 space-y-2">
                      <h3 className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Detalle (Descripción Meta)</h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {activeObjective.descripcion_meta || <span className="italic opacity-50">Sin descripción detallada.</span>}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0b]/50 p-5 rounded-xl border border-white/5 space-y-2">
                      <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Plan de Acción</h3>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {activeObjective.plan_accion || <span className="italic opacity-50">No hay un plan de acción registrado para este objetivo.</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer del Modal */}
                <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                  <button 
                    onClick={() => setExpandedObjectiveId(null)}
                    className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dashboard Estadístico */}
        <Charts objectives={objectives} />

        {/* Galería Multimedia */}
        <MediaGallery 
          role={role} 
          playerId={selectedPlayerId} 
          objectives={objectives} 
          onResourceAdded={() => {
            // Forzar recarga para actualizar la lista de recursos
            const temp = selectedPlayerId;
            setSelectedPlayerId('');
            setTimeout(() => setSelectedPlayerId(temp), 10);
          }}
        />

      </main>
    </div>
  );
}
