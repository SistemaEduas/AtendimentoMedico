-- Verifica se a coluna acesso_liberado existe na tabela medicos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medicos'
        AND column_name = 'acesso_liberado'
    ) THEN
        -- Adiciona a coluna acesso_liberado se não existir
        ALTER TABLE medicos ADD COLUMN acesso_liberado BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
