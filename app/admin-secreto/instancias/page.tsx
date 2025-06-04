"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { PlusCircle, Trash2, LinkIcon, Copy, Check, RefreshCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleSwitch } from "@/components/toggle-switch"

export default function AdminInstanciasPage() {
  // Inicializar o cliente Supabase com as variáveis de ambiente explicitamente
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Adicione logo após a inicialização do supabase
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Variáveis de ambiente do Supabase não encontradas")
      toast({
        title: "Erro de configuração",
        description: "As variáveis de ambiente do Supabase não estão configuradas corretamente.",
        variant: "destructive",
      })
    }
  }, [])

  const [isLoading, setIsLoading] = useState(true)
  const [instancias, setInstancias] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    usuario: "",
    senha: "",
    confirmarSenha: "",
    slug: "",
  })
  const [medicoFormData, setMedicoFormData] = useState({
    usuario: "",
    senha: "",
    confirmarSenha: "",
    nome: "",
    especialidade: "",
    crm: "",
  })
  const [instanciaParaExcluir, setInstanciaParaExcluir] = useState<string | null>(null)
  const [excluindoInstancia, setExcluindoInstancia] = useState(false)
  const [medicoSelecionado, setMedicoSelecionado] = useState<string>("")
  const [instanciaSelecionada, setInstanciaSelecionada] = useState<string>("")
  const [vinculandoMedico, setVinculandoMedico] = useState(false)
  const [authParaExcluir, setAuthParaExcluir] = useState<string | null>(null)
  const [excluindoAuth, setExcluindoAuth] = useState(false)
  const [ativandoAcesso, setAtivandoAcesso] = useState<Record<string, boolean>>({})
  const [colunaAcessoExiste, setColunaAcessoExiste] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  // SQL para adicionar a coluna acesso_liberado
  const sqlAdicionarColuna = "ALTER TABLE medicos_auth ADD COLUMN IF NOT EXISTS acesso_liberado BOOLEAN DEFAULT false;"

  // Função para adicionar logs de depuração
  const addLog = (message: string) => {
    console.log(`[LOG] ${message}`)
  }

  // Adicionar esta função após as declarações de estado
  const gerarSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remover caracteres especiais
      .replace(/\s+/g, "-") // Substituir espaços por hífens
      .replace(/-+/g, "-") // Remover hífens duplicados
      .trim()
  }

  // Função para copiar o SQL para a área de transferência
  const copiarSQL = () => {
    navigator.clipboard.writeText(sqlAdicionarColuna)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Verificar se a coluna acesso_liberado existe
  const verificarColunaAcesso = useCallback(async () => {
    try {
      addLog("Verificando se a coluna acesso_liberado existe...")

      // Executar uma consulta que tentará usar a coluna
      const { error } = await supabase.from("medicos_auth").select("acesso_liberado").limit(1)

      // Se não houver erro, a coluna existe
      if (!error || !error.message.includes("does not exist")) {
        setColunaAcessoExiste(true)
        addLog("✅ Coluna acesso_liberado existe")
        return true
      } else {
        setColunaAcessoExiste(false)
        addLog("❌ Coluna acesso_liberado NÃO existe")
        return false
      }
    } catch (error) {
      console.error("Erro ao verificar coluna:", error)
      setColunaAcessoExiste(false)
      return false
    }
  }, [supabase])

  // Função para criar a coluna acesso_liberado
  const criarColunaAcessoLiberado = async () => {
    try {
      addLog("Criando coluna acesso_liberado...")

      // Usar o método REST para executar SQL diretamente
      const response = await fetch("/api/executar-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: sqlAdicionarColuna }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar coluna")
      }

      addLog("✅ Coluna criada com sucesso")
      toast({
        title: "Coluna criada com sucesso",
        description: "A coluna acesso_liberado foi adicionada à tabela medicos_auth.",
      })

      // Atualizar o estado e recarregar dados
      await verificarColunaAcesso()
      await carregarDados()
    } catch (error: any) {
      console.error("Erro ao criar coluna:", error)
      toast({
        title: "Erro ao criar coluna",
        description: error.message || "Ocorreu um erro ao criar a coluna. Execute o SQL manualmente.",
        variant: "destructive",
      })
    }
  }

  // Carregar dados do banco de dados
  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    addLog("Carregando dados...")

    try {
      // Verificar se a coluna existe primeiro
      const colunaExiste = await verificarColunaAcesso()

      // Carregar instâncias
      const { data: instanciasData, error: instanciasError } = await supabase
        .from("instancias")
        .select(`*`)
        .order("criado_em", { ascending: false })

      if (instanciasError) {
        console.error("Erro ao carregar instâncias:", instanciasError)
        throw instanciasError
      }

      // Carregar médicos
      let query = supabase.from("medicos_auth").select(`
          id,
          nome,
          email,
          medico_id,
          instancia_id,
          medicos (nome, especialidade, crm)
        `)

      // Adicionar acesso_liberado à consulta se a coluna existir
      if (colunaExiste) {
        query = supabase.from("medicos_auth").select(`
            id,
            nome,
            email,
            medico_id,
            instancia_id,
            acesso_liberado,
            medicos (nome, especialidade, crm)
          `)
      }

      const { data: medicosData, error: medicosError } = await query.order("nome", { ascending: true })

      if (medicosError) {
        console.error("Erro ao carregar médicos:", medicosError)
        throw medicosError
      }

      // Processar médicos
      const medicosProcessados = await Promise.all(
        (medicosData || []).map(async (medico) => {
          // Verificar se existe assinatura ativa para este médico
          const { data: assinatura } = await supabase
            .from("assinaturas")
            .select("*")
            .eq("medico_id", medico.medico_id)
            .eq("status", "active")
            .maybeSingle()

          const temAssinatura = !!assinatura

          // Garantir que acesso_liberado seja um booleano
          const acessoLiberado = colunaExiste ? !!medico.acesso_liberado : false

          if (acessoLiberado) {
            addLog(`Médico ${medico.nome} (ID: ${medico.id}) tem acesso liberado = ${acessoLiberado}`)
          }

          return {
            ...medico,
            acesso_liberado: acessoLiberado,
            tem_assinatura: temAssinatura,
          }
        }),
      )

      // Processar instâncias
      const instanciasProcessadas = await Promise.all(
        (instanciasData || []).map(async (instancia) => {
          // Verificar se a instância tem assinatura
          const { data: assinaturaInstancia } = await supabase
            .from("assinaturas_instancia")
            .select("*")
            .eq("instancia_id", instancia.id)
            .eq("status", "active")
            .maybeSingle()

          const temAssinatura = !!assinaturaInstancia
          const assinaturaVia = assinaturaInstancia ? "instância" : null

          // Verificar se algum médico da instância tem acesso liberado
          let temAcessoLiberado = false
          if (colunaExiste) {
            const { data: medicosComAcesso } = await supabase
              .from("medicos_auth")
              .select("id")
              .eq("instancia_id", instancia.id)
              .eq("acesso_liberado", true)
              .limit(1)

            temAcessoLiberado = medicosComAcesso && medicosComAcesso.length > 0
          }

          return {
            ...instancia,
            tem_assinatura: temAssinatura,
            assinatura_via: assinaturaVia,
            acesso_liberado: temAcessoLiberado,
          }
        }),
      )

      setMedicos(medicosProcessados || [])
      setInstancias(instanciasProcessadas || [])
      addLog("✅ Dados carregados com sucesso")
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, verificarColunaAcesso])

  // Função para atualizar o acesso de um médico
  const alterarAcessoSemAssinatura = async (medicoId: string, novoEstado: boolean) => {
    // Marcar este médico específico como em processo de atualização
    setAtivandoAcesso((prev) => ({ ...prev, [medicoId]: true }))

    try {
      addLog(`Alterando acesso do médico ${medicoId} para ${novoEstado}`)

      // Verificar se a coluna existe
      if (!colunaAcessoExiste) {
        toast({
          title: "Coluna não existe",
          description: "A coluna 'acesso_liberado' não existe na tabela medicos_auth. Execute o SQL para adicioná-la.",
          variant: "destructive",
        })
        return
      }

      // Obter informações do médico
      const { data: medicoInfo, error: medicoError } = await supabase
        .from("medicos_auth")
        .select("nome, instancia_id, medico_id")
        .eq("id", medicoId)
        .single()

      if (medicoError) {
        throw new Error("Erro ao obter informações do médico")
      }

      if (!medicoInfo.instancia_id) {
        toast({
          title: "Erro",
          description: "Este médico não está vinculado a nenhuma instância",
          variant: "destructive",
        })
        return
      }

      // NOVO: Verificar se o médico tem assinatura ativa
      if (!novoEstado) {
        const { data: assinatura } = await supabase
          .from("assinaturas")
          .select("*")
          .eq("medico_id", medicoInfo.medico_id)
          .eq("status", "active")
          .maybeSingle()

        if (assinatura) {
          toast({
            title: "Não é possível revogar o acesso",
            description: "Este médico tem uma assinatura ativa. O acesso não pode ser revogado manualmente.",
            variant: "destructive",
          })
          return
        }
      }

      // Atualizar o acesso do médico usando o método update padrão do Supabase
      const { error: updateError } = await supabase
        .from("medicos_auth")
        .update({ acesso_liberado: novoEstado })
        .eq("id", medicoId)

      if (updateError) {
        throw updateError
      }

      // Verificar se a atualização foi bem-sucedida
      const { data: verificacao, error: erroVerificacao } = await supabase
        .from("medicos_auth")
        .select("acesso_liberado")
        .eq("id", medicoId)
        .single()

      if (erroVerificacao) {
        throw new Error("Erro ao verificar a atualização")
      }

      const acessoAtualizado = verificacao.acesso_liberado

      if (acessoAtualizado !== novoEstado) {
        throw new Error(`A atualização não foi aplicada corretamente. Valor atual: ${acessoAtualizado}`)
      }

      addLog(`✅ Acesso do médico ${medicoInfo.nome} alterado para ${novoEstado}`)

      // Atualizar o estado local do médico específico
      setMedicos((prevMedicos) =>
        prevMedicos.map((medico) => (medico.id === medicoId ? { ...medico, acesso_liberado: novoEstado } : medico)),
      )

      toast({
        title: novoEstado ? "Acesso liberado com sucesso" : "Acesso revogado com sucesso",
        description: novoEstado
          ? `O médico ${medicoInfo.nome} agora pode acessar o sistema sem assinatura`
          : `O médico ${medicoInfo.nome} agora precisará de uma assinatura para acessar o sistema`,
      })
    } catch (error: any) {
      console.error("Erro ao alterar acesso:", error)
      toast({
        title: "Erro ao alterar acesso",
        description: error.message || "Ocorreu um erro ao alterar o acesso.",
        variant: "destructive",
      })

      // Recarregar dados para garantir consistência
      await carregarDados()
    } finally {
      // Remover o estado de atualização para este médico
      setAtivandoAcesso((prev) => {
        const newState = { ...prev }
        delete newState[medicoId]
        return newState
      })
    }
  }

  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Função para forçar atualização dos dados
  const forcarAtualizacao = async () => {
    setAtualizando(true)
    await carregarDados()
    setAtualizando(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      // Se o campo sendo alterado for o nome, gerar um slug automaticamente
      if (name === "nome") {
        return { ...prev, [name]: value, slug: gerarSlug(value) }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleMedicoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMedicoFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validações
      if (!formData.nome || !formData.usuario || !formData.senha) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos")
      }

      if (formData.senha !== formData.confirmarSenha) {
        throw new Error("As senhas não coincidem")
      }

      // Verificar se já existe instância com este usuario
      const { data: existingInstancia } = await supabase
        .from("instancias")
        .select("id")
        .eq("usuario", formData.usuario)
        .maybeSingle()

      if (existingInstancia) {
        throw new Error("Já existe uma instância com este nome de usuário")
      }

      // Gerar um email automático baseado no nome de usuário
      const emailAutomatico = `${formData.usuario}@clinica.com`

      // Criar a instância
      const { data: instanciaData, error: instanciaError } = await supabase
        .from("instancias")
        .insert([
          {
            nome: formData.nome,
            usuario: formData.usuario,
            senha: formData.senha,
            slug: formData.slug, // Incluindo o slug
            email: emailAutomatico, // Usando o email gerado automaticamente
            ativo: true,
          },
        ])
        .select()

      if (instanciaError) {
        throw instanciaError
      }

      toast({
        title: "Instância criada com sucesso",
      })

      // Limpar formulário
      setFormData({
        nome: "",
        usuario: "",
        senha: "",
        confirmarSenha: "",
        slug: "",
      })

      // Recarregar dados
      await carregarDados()
    } catch (error: any) {
      console.error("Erro completo:", error)
      toast({
        title: "Erro ao criar instância",
        description: error.message || "Ocorreu um erro ao criar a instância.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMedicoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validações
      if (
        !medicoFormData.usuario ||
        !medicoFormData.senha ||
        !medicoFormData.nome ||
        !medicoFormData.especialidade ||
        !medicoFormData.crm
      ) {
        throw new Error("Todos os campos são obrigatórios")
      }

      if (medicoFormData.senha !== medicoFormData.confirmarSenha) {
        throw new Error("As senhas não coincidem")
      }

      // Verificar se já existe autenticação com este usuário
      const { data: existingAuth } = await supabase
        .from("medicos_auth")
        .select("id")
        .eq("email", medicoFormData.usuario)
        .single()

      if (existingAuth) {
        throw new Error("Este usuário já está em uso")
      }

      // Criar o médico primeiro, incluindo o email e CRM
      const { data: medicoData, error: medicoError } = await supabase
        .from("medicos")
        .insert([
          {
            nome: medicoFormData.nome,
            especialidade: medicoFormData.especialidade,
            email: medicoFormData.usuario,
            crm: medicoFormData.crm,
            telefone: "",
          },
        ])
        .select()

      if (medicoError) {
        console.error("Erro ao criar médico:", medicoError)
        throw new Error(`Erro ao criar médico: ${medicoError.message}`)
      }

      if (!medicoData || medicoData.length === 0) {
        throw new Error("Erro ao criar médico: nenhum dado retornado")
      }

      const medicoId = medicoData[0].id

      // Depois criar a autenticação vinculada ao médico
      const medicoAuthData = {
        email: medicoFormData.usuario,
        senha: medicoFormData.senha,
        nome: medicoFormData.nome,
        medico_id: medicoId,
      }

      // Adicionar acesso_liberado apenas se a coluna existir
      if (colunaAcessoExiste) {
        Object.assign(medicoAuthData, { acesso_liberado: false })
      }

      const { error: authError } = await supabase.from("medicos_auth").insert([medicoAuthData])

      if (authError) {
        console.error("Erro ao criar autenticação:", authError)
        // Remover o médico criado para não deixar lixo no banco
        await supabase.from("medicos").delete().eq("id", medicoId)
        throw new Error(`Erro ao criar autenticação: ${authError.message}`)
      }

      toast({
        title: "Médico criado com sucesso",
      })

      // Limpar formulário
      setMedicoFormData({
        usuario: "",
        senha: "",
        confirmarSenha: "",
        nome: "",
        especialidade: "",
        crm: "",
      })

      // Recarregar dados
      await carregarDados()
    } catch (error: any) {
      console.error("Erro completo:", error)
      toast({
        title: "Erro ao criar médico",
        description: error.message || "Ocorreu um erro ao criar o médico.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const excluirInstancia = async (id: string) => {
    setExcluindoInstancia(true)
    try {
      // Primeiro, desvincular todos os médicos desta instância
      await supabase.from("medicos_auth").update({ instancia_id: null }).eq("instancia_id", id)

      // Depois, excluir a instância
      const { error } = await supabase.from("instancias").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Instância excluída com sucesso",
      })

      // Recarregar dados
      await carregarDados()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir instância",
        description: error.message || "Ocorreu um erro ao excluir a instância.",
        variant: "destructive",
      })
    } finally {
      setExcluindoInstancia(false)
      setInstanciaParaExcluir(null)
    }
  }

  const excluirAuth = async (id: string) => {
    setExcluindoAuth(true)
    try {
      // Primeiro, obter o médico vinculado
      const { data: auth } = await supabase.from("medicos_auth").select("medico_id").eq("id", id).single()

      if (auth?.medico_id) {
        // Excluir o médico vinculado
        await supabase.from("medicos").delete().eq("id", auth.medico_id)
      }

      // Excluir a autenticação
      const { error } = await supabase.from("medicos_auth").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Médico excluído com sucesso",
      })

      // Recarregar dados
      await carregarDados()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir médico",
        description: error.message || "Ocorreu um erro ao excluir o médico.",
        variant: "destructive",
      })
    } finally {
      setExcluindoAuth(false)
      setAuthParaExcluir(null)
    }
  }

  const vincularMedico = async () => {
    if (!medicoSelecionado || !instanciaSelecionada) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um médico e uma instância para vincular.",
        variant: "destructive",
      })
      return
    }

    setVinculandoMedico(true)
    try {
      const { error } = await supabase
        .from("medicos_auth")
        .update({ instancia_id: instanciaSelecionada })
        .eq("id", medicoSelecionado)

      if (error) throw error

      toast({
        title: "Médico vinculado com sucesso",
      })

      // Limpar seleções
      setMedicoSelecionado("")
      setInstanciaSelecionada("")

      // Recarregar dados
      await carregarDados()
    } catch (error: any) {
      toast({
        title: "Erro ao vincular médico",
        description: error.message || "Ocorreu um erro ao vincular o médico à instância.",
        variant: "destructive",
      })
    } finally {
      setVinculandoMedico(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento do Sistema</h1>
        <Button
          onClick={forcarAtualizacao}
          variant="outline"
          disabled={atualizando || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          {atualizando ? "Atualizando..." : "Atualizar dados"}
        </Button>
      </div>

      {!colunaAcessoExiste && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 font-medium">Atenção</p>
          <p className="text-yellow-700 text-sm mt-1">
            A coluna 'acesso_liberado' não existe na tabela medicos_auth. Execute o SQL abaixo para adicioná-la:
          </p>
          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-auto relative">
            <pre>{sqlAdicionarColuna}</pre>
            <Button variant="outline" size="sm" className="absolute top-1 right-1 h-6 px-2 text-xs" onClick={copiarSQL}>
              {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span className="ml-1">{copiado ? "Copiado" : "Copiar"}</span>
            </Button>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={criarColunaAcessoLiberado}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Criar coluna automaticamente
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="vinculos" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instancias">Instâncias</TabsTrigger>
          <TabsTrigger value="medicos">Médicos</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
        </TabsList>

        {/* Tab de Instâncias */}
        <TabsContent value="instancias">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Instância</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Instância *</Label>
                    <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuário *</Label>
                    <Input
                      id="usuario"
                      name="usuario"
                      value={formData.usuario}
                      onChange={handleChange}
                      required
                      placeholder="usuario_clinica"
                    />
                    <p className="text-xs text-muted-foreground">Nome de usuário para acesso ao sistema</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      value={formData.senha}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isLoading ? "Criando..." : "Criar Instância"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instâncias Cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : instancias.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Médicos</TableHead>
                        <TableHead>Ações</TableHead>
                        <TableHead>Status da Assinatura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instancias.map((instancia) => {
                        // Contar médicos vinculados a esta instância
                        const medicosVinculados = medicos.filter((m) => m.instancia_id === instancia.id)

                        return (
                          <TableRow key={instancia.id}>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        instancia.tem_assinatura || instancia.acesso_liberado
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      }`}
                                    ></div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {instancia.acesso_liberado
                                      ? "Acesso liberado manualmente"
                                      : instancia.tem_assinatura
                                        ? `Assinatura ativa ${
                                            instancia.assinatura_via ? `(via ${instancia.assinatura_via})` : ""
                                          }`
                                        : "Sem assinatura ativa"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="font-medium">{instancia.nome}</TableCell>
                            <TableCell>{instancia.usuario}</TableCell>
                            <TableCell>{medicosVinculados.length}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  onClick={() => setInstanciaParaExcluir(instancia.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {instancia.tem_assinatura ? (
                                  <span className="text-sm text-green-600 font-medium">Assinatura Ativa</span>
                                ) : instancia.acesso_liberado ? (
                                  <span className="text-sm text-blue-600 font-medium">Acesso Liberado</span>
                                ) : (
                                  <span className="text-sm text-gray-500">Sem Assinatura</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Nenhuma instância cadastrada.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Médicos */}
        <TabsContent value="medicos">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Médico</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMedicoSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-medico">Nome do Médico *</Label>
                    <Input
                      id="nome-medico"
                      name="nome"
                      value={medicoFormData.nome}
                      onChange={handleMedicoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM *</Label>
                    <Input id="crm" name="crm" value={medicoFormData.crm} onChange={handleMedicoChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade *</Label>
                    <Input
                      id="especialidade"
                      name="especialidade"
                      value={medicoFormData.especialidade}
                      onChange={handleMedicoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usuario-medico">Usuário de Acesso *</Label>
                    <Input
                      id="usuario-medico"
                      name="usuario"
                      value={medicoFormData.usuario}
                      onChange={handleMedicoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha-medico">Senha *</Label>
                    <Input
                      id="senha-medico"
                      name="senha"
                      type="password"
                      value={medicoFormData.senha}
                      onChange={handleMedicoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha-medico">Confirmar Senha *</Label>
                    <Input
                      id="confirmarSenha-medico"
                      name="confirmarSenha"
                      type="password"
                      value={medicoFormData.confirmarSenha}
                      onChange={handleMedicoChange}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isLoading ? "Criando..." : "Criar Médico"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Médicos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : medicos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>CRM</TableHead>
                        <TableHead>Ações</TableHead>
                        <TableHead>Status da Assinatura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicos.map((medico) => (
                        <TableRow key={medico.id}>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      medico.acesso_liberado
                                        ? "bg-green-500"
                                        : medico.tem_assinatura
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                    }`}
                                  ></div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {medico.acesso_liberado
                                    ? "Acesso liberado manualmente"
                                    : medico.tem_assinatura
                                      ? "Assinatura ativa"
                                      : "Sem assinatura ativa"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="font-medium">{medico.nome}</TableCell>
                          <TableCell>{medico.medicos?.especialidade}</TableCell>
                          <TableCell>{medico.medicos?.crm}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => setAuthParaExcluir(medico.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {medico.tem_assinatura ? (
                                <span className="text-sm text-green-600 font-medium">Assinatura Ativa</span>
                              ) : medico.acesso_liberado ? (
                                <span className="text-sm text-blue-600 font-medium">Acesso Liberado</span>
                              ) : (
                                <span className="text-sm text-gray-500">Sem Assinatura</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Nenhum médico cadastrado.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Vínculos */}
        <TabsContent value="vinculos">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vincular Médico a Instância</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="medico">Médico</Label>
                    <Select value={medicoSelecionado} onValueChange={setMedicoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um médico" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicos.map((medico) => (
                          <SelectItem key={medico.id} value={medico.id}>
                            {medico.nome} ({medico.medicos?.especialidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instancia">Instância</Label>
                    <Select value={instanciaSelecionada} onValueChange={setInstanciaSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma instância" />
                      </SelectTrigger>
                      <SelectContent>
                        {instancias.map((instancia) => (
                          <SelectItem key={instancia.id} value={instancia.id}>
                            {instancia.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={vincularMedico}
                    disabled={vinculandoMedico || !medicoSelecionado || !instanciaSelecionada}
                    className="w-full"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {vinculandoMedico ? "Vinculando..." : "Vincular Médico à Instância"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Médicos e Suas Instâncias</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : medicos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Médico</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Instância Vinculada</TableHead>
                        <TableHead>Ações</TableHead>
                        <TableHead>Status da Assinatura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicos.map((medico) => {
                        // Encontrar a instância vinculada a este médico
                        const instanciaVinculada = instancias.find((i) => i.id === medico.instancia_id)
                        const isUpdating = !!ativandoAcesso[medico.id]

                        return (
                          <TableRow key={medico.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          medico.acesso_liberado || medico.tem_assinatura
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                      ></div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {medico.acesso_liberado
                                        ? "Acesso liberado manualmente"
                                        : medico.tem_assinatura
                                          ? "Assinatura ativa"
                                          : "Sem acesso"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{medico.nome}</TableCell>
                            <TableCell>{medico.medicos?.especialidade}</TableCell>
                            <TableCell>{medico.email}</TableCell>
                            <TableCell>{instanciaVinculada ? instanciaVinculada.nome : "Não vinculado"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                        <ToggleSwitch
                                          id={`toggle-${medico.id}`}
                                          checked={medico.acesso_liberado}
                                          onChange={(checked) => alterarAcessoSemAssinatura(medico.id, checked)}
                                          disabled={
                                            isUpdating ||
                                            !medico.instancia_id ||
                                            !colunaAcessoExiste ||
                                            medico.tem_assinatura
                                          }
                                        />
                                        <span className="text-xs ml-2">
                                          {isUpdating
                                            ? "Atualizando..."
                                            : medico.acesso_liberado
                                              ? "Acesso liberado manualmente"
                                              : "Acesso manual desativado"}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {!colunaAcessoExiste
                                        ? "Execute o SQL para adicionar a coluna acesso_liberado"
                                        : medico.tem_assinatura
                                          ? "Médico com assinatura ativa - acesso manual não necessário"
                                          : isUpdating
                                            ? "Atualizando..."
                                            : medico.acesso_liberado
                                              ? "Clique para revogar o acesso manual"
                                              : "Clique para liberar acesso manual"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {medico.tem_assinatura ? (
                                  <span className="text-sm text-green-600 font-medium">Assinatura Ativa</span>
                                ) : medico.acesso_liberado ? (
                                  <span className="text-sm text-blue-600 font-medium">Acesso Liberado Manualmente</span>
                                ) : (
                                  <span className="text-sm text-gray-500">Sem Assinatura</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">Nenhum médico cadastrado.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para excluir instância */}
      <AlertDialog open={!!instanciaParaExcluir} onOpenChange={(open) => !open && setInstanciaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir instância</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita e todos os vínculos com
              médicos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoInstancia}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => instanciaParaExcluir && excluirInstancia(instanciaParaExcluir)}
              disabled={excluindoInstancia}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {excluindoInstancia ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para excluir médico */}
      <AlertDialog open={!!authParaExcluir} onOpenChange={(open) => !open && setAuthParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir médico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este médico? Esta ação não pode ser desfeita e todos os dados relacionados
              a este médico serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoAuth}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => authParaExcluir && excluirAuth(authParaExcluir)}
              disabled={excluindoAuth}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {excluindoAuth ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
