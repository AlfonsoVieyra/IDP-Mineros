import { useState, useEffect } from 'react';
import { X, User, Shield, Activity, Calendar, FileText, Trash2 } from 'lucide-react';
import { PlayerProfile, mockPlayers } from '@/lib/mock-data';
import { Plantilla } from '@/types/database';

interface NewPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PlayerProfile | null;
}

export default function NewPlayerModal({ isOpen, onClose, initialData }: NewPlayerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    fotografia: '',
    demarcacion: 'PORTERO',
    posicion: 'Portero',
    categoria: '2005',
    rol_funcional_primario: 'Inicio',
    rol_funcional_secundario: 'Base',
    pierna_habil: 'Diestro',
    altura_cm: '180',
    peso_kg: '75',
    dorsal: '1',
    equipo: 'TDP',
  });

  // Cuando initialData cambie o el modal se abra, poblamos el estado
  useEffect(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        apellidos: initialData.apellidos || '',
        fotografia: initialData.fotografia || '',
        demarcacion: initialData.plantilla?.demarcacion || 'PORTERO',
        posicion: initialData.plantilla?.posicion || 'Portero',
        categoria: initialData.plantilla?.categoria || '2005',
        rol_funcional_primario: initialData.plantilla?.rol_funcional_primario || 'Inicio',
        rol_funcional_secundario: initialData.plantilla?.rol_funcional_secundario || 'Base',
        pierna_habil: initialData.plantilla?.pierna_habil || 'Diestro',
        altura_cm: initialData.plantilla?.altura_cm?.toString() || '180',
        peso_kg: initialData.plantilla?.peso_kg?.toString() || '75',
        dorsal: initialData.plantilla?.dorsal?.toString() || '1',
        equipo: initialData.plantilla?.equipo || 'TDP',
      });
      if (initialData.fotografia) {
        setPreviewUrl(initialData.fotografia);
      }
    } else {
      // Reseteamos al abrir para un nuevo jugador
      setFormData({
        nombre: '',
        apellidos: '',
        fotografia: '',
        demarcacion: 'PORTERO',
        posicion: 'Portero',
        categoria: '2005',
        rol_funcional_primario: 'Inicio',
        rol_funcional_secundario: 'Base',
        pierna_habil: 'Diestro',
        altura_cm: '180',
        peso_kg: '75',
        dorsal: '1',
        equipo: 'TDP',
      });
    }
  }, [initialData, isOpen]);

  // Efecto para bloquear scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleDelete = async () => {
    if (!initialData || !window.confirm('¿Estás seguro de que deseas eliminar este jugador? Esta acción no se puede deshacer.')) return;
    
    setIsSubmitting(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      // Usar Supabase para borrar el jugador en la tabla usuarios. 
      // Por cascade delete configurado en la base de datos, se borran sus datos de plantilla y objetivos.
      const { error } = await (supabase.from('usuarios') as any).delete().eq('id', initialData.id);
      if (error) throw error;
      
      onClose();
      // Recargar la página para ver el cambio
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar jugador');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      let finalFotoUrl = formData.fotografia;
      const playerId = initialData ? initialData.id : crypto.randomUUID();

      // Si hay un archivo seleccionado, subirlo a Storage primero
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${playerId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalFotoUrl = publicUrl;
      }
      
      if (initialData) {
        // UPDATE MODE
        const { error: userError } = await (supabase
          .from('usuarios') as any)
          .update({
            nombre: formData.nombre,
            apellidos: formData.apellidos,
            foto_url: finalFotoUrl || null
          })
          .eq('id', playerId);
          
        if (userError) throw userError;

        const { error: plantillaError } = await (supabase
          .from('plantilla') as any)
          .update({
            equipo: formData.equipo,
            dorsal: parseInt(formData.dorsal) || 0,
            demarcacion: formData.demarcacion,
            posicion: formData.posicion,
            categoria: formData.categoria,
            rol_funcional_primario: formData.rol_funcional_primario,
            rol_funcional_secundario: formData.rol_funcional_secundario || null,
            pierna_habil: formData.pierna_habil,
            altura_cm: parseInt(formData.altura_cm) || 0,
            peso_kg: parseInt(formData.peso_kg) || 0
          })
          .eq('jugador_id', initialData.id);

        if (plantillaError) throw plantillaError;
        alert('¡Jugador actualizado exitosamente!');

      } else {
        // INSERT MODE
        const emailFalso = `${formData.nombre.toLowerCase().replace(/\s+/g, '')}.${formData.apellidos.toLowerCase().replace(/\s+/g, '')}@mineros.test`;
        
        const { error: userError } = await (supabase
          .from('usuarios') as any)
          .insert({
            id: playerId,
            email: emailFalso,
            nombre: formData.nombre,
            apellidos: formData.apellidos,
            rol: 'jugador',
            foto_url: finalFotoUrl || `https://i.pravatar.cc/150?u=${playerId}`
          });
          
        if (userError) throw userError;

        const { error: plantillaError } = await (supabase
          .from('plantilla') as any)
          .insert({
            jugador_id: playerId,
            equipo: formData.equipo,
            dorsal: parseInt(formData.dorsal) || 0,
            demarcacion: formData.demarcacion,
            posicion: formData.posicion,
            categoria: formData.categoria,
            rol_funcional_primario: formData.rol_funcional_primario,
            rol_funcional_secundario: formData.rol_funcional_secundario || null,
            pierna_habil: formData.pierna_habil,
            altura_cm: parseInt(formData.altura_cm) || 0,
            peso_kg: parseInt(formData.peso_kg) || 0
          });

        if (plantillaError) throw plantillaError;
        alert('¡Jugador guardado exitosamente en Supabase!');
      }

      onClose();
      window.location.reload();
      
    } catch (error) {
      console.error('Error guardando jugador en Supabase:', error);
      alert('Error guardando en Supabase. Revisa la consola y asegúrate de que desactivaste las políticas RLS o ejecutaste el seed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0a0a0b]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#111424] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-border-accent/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="relative shrink-0 border-b border-gray-100 dark:border-border-accent/30 p-6 flex items-center justify-between bg-gray-50/50 dark:bg-white/5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Editar Jugador' : 'Registrar Nuevo Jugador'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {initialData ? 'Modificar la información de la ficha del jugador' : 'Añadir un integrante a la plantilla de IDP Mineros'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* SECCIÓN: Datos Personales */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-sm">
              <FileText size={16} />
              <h3>Datos Personales</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Nombre(s)</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                  placeholder="Ej. Alfonso"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Apellidos</label>
                <input 
                  type="text" 
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                  placeholder="Ej. Vieyra"
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-4">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Fotografía del Jugador (Opcional)</label>
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-border-accent/30 shrink-0" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN: Perfil Táctico */}
          <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-sm">
              <Shield size={16} />
              <h3>Perfil Táctico</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Demarcación (General)</label>
                <select 
                  name="demarcacion"
                  value={formData.demarcacion}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="PORTERO">Portero</option>
                  <option value="DEFENSA">Defensa</option>
                  <option value="CENTROCAMPISTA">Centrocampista</option>
                  <option value="DELANTERO">Delantero</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Posición Específica</label>
                <select 
                  name="posicion"
                  value={formData.posicion}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="Portero">Portero</option>
                  <option value="Central">Central</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Pivote">Pivote</option>
                  <option value="Interior">Interior</option>
                  <option value="Media punta">Media punta</option>
                  <option value="Extremo">Extremo</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Categoría</label>
                <input 
                  type="text" 
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                  placeholder="Ej. 2005"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Rol Primario</label>
                <select 
                  name="rol_funcional_primario"
                  value={formData.rol_funcional_primario}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="Inicio">Inicio</option>
                  <option value="Base">Base</option>
                  <option value="Cuadrados">Cuadrados</option>
                  <option value="Amplitud">Amplitud</option>
                  <option value="Profundidad">Profundidad</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Rol Secundario</label>
                <select 
                  name="rol_funcional_secundario"
                  value={formData.rol_funcional_secundario}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="">- Ninguno -</option>
                  <option value="Inicio">Inicio</option>
                  <option value="Base">Base</option>
                  <option value="Cuadrados">Cuadrados</option>
                  <option value="Amplitud">Amplitud</option>
                  <option value="Profundidad">Profundidad</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Pie Hábil</label>
                <select 
                  name="pierna_habil"
                  value={formData.pierna_habil}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="Diestro">Diestro</option>
                  <option value="Zurdo">Zurdo</option>
                  <option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECCIÓN: Datos Físicos e Información */}
          <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-sm">
              <Activity size={16} />
              <h3>Datos Físicos y Detalles</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Altura (cm)</label>
                <input 
                  type="number" 
                  name="altura_cm"
                  value={formData.altura_cm}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Peso (kg)</label>
                <input 
                  type="number" 
                  name="peso_kg"
                  value={formData.peso_kg}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Dorsal</label>
                <input 
                  type="number" 
                  name="dorsal"
                  value={formData.dorsal}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Equipo</label>
                <select 
                  name="equipo"
                  value={formData.equipo}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-background border border-gray-200 dark:border-border-accent/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white"
                >
                  <option value="TDP">TDP</option>
                  <option value="Premier">Premier</option>
                  <option value="Sub-16">Sub-16</option>
                  <option value="Sub-13">Sub-13</option>
                </select>
              </div>
            </div>
          </section>

        </div>

        {/* Footer del Modal (Botones) */}
        <div className="shrink-0 p-6 border-t border-gray-100 dark:border-border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/5 rounded-b-2xl">
          <div className="w-full sm:w-auto">
            {initialData && (
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-500 hover:text-red-600 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start"
              >
                <Trash2 size={16} /> ELIMINAR JUGADOR
              </button>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-bold text-sm bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
            >
              CANCELAR
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting || !formData.nombre || !formData.apellidos}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-primary-700 hover:bg-primary-600 text-white border-2 border-transparent dark:bg-transparent dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-600 dark:hover:text-white dark:shadow-[0_0_10px_rgba(212,64,99,0.3)] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? 'GUARDANDO...' : 'GUARDAR JUGADOR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
