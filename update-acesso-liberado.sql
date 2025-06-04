-- Criar uma função para atualizar o acesso_liberado
CREATE OR REPLACE FUNCTION atualizar_acesso_liberado(medico_id_param UUID, novo_estado BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  resultado BOOLEAN;
BEGIN
  -- Atualizar o registro
  UPDATE medicos_auth 
  SET acesso_liberado = novo_estado 
  WHERE id = medico_id_param;
  
  -- Verificar se a atualização foi bem-sucedida
  SELECT acesso_liberado INTO resultado 
  FROM medicos_auth 
  WHERE id = medico_id_param;
  
  -- Retornar o valor atual após a atualização
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;
