"use client"

import { useState, useEffect, type ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BloqueioAssinatura } from "./bloqueio-assinatura"
import { usePathname } from "next/navigation"

interface AssinaturaGlobalCheckProps {
  children: ReactNode
}

export function AssinaturaGlobalCheck({ children }: AssinaturaGlobalCheckProps) {
  const supabase = createClientComponentClient()
  const [temAcesso, setTemAcesso] = useState<boolean | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [ehMedico, setEhMedico] = useState(false)
  const [medicoId, setMedicoId] = useState<string | null>(null)
  const [medicoAuthId, setMedicoAuthId] = useState<string | null>(null)
  const pathname = usePathname()

  // Verificar se está na página de assinatura
  const ehPaginaAssinatura = pathname === "/medico/area/assinatura"

  // Função para verificar se o período da assinatura ainda é válido
  function periodoAssinaturaValido(assinatura: any): boolean {
    if (!assinatura.current_period_end) return false

    const periodoFinal = new Date(assinatura.current_period_end)
    const agora = new Date()

    return agora <= periodoFinal
  }

  // Função para verificar acesso
  async function verificarAcesso() {
    setCarregando(true)

    // Verificar se é um médico logado
    const medicoAutenticado = sessionStorage.getItem("medicoAutenticado")
    const medId = sessionStorage.getItem("medicoId")
    const medAuthId = sessionStorage.getItem("medicoAuthId")

    // Se não for um médico logado, permitir acesso
    if (medicoAutenticado !== "true" || !medId) {
      setEhMedico(false)
      setTemAcesso(true)
      setCarregando(false)
      return
    }

    // É um médico, então verificar acesso
    setEhMedico(true)
    setMedicoId(medId)
    setMedicoAuthId(medAuthId)

    // Se estiver na página de assinatura, permitir acesso independentemente do status
    if (ehPaginaAssinatura) {
      setTemAcesso(true)
      setCarregando(false)
      return
    }

    try {
      // Verificar se o médico tem uma assinatura ativa (incluindo canceladas mas ainda no período)
      const { data: assinaturas, error: assinaturaError } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("medico_id", medId)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (!assinaturaError && assinaturas && assinaturas.length > 0) {
        // Verificar se alguma assinatura ainda está no período válido
        const assinaturaValida = assinaturas.find((assinatura) => periodoAssinaturaValido(assinatura))

        if (assinaturaValida) {
          console.log("Médico tem assinatura com período válido")
          setTemAcesso(true)
          setCarregando(false)
          return
        }

        // Se nenhuma assinatura está no período válido, atualizar status das expiradas
        const assinaturasExpiradas = assinaturas.filter((assinatura) => !periodoAssinaturaValido(assinatura))

        for (const assinatura of assinaturasExpiradas) {
          console.log("Atualizando assinatura expirada:", assinatura.id)
          await supabase
            .from("assinaturas")
            .update({
              status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", assinatura.id)
        }
      }

      // Verificar acesso liberado na tabela medicos_auth
      if (medAuthId) {
        const { data: medicoAuth, error: errorAuth } = await supabase
          .from("medicos_auth")
          .select("acesso_liberado")
          .eq("id", medAuthId)
          .maybeSingle()

        if (!errorAuth && medicoAuth && medicoAuth.acesso_liberado) {
          console.log("Médico tem acesso liberado na tabela medicos_auth")
          setTemAcesso(true)
          setCarregando(false)
          return
        }
      }

      // Se chegou até aqui, não tem acesso
      console.log("Médico não tem acesso liberado nem assinatura válida")
      setTemAcesso(false)
    } catch (error) {
      console.error("Erro ao verificar acesso:", error)
      // Em caso de erro, permitimos o acesso para não bloquear o usuário
      setTemAcesso(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    verificarAcesso()
  }, [supabase, ehPaginaAssinatura])

  if (carregando) {
    return (
      <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não é médico, tem acesso ou está na página de assinatura, mostrar conteúdo normal
  if (!ehMedico || temAcesso) {
    return <>{children}</>
  }

  // Se é médico e não tem acesso, mostrar bloqueio
  return (
    <BloqueioAssinatura
      titulo="Acesso Bloqueado"
      descricao="Seu período de acesso expirou. Por favor, assine um novo plano ou entre em contato com o administrador para liberar seu acesso."
    >
      {children}
    </BloqueioAssinatura>
  )
}
