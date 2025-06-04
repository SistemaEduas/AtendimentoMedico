"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { format, isBefore, startOfDay } from "date-fns"
import { ArrowLeft, Search, X, UserPlus, AlertTriangle } from "lucide-react"

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")

  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [medicos, setMedicos] = useState<any[]>([])
  const [dataAgendamento, setDataAgendamento] = useState<string>("")
  const [pacienteId, setPacienteId] = useState<string>("")
  const [medicoId, setMedicoId] = useState<string>("")
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null)
  const [termoPesquisa, setTermoPesquisa] = useState<string>("")
  const [pesquisando, setPesquisando] = useState(false)
  const [resultadosPesquisa, setResultadosPesquisa] = useState<any[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [isDataPassada, setIsDataPassada] = useState(false)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)
  const [carregandoMedicos, setCarregandoMedicos] = useState(true)

  // Verificar se há um paciente selecionado no sessionStorage (vindo do cadastro)
  useEffect(() => {
    const pacienteId = sessionStorage.getItem("paciente_selecionado_id")
    const pacienteNome = sessionStorage.getItem("paciente_selecionado_nome")
    const pacienteNumero = sessionStorage.getItem("paciente_selecionado_numero")
    const instId = sessionStorage.getItem("instanciaId")

    setInstanciaId(instId)

    if (pacienteId && pacienteNome) {
      setPacienteId(pacienteId)
      setPacienteSelecionado({
        id: pacienteId,
        nome: pacienteNome,
        numero_identificacao: pacienteNumero || undefined,
      })

      // Limpar os dados da sessão após usar
      sessionStorage.removeItem("paciente_selecionado_id")
      sessionStorage.removeItem("paciente_selecionado_nome")
      sessionStorage.removeItem("paciente_selecionado_numero")
    }

    // Recuperar dados do agendamento se existirem
    const medicoSalvo = sessionStorage.getItem("agendamento_medico")
    const dataSalva = sessionStorage.getItem("agendamento_data")

    if (medicoSalvo) {
      setMedicoId(medicoSalvo)
      sessionStorage.removeItem("agendamento_medico")
    }

    if (dataSalva) {
      setDataAgendamento(dataSalva)
      sessionStorage.removeItem("agendamento_data")
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    async function carregarDados() {
      try {
        const instId = sessionStorage.getItem("instanciaId")

        if (!instId) {
          toast({
            title: "Erro de autenticação",
            description: "Sessão expirada. Faça login novamente.",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        setCarregandoMedicos(true)

        // Primeiro, buscar os médicos vinculados à instância através da tabela medicos_auth
        const { data: medicosAuth, error: errorAuth } = await supabase
          .from("medicos_auth")
          .select("medico_id")
          .eq("instancia_id", instId)

        if (errorAuth) {
          console.error("Erro ao buscar médicos vinculados:", errorAuth)
          throw errorAuth
        }

        // Se não houver médicos vinculados, mostrar mensagem
        if (!medicosAuth || medicosAuth.length === 0) {
          setMedicos([])
          setCarregandoMedicos(false)
          return
        }

        // Extrair os IDs dos médicos vinculados
        const medicosIds = medicosAuth.map((auth) => auth.medico_id)

        // Buscar os detalhes dos médicos vinculados
        const { data: medicosData, error } = await supabase
          .from("medicos")
          .select("id, nome, especialidade")
          .in("id", medicosIds)
          .order("nome")

        if (error) {
          console.error("Erro ao carregar médicos:", error)
          toast({
            title: "Erro ao carregar médicos",
            description: "Ocorreu um erro ao carregar a lista de médicos.",
            variant: "destructive",
          })
        } else {
          setMedicos(medicosData || [])
        }

        // Se tiver data nos parâmetros, usar ela
        if (dataParam) {
          try {
            const data = new Date(dataParam)
            setDataAgendamento(format(data, "yyyy-MM-dd'T'HH:mm"))

            // Verificar se a data é passada
            const isPassada = isBefore(data, startOfDay(new Date()))
            setIsDataPassada(isPassada)

            if (isPassada) {
              toast({
                title: "Data passada selecionada",
                description: "Não é possível criar agendamentos para datas passadas.",
                variant: "destructive",
              })
              // Redirecionar para a página de agendamentos
              setTimeout(() => {
                router.push("/agendamentos")
              }, 2000)
            }
          } catch (error) {
            console.error("Erro ao formatar data:", error)
          }
        }

        setCarregandoMedicos(false)
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
        setCarregandoMedicos(false)
      }
    }

    carregarDados()
  }, [supabase, dataParam, router])

  // Função para pesquisar pacientes diretamente no banco de dados
  const pesquisarPacientes = async () => {
    if (!termoPesquisa || termoPesquisa.length < 2) {
      setResultadosPesquisa([])
      setMostrarResultados(false)
      return
    }

    setPesquisando(true)
    setMostrarResultados(true)

    try {
      const instId = sessionStorage.getItem("instanciaId")

      if (!instId) {
        toast({
          title: "Erro de autenticação",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Dividir o termo de pesquisa por vírgulas para pesquisa por múltiplos critérios
      const termos = termoPesquisa
        .split(",")
        .map((termo) => termo.trim().toLowerCase())
        .filter((termo) => termo.length > 0)

      if (termos.length === 0) {
        setResultadosPesquisa([])
        return
      }

      // Construir a consulta SQL com múltiplos critérios
      let query = supabase
        .from("pacientes")
        .select("id, nome, numero_identificacao, cpf, data_nascimento")
        .eq("instancia_id", instId) // Filtrar por instância
        .order("nome")
        .limit(10)

      // Se tiver apenas um termo, usar a pesquisa padrão
      if (termos.length === 1) {
        const termo = termos[0]
        query = query.or(`nome.ilike.%${termo}%,numero_identificacao.ilike.%${termo}%,cpf.ilike.%${termo}%`)
      }
      // Se tiver múltiplos termos, aplicar cada um como um filtro separado
      else {
        // Para cada termo, aplicamos um filtro AND
        termos.forEach((termo, index) => {
          if (index === 0) {
            // Primeiro termo usa .or para pesquisar em vários campos
            query = query.or(`nome.ilike.%${termo}%,numero_identificacao.ilike.%${termo}%,cpf.ilike.%${termo}%`)
          } else {
            // Termos subsequentes usam .and para refinar a pesquisa
            query = query.or(`nome.ilike.%${termo}%,numero_identificacao.ilike.%${termo}%,cpf.ilike.%${termo}%`)
          }
        })
      }

      const { data, error } = await query

      if (error) throw error

      setResultadosPesquisa(data || [])
    } catch (error) {
      console.error("Erro ao pesquisar pacientes:", error)
      toast({
        title: "Erro ao pesquisar pacientes",
        description: "Ocorreu um erro ao pesquisar pacientes. Tente novamente.",
        variant: "destructive",
      })
      setResultadosPesquisa([])
    } finally {
      setPesquisando(false)
    }
  }

  // Função para selecionar um paciente
  const selecionarPaciente = (paciente: any) => {
    setPacienteId(paciente.id)
    setPacienteSelecionado(paciente)
    setMostrarResultados(false)
    setTermoPesquisa("")
  }

  // Função para limpar a seleção de paciente
  const limparPacienteSelecionado = () => {
    setPacienteId("")
    setPacienteSelecionado(null)
    setTermoPesquisa("")
    setResultadosPesquisa([])
    setMostrarResultados(false)
  }

  // Função para navegar para a página de novo paciente
  const irParaNovoPaciente = () => {
    // Salvar o estado atual para retornar depois
    sessionStorage.setItem("agendamento_retorno", "true")
    if (dataAgendamento) {
      sessionStorage.setItem("agendamento_data", dataAgendamento)
    }
    if (medicoId) {
      sessionStorage.setItem("agendamento_medico", medicoId)
    }

    router.push("/pacientes/novo?retorno=agendamento")
  }

  // Função para formatar a data de nascimento
  const formatarDataNascimento = (data: string | null) => {
    if (!data) return null
    try {
      return format(new Date(data), "dd/MM/yyyy")
    } catch (error) {
      return null
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    if (!pacienteId || !medicoId || !dataAgendamento || !instanciaId) {
      setIsLoading(false)
      return toast({
        title: "Erro ao criar agendamento",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      })
    }

    // Verificar se a data é passada
    const dataAgend = new Date(dataAgendamento)
    if (isBefore(dataAgend, startOfDay(new Date()))) {
      setIsLoading(false)
      return toast({
        title: "Data inválida",
        description: "Não é possível criar agendamentos para datas passadas",
        variant: "destructive",
      })
    }

    const observacoes = (event.currentTarget.elements.namedItem("observacoes") as HTMLTextAreaElement)?.value || ""

    const novoAgendamento = {
      paciente_id: pacienteId,
      medico_id: medicoId,
      data: new Date(dataAgendamento).toISOString(),
      observacoes: observacoes,
      status: "agendado",
      instancia_id: instanciaId, // Adicionar o ID da instância
    }

    const { error } = await supabase.from("agendamentos").insert([novoAgendamento])

    setIsLoading(false)

    if (error) {
      return toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      })
    }

    toast({
      title: "Agendamento criado com sucesso",
    })

    // Voltar para a página anterior
    router.back()
  }

  // Se a data for passada, não permitir agendamento
  if (isDataPassada) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push("/agendamentos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Novo Agendamento</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Data passada selecionada</p>
                <p className="text-red-700">Não é possível criar agendamentos para datas passadas.</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => router.push("/agendamentos")}>Voltar para Agendamentos</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Novo Agendamento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente *</Label>
                {pacienteSelecionado ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{pacienteSelecionado.nome}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={limparPacienteSelecionado}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Pesquisar por nome, ID, CPF ou múltiplos critérios separados por vírgula"
                          className="pl-8"
                          value={termoPesquisa}
                          onChange={(e) => setTermoPesquisa(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && termoPesquisa.length >= 2) {
                              e.preventDefault()
                              pesquisarPacientes()
                            }
                          }}
                        />
                      </div>
                      <Button type="button" onClick={pesquisarPacientes} disabled={termoPesquisa.length < 2}>
                        Buscar
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Dica: Para pesquisar por múltiplos critérios, separe-os por vírgula. Ex: "Silva, 123.456"
                    </p>

                    {mostrarResultados && (
                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        {pesquisando ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">Pesquisando...</div>
                        ) : resultadosPesquisa.length > 0 ? (
                          <div className="divide-y">
                            {resultadosPesquisa.map((paciente) => (
                              <div
                                key={paciente.id}
                                className="p-2 hover:bg-gray-50 cursor-pointer"
                                onClick={() => selecionarPaciente(paciente)}
                              >
                                <div className="font-medium">{paciente.nome}</div>
                                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4">
                                  {paciente.numero_identificacao && <span>ID: {paciente.numero_identificacao}</span>}
                                  {paciente.cpf && <span>CPF: {paciente.cpf}</span>}
                                  {paciente.data_nascimento && (
                                    <span>Nascimento: {formatarDataNascimento(paciente.data_nascimento)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhum paciente encontrado
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={irParaNovoPaciente}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Novo Paciente
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medico_id">Médico *</Label>
                <Select value={medicoId} onValueChange={setMedicoId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {carregandoMedicos ? (
                      <SelectItem value="carregando" disabled>
                        Carregando médicos...
                      </SelectItem>
                    ) : medicos && medicos.length > 0 ? (
                      medicos.map((medico) => (
                        <SelectItem key={medico.id} value={medico.id}>
                          Dr(a). {medico.nome} - {medico.especialidade}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="sem-medicos" disabled>
                        Nenhum médico disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {medicos && medicos.length === 0 && !carregandoMedicos && (
                  <p className="text-xs text-amber-600 mt-1">
                    Não há médicos vinculados a esta instância. Contate o administrador.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Data e Hora *</Label>
                <Input
                  id="data"
                  name="data"
                  type="datetime-local"
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  required
                  readOnly={!!dataParam}
                />
                {dataParam && <p className="text-sm text-muted-foreground">Data e hora selecionadas no calendário</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" placeholder="Observações sobre o agendamento" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">* Campos obrigatórios</p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
