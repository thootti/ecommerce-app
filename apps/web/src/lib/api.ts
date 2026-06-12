import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth = localStorage.getItem('auth-storage')
    if (auth) {
      const { state } = JSON.parse(auth)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  }
  return config
})

export default api
