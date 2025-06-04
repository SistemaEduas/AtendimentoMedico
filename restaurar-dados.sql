-- Verificar se a coluna acesso_liberado existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'medicos_auth'
        AND column_name = 'acesso_liberado'
    ) THEN
        ALTER TABLE medicos_auth ADD COLUMN acesso_liberado BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Inserir instâncias de exemplo (apenas se não existirem)
INSERT INTO instancias (nome, usuario, senha, email, ativo, slug)
SELECT 'Clínica Exemplo', 'clinica_exemplo', 'senha123', 'clinica_exemplo@clinica.com', true, 'clinica-exemplo'
WHERE NOT EXISTS (
    SELECT 1 FROM instancias WHERE usuario = 'clinica_exemplo'
);

INSERT INTO instancias (nome, usuario, senha, email, ativo, slug)
SELECT 'Hospital Central', 'hospital_central', 'senha123', 'hospital_central@clinica.com', true, 'hospital-central'
WHERE NOT EXISTS (
    SELECT 1 FROM instancias WHERE usuario = 'hospital_central'
);

-- Inserir médicos de exemplo (apenas se não existirem)
-- Primeiro médico
WITH medico_insert AS (
    INSERT INTO medicos (nome, especialidade, email, crm, telefone)
    SELECT 'Dr. João Silva', 'Cardiologia', 'joao.silva@medico.com', '12345-SP', '(11) 98765-4321'
    WHERE NOT EXISTS (
        SELECT 1 FROM medicos WHERE email = 'joao.silva@medico.com'
    )
    RETURNING id
)
INSERT INTO medicos_auth (email, senha, nome, medico_id, instancia_id)
SELECT 'joao.silva@medico.com', 'senha123', 'Dr. João Silva', m.id, 
    (SELECT id FROM instancias WHERE usuario = 'clinica_exemplo' LIMIT 1)
FROM medico_insert m
WHERE NOT EXISTS (
    SELECT 1 FROM medicos_auth WHERE email = 'joao.silva@medico.com'
);

-- Segundo médico
WITH medico_insert AS (
    INSERT INTO medicos (nome, especialidade, email, crm, telefone)
    SELECT 'Dra. Maria Santos', 'Pediatria', 'maria.santos@medico.com', '54321-SP', '(11) 91234-5678'
    WHERE NOT EXISTS (
        SELECT 1 FROM medicos WHERE email = 'maria.santos@medico.com'
    )
    RETURNING id
)
INSERT INTO medicos_auth (email, senha, nome, medico_id, instancia_id)
SELECT 'maria.santos@medico.com', 'senha123', 'Dra. Maria Santos', m.id, 
    (SELECT id FROM instancias WHERE usuario = 'hospital_central' LIMIT 1)
FROM medico_insert m
WHERE NOT EXISTS (
    SELECT 1 FROM medicos_auth WHERE email = 'maria.santos@medico.com'
);

-- Terceiro médico
WITH medico_insert AS (
    INSERT INTO medicos (nome, especialidade, email, crm, telefone)
    SELECT 'Dr. Carlos Oliveira', 'Ortopedia', 'carlos.oliveira@medico.com', '67890-SP', '(11) 95555-7777'
    WHERE NOT EXISTS (
        SELECT 1 FROM medicos WHERE email = 'carlos.oliveira@medico.com'
    )
    RETURNING id
)
INSERT INTO medicos_auth (email, senha, nome, medico_id, instancia_id)
SELECT 'carlos.oliveira@medico.com', 'senha123', 'Dr. Carlos Oliveira', m.id, 
    (SELECT id FROM instancias WHERE usuario = 'clinica_exemplo' LIMIT 1)
FROM medico_insert m
WHERE NOT EXISTS (
    SELECT 1 FROM medicos_auth WHERE email = 'carlos.oliveira@medico.com'
);
