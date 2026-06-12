export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'

async function getHomeData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get('/products?limit=8&sort=createdAt'),
      api.get('/categories')
    ])
    return {
      products: productsRes.data.products,
      categories: categoriesRes.data
    }
  } catch {
    return { products: [], categories: [] }
  }
}

export default async function HomePage() {
  const { products, categories } = await getHomeData()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Premium Products,<br />Unbeatable Prices</h1>
          <p className="text-xl text-blue-100 mb-8">Shop the latest electronics, fashion, and home essentials</p>
          <Link href="/products"
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center border border-gray-100">
              {cat.imageUrl && (
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="font-semibold text-gray-900 group-hover:text-blue-600">{cat.name}</p>
              <p className="text-sm text-gray-500 mt-1">{cat._count?.products} products</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-blue-600 hover:underline font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders over ₹999' },
            { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted checkout' },
            { icon: '↩️', title: 'Easy Returns', desc: '7-day return policy' },
            { icon: '💬', title: '24/7 Support', desc: 'Always here to help' }
          ].map(badge => (
            <div key={badge.title}>
              <div className="text-4xl mb-2">{badge.icon}</div>
              <p className="font-bold text-gray-900">{badge.title}</p>
              <p className="text-gray-500 text-sm">{badge.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product }: { product: any }) {
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null

  return (
    <Link href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img src={product.imageUrl} alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-blue-600 font-medium mb-1">{product.category?.name}</p>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">₹{product.comparePrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
