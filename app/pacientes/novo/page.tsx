"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

export default function NovoPacientePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const retornoParam = searchParams.get("retorno")

  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [numeroIdentificacao, setNumeroIdentificacao] = useState("")
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  // Obter o ID da instância e gerar número de identificação ao carregar a página
  useEffect(() => {
    const id = sessionStorage.getItem("instanciaId")
    setInstanciaId(id)
    gerarNumeroIdentificacao()
  }, [])

  // Função para gerar um número de identificação único
  const gerarNumeroIdentificacao = () => {
    // Gerar um número baseado na data atual + 4 dígitos aleatórios
    const timestamp = new Date().getTime().toString().slice(-6) // Últimos 6 dígitos do timestamp
    const random = Math.floor(1000 + Math.random() * 9000) // Número aleatório de 4 dígitos
    const novoNumero = `${timestamp}${random}`
    setNumeroIdentificacao(novoNumero)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    if (!instanciaId) {
      toast({
        title: "Erro ao cadastrar paciente",
        description: "Sessão expirada. Faça login novamente.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    const formData = new FormData(event.currentTarget)

    const novoPaciente = {
      nome: formData.get("nome") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      cpf: formData.get("cpf") as string,
      data_nascimento: formData.get("data_nascimento") as string,
      endereco: formData.get("endereco") as string,
      convenio: formData.get("convenio") as string,
      numero_convenio: formData.get("numero_convenio") as string,
      numero_identificacao: numeroIdentificacao,
      instancia_id: instanciaId, // Adicionar o ID da instância
    }

    const { data, error } = await supabase.from("pacientes").insert([novoPaciente]).select()

    setIsLoading(false)

    if (error) {
      return toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      })
    }

    toast({
      title: "Paciente cadastrado com sucesso",
    })

    // Se veio da página de agendamento, retornar para lá com o paciente selecionado
    if (retornoParam === "agendamento" && data && data.length > 0) {
      const pacienteCriado = data[0]

      // Armazenar o ID do paciente para ser usado na página de agendamento
      sessionStorage.setItem("paciente_selecionado_id", pacienteCriado.id)
      sessionStorage.setItem("paciente_selecionado_nome", pacienteCriado.nome)
      sessionStorage.setItem("paciente_selecionado_numero", pacienteCriado.numero_identificacao || "")

      router.push("/agendamentos/novo")
      return
    }

    // Voltar para a página anterior
    router.back()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Novo Paciente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_identificacao">Número de Identificação *</Label>
                <Input
                  id="numero_identificacao"
                  name="numero_identificacao"
                  value={numeroIdentificacao}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">Gerado automaticamente</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" name="nome" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" name="telefone" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input id="data_nascimento" name="data_nascimento" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" name="endereco" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="convenio">Convênio</Label>
                <Input id="convenio" name="convenio" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_convenio">Número do Convênio</Label>
                <Input id="numero_convenio" name="numero_convenio" />
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
