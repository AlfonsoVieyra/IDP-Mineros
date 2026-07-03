"use client";

import { ObjetivoIDP } from '@/types/database';
import { Target, Activity, Zap, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';

interface ObjectiveCardProps {
  objective: ObjetivoIDP;
  onEdit: () => void;
}

export default function ObjectiveCard({ objective, onEdit }: ObjectiveCardProps) {
  const isCompleted = objective.estado === 'completado';
  const isDev = objective.estado === 'en_desarrollo';
  
  const statusColor = isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      isDev ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';

  const statusDotColor = isCompleted ? 'bg-green-500' : isDev ? 'bg-yellow-500' : 'bg-red-500';
  const statusText = objective.estado.replace('_', ' ').toUpperCase();

  const getIcon = () => {
    switch (objective.categoria) {
      case 'fisica': return <Activity size={14} />;
      case 'tecnica': return <Zap size={14} />;
      case 'tactica': return <Target size={14} />;
      default: return <CheckCircle2 size={14} />;
    }
  };

  // Calcular progreso de tareas reales
  let totalTareas = 0;
  let tareasCompletadas = 0;
  
  if (objective.tareas_desarrollo) {
    try {
      const tareas = typeof objective.tareas_desarrollo === 'string' 
        ? JSON.parse(objective.tareas_desarrollo) 
        : objective.tareas_desarrollo;
        
      if (Array.isArray(tareas)) {
        totalTareas = tareas.length;
        tareasCompletadas = tareas.filter(t => t.completed).length;
      }
    } catch (e) {
      console.error("Error parseando tareas", e);
    }
  }

  const porcentaje = totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);

  return (
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {getIcon()} {objective.categoria}
        </div>
        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusColor}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`}></div>
          {statusText}
        </div>
      </div>

      <h3 className="font-bold text-lg mb-2 leading-tight uppercase">{objective.titulo}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
        {objective.descripcion_meta}
      </p>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center text-xs">
          <span className="text-gray-500 mr-1.5">PROPÓSITO:</span>
          <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
            {objective.proposito || 'MEJORAR'}
          </span>
        </div>
        <div className="flex items-center text-xs">
          <span className="text-gray-500 mr-1.5">FASE:</span>
          <span className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
            {objective.fase || (isCompleted ? 'Terminado' : 'En Curso')}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1.5">
          <span>TAREAS COMPLETADAS:</span>
          <span>{tareasCompletadas}/{totalTareas} ({porcentaje}%)</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary-600 h-full rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg mb-5 border border-gray-100 dark:border-white/5">
        <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider">
          <span>ÚLTIMO INFORME</span>
          <span>{objective.updated_at.split('T')[0]}</span>
        </div>
        <p className="text-xs italic text-gray-600 dark:text-gray-400 line-clamp-2">
          &quot;Se observa mejora en el timing. El jugador ha reducido los fueras de juego en un 20% en los partidos de práctica...&quot;
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
          <Calendar size={14} className="mr-1.5" />
          Inicio: {objective.fecha_inicio}
        </div>
        <button 
          onClick={onEdit}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center transition-colors"
        >
          EDITAR / EVALUAR <ChevronRight size={14} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
