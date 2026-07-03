"use client";
/* eslint-disable react-hooks/purity, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Play, Film, Calendar, AlertCircle, Info, ExternalLink, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Videoteca, CompetenciaVideoteca } from '@/types/database';
import { getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from '@/lib/youtube';
import AddVideoModal from '@/components/modals/AddVideoModal';

// Competencias del filtro con su mapeo al enum de la base de datos
const FILTER_OPTIONS = [
  { label: 'TODOS', value: 'ALL' },
  { label: 'COMPETENCIAS', value: 'COMPETENCIA' },
  { label: 'ENTRENAMIENTOS', value: 'Entrenamiento' },
  { label: 'REFERENCIAS', value: 'Referencia' }
];

// Videos de prueba premium en caso de fallo de Supabase o base de datos vacía
const FALLBACK_VIDEOS: Videoteca[] = [
  {
    id: 'mock-vid-1',
    titulo: 'Análisis Bloque Bajo - Jornada 5 (Liga TDP)',
    competencia: 'Liga TDP',
    url_youtube: 'https://www.youtube.com/watch?v=s538r6_uPyE',
    fecha_registro: '2026-06-25',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-vid-2',
    titulo: 'Presión Tras Pérdida - Transiciones Rápidas',
    competencia: 'Copa Conecta',
    url_youtube: 'https://www.youtube.com/watch?v=jW_oP_qSUpY',
    fecha_registro: '2026-06-20',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-vid-3',
    titulo: 'Salida de Presión Alta y Progresión de Bloque',
    competencia: 'Copa Promesas',
    url_youtube: 'https://www.youtube.com/watch?v=NnFk1v598-Q',
    fecha_registro: '2026-06-18',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-vid-4',
    titulo: 'Entrenamiento: Ejercicios de Definición al Primer Toque',
    competencia: 'Entrenamiento',
    url_youtube: 'https://www.youtube.com/watch?v=F0B4R74o1f0',
    fecha_registro: '2026-06-15',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-vid-5',
    titulo: 'Referencia Táctica: Movimientos del 9 por Knutsen',
    competencia: 'Referencia',
    url_youtube: 'https://www.youtube.com/watch?v=m7H0V16Q0S8',
    fecha_registro: '2026-06-10',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-vid-6',
    titulo: 'Referencia Táctica: Estructura Defensiva en Rombo 4-4-2',
    competencia: 'Referencia',
    url_youtube: 'https://www.youtube.com/watch?v=kly6Q29W9S4',
    fecha_registro: '2026-06-05',
    created_at: new Date().toISOString()
  }
];

export default function VideotecaPage() {
  const [role, setRole] = useState<'entrenador' | 'jugador'>('entrenador');
  const [videos, setVideos] = useState<Videoteca[]>([]);
  const [activeVideo, setActiveVideo] = useState<Videoteca | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('videoteca')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) {
        throw error;
      }

      setIsDbConnected(true);
      if (data && data.length > 0) {
        setVideos(data);
      } else {
        // Si la tabla está vacía, mostrar vacío en lugar del fallback
        setVideos([]);
      }
    } catch (err) {
      console.warn("Fallo al conectar con Supabase. Dejando lista vacía:", err);
      setVideos([]);
      setIsDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar rol y videos al montar
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('usuarios')
            .select('nombre, apellidos, rol')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setRole((data as any).rol);
          }
        } else {
          // Fallback con cookies para pruebas locales
          const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
          };
          
          const mockRole = getCookie('mockRole');
          if (mockRole === 'jugador') {
            setRole('jugador');
          } else {
            setRole('entrenador');
          }
        }
      } catch (error) {
        console.error("Error al obtener la sesión de usuario en la videoteca:", error);
      }
    }

    loadUser();
    loadVideos();
  }, [loadVideos]);

  // Filtrar videos basados en selección
  const filteredVideos = videos.filter(video => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'COMPETENCIA') {
      return video.competencia === 'Liga TDP' || 
             video.competencia === 'Copa Conecta' || 
             video.competencia === 'Copa Promesas';
    }
    return video.competencia === selectedFilter;
  });

  // Guardar nuevo video
  const handleSaveVideo = async (newVideoData: { titulo: string; competencia: CompetenciaVideoteca; url_youtube: string; fecha_registro: string }) => {
    try {
      if (isDbConnected) {
        // Intentar guardar en Supabase
        const { data, error } = await supabase
          .from('videoteca')
          .insert([newVideoData] as any)
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          setVideos(prev => [data[0], ...prev]);
        }
      } else {
        // Guardar localmente
        const mockNewVideo: Videoteca = {
          id: `mock-vid-${Date.now()}`,
          titulo: newVideoData.titulo,
          competencia: newVideoData.competencia,
          url_youtube: newVideoData.url_youtube,
          fecha_registro: newVideoData.fecha_registro,
          created_at: new Date().toISOString()
        };
        setVideos(prev => [mockNewVideo, ...prev]);
      }
    } catch (error) {
      console.error("Error guardando video:", error);
      throw new Error("No se pudo guardar el video en la base de datos.");
    }
  };

  // Eliminar video
  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar seleccionar el video para reproducir al hacer clic en eliminar
    
    if (!confirm("¿Estás seguro de que deseas eliminar este video táctico de la videoteca?")) {
      return;
    }

    try {
      if (isDbConnected && !id.startsWith('mock-vid-')) {
        // Eliminar de Supabase
        const { error } = await supabase
          .from('videoteca')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
      
      // Actualizar estado local
      setVideos(prev => prev.filter(v => v.id !== id));
      
      // Si el video eliminado era el activo, limpiar el reproductor
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    } catch (error) {
      console.error("Error eliminando video:", error);
      alert("No se pudo eliminar el video de la base de datos.");
    }
  };

  // Seleccionar video para modo teatro
  const handleSelectVideo = (video: Videoteca) => {
    setActiveVideo(video);
    // Auto scroll suave hacia arriba de la sección de reproducción
    const playerElement = document.getElementById('theater-player-container');
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Colores para las competencias en badges
  const getBadgeStyles = (competencia: CompetenciaVideoteca) => {
    switch (competencia) {
      case 'Liga TDP':
        return 'bg-blue-950/50 text-blue-400 border-blue-500/20';
      case 'Copa Conecta':
        return 'bg-amber-950/50 text-amber-400 border-amber-500/20';
      case 'Copa Promesas':
        return 'bg-purple-950/50 text-purple-400 border-purple-500/20';
      case 'Entrenamiento':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20';
      case 'Referencia':
        return 'bg-rose-950/50 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-950/50 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0b] overflow-y-auto font-sans relative pb-20">
      
      {/* Indicador de conexión a base de datos (Fallback alert) */}
      {!isDbConnected && !loading && (
        <div className="bg-amber-950/40 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-amber-300 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>Ejecutando en <strong>Modo Simulación Local</strong>. Los datos no persistirán en Supabase.</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Cabecera y Presentación */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2.5">
              <Film className="text-primary-500" size={28} />
              <span>Videoteca</span>
            </h1>
          </div>
        </div>

        {/* MODO TEATRO INTEGRADO (Reproductor Principal Superior) */}
        {activeVideo && (
          <div id="theater-player-container" className="w-full shrink-0">
            <div className="bg-[#111424] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 relative">
              
              {/* Botón para cerrar el Modo Teatro y colapsar el reproductor */}
              <button 
                onClick={() => setActiveVideo(null)} 
                className="absolute top-4 right-4 p-1.5 bg-black/40 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer z-10"
                title="Cerrar reproductor"
              >
                <X size={16} />
              </button>

              {/* Contenedor del Iframe con aspect-ratio 16:9 */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black shadow-inner">
                <iframe
                  src={getYoutubeEmbedUrl(activeVideo.url_youtube)}
                  title={activeVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>

              {/* Información del Video Activo */}
              <div className="flex items-start justify-between flex-wrap gap-4 pt-2 pr-8">
                <div className="space-y-1.5 max-w-[80%]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyles(activeVideo.competencia)}`}>
                      {activeVideo.competencia}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      Registrado: {activeVideo.fecha_registro || 'N/A'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                    {activeVideo.titulo}
                  </h2>
                </div>
                
                {role === 'entrenador' && (
                  <a 
                    href={activeVideo.url_youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    Abrir en YouTube
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN INFERIOR: FILTROS Y GRID */}
        <div className="space-y-6">
          
          {/* Barra de Filtro Rápido */}
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {FILTER_OPTIONS.map(opt => {
                const isActive = selectedFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedFilter(opt.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
                      isActive 
                        ? 'bg-transparent text-primary-500 border-primary-500 shadow-[0_0_8px_rgba(212,64,99,0.2)]' 
                        : 'bg-[#111424] border-white/5 hover:border-white/20 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            
            <div className="text-xs font-semibold text-gray-500">
              Mostrando {filteredVideos.length} de {videos.length} videos
            </div>
          </div>

          {/* Grid de Videos */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 mt-3 font-semibold">Cargando videoteca táctica...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20 bg-[#111424]/20 border border-dashed border-white/10 rounded-2xl">
              <AlertCircle size={28} className="mx-auto text-gray-500 mb-2" />
              <h4 className="text-sm font-bold text-gray-300">No se encontraron videos</h4>
              <p className="text-xs text-gray-500 mt-1">
                No hay registros para la competencia seleccionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map(video => {
                const thumbnail = getYoutubeThumbnailUrl(video.url_youtube);
                const isActive = activeVideo?.id === video.id;
                
                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`bg-[#111424] border rounded-xl overflow-hidden flex flex-col transition-all duration-300 group cursor-pointer shadow-md ${
                      isActive 
                        ? 'border-primary-500 shadow-lg shadow-primary-600/10 ring-1 ring-primary-500/20 scale-[1.01]' 
                        : 'border-white/5 hover:border-white/15 hover:scale-[1.01] hover:shadow-xl'
                    }`}
                  >
                    {/* Miniatura de Video */}
                    <div className="relative aspect-video w-full bg-black overflow-hidden border-b border-white/5">
                      <img
                        src={thumbnail}
                        alt={video.titulo}
                        className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                        <div className="bg-primary-600 p-3 rounded-full text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                          <Play size={18} className="fill-current translate-x-0.5" />
                        </div>
                      </div>

                      {/* Badge de Competencia */}
                      <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider shadow-md ${getBadgeStyles(video.competencia)}`}>
                        {video.competencia}
                      </span>

                      {/* Botón Eliminar para Entrenadores */}
                      {role === 'entrenador' && (
                        <button
                          onClick={(e) => handleDeleteVideo(video.id, e)}
                          className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-red-600 border border-white/10 hover:border-red-500 rounded text-gray-400 hover:text-white transition-all shadow-md group-hover:opacity-100 md:opacity-0"
                          title="Eliminar análisis"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* Indicador de Reproducción Activa */}
                      {isActive && (
                        <div className="absolute bottom-3 left-3 bg-primary-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          REPRODUCIENDO
                        </div>
                      )}
                    </div>

                    {/* Información de la tarjeta */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-primary-400 transition-colors">
                        {video.titulo}
                      </h3>
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold border-t border-white/5 pt-2 shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {video.fecha_registro || 'Sin fecha'}
                        </span>
                        <span className="text-primary-500 flex items-center gap-0.5 uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
                          Ver Táctica →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* BOTÓN FLOTANTE: REGISTRAR VIDEO (Solo para Entrenadores) */}
      {role === 'entrenador' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group cursor-pointer z-40 active:scale-95"
          title="Añadir video"
        >
          <div className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <Plus size={24} className="relative z-10" />
        </button>
      )}

      {/* MODAL DE CARGA (Solo para Entrenadores) */}
      {role === 'entrenador' && (
        <AddVideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveVideo}
        />
      )}

    </div>
  );
}
