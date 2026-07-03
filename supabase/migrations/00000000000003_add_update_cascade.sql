-- MIGRACIÓN PARA PERMITIR ACTUALIZACIÓN DEL ID DE USUARIO (VINCULACIÓN MANUAL)

-- 1. Actualizar llave foránea en `plantilla`
ALTER TABLE plantilla DROP CONSTRAINT plantilla_jugador_id_fkey;
ALTER TABLE plantilla ADD CONSTRAINT plantilla_jugador_id_fkey 
    FOREIGN KEY (jugador_id) 
    REFERENCES usuarios(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- 2. Actualizar llave foránea en `objetivos_idp`
ALTER TABLE objetivos_idp DROP CONSTRAINT objetivos_idp_jugador_id_fkey;
ALTER TABLE objetivos_idp ADD CONSTRAINT objetivos_idp_jugador_id_fkey 
    FOREIGN KEY (jugador_id) 
    REFERENCES usuarios(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- (Opcional, pero recomendado por si actualizas objetivos_idp.id manualmente)
ALTER TABLE seguimiento_acciones DROP CONSTRAINT seguimiento_acciones_objetivo_id_fkey;
ALTER TABLE seguimiento_acciones ADD CONSTRAINT seguimiento_acciones_objetivo_id_fkey 
    FOREIGN KEY (objetivo_id) 
    REFERENCES objetivos_idp(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE recursos_apoyo DROP CONSTRAINT recursos_apoyo_objetivo_id_fkey;
ALTER TABLE recursos_apoyo ADD CONSTRAINT recursos_apoyo_objetivo_id_fkey 
    FOREIGN KEY (objetivo_id) 
    REFERENCES objetivos_idp(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
