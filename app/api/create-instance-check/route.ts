import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

export async function POST(request: Request) {
  console.log("Iniciando criação de sessão de checkout para instância")

  // Verificar variáveis de ambiente
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY não definida")
    return NextResponse.json({ error: "Configuração do Stripe ausente" }, { status: 500 })
  }

  if (!process.env.STRIPE_PRICE_MONTHLY) {
    console.error("STRIPE_PRICE_MONTHLY não definida")
    return NextResponse.json({ error: "ID do preço não configurado" }, { status: 500 })
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    console.error("NEXT_PUBLIC_BASE_URL não definida")
    return NextResponse.json({ error: "URL base não configurada" }, { status: 500 })
  }

  console.log("Variáveis de ambiente verificadas")

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })

    console.log("Cliente Stripe inicializado")

    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "")

    console.log("Cliente Supabase inicializado")

    const { instanciaId, email, nome } = await request.json()
    console.log("ID da instância recebido:", instanciaId)

    if (!instanciaId) {
      console.error("ID da instância não fornecido")
      return NextResponse.json({ error: "ID da instância é obrigatório" }, { status: 400 })
    }

    // Buscar informações da instância
    const { data: instancia, error: instanciaError } = await supabase
      .from("instancias")
      .select("*")
      .eq("id", instanciaId)
      .single()

    if (instanciaError || !instancia) {
      console.error("Erro ao buscar instância:", instanciaError)
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 })
    }

    console.log("Instância encontrada:", instancia.nome)

    // Verificar se já existe um cliente Stripe para esta instância
    const { data: stripeCustomers, error: stripeCustomerError } = await supabase
      .from("stripe_customers_instancia")
      .select("*")
      .eq("instancia_id", instanciaId)

    if (stripeCustomerError && !stripeCustomerError.message.includes("does not exist")) {
      console.error("Erro ao buscar cliente Stripe:", stripeCustomerError)
      return NextResponse.json({ error: "Erro ao buscar cliente Stripe" }, { status: 500 })
    }

    let customerId

    if (stripeCustomers && stripeCustomers.length > 0) {
      const stripeCustomer = stripeCustomers[0]
      console.log("Cliente Stripe existente encontrado:", stripeCustomer)
      customerId = stripeCustomer.customer_id
    } else {
      console.log("Criando novo cliente Stripe com email:", email || "cliente@exemplo.com")
      // Criar um novo cliente no Stripe
      try {
        const customer = await stripe.customers.create({
          email: email || "cliente@exemplo.com",
          name: nome || instancia.nome,
          metadata: {
            instanciaId: instanciaId,
          },
        })

        customerId = customer.id
        console.log("Novo cliente Stripe criado:", customerId)

        // Tentar salvar o ID do cliente Stripe no Supabase
        try {
          // Verificar se a tabela existe
          const { error: tableCheckError } = await supabase
            .from("stripe_customers_instancia")
            .select("id")
            .limit(1)
            .maybeSingle()

          if (!tableCheckError || !tableCheckError.message.includes("does not exist")) {
            const insertData = {
              instancia_id: instanciaId,
              customer_id: customerId,
              email: email || "cliente@exemplo.com",
            }

            await supabase.from("stripe_customers_instancia").insert(insertData)
          }
        } catch (insertError) {
          console.error("Erro ao inserir cliente Stripe:", insertError)
          // Continuamos mesmo com erro de inserção
        }
      } catch (createError) {
        console.error("Erro ao criar cliente Stripe:", createError)
        return NextResponse.json({ error: "Erro ao criar cliente Stripe" }, { status: 500 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const priceId = process.env.STRIPE_PRICE_MONTHLY

    console.log("Criando sessão de checkout com:", {
      customerId,
      priceId,
      successUrl: `${baseUrl}/assinatura-sucesso?type=instancia&id=${instanciaId}`,
      cancelUrl: `${baseUrl}/assinatura-necessaria?canceled=true`,
    })

    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/assinatura-sucesso?type=instancia&id=${instanciaId}`,
      cancel_url: `${baseUrl}/assinatura-necessaria?canceled=true`,
      metadata: {
        instanciaId: instanciaId,
        type: "instancia",
      },
    })

    console.log("Sessão de checkout criada:", session.id)

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar sessão de checkout",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
