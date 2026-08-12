import { Product, Language, ColorKey } from '../types'

const WHATSAPP_NUMBER = '77475631252'

const COLOR_LABELS_RU: Record<ColorKey, string> = {
  grey: 'серый',
  red: 'красный',
  black: 'чёрный',
}

export function buildWhatsAppOrderLink(product: Product, lang: Language, colorKey?: ColorKey): string {
  const name = (product[`name_${lang}` as keyof Product] as string) || product.name_ru
  const sizeSpec = product.specs?.find((s) => s.key === 'Размер')

  const details: string[] = []
  if (sizeSpec) details.push(sizeSpec.value)
  if (colorKey) details.push(COLOR_LABELS_RU[colorKey])
  const detailsText = details.length ? ` (${details.join(', ')})` : ''

  const text = `Здравствуйте! Хочу заказать: ${name}${detailsText}. Подскажите, пожалуйста, по наличию и доставке.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
