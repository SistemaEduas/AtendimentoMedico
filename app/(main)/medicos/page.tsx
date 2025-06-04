import { BloqueioAssinatura } from "@/components/bloqueio-assinatura"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default async function MedicosPage() {
  const supabase = createServerComponentClient({ cookies })

  // Obter a instância atual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const instanciaId = session?.user?.user_metadata?.instancia_id

  // Obter médicos
  const { data: medicos } = await supabase
    .from("medicos")
    .select("*")
    .eq("instancia_id", instanciaId)
    .order("nome", { ascending: true })

  return (
    <BloqueioAssinatura>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Médicos</h1>
          <Button asChild>
            <Link href="/medicos/novo">Novo Médico</Link>
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar médicos..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] bg-gray-50 p-3 border-b font-medium text-sm">
            <div>Nome do Médico</div>
            <div>Especialidade</div>
            <div>Ações</div>
          </div>

          {medicos && medicos.length > 0 ? (
            <div className="divide-y">
              {medicos.map((medico) => (
                <div key={medico.id} className="grid grid-cols-[1fr_1fr_auto] p-3 items-center">
                  <div>
                    <p className="font-medium">{medico.nome}</p>
                    <p className="text-sm text-gray-500">
                      {medico.email || "Sem e-mail"} • {medico.telefone || "Sem telefone"}
                    </p>
                  </div>
                  <div>
                    <p>{medico.especialidade || "Não especificada"}</p>
                    <p className="text-sm text-gray-500">CRM: {medico.crm || "Não informado"}</p>
                  </div>
                  <div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/medicos/${medico.id}`}>Ver detalhes</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum médico encontrado.</p>
              <Button asChild className="mt-4">
                <Link href="/medicos/novo">Cadastrar Médico</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </BloqueioAssinatura>
  )
}
