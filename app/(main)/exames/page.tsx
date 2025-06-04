import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"

export default async function ExamesPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: exames } = await supabase
    .from("exames")
    .select(`
      *,
      pacientes (nome),
      medicos (nome, especialidade)
    `)
    .order("criado_em", { ascending: false })

  function formatarData(dataString: string) {
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "solicitado":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Solicitado
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
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exames</h1>
        <Button asChild>
          <Link href="/exames/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Exame
          </Link>
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo de Exame</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exames && exames.length > 0 ? (
              exames.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell>{formatarData(exame.criado_em)}</TableCell>
                  <TableCell>{exame.pacientes?.nome}</TableCell>
                  <TableCell>{exame.tipo_exame}</TableCell>
                  <TableCell>{exame.medicos?.nome}</TableCell>
                  <TableCell>{getStatusBadge(exame.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/exames/${exame.id}`}>Ver</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/exames/${exame.id}/resultado`}>Resultado</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nenhum exame encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
