"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Charts from '@/components/progreso/Charts';
import MediaGallery from '@/components/progreso/MediaGallery';
import { ObjetivoIDP } from '@/types/database';
import { Activity } from 'lucide-react';

export default function ProgresoPage() {
  const [role, setRole] = useState<'entrenador' | 'jugador' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [objectives, setObjectives] = useState<ObjetivoIDP[]>([]);
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
            .select('id, nombre, apellidos, foto_url, plantilla(dorsal, posicion)')
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
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <Activity className="text-primary-600" size={32} />
              Progreso <span className="text-primary-600">Individual</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Análisis estadístico y multimedia de objetivos</p>
          </div>
          
          {role === 'entrenador' && players.length > 0 && (
            <div className="flex items-center gap-3 bg-white dark:bg-card p-2 pr-4 rounded-xl shadow-sm border border-gray-200 dark:border-border-accent/30">
              {selectedPlayerInfo && (
                <img 
                  src={selectedPlayerInfo.foto_url || `https://i.pravatar.cc/150?u=${selectedPlayerInfo.id}`}
                  alt="Player" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary-500/50"
                />
              )}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Evaluando a:</label>
                <select 
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer text-primary-600 dark:text-primary-400"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-card">
                      {p.nombre} {p.apellidos} {p.plantilla?.[0]?.dorsal ? `(#${p.plantilla[0].dorsal})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

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
