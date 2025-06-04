import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarCPF(cpf: string): string {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, "")

  // Aplica a formatação
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatarTelefone(telefone: string): string {
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, "")

  // Verifica se é celular (9 dígitos) ou fixo (8 dígitos)
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  } else if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  // Se não se encaixar em nenhum formato, retorna o número limpo
  return telefoneLimpo
}

export function gerarHorarios(): string[] {
  const horarios: string[] = []
  const horaInicio = 8
  const horaFim = 18
  const intervaloMinutos = 30

  for (let hora = horaInicio; hora < horaFim; hora++) {
    for (let minuto = 0; minuto < 60; minuto += intervaloMinutos) {
      const horaFormatada = hora.toString().padStart(2, "0")
      const minutoFormatado = minuto.toString().padStart(2, "0")
      horarios.push(`${horaFormatada}:${minutoFormatado}`)
    }
  }

  return horarios
}

export function formatarData(data: string): string {
  const dataObj = new Date(data)
  return dataObj.toLocaleDateString("pt-BR")
}

export function formatarDataHora(data: string): string {
  const dataObj = new Date(data)
  return `${dataObj.toLocaleDateString("pt-BR")} ${dataObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()

  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }

  return idade
}

export function gerarCodigoAleatorio(tamanho = 6): string {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let resultado = ""
  for (let i = 0; i < tamanho; i++) {
    resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return resultado
}

export function truncarTexto(texto: string, tamanhoMaximo: number): string {
  if (texto.length <= tamanhoMaximo) return texto
  return texto.slice(0, tamanhoMaximo) + "..."
}

export function formatarCEP(cep: string): string {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, "")

  // Aplica a formatação
  return cepLimpo.replace(/(\d{5})(\d{3})/, "$1-$2")
}

export function formatarCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, "")

  // Aplica a formatação
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

export function validarEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, "")

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpfLimpo)) return false

  // Validação do primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += Number.parseInt(cpfLimpo.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  const digitoVerificador1 = resto === 10 || resto === 11 ? 0 : resto
  if (digitoVerificador1 !== Number.parseInt(cpfLimpo.charAt(9))) return false

  // Validação do segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += Number.parseInt(cpfLimpo.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  const digitoVerificador2 = resto === 10 || resto === 11 ? 0 : resto
  if (digitoVerificador2 !== Number.parseInt(cpfLimpo.charAt(10))) return false

  return true
}

export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/\D/g, "")

  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false

  // Validação do primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2
  let numeros = cnpjLimpo.substring(0, tamanho)
  const digitos = cnpjLimpo.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += Number.parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== Number.parseInt(digitos.charAt(0))) return false

  // Validação do segundo dígito verificador
  tamanho = tamanho + 1
  numeros = cnpjLimpo.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += Number.parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== Number.parseInt(digitos.charAt(1))) return false

  return true
}

export function formatarDataParaISO(data: string): string {
  // Converte data no formato DD/MM/YYYY para YYYY-MM-DD
  const partes = data.split("/")
  if (partes.length !== 3) return data // Retorna a data original se não estiver no formato esperado
  return `${partes[2]}-${partes[1]}-${partes[0]}`
}

export function formatarDataDeISO(data: string): string {
  // Converte data no formato YYYY-MM-DD para DD/MM/YYYY
  const partes = data.split("-")
  if (partes.length !== 3) return data // Retorna a data original se não estiver no formato esperado
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

export function diferencaEmDias(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)
  const diferencaEmMs = fim.getTime() - inicio.getTime()
  return Math.floor(diferencaEmMs / (1000 * 60 * 60 * 24))
}

export function adicionarDias(data: string, dias: number): string {
  const dataObj = new Date(data)
  dataObj.setDate(dataObj.getDate() + dias)
  return dataObj.toISOString().split("T")[0]
}
