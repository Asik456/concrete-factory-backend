import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (data: { name: string; phone: string; email: string; password: string }) =>
  api.post('/register', data)

export const login = (data: { email: string; password: string }) =>
  api.post('/login', data)

export const getMe = () => api.get('/me')

export const verifyEmail = (data: { email: string; code: string }) =>
  api.post('/verify-email', data)

export const resendVerificationCode = (email: string) =>
  api.post('/resend-verification-code', { email })

export const getAllUsers = () => api.get('/users')

export const updateUserRole = (id: number, role: string) =>
  api.put(`/users/${id}/role`, { role })

export const updateUserBlock = (id: number, is_blocked: boolean) =>
  api.put(`/users/${id}/block`, { is_blocked })

// Categories
export const getCategories = () => api.get('/categories')

export const createCategory = (data: object) => api.post('/categories', data)

export const updateCategory = (id: number, data: object) => api.put(`/categories/${id}`, data)

export const deleteCategory = (id: number) => api.delete(`/categories/${id}`)

// Products
export const getProducts = (params?: { category_id?: number; active?: boolean }) =>
  api.get('/products', { params })

export const getProductById = (id: number) => api.get(`/products/${id}`)

export const createProduct = (data: object) => api.post('/products', data)

export const updateProduct = (id: number, data: object) => api.put(`/products/${id}`, data)

export const deleteProduct = (id: number) => api.delete(`/products/${id}`)

// Inquiries
export const createInquiry = (data: object) => api.post('/inquiries', data)

export const getInquiries = () => api.get('/inquiries')

export const markInquiryRead = (id: number) => api.put(`/inquiries/${id}/read`)

// Notifications
export const sendNotification = (user_id: number, message: string) =>
  api.post('/notify', { user_id, message })

export default api
