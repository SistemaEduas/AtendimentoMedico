import { AlertaAssinatura } from "@/components/alerta-assinatura"

export default function TesteAlertaPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Página de Teste do Alerta</h1>
      <p className="mb-4">Esta página é usada para testar o componente AlertaAssinatura.</p>

      <AlertaAssinatura
        titulo="Teste de Alerta"
        descricao="Este é um teste do componente AlertaAssinatura. Se você está vendo esta mensagem, o componente está funcionando corretamente."
      />
    </div>
  )
}
