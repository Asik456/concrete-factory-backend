export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'customer' | 'admin'
  is_verified?: boolean
  is_blocked?: boolean
  created_at?: string
}

export interface Category {
  id: number
  name_ru: string
  name_kz: string
  name_en: string
  slug: string
}

export interface ProductSpec {
  id?: number
  product_id?: number
  key: string
  value: string
}

export type ColorKey = 'grey' | 'red' | 'black'

export interface ProductVariant {
  id?: number
  product_id?: number
  color_key: ColorKey
  price: number
  image?: string
}

export interface Product {
  id: number
  category_id: number
  name_ru: string
  name_kz: string
  name_en: string
  description_ru: string
  description_kz: string
  description_en: string
  price: number
  discount_price?: number
  price_wholesale?: number
  image: string
  is_active: boolean
  specs?: ProductSpec[]
  variants?: ProductVariant[]
}

export interface Inquiry {
  id: number
  name: string
  phone: string
  message: string
  is_read: boolean
  created_at: string
}

export type Language = 'ru' | 'kz' | 'en'
