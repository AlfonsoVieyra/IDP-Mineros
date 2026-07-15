"use client";

import { useState } from 'react';
import { ObjetivoIDP } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Play, FileText, Image as ImageIcon, MonitorPlay, Plus, Link as LinkIcon, Trash2, X } from 'lucide-react';

interface MediaGalleryProps {
  role: 'entrenador' | 'jugador' | null;
  playerId: string;
  objectives: ObjetivoIDP[];
  onResourceAdded: () => void;
}

export default function MediaGallery({ role, playerId, objectives, onResourceAdded }: MediaGalleryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    objetivo_id: '',
    tipo: 'video',
    titulo: '',
    url: ''
  });

  // Extraer todos los recursos de todos los objetivos
  const allResources: any[] = [];
  objectives.forEach(obj => {
    if (obj.recursos_apoyo && Array.isArray(obj.recursos_apoyo)) {
      obj.recursos_apoyo.forEach((rec: any) => {
        allResources.push({
          ...rec,
          objetivo_titulo: obj.titulo
        });
      });
    }
  });

  const videos = allResources.filter(r => r.tipo === 'video' || r.tipo === 'youtube');
  const documents = allResources.filter(r => r.tipo !== 'video' && r.tipo !== 'youtube');

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'pdf': return <FileText size={20} className="text-red-500" />;
      case 'imagen': return <ImageIcon size={20} className="text-blue-500" />;
      case 'slides': return <MonitorPlay size={20} className="text-yellow-500" />;
      default: return <LinkIcon size={20} className="text-gray-500" />;
    }
  };

  const handleAddResource = async () => {
    if (!formData.url || !formData.titulo) return;
    
    // Si no seleccionó objetivo, toma el primero por defecto
    const targetObjectiveId = formData.objetivo_id || (objectives.length > 0 ? objectives[0].id : null);
    
    if (!targetObjectiveId) {
      alert("El jugador necesita tener al menos un objetivo para poder asignarle recursos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient() as any;
      const { error } = await supabase.from('recursos_apoyo').insert({
        objetivo_id: targetObjectiveId,
        tipo: formData.tipo,
        url: formData.url,
        titulo: formData.titulo
      });

      if (error) throw error;
      
      setFormData({ ...formData, titulo: '', url: '' });
      setShowForm(false);
      onResourceAdded();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el recurso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("¿Estás seguro de que deseas eliminar este recurso multimedia?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('recursos_apoyo')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      onResourceAdded();
    } catch (error) {
      console.error("Error al eliminar el recurso:", error);
      alert("Error al eliminar el recurso de la base de datos.");
    }
  };

  const hasVideos = videos.length > 0;
  const hasDocs = documents.length > 0;
  const hasAnyResources = hasVideos || hasDocs;

  return (
    <div className="space-y-8 mt-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-border-accent/30 pb-4">
        <div className="flex items-center gap-3">
          <MonitorPlay className="text-primary-600" size={24} />
          <h2 className="text-2xl font-black uppercase tracking-tight">Almacén <span className="text-primary-600">Multimedia</span></h2>
        </div>
        {role === 'entrenador' && objectives.length > 0 && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-primary-600/20 active:scale-95"
          >
            <Plus size={14} /> Agregar Recurso
          </button>
        )}
      </div>

      {!hasAnyResources && !showForm ? (
        <div className="bg-white dark:bg-[#111424] border border-gray-200 dark:border-white/5 rounded-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full mx-auto flex items-center justify-center text-gray-400">
            <MonitorPlay size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Almacén vacío</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {role === 'entrenador' 
                ? 'No hay material de apoyo multimedia o documentos asignados a este jugador. Haz clic en "Agregar Recurso" para comenzar.'
                : 'No hay material de apoyo multimedia o documentos asignados a tu progreso.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contenedor de Videos */}
          {hasVideos && (
            <div className={`${hasDocs || showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
              <h3 className="font-bold uppercase text-gray-500 text-sm">Videos Asignados</h3>
              
              <div className={`grid grid-cols-1 ${hasDocs || showForm ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                {videos.map((vid, idx) => {
                  const yId = getYoutubeId(vid.url);
                  return (
                    <div key={vid.id || idx} className="relative group rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-border-accent/30 aspect-video block">
                      {/* Botón Eliminar para Entrenador */}
                      {role === 'entrenador' && (
                        <button
                          onClick={(e) => handleDeleteResource(vid.id, e)}
                          className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-red-600 border border-white/10 hover:border-red-500 rounded text-gray-400 hover:text-white transition-all shadow-md z-20 cursor-pointer"
                          title="Eliminar recurso"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <a 
                        href={vid.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute inset-0 block group-hover:opacity-80 transition-opacity"
                      >
                        {yId ? (
                          <img 
                            src={`https://img.youtube.com/vi/${yId}/maxresdefault.jpg`} 
                            alt={vid.titulo}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                            onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${yId}/hqdefault.jpg` }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                            Sin vista previa
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-primary-600 w-12 h-12 rounded-full flex items-center justify-center text-white transform group-hover:scale-110 transition-transform shadow-lg">
                            <Play fill="currentColor" size={20} className="ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-white">
                          <div className="text-[10px] text-primary-400 font-bold uppercase mb-0.5 line-clamp-1">{vid.objetivo_titulo}</div>
                          <div className="font-semibold text-sm line-clamp-1">{vid.titulo}</div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contenedor de Documentos y Formulario */}
          {(hasDocs || showForm) && (
            <div className={`${!hasVideos ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-8`}>
              
              {hasDocs && (
                <div className="space-y-4">
                  <h3 className="font-bold uppercase text-gray-500 text-sm">Documentos y Archivos</h3>
                  <div className="space-y-3">
                    {documents.map((doc, idx) => (
                      <div key={doc.id || idx} className="relative group/doc flex items-center justify-between bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                        <a 
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-3 flex-1 min-w-0 group"
                        >
                          <div className="w-10 h-10 rounded bg-gray-100 dark:bg-background flex items-center justify-center shrink-0">
                            {getIcon(doc.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase line-clamp-1">{doc.objetivo_titulo}</div>
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {doc.titulo}
                            </div>
                          </div>
                        </a>
                        
                        {role === 'entrenador' && (
                          <button
                            onClick={(e) => handleDeleteResource(doc.id, e)}
                            className="mr-3 p-2 bg-transparent hover:bg-red-500/10 hover:text-red-500 rounded text-gray-400 hover:border-red-500/20 transition-all cursor-pointer border border-transparent"
                            title="Eliminar recurso"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario rápido para entrenador */}
              {showForm && role === 'entrenador' && objectives.length > 0 && (
                <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                    <h4 className="font-bold uppercase text-xs text-primary-600 flex items-center gap-1.5">
                      <Plus size={14} /> Añadir Material de Apoyo
                    </h4>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <select 
                      value={formData.tipo}
                      onChange={e => setFormData({...formData, tipo: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="video">Video (YouTube)</option>
                      <option value="pdf">Documento PDF</option>
                      <option value="imagen">Imagen / Pizarra</option>
                      <option value="slides">Presentación</option>
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Título del recurso..."
                      value={formData.titulo}
                      onChange={e => setFormData({...formData, titulo: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    
                    <input 
                      type="url" 
                      placeholder="URL (ej. https://youtube.com/...)"
                      value={formData.url}
                      onChange={e => setFormData({...formData, url: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                    />

                    <select 
                      value={formData.objetivo_id}
                      onChange={e => setFormData({...formData, objetivo_id: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">-- Asignar a un objetivo --</option>
                      {objectives.map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.titulo}</option>
                      ))}
                    </select>
    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-lg text-xs transition-all text-center"
                      >
                        CANCELAR
                      </button>
                      <button
                        onClick={handleAddResource}
                        disabled={isSubmitting || !formData.url || !formData.titulo}
                        className="flex-1 bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50"
                      >
                        {isSubmitting ? 'GUARDANDO...' : 'GUARDAR'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
