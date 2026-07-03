"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { X, Video, Calendar, Link2, AlertTriangle } from 'lucide-react';
import { CompetenciaVideoteca } from '@/types/database';
import { isValidYoutubeUrl, getYoutubeThumbnailUrl } from '@/lib/youtube';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (video: { titulo: string; competencia: CompetenciaVideoteca; url_youtube: string; fecha_registro: string }) => Promise<void>;
}

export default function AddVideoModal({ isOpen, onClose, onSave }: AddVideoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [competencia, setCompetencia] = useState<CompetenciaVideoteca>('Liga TDP');
  const [urlYoutube, setUrlYoutube] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar fecha actual por defecto al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setFechaRegistro(today);
      setTitulo('');
      setUrlYoutube('');
      setCompetencia('Liga TDP');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) {
      setError('Por favor, introduce un título para el video.');
      return;
    }

    if (!urlYoutube.trim()) {
      setError('Por favor, introduce la URL del video de YouTube.');
      return;
    }

    if (!isValidYoutubeUrl(urlYoutube)) {
      setError('Por favor, introduce una URL de YouTube válida (ej: https://www.youtube.com/watch?v=...).');
      return;
    }

    if (!fechaRegistro) {
      setError('Por favor, selecciona una fecha.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        titulo: titulo.trim(),
        competencia,
        url_youtube: urlYoutube.trim(),
        fecha_registro: fechaRegistro
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el video. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isUrlValid = urlYoutube.trim() !== '' && isValidYoutubeUrl(urlYoutube);
  const videoThumbnail = isUrlValid ? getYoutubeThumbnailUrl(urlYoutube) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
      <div className="bg-[#111424] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d0f1c]">
          <div className="flex items-center gap-2 text-white">
            <Video className="text-primary-500" size={20} />
            <h2 className="text-lg font-bold tracking-tight uppercase">Registrar Nuevo Video Táctico</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0a0c16]/50">
          
          {/* Mensaje de Error */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-lg flex items-start gap-2 animate-pulse">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Input: Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Título del Video
            </label>
            <input
              type="text"
              placeholder="Ej. Análisis Bloque Bajo - Jornada 5"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#1c2136] border border-white/10 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all font-sans"
              required
            />
          </div>

          {/* Select: Competencia */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Competencia
            </label>
            <select
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value as CompetenciaVideoteca)}
              className="w-full bg-[#1c2136] border border-white/10 rounded-lg py-2.5 px-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            >
              <option value="Liga TDP">Liga TDP</option>
              <option value="Copa Conecta">Copa Conecta</option>
              <option value="Copa Promesas">Copa Promesas</option>
              <option value="Entrenamiento">Entrenamiento</option>
              <option value="Referencia">Referencia</option>
            </select>
          </div>

          {/* Input: URL de YouTube */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              URL de YouTube
            </label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={urlYoutube}
                onChange={(e) => setUrlYoutube(e.target.value)}
                className="w-full bg-[#1c2136] border border-white/10 rounded-lg py-2.5 pl-9 pr-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Vista previa de miniatura en vivo (Premium UX Feature) */}
          {isUrlValid && videoThumbnail && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Vista Previa de Miniatura</span>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/15 bg-black">
                <img 
                  src={videoThumbnail} 
                  alt="Vista previa" 
                  className="w-full h-full object-cover object-center scale-102 hover:scale-100 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-xs text-white font-semibold truncate bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                    {titulo || 'Video Detectado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Input: Fecha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Fecha de Registro
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="date"
                value={fechaRegistro}
                onChange={(e) => setFechaRegistro(e.target.value)}
                className="w-full bg-[#1c2136] border border-white/10 rounded-lg py-2.5 pl-9 pr-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Footer del Formulario */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-500 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] font-bold py-2 px-5 text-sm rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-primary-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : 'Registrar Video'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
