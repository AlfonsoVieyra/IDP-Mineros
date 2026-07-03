"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import MainPanel from '@/components/dashboard/MainPanel';
import NewObjectiveModal from '@/components/modals/NewObjectiveModal';
import NewPlayerModal from '@/components/modals/NewPlayerModal';
import { createClient } from '@/lib/supabase/client';
import { PlayerProfile, mockPlayers } from '@/lib/mock-data';

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlayerModalOpen, setIsNewPlayerModalOpen] = useState(false);
  const [editPlayerMode, setEditPlayerMode] = useState(false);
  const [editObjectiveId, setEditObjectiveId] = useState<string | null>(null);
  const [role, setRole] = useState<'entrenador' | 'jugador' | null>(null);
  const [mobileView, setMobileView] = useState<'sidebar' | 'panel'>('sidebar');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      // Verificar rol del usuario primero
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          const uRole = (profile as any).rol;
          setRole(uRole);
          if (uRole === 'jugador') {
            router.push('/progreso');
            return;
          }
        }
      }

      // Intentar cargar usuarios con su plantilla y objetivos relacionados
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id, email, nombre, apellidos, rol, foto_url, created_at,
          plantilla (*),
          objetivos_idp (
            *,
            seguimiento_acciones (*),
            recursos_apoyo (*)
          )
        `)
        .eq('rol', 'jugador');

      if (error) throw error;

      if (data && data.length > 0) {
        // Mapear al formato PlayerProfile
        const formattedPlayers: PlayerProfile[] = data.map((u: any) => ({
          id: u.id,
          email: u.email || '',
          nombre: u.nombre,
          apellidos: u.apellidos || '',
          rol: u.rol || 'jugador',
          foto_url: u.foto_url || null,
          fotografia: u.foto_url || `https://i.pravatar.cc/150?u=${u.id}`,
          created_at: u.created_at || new Date().toISOString(),
          plantilla: Array.isArray(u.plantilla) 
            ? (u.plantilla[0] || {
              equipo: 'Mineros', dorsal: 0, demarcacion: 'N/A', posicion: '', categoria: '',
              rol_funcional_primario: '', rol_funcional_secundario: '', pierna_habil: '',
              altura_cm: 0, peso_kg: 0
            })
            : (u.plantilla || {
              equipo: 'Mineros', dorsal: 0, demarcacion: 'N/A', posicion: '', categoria: '',
              rol_funcional_primario: '', rol_funcional_secundario: '', pierna_habil: '',
              altura_cm: 0, peso_kg: 0
            }),
          objetivos: u.objetivos_idp || []
        }));
        
        setPlayers(formattedPlayers);
        if (formattedPlayers.length > 0 && !selectedPlayerId) {
          setSelectedPlayerId(formattedPlayers[0].id);
        }
      } else {
        // Si no hay datos (o RLS los bloquea), dejamos la lista vacía
        console.warn("No se encontraron jugadores en Supabase o RLS bloqueó la consulta.");
        setPlayers([]);
        setSelectedPlayerId(null);
      }
    } catch (err: any) {
      console.error("Error al cargar jugadores:", err);
      setErrorMsg(err.message || JSON.stringify(err));
      setPlayers([]);
      setSelectedPlayerId(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedPlayerId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || null;

  if (role === 'jugador') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0b] text-gray-400 font-semibold">
        Redirigiendo a tu progreso...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0b]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Sidebar 
        players={players} 
        selectedPlayerId={selectedPlayerId} 
        onSelectPlayer={(id) => {
          setSelectedPlayerId(id);
          setMobileView('panel');
        }} 
        onNewPlayer={() => setIsNewPlayerModalOpen(true)}
        className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex`}
      />
      
      {selectedPlayer ? (
        <div className={`${mobileView === 'panel' ? 'block' : 'hidden'} md:block flex-1 h-full overflow-hidden`}>
          <MainPanel 
            player={selectedPlayer} 
            onNewObjective={() => {
              setEditObjectiveId(null);
              setIsModalOpen(true);
            }}
            onEditObjective={(id) => {
              setEditObjectiveId(id);
              setIsModalOpen(true);
            }}
            onEditPlayer={() => {
              setEditPlayerMode(true);
              setIsNewPlayerModalOpen(true);
            }}
            onBack={() => setMobileView('sidebar')}
          />
        </div>
      ) : (
        <div className={`${mobileView === 'panel' ? 'block' : 'hidden'} md:block flex-1 flex flex-col items-center justify-center bg-[#0a0a0b] text-gray-500`}>
          {errorMsg ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-md text-center">
              <h3 className="font-bold mb-2 uppercase">Error de Base de Datos</h3>
              <p className="text-sm">{errorMsg}</p>
            </div>
          ) : (
            <p>No hay jugadores disponibles</p>
          )}
        </div>
      )}

      {selectedPlayer && (
        <NewObjectiveModal 
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditObjectiveId(null);
          }}
          initialData={editObjectiveId ? selectedPlayer.objetivos.find(o => o.id === editObjectiveId) : null}
        />
      )}

      <NewPlayerModal 
        isOpen={isNewPlayerModalOpen}
        onClose={() => {
          setIsNewPlayerModalOpen(false);
          setEditPlayerMode(false);
        }}
        initialData={editPlayerMode ? selectedPlayer : null}
      />
    </>
  );
}
