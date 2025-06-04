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

    // Verificar se a chave do webhook está configurada
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET não está configurada")
      return jsonResponse({ error: "Configuração de webhook incompleta" }, 500)
    }

    // Inicializar Stripe com sua chave secreta
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    const payload = await request.text()
    const sig = request.headers.get("stripe-signature") || ""

    let event

    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`)
      return jsonResponse({ error: `Webhook Error: ${err.message}` }, 400)
    }

    const supabase = createServerComponentClient({ cookies })

    // Processar eventos do Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const medicoId = session.metadata?.medicoId
        const instanciaId = session.metadata?.instanciaId
        const type = session.metadata?.type

        // Obter detalhes da assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const paymentMethod = await stripe.paymentMethods.retrieve(subscription.default_payment_method as string)

        if (type === "instancia" && instanciaId) {
          console.log("Processando assinatura de instância:", instanciaId)

          try {
            // Verificar se a tabela existe
            const { error: tableCheckError } = await supabase
              .from("assinaturas_instancia")
              .select("id")
              .limit(1)
              .maybeSingle()

            if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
              // Salvar informações da assinatura no banco de dados
              await supabase.from("assinaturas_instancia").insert({
                instancia_id: instanciaId,
                customer_id: customerId,
                subscription_id: subscriptionId,
                status: subscription.status,
                plan: "mensal",
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                payment_method: paymentMethod.type,
                last_4: paymentMethod.card?.last4,
                amount: subscription.items.data[0].price.unit_amount,
                currency: subscription.currency,
              })
            }
          } catch (error) {
            console.error("Erro ao salvar assinatura de instância:", error)
          }
        } else if (medicoId) {
          console.log("Processando assinatura de médico:", medicoId)

          // Salvar informações da assinatura no banco de dados
          await supabase.from("assinaturas").insert({
            medico_id: medicoId,
            customer_id: customerId,
            subscription_id: subscriptionId,
            status: subscription.status,
            plan: "mensal",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            payment_method: paymentMethod.type,
            last_4: paymentMethod.card?.last4,
            amount: subscription.items.data[0].price.unit_amount,
            currency: subscription.currency,
          })
        } else {
          console.error("ID do médico ou instância não encontrado nos metadados da sessão")
          return jsonResponse({ error: "ID do médico ou instância não encontrado" }, 400)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        const customerId = invoice.customer as string

        // Atualizar informações da assinatura no banco de dados
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Verificar se é uma assinatura de instância ou médico
        const { data: assinaturaMedico } = await supabase
          .from("assinaturas")
          .select("id")
          .eq("subscription_id", subscriptionId)
          .maybeSingle()

        if (assinaturaMedico) {
          // Atualizar assinatura de médico
          await supabase
            .from("assinaturas")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("subscription_id", subscriptionId)
        } else {
          // Verificar se a tabela de assinaturas de instância existe
          const { error: tableCheckError } = await supabase
            .from("assinaturas_instancia")
            .select("id")
            .limit(1)
            .maybeSingle()

          if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
            // Atualizar assinatura de instância
            await supabase
              .from("assinaturas_instancia")
              .update({
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("subscription_id", subscriptionId)
          }
        }

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        // Verificar se é uma assinatura de instância ou médico
        const { data: assinaturaMedico } = await supabase
          .from("assinaturas")
          .select("id")
          .eq("subscription_id", subscription.id)
          .maybeSingle()

        if (assinaturaMedico) {
          // Atualizar assinatura de médico
          await supabase
            .from("assinaturas")
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("subscription_id", subscription.id)
        } else {
          // Verificar se a tabela de assinaturas de instância existe
          const { error: tableCheckError } = await supabase
            .from("assinaturas_instancia")
            .select("id")
            .limit(1)
            .maybeSingle()

          if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
            // Atualizar assinatura de instância
            await supabase
              .from("assinaturas_instancia")
              .update({
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("subscription_id", subscription.id)
          }
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Verificar se é uma assinatura de instância ou médico
        const { data: assinaturaMedico } = await supabase
          .from("assinaturas")
          .select("id")
          .eq("subscription_id", subscription.id)
          .maybeSingle()

        if (assinaturaMedico) {
          // Atualizar assinatura de médico
          // Verificar se ainda está no período pago
          const { data: assinaturaDetalhes } = await supabase
            .from("assinaturas")
            .select("current_period_end")
            .eq("subscription_id", subscription.id)
            .single()

          const periodoFinal = new Date(assinaturaDetalhes?.current_period_end)
          const agora = new Date()

          // Se o período final já passou, marcar como totalmente cancelada
          // Caso contrário, marcar como ativa até o fim do período
          const novoStatus = agora > periodoFinal ? "canceled" : "active_until_period_end"

          await supabase
            .from("assinaturas")
            .update({
              status: novoStatus,
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("subscription_id", subscription.id)
        } else {
          // Verificar se a tabela de assinaturas de instância existe
          const { error: tableCheckError } = await supabase
            .from("assinaturas_instancia")
            .select("id")
            .limit(1)
            .maybeSingle()

          if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
            // Atualizar assinatura de instância
            await supabase
              .from("assinaturas_instancia")
              .update({
                status: "canceled",
                canceled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("subscription_id", subscription.id)
          }
        }

        break
      }
    }

    return jsonResponse({ received: true })
  } catch (error: any) {
    console.error("Erro não tratado no webhook:", error)
    return jsonResponse({ error: "Erro interno do servidor", details: error.message }, 500)
  }
}
