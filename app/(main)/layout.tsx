import type React from "react"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { InstanciaAuthCheck } from "@/components/instancia-auth-check"
import { AssinaturaGlobalCheck } from "@/components/assinatura-global-check"

const inter = Inter({ subsets: ["latin"] })

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <InstanciaAuthCheck>
            <AssinaturaGlobalCheck>
              <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 overflow-auto">{children}</div>
              </div>
            </AssinaturaGlobalCheck>
          </InstanciaAuthCheck>
        </ThemeProvider>
      </body>
    </html>
  )
}
