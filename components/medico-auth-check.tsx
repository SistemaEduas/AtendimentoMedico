"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface MedicoAuthCheckProps {
  children: React.ReactNode
}

export function MedicoAuthCheck({ children }: MedicoAuthCheckProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isAutenticado, setIsAutenticado] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Modificar a função verificarAutenticacao para usar maybeSingle() em vez de single()
    // e melhorar o tratamento de erros

    const verificarAutenticacao = async () => {
      const medicoAutenticado = sessionStorage.getItem("medicoAutenticado")
      const medicoEmail = sessionStorage.getItem("medicoEmail")
      const medicoId = sessionStorage.getItem("medicoId")
      const medicoAuthId = sessionStorage.getItem("medicoAuthId") // Adicionar esta linha
      const instanciaId = sessionStorage.getItem("instanciaId")

      if (medicoAutenticado !== "true" || !medicoEmail || !medicoId) {
        toast({
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar esta página.",
          variant: "destructive",
        })
        router.push("/medico/login")
        return
      }

      // Verificar se o médico está vinculado à instância atual
      if (instanciaId) {
        try {
          // Usar medicoAuthId em vez de medicoId e maybeSingle() em vez de single()
          const { data: medicoAuth, error } = await supabase
            .from("medicos_auth")
            .select("instancia_id")
            .eq("id", medicoAuthId || medicoId) // Usar medicoAuthId se disponível, senão usar medicoId
            .maybeSingle()

          if (error) throw error

          // Se não encontrou o médico ou se ele não está vinculado à instância atual
          if (!medicoAuth || !medicoAuth.instancia_id || medicoAuth.instancia_id !== instanciaId) {
            toast({
              title: "Acesso negado",
              description: "Você não tem permissão para acessar esta instância.",
              variant: "destructive",
            })
            router.push("/medico/login")
            return
          }
        } catch (error) {
          console.error("Erro ao verificar vínculo do médico:", error)
          toast({
            title: "Erro de autenticação",
            description: "Ocorreu um erro ao verificar suas permissões. Por favor, faça login novamente.",
            variant: "destructive",
          })
          router.push("/medico/login")
          return
        }
      }

      setIsAutenticado(true)
      setIsLoading(false)
    }

    verificarAutenticacao()
  }, [router, supabase])

  if (isLoading) {
    return <div className="p-6 text-center">Verificando autenticação...</div>
  }

  if (!isAutenticado) {
    return null
  }

  return <>{children}</>
}
