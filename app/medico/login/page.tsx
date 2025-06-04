"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"

export default function LoginMedicoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    usuario: "",
    senha: "",
  })
  const [instanciaNome, setInstanciaNome] = useState<string | null>(null)
  const [instanciaId, setInstanciaId] = useState<string | null>(null)

  useEffect(() => {
    // Verificar se há uma instância autenticada
    const nome = sessionStorage.getItem("instanciaNome")
    const id = sessionStorage.getItem("instanciaId")

    setInstanciaNome(nome)
    setInstanciaId(id)

    // Se não houver instância autenticada, redirecionar para o login geral
    if (!id) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login no sistema primeiro.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Verificar se as credenciais estão corretas
      const { data: medico, error: medicoError } = await supabase
        .from("medicos_auth")
        .select("*, medicos(id, nome, especialidade)")
        .eq("email", formData.usuario)
        .eq("instancia_id", instanciaId)
        .single()

      if (medicoError || !medico) {
        throw new Error("Credenciais inválidas ou médico não vinculado a esta instância")
      }

      // Verificar a senha (em um sistema real, você usaria bcrypt ou similar)
      if (medico.senha !== formData.senha) {
        throw new Error("Credenciais inválidas")
      }

      // Armazenar informações do médico na sessão
      sessionStorage.setItem("medicoAuthId", medico.id || "")
      sessionStorage.setItem("medicoId", medico.medico_id || "")
      sessionStorage.setItem("medicoNome", medico.nome || "")
      sessionStorage.setItem("medicoEmail", medico.email || "")
      sessionStorage.setItem("medicoAutenticado", "true")
      // Garantir que o ID da instância esteja disponível
      if (instanciaId) {
        sessionStorage.setItem("instanciaId", instanciaId)
      }

      toast({
        title: "Login realizado com sucesso",
      })

      // Verificar se há um redirecionamento pendente
      const redirecionamento = sessionStorage.getItem("redirecionarAposLogin")
      if (redirecionamento) {
        // Limpar o redirecionamento da sessão
        sessionStorage.removeItem("redirecionarAposLogin")
        // Redirecionar para a página especificada
        router.push(redirecionamento)
      } else {
        // Redirecionar para a área do médico (comportamento padrão)
        router.push("/medico/area/agendamentos")
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!instanciaId) {
    return (
      <div className="p-6 text-center">
        <p>Redirecionando para o login principal...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold">Login do Médico</h1>
        </div>

        {instanciaNome && (
          <div className="mb-4 text-center">
            <p className="text-lg font-medium">{instanciaNome}</p>
            <p className="text-sm text-muted-foreground">Acesso restrito para médicos</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input id="usuario" name="usuario" value={formData.usuario} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
