import { Usuario, Plantilla, ObjetivoIDP } from '@/types/database';

export interface PlayerProfile extends Usuario {
  plantilla: Plantilla;
  objetivos: ObjetivoIDP[];
  apellidos?: string | null;
  fotografia?: string | null;
}

export const mockPlayers: PlayerProfile[] = [
  {
    id: 'user-1',
    email: 'maroan@mineros.com',
    nombre: 'Maroan Sannadi',
    rol: 'jugador',
    foto_url: 'https://i.pravatar.cc/150?img=11',
    created_at: new Date().toISOString(),
    plantilla: {
      id: 'p-1',
      jugador_id: 'user-1',
      equipo: 'Athletic Club de Bilbao - Primer Equipo',
      dorsal: 21,
      demarcacion: 'DELANTERO',
      posicion: 'DELANTERO',
      categoria: '2003',
      rol_funcional_primario: 'PROFUNDIDAD',
      rol_funcional_secundario: 'AMPLITUD',
      pierna_habil: 'Derecho',
      altura_cm: 188,
      peso_kg: 82,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    objetivos: [
      {
        id: 'obj-1',
        jugador_id: 'user-1',
        titulo: 'Temporizar llegadas a área',
        categoria: 'tactica',
        estado: 'pendiente',
        fecha_inicio: '2026-06-30',
        fecha_fin: '2026-07-30',
        descripcion_meta: 'Coordinar los desmarques con el centrocampista y retrasar el sprint final 1.5 segundos para evitar caer en fuera de juego y llegar en carrera al segundo palo.',
        tareas_desarrollo: '1. Ejercicios de timing sin balón. 2. Repetición de centros laterales.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'obj-2',
        jugador_id: 'user-1',
        titulo: 'Definición al primer toque con pie izquierdo',
        categoria: 'tecnica',
        estado: 'en_desarrollo',
        fecha_inicio: '2026-06-15',
        fecha_fin: '2026-08-15',
        descripcion_meta: 'Aumentar el porcentaje de acierto de tiros con el pie no hábil dentro del área penal tras recibir centros rasos desde la banda derecha.',
        tareas_desarrollo: '1. Ejercicios de finalización cruzada.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 'user-2',
    email: 'nico@mineros.com',
    nombre: 'Nico Williams',
    rol: 'jugador',
    foto_url: 'https://i.pravatar.cc/150?img=12',
    created_at: new Date().toISOString(),
    plantilla: {
      id: 'p-2',
      jugador_id: 'user-2',
      equipo: 'Athletic Club de Bilbao - Primer Equipo',
      dorsal: 11,
      demarcacion: 'DELANTERO',
      posicion: 'EXTREMO',
      categoria: '2003',
      rol_funcional_primario: 'AMPLITUD',
      rol_funcional_secundario: 'PROFUNDIDAD',
      pierna_habil: 'Derecho',
      altura_cm: 181,
      peso_kg: 67,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    objetivos: [
      {
        id: 'obj-3',
        jugador_id: 'user-2',
        titulo: 'Regate uno contra uno en banda',
        categoria: 'tecnica',
        estado: 'completado',
        fecha_inicio: '2026-05-01',
        fecha_fin: '2026-06-01',
        descripcion_meta: 'Mejorar el índice de éxito en regates 1v1 buscando línea de fondo.',
        tareas_desarrollo: '1. Situaciones de 1v1 con defensa en pasillo.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 'user-3',
    email: 'oihan@mineros.com',
    nombre: 'Oihan Sancet',
    rol: 'jugador',
    foto_url: 'https://i.pravatar.cc/150?img=33',
    created_at: new Date().toISOString(),
    plantilla: {
      id: 'p-3',
      jugador_id: 'user-3',
      equipo: 'Athletic Club de Bilbao - Primer Equipo',
      dorsal: 8,
      demarcacion: 'CENTROCAMPISTA',
      posicion: 'MEDIA PUNTA',
      categoria: '2003',
      rol_funcional_primario: 'CUADRADOS',
      rol_funcional_secundario: null,
      pierna_habil: 'Derecho',
      altura_cm: 188,
      peso_kg: 73,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    objetivos: []
  },
  {
    id: 'user-4',
    email: 'dani@mineros.com',
    nombre: 'Dani Vivian',
    rol: 'jugador',
    foto_url: 'https://i.pravatar.cc/150?img=51',
    created_at: new Date().toISOString(),
    plantilla: {
      id: 'p-4',
      jugador_id: 'user-4',
      equipo: 'Athletic Club de Bilbao - Primer Equipo',
      dorsal: 3,
      demarcacion: 'DEFENSA',
      posicion: 'CENTRAL',
      categoria: '2003',
      rol_funcional_primario: 'INICIO',
      rol_funcional_secundario: 'BASE',
      pierna_habil: 'Derecho',
      altura_cm: 184,
      peso_kg: 79,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    objetivos: []
  },
  {
    id: 'user-5',
    email: 'unai@mineros.com',
    nombre: 'Unai Simón',
    rol: 'jugador',
    foto_url: 'https://i.pravatar.cc/150?img=60',
    created_at: new Date().toISOString(),
    plantilla: {
      id: 'p-5',
      jugador_id: 'user-5',
      equipo: 'Athletic Club de Bilbao - Primer Equipo',
      dorsal: 1,
      demarcacion: 'PORTERO',
      posicion: 'PORTERO',
      categoria: '2003',
      rol_funcional_primario: 'INICIADOR',
      rol_funcional_secundario: 'LATERALIZAR',
      pierna_habil: 'Derecho',
      altura_cm: 190,
      peso_kg: 88,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    objetivos: []
  }
];
