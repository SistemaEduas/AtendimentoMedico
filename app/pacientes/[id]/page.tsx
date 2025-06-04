"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, Calendar, FileText, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Paciente {
  id: string
  nome: string
  cpf: string
  rg: string
  data_nascimento: string
  telefone: string
  email: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  convenio: string
  numero_convenio: string
  observacoes: string
  created_at: string
  updated_at: string
}

export default function PacientePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  useEffect(() => {
    async function carregarPaciente() {
      try {
        // Obter a instância atual do sessionStorage
        const instId = sessionStorage.getItem("instanciaId")
        setInstanciaId(instId)

        if (!instId || !params.id) return

        // Buscar dados do paciente
        const { data, error } = await supabase
          .from("pacientes")
          .select("*")
          .eq("id", params.id)
          .eq("instancia_id", instId)
          .single()

        if (error) {
          console.error("Erro ao carregar paciente:", error)
          return
        }

        setPaciente(data)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarPaciente()
  }, [supabase, params.id])

  const handleExcluir = async () => {
    if (!paciente || !instanciaId) return

    if (confirm(`Deseja realmente excluir o paciente ${paciente.nome}?`)) {
      try {
        const { error } = await supabase
          .from("pacientes")
          .delete()
          .eq("id", paciente.id)
          .eq("instancia_id", instanciaId)

        if (error) {
          console.error("Erro ao excluir paciente:", error)
          alert("Erro ao excluir paciente")
          return
        }

        alert("Paciente excluído com sucesso!")
        router.push("/pacientes")
      } catch (error) {
        console.error("Erro:", error)
        alert("Erro ao excluir paciente")
      }
    }
  }

  const formatarData = (data: string) => {
    if (!data) return "-"
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return "-"
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return `${idade} anos`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
            <Link href="/pacientes" className="text-blue-600 hover:underline">
              Voltar para lista de pacientes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/pacientes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Dados do Paciente</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/pacientes/${paciente.id}/editar`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleExcluir}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                <p className="text-lg">{paciente.nome || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">CPF</label>
                <p className="text-lg">{paciente.cpf || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">RG</label>
                <p className="text-lg">{paciente.rg || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
                <p className="text-lg">{formatarData(paciente.data_nascimento)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Idade</label>
                <p className="text-lg">{calcularIdade(paciente.data_nascimento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </label>
              <p className="text-lg">{paciente.telefone || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-lg">{paciente.email || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Endereço</label>
                <p className="text-lg">{paciente.endereco || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cidade</label>
                <p className="text-lg">{paciente.cidade || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <p className="text-lg">{paciente.estado || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">CEP</label>
                <p className="text-lg">{paciente.cep || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Convênio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Convênio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Convênio</label>
              <p className="text-lg">
                {paciente.convenio ? <Badge variant="secondary">{paciente.convenio}</Badge> : "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Número do Convênio</label>
              <p className="text-lg">{paciente.numero_convenio || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {paciente.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{paciente.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="font-medium">Cadastrado em:</label>
                <p>{formatarData(paciente.created_at)}</p>
              </div>
              <div>
                <label className="font-medium">Última atualização:</label>
                <p>{formatarData(paciente.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
