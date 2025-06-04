-- Verificar se a tabela stripe_customers existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'stripe_customers'
);

-- Verificar a estrutura da tabela stripe_customers se ela existir
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stripe_customers';
