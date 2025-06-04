import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
// Adicionar o import do Badge
import { Badge } from "@/components/ui/badge"

export default async function MedicoDetalhesPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: medico } = await supabase.from("medicos").select("*").eq("id", params.id).single()

  if (!medico) {
    notFound()
  }

  // Buscar os agendamentos do médico
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(`
      *,
      pacientes (nome),
      status
    `)
    .eq("medico_id", params.id)
    .order("data", { ascending: false })
    .limit(5)

  function formatarDataHora(dataString: string) {
    const data = new Date(dataString)
    return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  // Função para formatar a data para o formato de URL (YYYY-MM-DD)
  function formatarDataParaURL(dataString: string) {
    const data = new Date(dataString)
    return format(data, "yyyy-MM-dd")
  }

  // Adicionar a função getStatusBadge após a função formatarDataParaURL
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/medicos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Dr(a). {medico.nome}</h1>
        </div>
        <Button asChild>
          <Link href={`/medicos/${params.id}/editar`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Médico</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="grid grid-cols-2">
                <dt className="font-medium text-gray-500">Nome:</dt>
                <dd>{medico.nome}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium text-gray-500">CRM:</dt>
                <dd>{medico.crm}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium text-gray-500">Especialidade:</dt>
                <dd>{medico.especialidade}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium text-gray-500">Email:</dt>
                <dd>{medico.email || "Não informado"}</dd>
              </div>
              <div className="grid grid-cols-2">
                <dt className="font-medium text-gray-500">Telefone:</dt>
                <dd>{medico.telefone || "Não informado"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {agendamentos && agendamentos.length > 0 ? (
              <div className="space-y-4">
                {agendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="border rounded-md p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{agendamento.pacientes?.nome}</p>
                          {getStatusBadge(agendamento.status)}
                        </div>
                        <p className="text-sm text-gray-500">{formatarDataHora(agendamento.data)}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agendamentos/dia/${formatarDataParaURL(agendamento.data)}`}>Ver Agendamento</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum agendamento encontrado para este médico.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
