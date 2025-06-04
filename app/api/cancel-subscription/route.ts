import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Stripe from "stripe"

// Função auxiliar para garantir que sempre retornamos JSON
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function POST(request: Request) {
  try {
    // Verificar se a chave do Stripe está configurada
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY não está configurada")
      return jsonResponse({ error: "Configuração de pagamento incompleta" }, 500)
    }

    // Inicializar Stripe com sua chave secreta
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    // Extrair dados do corpo da requisição
    let body
    try {
      body = await request.json()
    } catch (e) {
      return jsonResponse({ error: "Corpo da requisição inválido" }, 400)
    }

    const { subscriptionId } = body

    if (!subscriptionId) {
      return jsonResponse({ error: "ID da assinatura é obrigatório" }, 400)
    }

    const supabase = createServerComponentClient({ cookies })

    // Verificar se a assinatura existe no banco de dados
    const { data: assinaturaExistente, error: dbError } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single()

    if (dbError) {
      console.error("Erro ao buscar assinatura no banco de dados:", dbError)
      return jsonResponse({ error: "Assinatura não encontrada no banco de dados" }, 404)
    }

    // Verificar se a assinatura já está cancelada
    if (assinaturaExistente.canceled_at) {
      return jsonResponse({
        success: true,
        message: "Assinatura já está cancelada",
        alreadyCanceled: true,
      })
    }

    try {
      // Tentar cancelar a assinatura no Stripe (cancelamento imediato)
      try {
        await stripe.subscriptions.cancel(subscriptionId)
        console.log("Assinatura cancelada no Stripe com sucesso")
      } catch (stripeError: any) {
        // Se a assinatura não existir no Stripe, apenas atualizamos nosso banco de dados
        if (stripeError.code === "resource_missing" || stripeError.message.includes("No such subscription")) {
          console.log("Assinatura não encontrada no Stripe, atualizando apenas o banco de dados")
        } else {
          // Se for outro erro do Stripe, repassamos
          throw stripeError
        }
      }

      // Atualizar no banco de dados: marcar como cancelada mas manter status ativo até o período expirar
      await supabase
        .from("assinaturas")
        .update({
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Mantém o status como "active" para que o usuário continue tendo acesso até o período expirar
        })
        .eq("subscription_id", subscriptionId)

      return jsonResponse({
        success: true,
        message: "Assinatura cancelada com sucesso. Você manterá acesso até o final do período contratado.",
      })
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error)

      // Tratamento específico para erros comuns
      if (error.type === "StripeInvalidRequestError") {
        return jsonResponse(
          {
            error: "Não foi possível cancelar a assinatura no Stripe. A assinatura pode já estar cancelada.",
            details: error.message,
          },
          400,
        )
      }

      return jsonResponse({ error: "Erro ao cancelar assinatura", details: error.message }, 500)
    }
  } catch (error: any) {
    console.error("Erro não tratado ao cancelar assinatura:", error)
    return jsonResponse({ error: "Erro interno do servidor", details: error.message }, 500)
  }
}
