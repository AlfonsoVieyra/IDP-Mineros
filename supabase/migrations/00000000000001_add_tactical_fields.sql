-- 1. Agregar campo 'apellidos' a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255);

-- 2. Agregar nuevos campos tácticos a la tabla plantilla
ALTER TABLE plantilla ADD COLUMN IF NOT EXISTS posicion VARCHAR(100);
ALTER TABLE plantilla ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE plantilla ADD COLUMN IF NOT EXISTS rol_funcional_primario VARCHAR(100);
ALTER TABLE plantilla ADD COLUMN IF NOT EXISTS rol_funcional_secundario VARCHAR(100);
