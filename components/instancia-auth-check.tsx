"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface InstanciaAuthCheckProps {
  children: React.ReactNode
}

export function InstanciaAuthCheck({ children }: InstanciaAuthCheckProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAutenticado, setIsAutenticado] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se estamos em uma rota de autenticação ou admin
    if (pathname.startsWith("/login") || pathname.startsWith("/admin-secreto") || pathname.startsWith("/medico")) {
      setIsAutenticado(true)
      setIsLoading(false)
      return
    }

    const instanciaAutenticada = sessionStorage.getItem("instanciaAutenticada")
    const instanciaId = sessionStorage.getItem("instanciaId")

    if (instanciaAutenticada !== "true" || !instanciaId) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsAutenticado(true)
    setIsLoading(false)
  }, [router, pathname])

  if (isLoading) {
    return <div className="p-6 text-center">Verificando autenticação...</div>
  }

  if (!isAutenticado) {
    return null
  }

  return <>{children}</>
}
