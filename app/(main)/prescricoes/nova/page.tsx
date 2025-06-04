"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

export default function NovaPrescricaoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [pacientes, setPacientes] = useState<any[]>([])
  const [pacienteId, setPacienteId] = useState<string>("")

  useEffect(() => {
    async function carregarDados() {
      const { data: pacientesData } = await supabase.from("pacientes").select("id, nome").order("nome")
      if (pacientesData) setPacientes(pacientesData)
    }

    carregarDados()
  }, [supabase])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    if (!pacienteId) {
      setIsLoading(false)
      return toast({
        title: "Erro ao criar prescrição",
        description: "Selecione um paciente",
        variant: "destructive",
      })
    }

    const descricao = (event.currentTarget.elements.namedItem("descricao") as HTMLTextAreaElement)?.value || ""

    // Buscar o primeiro médico disponível (temporário)
    const { data: medicos } = await supabase.from("medicos").select("id").limit(1)
    const medicoId = medicos && medicos.length > 0 ? medicos[0].id : null

    if (!medicoId) {
      setIsLoading(false)
      return toast({
        title: "Erro ao criar prescrição",
        description: "Não há médicos cadastrados no sistema",
        variant: "destructive",
      })
    }

    const novaPrescricao = {
      paciente_id: pacienteId,
      medico_id: medicoId, // Usando o primeiro médico disponível
      descricao: descricao,
    }

    const { error } = await supabase.from("prescricoes").insert([novaPrescricao])

    setIsLoading(false)

    if (error) {
      return toast({
        title: "Erro ao criar prescrição",
        description: error.message,
        variant: "destructive",
      })
    }

    toast({
      title: "Prescrição criada com sucesso",
    })

    // Voltar para a página anterior
    router.back()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Nova Prescrição</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Prescrição</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select value={pacienteId} onValueChange={setPacienteId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Prescrição *</Label>
                <Textarea id="descricao" name="descricao" placeholder="Digite a prescrição médica" rows={10} required />
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
