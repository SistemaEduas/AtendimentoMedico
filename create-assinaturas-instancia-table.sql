-- Criar tabela de assinaturas de instância se não existir
CREATE TABLE IF NOT EXISTS assinaturas_instancia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instancia_id UUID NOT NULL REFERENCES instancias(id),
  customer_id TEXT,
  subscription_id TEXT,
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  last_4 TEXT,
  amount INTEGER,
  currency TEXT,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_assinaturas_instancia_instancia_id ON assinaturas_instancia(instancia_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_instancia_status ON assinaturas_instancia(status);
