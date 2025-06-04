"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Plus, Trash2 } from "lucide-react"

export default function PacientesPage() {
  const supabase = createClientComponentClient()
  const [pacientes, setPacientes] = useState([])
  const [termoBusca, setTermoBusca] = useState("")
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  useEffect(() => {
    async function carregarPacientes() {
      // Obter a instância atual do sessionStorage
      const instId = sessionStorage.getItem("instanciaId")
      setInstanciaId(instId)

      if (!instId) return

      // Obter pacientes
      const { data } = await supabase
        .from("pacientes")
        .select("*")
        .eq("instancia_id", instId)
        .order("nome", { ascending: true })

      if (data) {
        setPacientes(data)
      }
    }

    carregarPacientes()
  }, [supabase])

  // Filtrar pacientes com base no termo de busca
  const pacientesFiltrados = pacientes.filter((paciente) => {
    if (!termoBusca) return true

    const termo = termoBusca.toLowerCase()
    return (
      paciente.nome?.toLowerCase().includes(termo) ||
      paciente.cpf?.toLowerCase().includes(termo) ||
      paciente.telefone?.toLowerCase().includes(termo) ||
      paciente.email?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Link href="/pacientes/novo" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md">
          <Plus size={18} />
          Novo Paciente
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Buscar Pacientes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, telefone ou email..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Nome</th>
              <th className="text-left p-4 font-medium">CPF</th>
              <th className="text-left p-4 font-medium">Telefone</th>
              <th className="text-left p-4 font-medium">Convênio</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.length > 0 ? (
              pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="border-b">
                  <td className="p-4">{paciente.nome}</td>
                  <td className="p-4">{paciente.cpf || "-"}</td>
                  <td className="p-4">{paciente.telefone || "-"}</td>
                  <td className="p-4">{paciente.convenio || "-"}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <Link href={`/pacientes/${paciente.id}`} className="px-3 py-1 border rounded-md hover:bg-gray-50">
                      Ver
                    </Link>
                    <Link
                      href={`/pacientes/${paciente.id}/editar`}
                      className="px-3 py-1 border rounded-md hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    <button
                      className="px-3 py-1 border rounded-md text-red-600 hover:bg-red-50 flex items-center gap-1"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o paciente ${paciente.nome}?`)) {
                          // Lógica para excluir paciente
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
