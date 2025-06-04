import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function PrescricoesPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: prescricoes } = await supabase
    .from("prescricoes")
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prescrições</h1>
        <Button asChild>
          <Link href="/prescricoes/nova">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Prescrição
          </Link>
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescricoes && prescricoes.length > 0 ? (
              prescricoes.map((prescricao) => (
                <TableRow key={prescricao.id}>
                  <TableCell>{formatarData(prescricao.criado_em)}</TableCell>
                  <TableCell>{prescricao.pacientes?.nome}</TableCell>
                  <TableCell>{prescricao.medicos?.nome}</TableCell>
                  <TableCell>{prescricao.medicos?.especialidade}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prescricoes/${prescricao.id}`}>Ver</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prescricoes/${prescricao.id}/imprimir`}>Imprimir</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhuma prescrição encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
