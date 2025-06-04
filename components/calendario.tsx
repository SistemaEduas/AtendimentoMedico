"use client"

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarioProps {
  diasDisponiveis?: string[]
  onSelectDate?: (date: Date) => void
  initialMonth?: Date
}

export function Calendario({ diasDisponiveis = [], onSelectDate, initialMonth = new Date() }: CalendarioProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Gerar dias do mês atual
  const diasDoMes = []
  const primeiroDia = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const ultimoDia = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  // Preencher dias do mês anterior para completar a primeira semana
  const diaDaSemanaInicial = primeiroDia.getDay() // 0 = Domingo, 1 = Segunda, etc.
  for (let i = 0; i < diaDaSemanaInicial; i++) {
    const dia = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -i)
    diasDoMes.unshift({
      data: dia,
      diaDoMes: dia.getDate(),
      mesAtual: false,
      disponivel: false,
    })
  }

  // Preencher dias do mês atual
  for (let i = 1; i <= ultimoDia.getDate(); i++) {
    const dia = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
    const dataFormatada = format(dia, "yyyy-MM-dd")
    diasDoMes.push({
      data: dia,
      diaDoMes: i,
      mesAtual: true,
      disponivel: diasDisponiveis.includes(dataFormatada),
    })
  }

  // Preencher dias do próximo mês para completar a última semana
  const diasRestantes = 42 - diasDoMes.length // 6 semanas * 7 dias = 42
  for (let i = 1; i <= diasRestantes; i++) {
    const dia = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i)
    diasDoMes.push({
      data: dia,
      diaDoMes: i,
      mesAtual: false,
      disponivel: false,
    })
  }

  // Agrupar dias em semanas
  const semanas = []
  for (let i = 0; i < diasDoMes.length; i += 7) {
    semanas.push(diasDoMes.slice(i, i + 7))
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-center mb-4">Selecione uma Data</h2>

      <div className="flex justify-center gap-8 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-400 mr-2"></div>
          <span>Dias com vagas disponíveis</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-300 mr-2"></div>
          <span>Dias sem vagas disponíveis</span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <button onClick={prevMonth} className="p-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-medium mx-4">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h3>
        <button onClick={nextMonth} className="p-1">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, index) => (
          <div key={index} className="text-center py-2 text-gray-600">
            {dia}
          </div>
        ))}

        {/* Dias do mês */}
        {semanas.map((semana, semanaIndex) =>
          semana.map((dia, diaIndex) => (
            <div
              key={`${semanaIndex}-${diaIndex}`}
              className={`
                border rounded-md p-2 text-center min-h-[70px] flex flex-col items-center
                ${!dia.mesAtual ? "text-gray-300 bg-gray-50" : ""}
                ${dia.disponivel && dia.mesAtual ? "bg-green-50" : ""}
                ${dia.mesAtual && onSelectDate ? "cursor-pointer hover:bg-gray-50" : ""}
              `}
              onClick={() => {
                if (dia.mesAtual && onSelectDate) {
                  onSelectDate(dia.data)
                }
              }}
            >
              <span className="text-lg">{dia.diaDoMes}</span>
              {dia.disponivel && dia.mesAtual && <span className="text-green-600 text-sm mt-1">Disponível</span>}
            </div>
          )),
        )}
      </div>
    </div>
  )
}
