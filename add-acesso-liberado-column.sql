-- Adicionar coluna acesso_liberado à tabela medicos_auth se ela não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medicos_auth'
        AND column_name = 'acesso_liberado'
    ) THEN
        -- Adicionar a coluna com valor padrão false
        ALTER TABLE medicos_auth ADD COLUMN acesso_liberado BOOLEAN DEFAULT false;
        
        -- Atualizar registros existentes para false
        UPDATE medicos_auth SET acesso_liberado = false;
    END IF;
END $$;
