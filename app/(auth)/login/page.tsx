// Este componente usa o layout definido em app/(auth)/layout.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  // Atualizar o estado do formulário para usar "usuario" em vez de "email"
  const [formData, setFormData] = useState({
    usuario: "",
    senha: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      // Atualizar a consulta ao banco de dados para usar "usuario" em vez de "email"
      const { data: instancia, error } = await supabase
        .from("instancias")
        .select("*")
        .eq("usuario", formData.usuario)
        .eq("senha", formData.senha)
        .eq("ativo", true)
        .single()

      if (error || !instancia) {
        throw new Error("Credenciais inválidas")
      }

      // Verificar se algum médico da instância tem acesso liberado
      const { data: medicosAuth, error: medicosAuthError } = await supabase
        .from("medicos_auth")
        .select("acesso_liberado")
        .eq("instancia_id", instancia.id)
        .eq("acesso_liberado", true)
        .limit(1)

      // Definir o status de acesso aos agendamentos
      const acessoAgendamentosLiberado = !medicosAuthError && medicosAuth && medicosAuth.length > 0

      // Armazenar informações da instância na sessão
      sessionStorage.setItem("instanciaId", instancia.id)
      sessionStorage.setItem("instanciaNome", instancia.nome)
      sessionStorage.setItem("instanciaSlug", instancia.slug)
      sessionStorage.setItem("instanciaAutenticada", "true")
      sessionStorage.setItem("acessoAgendamentosLiberado", acessoAgendamentosLiberado ? "true" : "false")

      console.log("Acesso aos agendamentos liberado:", acessoAgendamentosLiberado)

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo ao sistema ${instancia.nome}`,
      })

      // Redirecionar para a página inicial do sistema
      router.push("/agendamentos")
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

  // Tornar a página de login responsiva

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sistema Médico</CardTitle>
            <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Atualizar o campo de entrada para usar "usuario" em vez de "email" */}
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  name="usuario"
                  placeholder="seu_usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  required
                />
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
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">Sistema de Gerenciamento de Clínica Médica</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
