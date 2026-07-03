"use client";

import { useState, useEffect } from 'react';
import { PlayerProfile } from '@/lib/mock-data';
import { X, Sparkles, Check, Trash2, Calendar, Plus } from 'lucide-react';

interface NewObjectiveModalProps {
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

type TabType = 'OBJETIVO' | 'ACCIONES' | 'EVALUACIONES';

export default function NewObjectiveModal({ player, isOpen, onClose, initialData }: NewObjectiveModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('OBJETIVO');

  // ESTADO DEL FORMULARIO PRINCIPAL
  const [formData, setFormData] = useState({
    tipo_objetivo: 'Deportiva',
    fecha_inicio: '',
    estado: 'pendiente', // 'pendiente' (rojo), 'en_desarrollo' (amarillo), 'completado' (verde)
    titulo: '',
    proposito: 'MEJORAR', // 'POTENCIAR' | 'MEJORAR'
    fase: 'EN CURSO', // 'TERMINADO' | 'EN CURSO'
    detalles: '',
    plan_accion: ''
  });

  // ESTADO DE TAREAS (Pestaña Acciones)
  const [tareas, setTareas] = useState<{id: string, text: string, completed: boolean, date: string}[]>([]);
  const [taskInput, setTaskInput] = useState('');

  // ESTADO DE RECURSOS
  const [recursos, setRecursos] = useState<{tipo: string, url: string, titulo: string, id?: string}[]>([]);
  const [showRecursoForm, setShowRecursoForm] = useState(false);
  const [nuevoRecurso, setNuevoRecurso] = useState({ tipo: 'video', url: '', titulo: '' });

  // ESTADO DE EVALUACION
  const [evaluacion, setEvaluacion] = useState({
    nota: 0,
    feedback: ''
  });
  const [historialEvaluaciones, setHistorialEvaluaciones] = useState<{id: string, date: string, nota: number, feedback: string}[]>([]);

  useEffect(() => {
    if (initialData && isOpen) {
      // Capitalizar la primera letra de la categoría
      const cat = initialData.categoria || 'deportiva';
      const capCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      
      setFormData({
        tipo_objetivo: capCat,
        fecha_inicio: initialData.fecha_inicio || '',
        estado: initialData.estado || 'pendiente',
        titulo: initialData.titulo || '',
        proposito: initialData.proposito || 'MEJORAR',
        fase: initialData.fase || 'EN CURSO',
        detalles: initialData.descripcion_meta || '',
        plan_accion: initialData.plan_accion || ''
      });
      
      setEvaluacion({ nota: 0, feedback: '' });

      if (initialData.historial_evaluaciones) {
        try {
          const parsed = typeof initialData.historial_evaluaciones === 'string' 
            ? JSON.parse(initialData.historial_evaluaciones) 
            : initialData.historial_evaluaciones;
          setHistorialEvaluaciones(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setHistorialEvaluaciones([]);
        }
      } else {
        setHistorialEvaluaciones([]);
      }

      if (initialData.recursos_apoyo) {
        setRecursos(initialData.recursos_apoyo);
      } else {
        setRecursos([]);
      }

      if (initialData.tareas_desarrollo) {
        try {
          const parsed = typeof initialData.tareas_desarrollo === 'string' 
            ? JSON.parse(initialData.tareas_desarrollo) 
            : initialData.tareas_desarrollo;
          setTareas(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setTareas([]);
        }
      } else {
        setTareas([]);
      }
    } else if (!isOpen) {
      // Reset when closing
      setFormData({
        tipo_objetivo: 'Deportiva',
        fecha_inicio: '',
        estado: 'pendiente',
        titulo: '',
        proposito: 'MEJORAR',
        fase: 'EN CURSO',
        detalles: '',
        plan_accion: ''
      });
      setTareas([]);
      setRecursos([]);
      setEvaluacion({ nota: 0, feedback: '' });
      setHistorialEvaluaciones([]);
      setShowRecursoForm(false);
    }
  }, [initialData, isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGuardarCambios = async () => {
    setIsSubmitting(true);
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Normalizar categoría quitando acentos y a minúsculas
      const normalizeCategoria = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };

      const objectivePayload = {
        jugador_id: player.id,
        titulo: formData.titulo || 'Sin título',
        categoria: normalizeCategoria(formData.tipo_objetivo) as any,
        estado: formData.estado as any,
        fecha_inicio: formData.fecha_inicio || new Date().toISOString().split('T')[0],
        descripcion_meta: formData.detalles || '',
        tareas_desarrollo: JSON.stringify(tareas),
        proposito: formData.proposito,
        fase: formData.fase,
        plan_accion: formData.plan_accion,
        historial_evaluaciones: JSON.stringify(historialEvaluaciones)
      };

      let error;
      let currentObjectiveId = initialData?.id;

      if (initialData) {
        const { error: updateError } = await (supabase
          .from('objetivos_idp') as any)
          .update(objectivePayload)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { data: newObjective, error: insertError } = await (supabase
          .from('objetivos_idp') as any)
          .insert(objectivePayload)
          .select()
          .single();
        error = insertError;
        if (newObjective) {
          currentObjectiveId = newObjective.id;
        }
      }

      if (error) throw error;

      // Guardar Recursos
      if (currentObjectiveId) {
        // Para simplificar: borramos los recursos anteriores y metemos los nuevos
        // (Omitimos borrar si no hay initialData)
        if (initialData) {
          await (supabase.from('recursos_apoyo') as any).delete().eq('objetivo_id', currentObjectiveId);
        }
        
        if (recursos.length > 0) {
          const recursosPayload = recursos.map(r => ({
            objetivo_id: currentObjectiveId,
            tipo: r.tipo as any,
            url: r.url,
            titulo: r.titulo || `Recurso ${r.tipo}`
          }));
          const { error: errorRecursos } = await (supabase
            .from('recursos_apoyo') as any)
            .insert(recursosPayload);
            
          if (errorRecursos) console.error("Error guardando recursos", errorRecursos);
        }
      }

      alert('¡Objetivo guardado exitosamente en Supabase!');
      onClose();
      window.location.reload(); // Recargar para ver el objetivo
      
    } catch (error) {
      console.error('Error guardando objetivo en Supabase:', error);
      alert('Error al guardar. Asegúrate de tener permisos y RLS configurado o desactivado localmente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !window.confirm('¿Estás seguro de que deseas eliminar este objetivo? Esta acción no se puede deshacer.')) return;
    
    setIsSubmitting(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { error } = await supabase.from('objetivos_idp').delete().eq('id', initialData.id);
      if (error) throw error;
      
      onClose();
      // Recargar la página para ver el cambio
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar objetivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskInput,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };
    setTareas([...tareas, newTask]);
    setTaskInput('');
  };

  const handleDeleteTask = (id: string) => {
    setTareas(tareas.filter(t => t.id !== id));
  };

  const handleToggleTask = (id: string) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const tareasCompletadas = tareas.filter(t => t.completed).length;
  const porcentajeTareas = tareas.length === 0 ? 0 : Math.round((tareasCompletadas / tareas.length) * 100);

  const handleAgregarEvaluacion = () => {
    if (evaluacion.nota === 0 && !evaluacion.feedback.trim()) return;
    
    const nuevaEval = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      nota: evaluacion.nota,
      feedback: evaluacion.feedback
    };
    
    setHistorialEvaluaciones([nuevaEval, ...historialEvaluaciones]);
    setEvaluacion({ nota: 0, feedback: '' });
  };

  const handleEliminarEvaluacion = (id: string) => {
    setHistorialEvaluaciones(historialEvaluaciones.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111424] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header con Pestañas */}
        <div className="px-6 pt-6 border-b border-gray-200 dark:border-border-accent/30 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold uppercase tracking-tight">
              {initialData ? 'Editar Objetivo Individual' : 'Nuevo Objetivo Individual'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-8 text-sm font-bold uppercase tracking-wider overflow-x-auto no-scrollbar">
            {['OBJETIVO', 'ACCIONES', 'EVALUACIONES'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as TabType)}
                  className={`pb-4 px-1 whitespace-nowrap transition-colors relative ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'OBJETIVO' ? 'EL OBJETIVO' : tab}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-background">
          
          {/* Header del jugador dentro del modal */}
          <div className="bg-[#111424] dark:bg-card border border-[#1c2136] dark:border-border-accent/30 rounded-xl p-4 flex items-center justify-between mb-6 text-white shadow-md">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={player.fotografia || `https://i.pravatar.cc/150?u=${player.id}`} alt={player.nombre} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
                <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#111424]">
                  {player.plantilla.dorsal}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold uppercase">{player.nombre}</h3>
                  <div className="flex gap-1.5 ml-2">
                    {player.objetivos.length > 0 ? (
                      player.objetivos.map(obj => {
                        const colorClass = obj.estado === 'completado' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 
                                           obj.estado === 'en_desarrollo' ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)]' : 
                                           'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]';
                        return <div key={obj.id} className={`w-3 h-3 rounded-full border border-black/20 ${colorClass}`}></div>;
                      })
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 uppercase mt-0.5">{player.plantilla.equipo}</p>
              </div>
            </div>

            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-center pr-4">
              <div>
                <div className="text-gray-500 font-bold mb-0.5 uppercase">Categoría</div>
                <div className="font-semibold">{player.plantilla.categoria || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-bold mb-0.5 uppercase">Posición</div>
                <div className="font-semibold capitalize text-primary-400">{player.plantilla.posicion || player.plantilla.demarcacion}</div>
              </div>
              <div>
                <div className="text-gray-500 font-bold mb-0.5 uppercase">Rol Primario</div>
                <div className="font-semibold capitalize text-indigo-400">{player.plantilla.rol_funcional_primario || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500 font-bold mb-0.5 uppercase">Rol Secundario</div>
                <div className="font-semibold capitalize">{player.plantilla.rol_funcional_secundario || '-'}</div>
              </div>
            </div>
          </div>

          {/* Banner IA */}
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg p-3 flex items-start sm:items-center gap-3 mb-6 text-indigo-800 dark:text-indigo-300">
            <Sparkles size={18} className="shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm">
              <strong>Funciones IA activas:</strong> Sugerir objetivos tácticos, generar planes de acción detallados e informes de progreso automáticos.
            </p>
          </div>

          {/* Contenido según pestaña */}
          {activeTab === 'OBJETIVO' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tipo de Objetivo *</label>
                  <select 
                    value={formData.tipo_objetivo}
                    onChange={e => setFormData({...formData, tipo_objetivo: e.target.value})}
                    className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option>Deportiva</option>
                    <option>Técnica</option>
                    <option>Táctica</option>
                    <option>Física</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fecha de inicio *</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={formData.fecha_inicio}
                      onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                      className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Estado Semáforo *</label>
                  <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-2.5 flex items-center justify-center gap-4 h-[42px]">
                    <button 
                      onClick={() => setFormData({...formData, estado: 'pendiente'})}
                      className={`w-5 h-5 rounded-full bg-red-500 transition-all ${formData.estado === 'pendiente' ? 'ring-2 ring-red-500/30 ring-offset-2 ring-offset-white dark:ring-offset-card opacity-100 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'opacity-40 hover:opacity-80'}`}
                    ></button>
                    <button 
                      onClick={() => setFormData({...formData, estado: 'en_desarrollo'})}
                      className={`w-5 h-5 rounded-full bg-yellow-400 transition-all ${formData.estado === 'en_desarrollo' ? 'ring-2 ring-yellow-400/30 ring-offset-2 ring-offset-white dark:ring-offset-card opacity-100 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'opacity-40 hover:opacity-80'}`}
                    ></button>
                    <button 
                      onClick={() => setFormData({...formData, estado: 'completado'})}
                      className={`w-5 h-5 rounded-full bg-green-500 transition-all ${formData.estado === 'completado' ? 'ring-2 ring-green-500/30 ring-offset-2 ring-offset-white dark:ring-offset-card opacity-100 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'opacity-40 hover:opacity-80'}`}
                    ></button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título del Objetivo *</label>
                  <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                    <Sparkles size={12} /> Sugerir con IA
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Ej: Mejorar transición defensiva..." 
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                  className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-medium" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Propósito del objetivo *</label>
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                    <button 
                      onClick={() => setFormData({...formData, proposito: 'POTENCIAR'})}
                      className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.proposito === 'POTENCIAR' ? 'bg-white dark:bg-card text-primary-600 shadow-sm border border-gray-200 dark:border-border-accent/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'}`}
                    >POTENCIAR</button>
                    <button 
                      onClick={() => setFormData({...formData, proposito: 'MEJORAR'})}
                      className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.proposito === 'MEJORAR' ? 'bg-white dark:bg-card text-primary-600 shadow-sm border border-gray-200 dark:border-border-accent/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'}`}
                    >MEJORAR</button>
                  </div>
                 </div>
                 <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Fase de desarrollo *</label>
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                    <button 
                      onClick={() => setFormData({...formData, fase: 'TERMINADO'})}
                      className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.fase === 'TERMINADO' ? 'bg-white dark:bg-card text-primary-600 shadow-sm border border-gray-200 dark:border-border-accent/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'}`}
                    >TERMINADO ✓</button>
                    <button 
                      onClick={() => setFormData({...formData, fase: 'EN CURSO'})}
                      className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.fase === 'EN CURSO' ? 'bg-white dark:bg-card text-primary-600 shadow-sm border border-gray-200 dark:border-border-accent/30' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'}`}
                    >EN CURSO ⚙</button>
                  </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detalles del Objetivo</label>
                  <textarea 
                    rows={4} 
                    value={formData.detalles}
                    onChange={e => setFormData({...formData, detalles: e.target.value})}
                    className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  ></textarea>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan de Acción Técnico</label>
                    <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                      <Sparkles size={10} /> Generar Plan con IA
                    </button>
                  </div>
                  <textarea 
                    rows={4} 
                    value={formData.plan_accion}
                    onChange={e => setFormData({...formData, plan_accion: e.target.value})}
                    className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              {/* SECCIÓN RECURSOS ADICIONALES */}
              <div className="mt-6 border-t border-gray-200 dark:border-border-accent/30 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recursos Adicionales (PDF, Video, Slides, Imagen)</label>
                  <button 
                    onClick={() => setShowRecursoForm(!showRecursoForm)}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:text-primary-700"
                  >
                    <Plus size={14} /> AÑADIR RECURSO
                  </button>
                </div>

                {showRecursoForm && (
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-4 mb-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tipo</label>
                      <select 
                        value={nuevoRecurso.tipo}
                        onChange={e => setNuevoRecurso({...nuevoRecurso, tipo: e.target.value})}
                        className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded p-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                      >
                        <option value="video">Video (YouTube/URL)</option>
                        <option value="pdf">Documento PDF</option>
                        <option value="slides">Google Slides</option>
                        <option value="imagen">Imagen</option>
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">URL / Enlace</label>
                      <input 
                        type="text"
                        placeholder="https://..."
                        value={nuevoRecurso.url}
                        onChange={e => setNuevoRecurso({...nuevoRecurso, url: e.target.value})}
                        className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded p-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Título (Opcional)</label>
                      <input 
                        type="text"
                        placeholder="Ej. Análisis táctico..."
                        value={nuevoRecurso.titulo}
                        onChange={e => setNuevoRecurso({...nuevoRecurso, titulo: e.target.value})}
                        className="w-full bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded p-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if(nuevoRecurso.url) {
                          setRecursos([...recursos, { ...nuevoRecurso, id: Date.now().toString() }]);
                          setNuevoRecurso({ tipo: 'video', url: '', titulo: '' });
                          setShowRecursoForm(false);
                        }
                      }}
                      className="bg-primary-600 hover:bg-primary-700 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] font-bold py-2 px-4 rounded text-sm transition-all"
                    >
                      AGREGAR
                    </button>
                  </div>
                )}

                {recursos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recursos.map((rec, index) => (
                      <div key={rec.id || index} className="flex items-center justify-between bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 p-3 rounded-lg shadow-sm">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] font-bold text-primary-500 uppercase">{rec.tipo}</span>
                          <span className="text-sm font-semibold truncate" title={rec.titulo || rec.url}>{rec.titulo || 'Sin título'}</span>
                          <a href={rec.url} target="_blank" rel="noreferrer" className="text-xs text-gray-400 truncate hover:text-primary-500 transition-colors">
                            {rec.url}
                          </a>
                        </div>
                        <button 
                          onClick={() => setRecursos(recursos.filter((_, i) => i !== index))}
                          className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-border-accent/30">
                    <p className="text-sm text-gray-500">No hay recursos adjuntos a este objetivo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ACCIONES' && (
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold uppercase mb-2">Plan de Trabajo Individualizado (Tareas)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Define tareas, ejercicios, sesiones de video o hitos para medir el avance del jugador. El progreso se calculará en base a las acciones completadas.</p>
              
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  <span>Progreso de las acciones:</span>
                  <span className="text-primary-600">{tareasCompletadas} / {tareas.length} Tareas ({porcentajeTareas}%)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary-600 h-full rounded-full transition-all duration-300" style={{ width: `${porcentajeTareas}%` }}></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  type="text" 
                  placeholder="ej: Realizar sesión de 30 minutos de centros cruzados en video" 
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500" 
                />
                <button
                  onClick={handleAddTask}
                  className="bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-sm"
                >
                  <Plus size={16} /> AGREGAR TAREA
                </button>
              </div>

              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Lista de Tareas ({tareas.length})</h4>
              
              {tareas.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-border-accent/30 rounded-xl text-gray-500 text-sm">
                  Aún no hay tareas registradas. Agrega una arriba.
                </div>
              ) : (
                <div className="space-y-3">
                  {tareas.map(tarea => (
                    <div key={tarea.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${tarea.completed ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-900/30' : 'bg-white dark:bg-card border-gray-200 dark:border-border-accent/30'}`}>
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleToggleTask(tarea.id)}
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${tarea.completed ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-primary-500'}`}
                        >
                          <Check size={14} />
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${tarea.completed ? 'text-gray-500 line-through' : 'text-foreground'}`}>
                            {tarea.text}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                            <Calendar size={12} /> Asignada: {tarea.date}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(tarea.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'EVALUACIONES' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-6">
                  <h3 className="font-bold uppercase mb-4 flex items-center gap-2">
                    <span className="text-indigo-500">🏆</span> Registrar Evaluación Técnica
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nota de desempeño</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button 
                          key={n} 
                          onClick={() => setEvaluacion({...evaluacion, nota: n})}
                          className={`py-2 rounded-lg border text-sm font-bold transition-all ${evaluacion.nota === n ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20 transform scale-105' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-border-accent/30 text-gray-600 dark:text-gray-300 hover:border-primary-500'}`}
                        >
                          {n} {n === 1 || n === 5 ? '★' : ''}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                      <span>1: Rendimiento Bajo</span>
                      <span>3: Esperado</span>
                      <span>5: Excelente / Superado</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notas de evolución y feedback</label>
                    <textarea 
                      rows={4} 
                      value={evaluacion.feedback}
                      onChange={e => setEvaluacion({...evaluacion, feedback: e.target.value})}
                      placeholder="Indica el progreso del jugador..." 
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-3"
                    ></textarea>
                    
                    <button 
                      onClick={handleAgregarEvaluacion}
                      disabled={evaluacion.nota === 0 && !evaluacion.feedback.trim()}
                      className="w-full py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
                    >
                      GUARDAR EVALUACIÓN
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold uppercase flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" /> Analizar Progreso con IA
                    </h3>
                    <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                      <Sparkles size={10} /> Generar con IA
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                    La IA analizará el objetivo, el plan, las tareas completadas y el historial de evaluaciones para redactar un informe técnico consolidado y sugerir una nota de rendimiento.
                  </p>
                  <div className="h-32 border border-dashed border-gray-300 dark:border-border-accent/30 rounded-lg flex items-center justify-center text-center p-4">
                    <p className="text-xs text-gray-400 italic">Haz clic en &quot;Generar con IA&quot; para redactar un informe automático de progreso y recomendaciones tácticas.</p>
                  </div>
                </div>
              </div>
              
              {/* Historial de Evaluaciones */}
              <div className="mt-6 border-t border-gray-200 dark:border-border-accent/30 pt-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                  HISTORIAL DE EVALUACIONES ({historialEvaluaciones.length})
                </h4>
                
                {historialEvaluaciones.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-border-accent/30 text-sm text-gray-500">
                    No hay evaluaciones registradas en el historial.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historialEvaluaciones.map((ev, i) => (
                      <div key={ev.id || i} className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-4 flex gap-4 relative group">
                        <div className="shrink-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-lg">
                          <span className="text-xs font-bold text-gray-400 mb-1">{ev.date}</span>
                          <div className="flex gap-0.5 text-yellow-400">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className={`text-[10px] ${star <= ev.nota ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                          {ev.feedback || <span className="italic text-gray-400">Sin comentarios adicionales.</span>}
                        </div>
                        <button 
                          onClick={() => handleEliminarEvaluacion(ev.id)}
                          className="absolute right-4 top-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Eliminar evaluación"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#111424] border-t border-gray-200 dark:border-border-accent/30 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
          <div className="w-full sm:w-auto">
            {initialData && (
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-500 hover:text-red-600 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start"
              >
                <Trash2 size={16} /> ELIMINAR OBJETIVO
              </button>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose} 
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-bold text-sm bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
            >
              CANCELAR
            </button>
            <button 
              onClick={handleGuardarCambios}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-bold text-sm bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
