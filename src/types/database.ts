export type RolUsuario = 'entrenador' | 'jugador';
export type CategoriaObjetivo = 'deportiva' | 'tecnica' | 'tactica' | 'fisica';
export type EstadoObjetivo = 'pendiente' | 'en_desarrollo' | 'completado';
export type TipoGraficoSeguimiento = 'barras' | 'lineas' | 'contador' | 'radar';
export type TipoRecurso = 'video' | 'pdf' | 'imagen' | 'slides';
export type CompetenciaVideoteca = 'Liga TDP' | 'Copa Conecta' | 'Copa Promesas' | 'Entrenamiento' | 'Referencia' | 'Amistoso';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string | null;
  rol: RolUsuario;
  foto_url: string | null;
  created_at: string;
}

export interface Plantilla {
  id: string;
  jugador_id: string;
  equipo: string | null;
  dorsal: number | null;
  demarcacion: string | null;
  posicion: string | null;
  categoria: string | null;
  rol_funcional_primario: string | null;
  rol_funcional_secundario: string | null;
  pierna_habil: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface ObjetivoIDP {
  id: string;
  jugador_id: string;
  titulo: string;
  categoria: CategoriaObjetivo;
  estado: EstadoObjetivo;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  descripcion_meta: string | null;
  tareas_desarrollo: string | null;
  proposito?: string | null;
  fase?: string | null;
  plan_accion?: string | null;
  nota_evaluacion?: number | null;
  feedback_evaluacion?: string | null;
  historial_evaluaciones?: string | null;
  recursos_apoyo?: RecursoApoyo[];
  created_at: string;
  updated_at: string;
}

export interface SeguimientoAcciones {
  id: string;
  objetivo_id: string;
  tipo_grafico: TipoGraficoSeguimiento;
  valor_actual: number;
  valor_meta: number | null;
  unidad_medida: string | null;
  datos_json: Record<string, unknown> | null; // idealmente definir una interfaz más estricta si se conoce la estructura
  created_at: string;
  updated_at: string;
}

export interface RecursoApoyo {
  id: string;
  objetivo_id: string;
  tipo: TipoRecurso;
  url: string;
  titulo: string;
  created_at: string;
}

export interface Videoteca {
  id: string;
  titulo: string;
  competencia: CompetenciaVideoteca;
  url_youtube: string;
  fecha_registro: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: Usuario;
        Insert: Omit<Usuario, 'created_at'> & { created_at?: string };
        Update: Partial<Usuario>;
      };
      plantilla: {
        Row: Plantilla;
        Insert: Omit<Plantilla, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Plantilla>;
      };
      objetivos_idp: {
        Row: Omit<ObjetivoIDP, 'recursos_apoyo'>;
        Insert: Omit<ObjetivoIDP, 'id' | 'created_at' | 'updated_at' | 'recursos_apoyo'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<ObjetivoIDP, 'recursos_apoyo'>>;
      };
      seguimiento_acciones: {
        Row: SeguimientoAcciones;
        Insert: Omit<SeguimientoAcciones, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<SeguimientoAcciones>;
      };
      recursos_apoyo: {
        Row: RecursoApoyo;
        Insert: Omit<RecursoApoyo, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<RecursoApoyo>;
      };
      videoteca: {
        Row: Videoteca;
        Insert: Omit<Videoteca, 'id' | 'created_at' | 'fecha_registro'> & { id?: string; created_at?: string; fecha_registro?: string | null };
        Update: Partial<Videoteca>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      rol_usuario: RolUsuario;
      categoria_objetivo: CategoriaObjetivo;
      estado_objetivo: EstadoObjetivo;
      tipo_grafico_seguimiento: TipoGraficoSeguimiento;
      tipo_recurso: TipoRecurso;
      competencia_videoteca: CompetenciaVideoteca;
    };
  };
}
