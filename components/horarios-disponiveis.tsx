"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HorariosDisponiveisProps {
  data: Date
  onSelectHorario: (horario: string) => void
  horariosOcupados?: string[]
}

export function HorariosDisponiveis({ data, onSelectHorario, horariosOcupados = [] }: HorariosDisponiveisProps) {
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)

  // Gerar horários das 08:00 às 17:00 com intervalos de 30 minutos
  const gerarHorarios = () => {
    const horarios = []
    const inicio = 8 // 8:00
    const fim = 17 // 17:00
    const intervalo = 30 // 30 minutos

    for (let hora = inicio; hora <= fim; hora++) {
      for (let minuto = 0; minuto < 60; minuto += intervalo) {
        // Pular 17:30
        if (hora === fim && minuto > 0) continue

        horarios.push(`${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`)
      }
    }

    return horarios
  }

  const horarios = gerarHorarios()

  const handleSelectHorario = (horario: string) => {
    setHorarioSelecionado(horario)
    onSelectHorario(horario)
  }

  const isHorarioOcupado = (horario: string) => {
    return horariosOcupados.includes(horario)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários Disponíveis - {format(data, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {horarios.map((horario) => (
            <Button
              key={horario}
              variant={horarioSelecionado === horario ? "default" : "outline"}
              className={isHorarioOcupado(horario) ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
              onClick={() => !isHorarioOcupado(horario) && handleSelectHorario(horario)}
              disabled={isHorarioOcupado(horario)}
            >
              {horario}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
