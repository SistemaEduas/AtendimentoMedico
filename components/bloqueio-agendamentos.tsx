"use client"

import { useState } from "react"
import Link from "next/link"

export function BloqueioAgendamentos() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-red-500 mb-4">Acesso Bloqueado</h2>
        <p className="mb-6 text-gray-700">
          O acesso ao módulo de agendamentos está temporariamente indisponível. Entre em contato com o administrador
          para liberar o acesso.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setVisible(false)}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Fechar
          </button>
          <Link href="/" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center">
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  )
}
