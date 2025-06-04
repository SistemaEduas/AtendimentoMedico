"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"

export default function NovoMedicoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    crm: "",
    especialidade: "",
    email: "",
    telefone: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    if (!formData.nome || !formData.crm || !formData.especialidade) {
      setIsLoading(false)
      return toast({
        title: "Erro ao cadastrar médico",
        description: "Nome, CRM e especialidade são obrigatórios",
        variant: "destructive",
      })
    }

    const { error } = await supabase.from("medicos").insert([formData])

    setIsLoading(false)

    if (error) {
      return toast({
        title: "Erro ao cadastrar médico",
        description: error.message,
        variant: "destructive",
      })
    }

    toast({
      title: "Médico cadastrado com sucesso",
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
        <h1 className="text-3xl font-bold">Novo Médico</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Médico</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm">CRM *</Label>
                <Input id="crm" name="crm" value={formData.crm} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade *</Label>
                <Input
                  id="especialidade"
                  name="especialidade"
                  value={formData.especialidade}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} />
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
