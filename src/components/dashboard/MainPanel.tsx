"use client";

import { PlayerProfile } from '@/lib/mock-data';
import { Plus, Edit2 } from 'lucide-react';
import ObjectiveCard from './ObjectiveCard';

interface MainPanelProps {
  player: PlayerProfile | null;
  onNewObjective: () => void;
  onEditObjective: (id: string) => void;
  onEditPlayer?: () => void;
  onBack?: () => void;
}

export default function MainPanel({ player, onNewObjective, onEditObjective, onEditPlayer, onBack }: MainPanelProps) {
  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-background overflow-hidden">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Selecciona un jugador de la plantilla</p>
          <p className="text-sm mt-2">Para ver sus objetivos individuales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background p-6 lg:p-8 h-full">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Botón de regreso para celulares */}
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:text-primary-600 uppercase tracking-wider mb-4 transition-colors cursor-pointer"
          >
            ← Volver a Plantilla
          </button>
        )}
        
        {/* Cabecera del Jugador */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <img src={player.fotografia || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.nombre} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-gray-50 dark:border-white/5" />
              <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-4 border-white dark:border-card">
                {player.plantilla.dorsal}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">
                  {player.nombre} {player.apellidos}
                </h1>
                <div className="flex gap-2 ml-2">
                  {player.objetivos.length > 0 ? (
                    player.objetivos.map(obj => {
                      const colorClass = obj.estado === 'completado' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                                         obj.estado === 'en_desarrollo' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 
                                         'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                      return <div key={obj.id} className={`w-4 h-4 rounded-full border border-black/10 dark:border-border-accent/30 ${colorClass}`} title={obj.titulo}></div>;
                    })
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  )}
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-4">
                {player.plantilla.equipo}
              </p>
              
              <div className="flex flex-col gap-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                {/* Primera Fila: Roles Tácticos */}
                <div className="flex flex-wrap gap-3">
                  <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded">
                    {player.plantilla.posicion || player.plantilla.demarcacion}
                  </div>
                  {player.plantilla.rol_funcional_primario && (
                    <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                      <span className="mr-1.5 font-bold">1º ROL:</span> {player.plantilla.rol_funcional_primario}
                    </div>
                  )}
                  {player.plantilla.rol_funcional_secundario && (
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded border border-gray-200 dark:border-border-accent/30">
                      <span className="mr-1.5 font-bold">2º ROL:</span> {player.plantilla.rol_funcional_secundario}
                    </div>
                  )}
                </div>

                {/* Segunda Fila: Datos Físicos y Categoría */}
                <div className="flex flex-wrap gap-3">
                  {player.plantilla.categoria && (
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded">
                      <span className="text-gray-400 mr-1.5">📅</span> {player.plantilla.categoria}
                    </div>
                  )}
                  <div className="flex items-center bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded">
                    <span className="text-yellow-500 mr-1.5">🦶</span> {player.plantilla.pierna_habil}
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded">
                    <span className="text-gray-400 mr-1.5">📏</span> {player.plantilla.altura_cm} cm
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded">
                    <span className="text-gray-400 mr-1.5">⚖️</span> {player.plantilla.peso_kg} kg
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={onEditPlayer}
              className="p-3 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-border-accent/30 rounded-lg transition-colors bg-white dark:bg-[#111424]"
              title="Editar Perfil"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={onNewObjective}
              className="bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_12px_rgba(212,64,99,0.3)] font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-sm w-full md:w-auto justify-center"
            >
              <Plus size={18} /> NUEVO OBJETIVO
            </button>
          </div>
        </div>

        {/* Sección de Objetivos */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-200 dark:border-border-accent/30 pb-3 gap-2">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              PLAN DE OBJETIVOS INDIVIDUALES ({player.objetivos.length})
            </h2>
            <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">Filtro por futbolista activo</span>
          </div>

          {player.objetivos.length === 0 ? (
             <div className="text-center py-12 border border-dashed border-gray-300 dark:border-border-accent/30 rounded-xl">
               <p className="text-gray-500 dark:text-gray-400">No hay objetivos registrados para este jugador.</p>
               <button onClick={onNewObjective} className="text-primary-600 font-bold mt-2 text-sm">Crear el primer objetivo</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {player.objetivos.map(obj => (
                <ObjectiveCard 
                  key={obj.id} 
                  objective={obj} 
                  onEdit={() => onEditObjective(obj.id)} 
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
