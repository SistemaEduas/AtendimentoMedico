"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ExcluirMedicoProps {
  id: string
}

export function ExcluirMedico({ id }: ExcluirMedicoProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [open, setOpen] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const excluirMedico = async () => {
    setExcluindo(true)
    try {
      const { error } = await supabase.from("medicos").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Médico excluído com sucesso",
      })

      // Fechar o diálogo e atualizar a página
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao excluir médico:", error)
      toast({
        title: "Erro ao excluir médico",
        description: error.message || "Não foi possível excluir o médico.",
        variant: "destructive",
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Excluir
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir médico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este médico? Esta ação não pode ser desfeita e todos os dados relacionados
              a este médico serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluirMedico}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
