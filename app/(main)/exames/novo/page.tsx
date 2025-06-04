"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

export default function NovoExamePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [pacientes, setPacientes] = useState<any[]>([])
  const [medicos, setMedicos] = useState<any[]>([])
  const [pacienteId, setPacienteId] = useState<string>("")
  const [medicoId, setMedicoId] = useState<string>("")
  const [tipoExame, setTipoExame] = useState<string>("")

  useEffect(() => {
    async function carregarDados() {
      const { data: pacientesData } = await supabase.from("pacientes").select("id, nome").order("nome")
      const { data: medicosData } = await supabase.from("medicos").select("id, nome, especialidade").order("nome")

      if (pacientesData) setPacientes(pacientesData)
      if (medicosData) setMedicos(medicosData)
    }

    carregarDados()
  }, [supabase])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    if (!pacienteId || !medicoId || !tipoExame) {
      setIsLoading(false)
      return toast({
        title: "Erro ao solicitar exame",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive",
      })
    }

    const novoExame = {
      paciente_id: pacienteId,
      medico_id: medicoId,
      tipo_exame: tipoExame,
      status: "solicitado",
    }

    const { error } = await supabase.from("exames").insert([novoExame])

    setIsLoading(false)

    if (error) {
      return toast({
        title: "Erro ao solicitar exame",
        description: error.message,
        variant: "destructive",
      })
    }

    toast({
      title: "Exame solicitado com sucesso",
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
        <h1 className="text-3xl font-bold">Solicitar Novo Exame</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Exame</CardTitle>
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
                <Label htmlFor="medico_id">Médico Solicitante *</Label>
                <Select value={medicoId} onValueChange={setMedicoId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicos.map((medico) => (
                      <SelectItem key={medico.id} value={medico.id}>
                        {medico.nome} - {medico.especialidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_exame">Tipo de Exame *</Label>
                <Input
                  id="tipo_exame"
                  name="tipo_exame"
                  placeholder="Ex: Hemograma, Raio-X, Ultrassom"
                  value={tipoExame}
                  onChange={(e) => setTipoExame(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">* Campos obrigatórios</p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Solicitar Exame"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
