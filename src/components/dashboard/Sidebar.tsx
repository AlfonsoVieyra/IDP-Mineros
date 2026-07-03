"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { PlayerProfile } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  players: PlayerProfile[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
  onNewPlayer?: () => void;
  className?: string;
}

const filters = ['TODOS', 'PORTERO', 'DEFENSA', 'CENTROCAMPISTA', 'DELANTERO'];

export default function Sidebar({ players, selectedPlayerId, onSelectPlayer, onNewPlayer, className = '' }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('N');

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'TODOS' || p.plantilla.demarcacion?.toUpperCase() === activeFilter;
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, apellidos, rol')
          .eq('id', user.id)
          .single();
          
        if (data) {
          const u = data as any;
          const fullName = u.apellidos ? `${u.nombre} ${u.apellidos}` : u.nombre;
          setUserName(fullName);
          setUserRole(u.rol);
          setUserInitial(u.nombre.charAt(0).toUpperCase());
        }
      }
    }
    loadUser();
  }, []);

  return (
    <aside className={`w-full md:w-80 bg-[#111424] text-white flex flex-col h-full shrink-0 border-r border-white/5 overflow-hidden ${className}`}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 tracking-wider">
            PLANTILLA ACTUAL <span className="bg-white/10 px-2 py-0.5 rounded-full text-white ml-1">{players.length}</span>
          </span>
          <button 
            onClick={onNewPlayer}
            className="bg-transparent text-primary-500 border-2 border-primary-500 hover:bg-primary-600 hover:text-white hover:border-primary-600 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> NUEVO
          </button>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c2136] border border-white/10 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-gray-500 transition-shadow"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded border-2 transition-all ${activeFilter === f ? 'bg-transparent text-primary-500 border-primary-500 shadow-[0_0_8px_rgba(212,64,99,0.2)]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {filteredPlayers.map(player => {
          const isActive = player.id === selectedPlayerId;
          
          return (
            <button
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              className={`w-full flex items-center p-4 border-b border-white/5 transition-colors text-left relative ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}
              
              <div className="relative">
                <img src={player.fotografia || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.nombre} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#111424]">
                  {player.plantilla.dorsal}
                </div>
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{player.nombre} {player.apellidos}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                  <span className="uppercase font-bold">{player.plantilla.posicion || player.plantilla.demarcacion}</span>
                  <span className="text-yellow-500 flex items-center gap-0.5"><User size={10} /> {player.plantilla.pierna_habil}</span>
                </div>
              </div>

              <div className="ml-2 flex flex-col items-end">
                <span className="text-[9px] text-gray-500 font-semibold mb-1 tracking-wider">OBJETIVOS</span>
                <div className="flex gap-1.5 items-center h-4">
                  {player.objetivos.length > 0 ? (
                    player.objetivos.map(obj => {
                      const colorClass = obj.estado === 'completado' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]' : 
                                         obj.estado === 'en_desarrollo' ? 'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.3)]' : 
                                         'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]';
                      return <div key={obj.id} className={`w-3 h-3 rounded-full border border-black/20 ${colorClass}`}></div>;
                    })
                  ) : (
                    <span className="text-gray-600 text-xs font-bold px-1">-</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
        {filteredPlayers.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No se encontraron jugadores.
          </div>
        )}
      </div>

      {/* Perfil del Usuario en la parte inferior */}
      {userName && (
        <div className="p-4 border-t border-white/5 bg-[#0a0a0b]/50 mt-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1c2136] border border-white/10 flex items-center justify-center font-bold text-white shadow-inner">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
