-- =========================================================================
-- MIGRACIÓN: AGREGAR HISTORIAL DE EVALUACIONES
-- =========================================================================

-- Agregamos la columna para el historial de evaluaciones (en formato JSON)
ALTER TABLE objetivos_idp
ADD COLUMN IF NOT EXISTS historial_evaluaciones TEXT;
