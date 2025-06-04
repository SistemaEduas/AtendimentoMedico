"use client"

import type React from "react"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "date-fns/locale"

interface SimpleCalendarProps {
  mode?: "single"
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  className?: string
  fromDate?: Date
  toDate?: Date
  disabled?: (date: Date) => boolean
  footer?: React.ReactNode
  availableDays?: Date[]
  unavailableDays?: Date[]
  initialFocus?: boolean
  month?: Date
  onMonthChange?: (month: Date) => void
  hideNavigation?: boolean
}

export function SimpleCalendar({
  mode = "single",
  selected,
  onSelect,
  className,
  fromDate,
  toDate,
  disabled,
  footer,
  availableDays,
  unavailableDays,
  initialFocus,
  month: externalMonth,
  onMonthChange: externalOnMonthChange,
  hideNavigation = false,
}: SimpleCalendarProps) {
  const [internalMonth, setInternalMonth] = useState<Date>(selected || new Date())

  // Use either external or internal state for month
  const month = externalMonth || internalMonth
  const onMonthChange = externalOnMonthChange || setInternalMonth

  // Modifiers para dias com e sem vagas
  const modifiers = {
    withVacancy: availableDays || [],
    withoutVacancy: unavailableDays || [],
  }

  // Estilos para os modifiers
  const modifiersStyles = {
    withVacancy: { color: "green" },
    withoutVacancy: { color: "red" },
  }

  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      locale={ptBR}
      weekStartsOn={0}
      month={month}
      onMonthChange={onMonthChange}
      fromDate={fromDate}
      toDate={toDate}
      disabled={disabled}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      showOutsideDays
      initialFocus={initialFocus}
      footer={footer}
      className={`w-full ${className}`}
      classNames={{
        months: "flex flex-col w-full",
        month: "w-full",
        caption: "hidden", // Esconder completamente o caption
        caption_label: "hidden", // Esconder o label
        nav: "hidden", // Esconder a navegação
        nav_button: "hidden", // Esconder os botões de navegação
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] px-2 text-center",
        row: "flex w-full mt-2",
        cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 px-2",
        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
    />
  )
}
