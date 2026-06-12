import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

interface CartItem {
  productId: string
  quantity: number
  product: {
    name: string
    slug: string
    price: number
    imageUrl: string
    stock: number
  }
  total: number
}

interface CartStore {
  items: CartItem[]
  subtotal: number
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (productId: string, quantity?: number) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

export const useCart = create<CartStore>((set) => ({
  items: [],
  subtotal: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true })
      const { data } = await api.get('/cart')
      set({ items: data.items, subtotal: data.subtotal })
    } catch {
      set({ items: [], subtotal: 0 })
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (productId, quantity = 1) => {
    await api.post('/cart/add', { productId, quantity })
    const { data } = await api.get('/cart')
    set({ items: data.items, subtotal: data.subtotal })
  },

  updateItem: async (productId, quantity) => {
    await api.patch('/cart/update', { productId, quantity })
    const { data } = await api.get('/cart')
    set({ items: data.items, subtotal: data.subtotal })
  },

  clearCart: async () => {
    await api.delete('/cart/clear')
    set({ items: [], subtotal: 0 })
  }
}))

// Auth store
interface AuthStore {
  user: any | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({ user: data.user, token: data.token })
        api.defaults.headers.Authorization = `Bearer ${data.token}`
      },

      register: async (email, password, name) => {
        const { data } = await api.post('/auth/register', { email, password, name })
        set({ user: data.user, token: data.token })
        api.defaults.headers.Authorization = `Bearer ${data.token}`
      },

      logout: () => {
        set({ user: null, token: null })
        delete api.defaults.headers.Authorization
      }
    }),
    { name: 'auth-storage' }
  )
)
