'use client'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth, useCart } from '@/lib/store'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { items } = useCart()
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">ShopEase</Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-gray-600 hover:text-blue-600 font-medium">Products</Link>
            <Link href="/products?category=electronics" className="text-gray-600 hover:text-blue-600 font-medium">Electronics</Link>
            <Link href="/products?category=clothing" className="text-gray-600 hover:text-blue-600 font-medium">Clothing</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full">
                  <User className="w-5 h-5 text-gray-700" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-xl border border-gray-100 hidden group-hover:block">
                  <div className="p-3 border-b">
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Orders</Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-50">Admin Panel</Link>
                  )}
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700">
                Sign In
              </Link>
            )}

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t">
            <Link href="/products" className="block py-2 text-gray-700">Products</Link>
            <Link href="/products?category=electronics" className="block py-2 text-gray-700">Electronics</Link>
            <Link href="/products?category=clothing" className="block py-2 text-gray-700">Clothing</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
