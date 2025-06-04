-- Verificar se a coluna acesso_liberado existe na tabela medicos_auth
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medicos_auth'
        AND column_name = 'acesso_liberado'
    ) THEN
        -- Adicionar a coluna acesso_liberado se não existir
        ALTER TABLE medicos_auth ADD COLUMN acesso_liberado BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna acesso_liberado adicionada à tabela medicos_auth';
    ELSE
        RAISE NOTICE 'Coluna acesso_liberado já existe na tabela medicos_auth';
    END IF;
END $$;

-- Verificar registros sem a coluna acesso_liberado definida
SELECT id, medico_id, instancia_id, acesso_liberado
FROM medicos_auth
WHERE acesso_liberado IS NULL;

-- Atualizar registros sem a coluna acesso_liberado definida
UPDATE medicos_auth
SET acesso_liberado = false
WHERE acesso_liberado IS NULL;

-- Verificar registros após a atualização
SELECT id, medico_id, instancia_id, acesso_liberado
FROM medicos_auth;

-- Verificar médicos sem registro na tabela medicos_auth
SELECT m.id, m.nome, m.instancia_id
FROM medicos m
LEFT JOIN medicos_auth ma ON m.id = ma.medico_id
WHERE ma.id IS NULL;

-- Inserir registros para médicos que não têm registro na tabela medicos_auth
INSERT INTO medicos_auth (medico_id, instancia_id, acesso_liberado)
SELECT m.id, m.instancia_id, false
FROM medicos m
LEFT JOIN medicos_auth ma ON m.id = ma.medico_id
WHERE ma.id IS NULL;

-- Verificar registros após a inserção
SELECT id, medico_id, instancia_id, acesso_liberado
FROM medicos_auth;
