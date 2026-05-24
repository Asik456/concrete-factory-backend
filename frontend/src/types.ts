export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'customer' | 'admin'
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
  image: string
  is_active: boolean
  specs?: ProductSpec[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price_at_order: number
}

export interface Order {
  id: number
  user_id: number
  status: string
  payment_status: string
  delivery_type: string
  delivery_address: string
  delivery_cost: number
  total: number
  items?: OrderItem[]
  created_at: string
}

export interface Inquiry {
  id: number
  name: string
  phone: string
  message: string
  is_read: boolean
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export type Language = 'ru' | 'kz' | 'en'
