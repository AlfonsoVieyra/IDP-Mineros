-- =========================================================================
-- MIGRACIÓN: AGREGAR COLUMNAS FALTANTES A OBJETIVOS IDP
-- =========================================================================

-- Agregamos las columnas para el formulario extendido de objetivos y las evaluaciones
ALTER TABLE objetivos_idp
ADD COLUMN IF NOT EXISTS proposito VARCHAR(50) DEFAULT 'MEJORAR',
ADD COLUMN IF NOT EXISTS fase VARCHAR(50) DEFAULT 'EN CURSO',
ADD COLUMN IF NOT EXISTS plan_accion TEXT,
ADD COLUMN IF NOT EXISTS nota_evaluacion INTEGER,
ADD COLUMN IF NOT EXISTS feedback_evaluacion TEXT;
