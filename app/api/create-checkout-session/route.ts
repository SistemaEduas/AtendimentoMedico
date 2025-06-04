import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para gerar um email válido a partir do nome
function generateValidEmail(name: string): string {
  // Remove caracteres especiais e espaços, converte para minúsculas
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, ".")
  return `${sanitizedName}@exemplo.com`
}

export async function POST(request: Request) {
  console.log("Iniciando criação de sessão de checkout")

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

    const { medicoId } = await request.json()
    console.log("ID do médico recebido:", medicoId)

    if (!medicoId) {
      console.error("ID do médico não fornecido")
      return NextResponse.json({ error: "ID do médico é obrigatório" }, { status: 400 })
    }

    // Buscar informações do médico
    const { data: medico, error: medicoError } = await supabase.from("medicos").select("*").eq("id", medicoId).single()

    if (medicoError || !medico) {
      console.error("Erro ao buscar médico:", medicoError)
      return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 })
    }

    console.log("Médico encontrado:", medico.nome)

    // Verificar e corrigir o email do médico
    let customerEmail = medico.email || ""
    console.log("Email original do médico:", customerEmail)

    if (!isValidEmail(customerEmail)) {
      console.log("Email inválido detectado, gerando email alternativo")
      customerEmail = generateValidEmail(medico.nome)
      console.log("Email alternativo gerado:", customerEmail)

      // Atualizar o email do médico no banco de dados
      const { error: updateError } = await supabase.from("medicos").update({ email: customerEmail }).eq("id", medicoId)

      if (updateError) {
        console.log("Aviso: Não foi possível atualizar o email do médico no banco de dados:", updateError)
        // Continuamos mesmo com erro de atualização
      } else {
        console.log("Email do médico atualizado no banco de dados")
      }
    }

    // Verificar se já existe um cliente Stripe para este médico
    const { data: stripeCustomers, error: stripeCustomerError } = await supabase
      .from("stripe_customers")
      .select("*")
      .eq("medico_id", medicoId)

    if (stripeCustomerError) {
      console.error("Erro ao buscar cliente Stripe:", stripeCustomerError)
      return NextResponse.json({ error: "Erro ao buscar cliente Stripe" }, { status: 500 })
    }

    console.log("Clientes Stripe encontrados:", stripeCustomers)

    let customerId

    if (stripeCustomers && stripeCustomers.length > 0) {
      const stripeCustomer = stripeCustomers[0]
      console.log("Cliente Stripe existente encontrado:", stripeCustomer)

      // Usar o campo customer_id
      customerId = stripeCustomer.customer_id

      if (!customerId) {
        console.error("ID do cliente Stripe não encontrado no registro")
        return NextResponse.json({ error: "Estrutura de dados inválida" }, { status: 500 })
      }

      // Verificar se o email do cliente Stripe precisa ser atualizado
      const currentEmail = stripeCustomer.email
      if (currentEmail !== customerEmail) {
        console.log("Atualizando email do cliente Stripe")
        try {
          await stripe.customers.update(customerId, {
            email: customerEmail,
          })
          console.log("Email do cliente Stripe atualizado")

          // Atualizar o email no banco de dados
          await supabase.from("stripe_customers").update({ email: customerEmail }).eq("medico_id", medicoId)
        } catch (updateError) {
          console.error("Erro ao atualizar email do cliente Stripe:", updateError)
          // Continuamos mesmo com erro de atualização
        }
      }
    } else {
      console.log("Criando novo cliente Stripe com email:", customerEmail)
      // Criar um novo cliente no Stripe
      try {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: medico.nome,
          metadata: {
            medicoId: medicoId,
          },
        })

        customerId = customer.id
        console.log("Novo cliente Stripe criado:", customerId)

        // Salvar o ID do cliente Stripe no Supabase com apenas as colunas essenciais
        try {
          const insertData = {
            medico_id: medicoId,
            customer_id: customerId,
            email: customerEmail,
          }

          console.log("Tentando inserir cliente Stripe com dados:", insertData)

          const { error: insertError } = await supabase.from("stripe_customers").insert(insertData)

          if (insertError) {
            console.error("Erro ao salvar cliente Stripe:", insertError)
            return NextResponse.json({ error: "Erro ao salvar cliente" }, { status: 500 })
          }

          console.log("Cliente Stripe salvo no Supabase")
        } catch (insertError) {
          console.error("Erro ao inserir cliente Stripe:", insertError)
          return NextResponse.json({ error: "Erro ao inserir cliente Stripe" }, { status: 500 })
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
      successUrl: `${baseUrl}/medico/area/assinatura?success=true`,
      cancelUrl: `${baseUrl}/medico/area/assinatura?canceled=true`,
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
      success_url: `${baseUrl}/medico/area/assinatura?success=true`,
      cancel_url: `${baseUrl}/medico/area/assinatura?canceled=true`,
      metadata: {
        medicoId: medicoId,
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
