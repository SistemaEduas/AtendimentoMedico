"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  Save,
  FileText,
  FlaskConical,
  Clock,
  FileCheck,
  FileSpreadsheet,
  Printer,
  Trash2,
  CheckCircle,
  RotateCcw,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function AtendimentoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [agendamento, setAgendamento] = useState<any>(null)
  const [prescricao, setPrescricao] = useState("")
  const [tipoExame, setTipoExame] = useState("")
  const [atestado, setAtestado] = useState("")
  const [receituario, setReceituario] = useState("")
  const [salvandoPrescricao, setSalvandoPrescricao] = useState(false)
  const [salvandoExame, setSalvandoExame] = useState(false)
  const [imprimindoAtestado, setImprimindoAtestado] = useState(false)
  const [imprimindoReceituario, setImprimindoReceituario] = useState(false)
  const [prescricoesAnteriores, setPrescricoesAnteriores] = useState<any[]>([])
  const [prescricaoSelecionada, setPrescricaoSelecionada] = useState<any>(null)
  const [prescricaoParaExcluir, setPrescricaoParaExcluir] = useState<string | null>(null)
  const [excluindoPrescricao, setExcluindoPrescricao] = useState(false)
  const [finalizandoAtendimento, setFinalizandoAtendimento] = useState(false)
  const [confirmarFinalizacao, setConfirmarFinalizacao] = useState(false)
  // Novos estados para desfazer finalização
  const [desfazendoFinalizacao, setDesfazendoFinalizacao] = useState(false)
  const [confirmarDesfazerFinalizacao, setConfirmarDesfazerFinalizacao] = useState(false)

  const [diasAfastamento, setDiasAfastamento] = useState("")
  const [motivoAfastamento, setMotivoAfastamento] = useState("")
  const [informacoesRelevantes, setInformacoesRelevantes] = useState("")

  // Referência para o componente do atestado
  const atestadoRef = useRef<HTMLDivElement>(null)

  // Substituir as múltiplas funções de formatação por uma única função reutilizável:
  function formatarData(dataString: string | null, incluirHora = false) {
    if (!dataString) return "Não informado"
    try {
      const data = new Date(dataString)
      return format(data, incluirHora ? "dd/MM/yyyy 'às' HH:mm" : "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  // Substituir as funções duplicadas de impressão por uma única função:
  const imprimirDocumento = async (tipo: "atestado" | "receituario", texto: string) => {
    if (!texto.trim()) {
      toast({
        title: "Campo obrigatório",
        description: `Por favor, preencha o ${tipo}.`,
        variant: "destructive",
      })
      return
    }

    const setLoading = tipo === "atestado" ? setImprimindoAtestado : setImprimindoReceituario
    setLoading(true)

    try {
      // Simulação de impressão
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} enviado para impressão`,
      })
    } catch (error) {
      console.error(`Erro ao imprimir ${tipo}:`, error)
      toast({
        title: `Erro ao imprimir ${tipo}`,
        description: `Não foi possível imprimir o ${tipo}.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAgendamento()
  }, [])

  const carregarAgendamento = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          pacientes (id, nome, cpf, telefone, convenio, numero_identificacao, data_nascimento),
          medicos (id, nome, especialidade, crm)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setAgendamento(data)

      // Carregar prescrições anteriores do paciente
      if (data.paciente_id) {
        await carregarPrescricoesAnteriores(data.paciente_id)
      }
    } catch (error) {
      console.error("Erro ao carregar agendamento:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do atendimento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const carregarPrescricoesAnteriores = async (pacienteId: string) => {
    try {
      const { data, error } = await supabase
        .from("prescricoes")
        .select(`
          *,
          medicos (nome, especialidade),
          agendamentos (data)
        `)
        .eq("paciente_id", pacienteId)
        .order("criado_em", { ascending: false })

      if (error) throw error
      setPrescricoesAnteriores(data || [])
    } catch (error) {
      console.error("Erro ao carregar prescrições anteriores:", error)
    }
  }

  const salvarPrescricao = async () => {
    if (!prescricao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha a prescrição.",
        variant: "destructive",
      })
      return
    }

    setSalvandoPrescricao(true)
    try {
      const novaPrescricao = {
        paciente_id: agendamento.paciente_id,
        medico_id: agendamento.medico_id,
        agendamento_id: agendamento.id,
        descricao: prescricao,
      }

      const { data, error } = await supabase.from("prescricoes").insert([novaPrescricao]).select()

      if (error) throw error

      toast({
        title: "Prescrição salva com sucesso",
      })
      setPrescricao("")

      // Atualizar a lista de prescrições
      await carregarPrescricoesAnteriores(agendamento.paciente_id)
    } catch (error) {
      console.error("Erro ao salvar prescrição:", error)
      toast({
        title: "Erro ao salvar prescrição",
        description: "Não foi possível salvar a prescrição.",
        variant: "destructive",
      })
    } finally {
      setSalvandoPrescricao(false)
    }
  }

  const salvarExame = async () => {
    if (!tipoExame.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o tipo de exame.",
        variant: "destructive",
      })
      return
    }

    setSalvandoExame(true)
    try {
      const novoExame = {
        paciente_id: agendamento.paciente_id,
        medico_id: agendamento.medico_id,
        agendamento_id: agendamento.id,
        tipo_exame: tipoExame,
        status: "solicitado",
      }

      const { error } = await supabase.from("exames").insert([novoExame])

      if (error) throw error

      toast({
        title: "Exame solicitado com sucesso",
      })
      setTipoExame("")
    } catch (error) {
      console.error("Erro ao solicitar exame:", error)
      toast({
        title: "Erro ao solicitar exame",
        description: "Não foi possível solicitar o exame.",
        variant: "destructive",
      })
    } finally {
      setSalvandoExame(false)
    }
  }

  const gerarPDFAtestado = async () => {
    if (!diasAfastamento) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número de dias de afastamento.",
        variant: "destructive",
      })
      return
    }

    if (!motivoAfastamento) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o motivo do afastamento.",
        variant: "destructive",
      })
      return
    }

    setImprimindoAtestado(true)

    try {
      if (atestadoRef.current) {
        // Capturar o elemento como imagem
        const canvas = await html2canvas(atestadoRef.current, {
          scale: 2, // Aumenta a qualidade
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        })

        // Criar PDF
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        // Calcular dimensões para ajustar ao tamanho A4
        const imgWidth = 210 // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

        // Abrir PDF em nova janela
        window.open(URL.createObjectURL(pdf.output("blob")))

        toast({
          title: "Atestado gerado com sucesso",
          description: "O PDF do atestado foi aberto em uma nova janela.",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar PDF do atestado:", error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do atestado.",
        variant: "destructive",
      })
    } finally {
      setImprimindoAtestado(false)
    }
  }

  const imprimirReceituario = async () => {
    imprimirDocumento("receituario", receituario)
  }

  const excluirPrescricao = async (prescricaoId: string) => {
    setExcluindoPrescricao(true)
    try {
      const { error } = await supabase.from("prescricoes").delete().eq("id", prescricaoId)

      if (error) throw error

      toast({
        title: "Prescrição excluída com sucesso",
      })

      // Verificar se a prescrição excluída é a que está selecionada
      if (prescricaoSelecionada && prescricaoSelecionada.id === prescricaoId) {
        // Limpar a prescrição selecionada
        setPrescricaoSelecionada(null)
      }

      // Atualizar a lista de prescrições
      await carregarPrescricoesAnteriores(agendamento.paciente_id)
    } catch (error) {
      console.error("Erro ao excluir prescrição:", error)
      toast({
        title: "Erro ao excluir prescrição",
        description: "Não foi possível excluir a prescrição.",
        variant: "destructive",
      })
    } finally {
      setExcluindoPrescricao(false)
      setPrescricaoParaExcluir(null)
    }
  }

  // Nova função para finalizar o atendimento
  const finalizarAtendimento = async () => {
    setFinalizandoAtendimento(true)
    try {
      const { error } = await supabase.from("agendamentos").update({ status: "concluido" }).eq("id", params.id)

      if (error) throw error

      // Atualizar o estado local
      setAgendamento({ ...agendamento, status: "concluido" })

      toast({
        title: "Atendimento finalizado com sucesso",
        description: "O status do agendamento foi atualizado para concluído.",
      })

      // Fechar o diálogo de confirmação
      setConfirmarFinalizacao(false)

      // Opcional: redirecionar após alguns segundos
      setTimeout(() => {
        router.push("/agendamentos")
      }, 2000)
    } catch (error) {
      console.error("Erro ao finalizar atendimento:", error)
      toast({
        title: "Erro ao finalizar atendimento",
        description: "Não foi possível finalizar o atendimento.",
        variant: "destructive",
      })
    } finally {
      setFinalizandoAtendimento(false)
    }
  }

  // Nova função para desfazer a finalização do atendimento
  const desfazerFinalizacao = async () => {
    setDesfazendoFinalizacao(true)
    try {
      const { error } = await supabase.from("agendamentos").update({ status: "agendado" }).eq("id", params.id)

      if (error) throw error

      // Atualizar o estado local
      setAgendamento({ ...agendamento, status: "agendado" })

      toast({
        title: "Finalização desfeita com sucesso",
        description: "O status do agendamento foi revertido para agendado.",
      })

      // Fechar o diálogo de confirmação
      setConfirmarDesfazerFinalizacao(false)
    } catch (error) {
      console.error("Erro ao desfazer finalização:", error)
      toast({
        title: "Erro ao desfazer finalização",
        description: "Não foi possível reverter o status do atendimento.",
        variant: "destructive",
      })
    } finally {
      setDesfazendoFinalizacao(false)
    }
  }

  function calcularIdade(dataNascimento: string | null) {
    if (!dataNascimento) return "Não informada"
    try {
      const nascimento = new Date(dataNascimento)
      const hoje = new Date()
      let idade = hoje.getFullYear() - nascimento.getFullYear()
      const mesAtual = hoje.getMonth()
      const mesNascimento = nascimento.getMonth()

      if (mesNascimento > mesAtual || (mesNascimento === mesAtual && nascimento.getDate() > hoje.getDate())) {
        idade--
      }

      return `${idade} anos`
    } catch (error) {
      return "Não calculada"
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "agendado":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Agendado
          </Badge>
        )
      case "concluido":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Concluído
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelado
          </Badge>
        )
      case "nao_compareceu":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Não Compareceu
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Carregando dados do atendimento...</div>
      </div>
    )
  }

  if (!agendamento) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Agendamento não encontrado.</div>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/agendamentos">Voltar para Agendamentos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Atendimento</h1>
          <div>{getStatusBadge(agendamento.status)}</div>
        </div>

        {/* Botões de ação baseados no status */}
        <div className="flex gap-2">
          {agendamento.status === "agendado" && (
            <Button onClick={() => setConfirmarFinalizacao(true)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Atendimento
            </Button>
          )}

          {agendamento.status === "concluido" && (
            <Button
              onClick={() => setConfirmarDesfazerFinalizacao(true)}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Desfazer Finalização
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Nome:</dt>
                <dd className="font-medium">{agendamento.pacientes?.nome}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">ID:</dt>
                <dd>{agendamento.pacientes?.numero_identificacao || "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Idade:</dt>
                <dd>{calcularIdade(agendamento.pacientes?.data_nascimento)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Convênio:</dt>
                <dd>{agendamento.pacientes?.convenio || "Não informado"}</dd>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/pacientes/${agendamento.paciente_id}`}>Ver Ficha Completa</Link>
                </Button>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Data:</dt>
                <dd className="font-medium">{formatarData(agendamento.data, true)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Observações:</dt>
                <dd>{agendamento.observacoes || "Nenhuma observação"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="historico">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="prescricao">
            <FileText className="h-4 w-4 mr-2" />
            Prescrição
          </TabsTrigger>
          <TabsTrigger value="exames">
            <FlaskConical className="h-4 w-4 mr-2" />
            Exames
          </TabsTrigger>
          <TabsTrigger value="atestado">
            <FileCheck className="h-4 w-4 mr-2" />
            Atestado
          </TabsTrigger>
          <TabsTrigger value="receituario">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Receituário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Prescrições Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                {prescricoesAnteriores.length > 0 ? (
                  <div className="space-y-2">
                    {prescricoesAnteriores.map((prescricao) => (
                      <div
                        key={prescricao.id}
                        className={`p-3 rounded-md border hover:bg-gray-50 ${
                          prescricaoSelecionada?.id === prescricao.id ? "bg-blue-50 border-blue-200" : ""
                        }`}
                      >
                        <div className="flex justify-between">
                          <div
                            className="font-medium cursor-pointer flex-grow"
                            onClick={() => setPrescricaoSelecionada(prescricao)}
                          >
                            {formatarData(prescricao.criado_em)}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">Dr(a). {prescricao.medicos?.nome}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPrescricaoParaExcluir(prescricao.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </div>
                        <div
                          className="text-sm text-gray-500 mt-1 break-words overflow-hidden text-ellipsis cursor-pointer"
                          style={{ maxHeight: "3em" }}
                          onClick={() => setPrescricaoSelecionada(prescricao)}
                        >
                          {prescricao.descricao.substring(0, 50)}
                          {prescricao.descricao.length > 50 ? "..." : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">Nenhuma prescrição anterior encontrada.</div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Detalhes da Prescrição</CardTitle>
              </CardHeader>
              <CardContent>
                {prescricaoSelecionada ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">Data: {formatarData(prescricaoSelecionada.criado_em)}</div>
                        <div>Dr(a). {prescricaoSelecionada.medicos?.nome}</div>
                      </div>
                      <div className="border-t pt-2">
                        <div
                          className="whitespace-pre-wrap font-sans break-words overflow-auto"
                          style={{ maxHeight: "300px" }}
                        >
                          {prescricaoSelecionada.descricao}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Imprimir Prescrição
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">Selecione uma prescrição para ver os detalhes.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prescricao">
          <Card>
            <CardHeader>
              <CardTitle>Nova Prescrição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prescricao">Prescrição Médica</Label>
                  <Textarea
                    id="prescricao"
                    placeholder="Digite a prescrição médica..."
                    rows={10}
                    value={prescricao}
                    onChange={(e) => setPrescricao(e.target.value)}
                  />
                </div>
                <Button onClick={salvarPrescricao} disabled={salvandoPrescricao}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvandoPrescricao ? "Salvando..." : "Salvar Prescrição"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exames">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Exame</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_exame">Tipo de Exame</Label>
                  <Input
                    id="tipo_exame"
                    placeholder="Ex: Hemograma, Raio-X, Ultrassom"
                    value={tipoExame}
                    onChange={(e) => setTipoExame(e.target.value)}
                  />
                </div>
                <Button onClick={salvarExame} disabled={salvandoExame}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvandoExame ? "Solicitando..." : "Solicitar Exame"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atestado">
          <Card>
            <CardHeader>
              <CardTitle>Emitir Atestado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dias_afastamento">Dias de Afastamento</Label>
                    <Input
                      id="dias_afastamento"
                      type="number"
                      min="1"
                      placeholder="Número de dias"
                      value={diasAfastamento}
                      onChange={(e) => setDiasAfastamento(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo_afastamento">Motivo do Afastamento</Label>
                    <Input
                      id="motivo_afastamento"
                      placeholder="Motivo do afastamento"
                      value={motivoAfastamento}
                      onChange={(e) => setMotivoAfastamento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="informacoes_relevantes">Informações Relevantes</Label>
                  <Textarea
                    id="informacoes_relevantes"
                    placeholder="Informações adicionais relevantes..."
                    rows={3}
                    value={informacoesRelevantes}
                    onChange={(e) => setInformacoesRelevantes(e.target.value)}
                  />
                </div>

                {/* Modelo do atestado para impressão */}
                <div className="border rounded-lg p-4 bg-white">
                  <div ref={atestadoRef} className="border-2 border-green-500 rounded-lg p-8 relative">
                    <h2 className="text-center text-2xl font-bold mb-10 border-b border-green-500 pb-4">
                      ATESTADO MÉDICO
                    </h2>

                    <div className="space-y-8 text-sm">
                      <p className="leading-relaxed">
                        Atesto para <span className="underline">os devidos fins</span> que o Sr.(a){" "}
                        <span className="font-bold">{agendamento.pacientes?.nome || "___________________"}</span>,
                        portador(a) do CPF nº{" "}
                        <span className="font-bold">{agendamento.pacientes?.cpf || "___________________"}</span> esteve
                        sob cuidados médicos no dia{" "}
                        <span className="font-bold">{formatarData(agendamento.data) || "___________________"}</span> e
                        deverá se afastar de suas atividades pelo período de{" "}
                        <span className="font-bold">{diasAfastamento || "___"}</span> dias por motivos de{" "}
                        <span className="font-bold">{motivoAfastamento || "___________________"}</span>.
                      </p>

                      <div className="border border-green-500 rounded-lg p-6 mt-8">
                        <p className="font-medium mb-4">INFORMAÇÕES RELEVANTES:</p>
                        <p className="min-h-[80px] leading-relaxed">{informacoesRelevantes}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-10 pt-4">
                        <div>
                          <p>
                            Local: <span className="font-bold">_____________________</span>
                          </p>
                        </div>
                        <div>
                          <p>
                            Data: <span className="font-bold">{formatarData(new Date().toISOString())}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-16 text-center">
                        <div className="border-t border-black pt-4 w-64 mx-auto">
                          <p className="mb-1">Dr(a). {agendamento.medicos?.nome || "___________________"}</p>
                          <p className="mb-1">CRM: {agendamento.medicos?.crm || "___________________"}</p>
                          <p>{agendamento.medicos?.especialidade || "___________________"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={gerarPDFAtestado} disabled={imprimindoAtestado}>
                  <Printer className="h-4 w-4 mr-2" />
                  {imprimindoAtestado ? "Gerando PDF..." : "Gerar PDF do Atestado"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receituario">
          <Card>
            <CardHeader>
              <CardTitle>Emitir Receituário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receituario">Receituário Médico</Label>
                  <Textarea
                    id="receituario"
                    placeholder="Digite o texto do receituário médico..."
                    rows={10}
                    value={receituario}
                    onChange={(e) => setReceituario(e.target.value)}
                  />
                </div>
                <Button onClick={imprimirReceituario} disabled={imprimindoReceituario}>
                  <Printer className="h-4 w-4 mr-2" />
                  {imprimindoReceituario ? "Imprimindo..." : "Imprimir Receituário"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para confirmar exclusão de prescrição */}
      <AlertDialog open={!!prescricaoParaExcluir} onOpenChange={(open) => !open && setPrescricaoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prescrição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta prescrição? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoPrescricao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => prescricaoParaExcluir && excluirPrescricao(prescricaoParaExcluir)}
              disabled={excluindoPrescricao}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {excluindoPrescricao ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para confirmar finalização do atendimento */}
      <AlertDialog open={confirmarFinalizacao} onOpenChange={setConfirmarFinalizacao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar este atendimento? O status será alterado para "Concluído".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizandoAtendimento}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={finalizarAtendimento}
              disabled={finalizandoAtendimento}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {finalizandoAtendimento ? "Finalizando..." : "Finalizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para confirmar desfazer finalização do atendimento */}
      <AlertDialog open={confirmarDesfazerFinalizacao} onOpenChange={setConfirmarDesfazerFinalizacao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer finalização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desfazer a finalização deste atendimento? O status será alterado de "Concluído"
              para "Agendado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desfazendoFinalizacao}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={desfazerFinalizacao}
              disabled={desfazendoFinalizacao}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
            >
              {desfazendoFinalizacao ? "Desfazendo..." : "Desfazer Finalização"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
