"\"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface StripeCheckoutProps {
  sessionId: string | null
  clientSecret: string | null
}

export const StripeCheckout = ({ sessionId, clientSecret }: StripeCheckoutProps) => {
  const [stripe, setStripe] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadStripeJs() {
      const { loadStripe } = await import("@stripe/stripe-js")
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")
      setStripe(stripe)
    }

    loadStripeJs()
  }, [])

  useEffect(() => {
    if (!stripe || !clientSecret) return

    setIsLoading(true)

    stripe
      .confirmPayment({
        elements: stripe.elements({ clientSecret }),
        confirmParams: {
          return_url: `${window.location.origin}/assinatura-sucesso`,
        },
      })
      .then((result: any) => {
        if (result.error) {
          toast({
            title: "Erro ao confirmar pagamento",
            description: result.error.message,
            variant: "destructive",
          })
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [stripe, clientSecret])

  return <Button disabled={isLoading}>{isLoading ? "Processando..." : "Confirmar Pagamento"}</Button>
}
