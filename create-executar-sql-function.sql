-- Criar uma função para executar SQL diretamente
CREATE OR REPLACE FUNCTION executar_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  resultado JSONB;
  linhas_afetadas INTEGER;
BEGIN
  EXECUTE sql_query;
  GET DIAGNOSTICS linhas_afetadas = ROW_COUNT;
  
  resultado := jsonb_build_object(
    'success', true,
    'count', linhas_afetadas
  );
  
  RETURN resultado;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para a função
GRANT EXECUTE ON FUNCTION executar_sql TO authenticated;
GRANT EXECUTE ON FUNCTION executar_sql TO anon;
GRANT EXECUTE ON FUNCTION executar_sql TO service_role;
