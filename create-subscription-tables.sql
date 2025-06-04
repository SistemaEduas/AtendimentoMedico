-- Verificar a estrutura da tabela stripe_customers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stripe_customers';
