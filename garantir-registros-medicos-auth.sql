-- Verificar se a coluna acesso_liberado existe na tabela medicos_auth
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medicos_auth' AND column_name = 'acesso_liberado'
    ) THEN
        -- Adicionar a coluna acesso_liberado se não existir
        ALTER TABLE medicos_auth ADD COLUMN acesso_liberado BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Inserir registros para médicos que não têm entrada na tabela medicos_auth
INSERT INTO medicos_auth (medico_id, instancia_id, acesso_liberado)
SELECT m.id, m.instancia_id, false
FROM medicos m
WHERE NOT EXISTS (
    SELECT 1
    FROM medicos_auth ma
    WHERE ma.medico_id = m.id
);

-- Atualizar registros existentes que não têm a coluna acesso_liberado definida
UPDATE medicos_auth
SET acesso_liberado = false
WHERE acesso_liberado IS NULL;

-- Retornar o número de registros atualizados
SELECT 'Registros atualizados com sucesso' as mensagem;
