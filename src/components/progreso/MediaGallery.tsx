"use client";

import { useState } from 'react';
import { ObjetivoIDP } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Play, FileText, Image as ImageIcon, MonitorPlay, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';

interface MediaGalleryProps {
  role: 'entrenador' | 'jugador' | null;
  playerId: string;
  objectives: ObjetivoIDP[];
  onResourceAdded: () => void;
}

export default function MediaGallery({ role, playerId, objectives, onResourceAdded }: MediaGalleryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      onResourceAdded();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el recurso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border-accent/30 pb-4">
        <MonitorPlay className="text-primary-600" size={24} />
        <h2 className="text-2xl font-black uppercase tracking-tight">Almacén <span className="text-primary-600">Multimedia</span></h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contenedor de Videos */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold uppercase text-gray-500 text-sm">Videos Asignados</h3>
          
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid, idx) => {
                const yId = getYoutubeId(vid.url);
                return (
                  <a 
                    key={vid.id || idx} 
                    href={vid.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-border-accent/30 aspect-video block"
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
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-card border border-dashed border-gray-300 dark:border-border-accent/30 rounded-xl p-8 text-center text-gray-500 text-sm">
              No hay videos asignados al progreso de este jugador.
            </div>
          )}
        </div>

        {/* Contenedor de Documentos y Formulario */}
        <div className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="font-bold uppercase text-gray-500 text-sm">Documentos y Archivos</h3>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <a 
                    key={doc.id || idx}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-3 bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
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
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-card border border-dashed border-gray-300 dark:border-border-accent/30 rounded-xl p-6 text-center text-gray-500 text-sm">
                No hay documentos anexados.
              </div>
            )}
          </div>

          {/* Formulario rápido para entrenador */}
          {role === 'entrenador' && objectives.length > 0 && (
            <div className="bg-white dark:bg-card border border-gray-200 dark:border-border-accent/30 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold uppercase text-xs text-primary-600 mb-4 flex items-center gap-1.5">
                <Plus size={14} /> Añadir Material de Apoyo
              </h4>
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

                <button
                  onClick={handleAddResource}
                  disabled={isSubmitting || !formData.url || !formData.titulo}
                  className="w-full bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'GUARDANDO...' : 'GUARDAR RECURSO'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
