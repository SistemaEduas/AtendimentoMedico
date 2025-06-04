"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-1 sm:space-x-1 sm:space-y-0",
        month: "space-y-1",
        caption: "hidden", // Esconder completamente o cabeçalho
        caption_label: "hidden", // Esconder o título do mês/ano
        nav: "hidden", // Esconder a navegação
        nav_button: "hidden", // Esconder os botões de navegação
        nav_button_previous: "hidden", // Esconder o botão anterior
        nav_button_next: "hidden", // Esconder o botão próximo
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] py-2",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative hover:bg-gray-50 rounded-md transition-colors focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-medium",
        day_today: "bg-accent text-accent-foreground font-medium",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        day_withVacancy: "text-emerald-700 font-medium",
        day_withoutVacancy: "text-red-700 font-medium",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        ...props.components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
