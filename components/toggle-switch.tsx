"use client"

import { useState, useEffect } from "react"

interface ToggleSwitchProps {
  id?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleSwitch({ id, checked = false, onChange, disabled = false }: ToggleSwitchProps) {
  const [isChecked, setIsChecked] = useState(checked)

  // Atualizar o estado interno quando a prop checked mudar
  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleChange = () => {
    if (disabled) return

    const newValue = !isChecked
    setIsChecked(newValue)

    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div
      className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${
        isChecked ? "bg-green-500" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onClick={handleChange}
      role="switch"
      aria-checked={isChecked}
      aria-disabled={disabled}
      id={id}
    >
      <span
        className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform ${
          isChecked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  )
}
