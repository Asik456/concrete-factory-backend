export function formatKzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1)
  digits = digits.slice(0, 10)
  let result = '+7'
  if (digits.length > 0) result += ' ' + digits.slice(0, 3)
  if (digits.length > 3) result += ' ' + digits.slice(3, 6)
  if (digits.length > 6) result += ' ' + digits.slice(6, 8)
  if (digits.length > 8) result += ' ' + digits.slice(8, 10)
  return result
}
