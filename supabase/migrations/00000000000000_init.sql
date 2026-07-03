-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE rol_usuario AS ENUM ('entrenador', 'jugador');
CREATE TYPE categoria_objetivo AS ENUM ('deportiva', 'tecnica', 'tactica', 'fisica');
CREATE TYPE estado_objetivo AS ENUM ('pendiente', 'en_desarrollo', 'completado');
CREATE TYPE tipo_grafico_seguimiento AS ENUM ('barras', 'lineas', 'contador', 'radar');
CREATE TYPE tipo_recurso AS ENUM ('video', 'pdf', 'imagen', 'slides');
CREATE TYPE competencia_videoteca AS ENUM ('Liga TDP', 'Copa Conecta', 'Copa Promesas', 'Entrenamiento', 'Referencia');

-- 1. Tabla usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY, -- referenciará a auth.users si se usa Supabase Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'jugador',
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla plantilla (perfil deportivo)
CREATE TABLE plantilla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jugador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    equipo VARCHAR(255),
    dorsal INTEGER,
    demarcacion VARCHAR(100),
    pierna_habil VARCHAR(50),
    altura_cm NUMERIC,
    peso_kg NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla objetivos_idp
CREATE TABLE objetivos_idp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jugador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria categoria_objetivo NOT NULL,
    estado estado_objetivo NOT NULL DEFAULT 'pendiente',
    fecha_inicio DATE,
    fecha_fin DATE,
    descripcion_meta TEXT,
    tareas_desarrollo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla seguimiento_acciones
CREATE TABLE seguimiento_acciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objetivo_id UUID NOT NULL REFERENCES objetivos_idp(id) ON DELETE CASCADE,
    tipo_grafico tipo_grafico_seguimiento NOT NULL,
    valor_actual NUMERIC DEFAULT 0,
    valor_meta NUMERIC,
    unidad_medida VARCHAR(50),
    datos_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla recursos_apoyo
CREATE TABLE recursos_apoyo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objetivo_id UUID NOT NULL REFERENCES objetivos_idp(id) ON DELETE CASCADE,
    tipo tipo_recurso NOT NULL,
    url TEXT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla videoteca
CREATE TABLE videoteca (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    competencia competencia_videoteca NOT NULL,
    url_youtube TEXT NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- TRIGGERS
-- =========================================================================

-- Restricción Estricta: jugador_id en objetivos_idp DEBE tener rol 'jugador'
CREATE OR REPLACE FUNCTION check_jugador_role()
RETURNS TRIGGER AS $$
DECLARE
    user_rol rol_usuario;
BEGIN
    SELECT rol INTO user_rol FROM usuarios WHERE id = NEW.jugador_id;
    IF user_rol != 'jugador' THEN
        RAISE EXCEPTION 'El usuario asignado (ID: %) no tiene el rol de jugador. No se pueden generar IDPs para entrenadores.', NEW.jugador_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_jugador_role_on_idp_insert
BEFORE INSERT OR UPDATE ON objetivos_idp
FOR EACH ROW
EXECUTE FUNCTION check_jugador_role();

-- =========================================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- =========================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetivos_idp ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_apoyo ENABLE ROW LEVEL SECURITY;
ALTER TABLE videoteca ENABLE ROW LEVEL SECURITY;

-- Helper func para simplificar políticas (verifica si el auth.uid() es entrenador)
CREATE OR REPLACE FUNCTION is_entrenador()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'entrenador'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Políticas para 'usuarios'
CREATE POLICY "Entrenadores full access usuarios" ON usuarios FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Jugadores select self usuarios" ON usuarios FOR SELECT TO authenticated USING (id = auth.uid() OR is_entrenador());

-- 2. Políticas para 'plantilla'
CREATE POLICY "Entrenadores full access plantilla" ON plantilla FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Jugadores select self plantilla" ON plantilla FOR SELECT TO authenticated USING (jugador_id = auth.uid() OR is_entrenador());

-- 3. Políticas para 'objetivos_idp'
CREATE POLICY "Entrenadores full access objetivos_idp" ON objetivos_idp FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Jugadores select self objetivos_idp" ON objetivos_idp FOR SELECT TO authenticated USING (jugador_id = auth.uid() OR is_entrenador());

-- 4. Políticas para 'seguimiento_acciones'
CREATE POLICY "Entrenadores full access seguimiento_acciones" ON seguimiento_acciones FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Jugadores select self seguimiento_acciones" ON seguimiento_acciones FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM objetivos_idp WHERE id = seguimiento_acciones.objetivo_id AND jugador_id = auth.uid()) OR is_entrenador()
);

-- 5. Políticas para 'recursos_apoyo'
CREATE POLICY "Entrenadores full access recursos_apoyo" ON recursos_apoyo FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Jugadores select self recursos_apoyo" ON recursos_apoyo FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM objetivos_idp WHERE id = recursos_apoyo.objetivo_id AND jugador_id = auth.uid()) OR is_entrenador()
);

-- 6. Políticas para 'videoteca'
CREATE POLICY "Entrenadores full access videoteca" ON videoteca FOR ALL TO authenticated USING (is_entrenador()) WITH CHECK (is_entrenador());
CREATE POLICY "Usuarios autenticados select videoteca" ON videoteca FOR SELECT TO authenticated USING (true);
