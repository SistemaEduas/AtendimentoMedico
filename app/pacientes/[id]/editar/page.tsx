"use client"

import type React from "react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
}

export default function EditarPacientePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Paciente>({
    id: "",
    nome: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    convenio: "",
    numero_convenio: "",
    observacoes: "",
  })

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

        // Formatar data para input date
        const dataFormatada = data.data_nascimento ? new Date(data.data_nascimento).toISOString().split("T")[0] : ""

        setFormData({
          ...data,
          data_nascimento: dataFormatada,
        })
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarPaciente()
  }, [supabase, params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instanciaId || !formData.id) return

    setSaving(true)

    try {
      // Preparar dados para atualização
      const dadosAtualizacao = {
        nome: formData.nome,
        cpf: formData.cpf,
        rg: formData.rg,
        data_nascimento: formData.data_nascimento || null,
        telefone: formData.telefone,
        email: formData.email,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        convenio: formData.convenio,
        numero_convenio: formData.numero_convenio,
        observacoes: formData.observacoes,
      }

      const { error } = await supabase
        .from("pacientes")
        .update(dadosAtualizacao)
        .eq("id", formData.id)
        .eq("instancia_id", instanciaId)

      if (error) {
        console.error("Erro ao atualizar paciente:", error)
        alert("Erro ao atualizar paciente")
        return
      }

      alert("Paciente atualizado com sucesso!")
      router.push(`/pacientes/${formData.id}`)
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar paciente")
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/pacientes/${formData.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Paciente</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" name="nome" value={formData.nome} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" name="rg" value={formData.rg} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Rua, número, complemento"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  placeholder="SP"
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Convênio */}
        <Card>
          <CardHeader>
            <CardTitle>Convênio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="convenio">Convênio</Label>
                <Input
                  id="convenio"
                  name="convenio"
                  value={formData.convenio}
                  onChange={handleInputChange}
                  placeholder="Nome do convênio"
                />
              </div>
              <div>
                <Label htmlFor="numero_convenio">Número do Convênio</Label>
                <Input
                  id="numero_convenio"
                  name="numero_convenio"
                  value={formData.numero_convenio}
                  onChange={handleInputChange}
                  placeholder="Número da carteirinha"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="observacoes">Observações Gerais</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              placeholder="Informações adicionais sobre o paciente..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-end">
          <Link href={`/pacientes/${formData.id}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
