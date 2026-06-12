import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: await bcrypt.hash('Admin@123', 12),
      name: 'Admin User',
      role: 'ADMIN'
    }
  })
  console.log('Admin created:', admin.email)

  // Categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Phones, laptops, gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
    }
  })

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'
    }
  })

  const homeKitchen = await prisma.category.upsert({
    where: { slug: 'home-kitchen' },
    update: {},
    create: {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home essentials',
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
    }
  })

  // Products
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium sound quality with 30hr battery life and active noise cancellation.',
      price: 2999,
      comparePrice: 4999,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      images: [],
      stock: 50,
      sku: 'ELEC-001',
      categoryId: electronics.id
    },
    {
      name: 'Smart Watch Series 5',
      slug: 'smart-watch-series-5',
      description: 'Track fitness, notifications and more with this feature-packed smartwatch.',
      price: 4499,
      comparePrice: 6999,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      images: [],
      stock: 30,
      sku: 'ELEC-002',
      categoryId: electronics.id
    },
    {
      name: 'USB-C Fast Charger 65W',
      slug: 'usb-c-fast-charger-65w',
      description: 'Charge your laptop, phone and tablet simultaneously.',
      price: 1299,
      comparePrice: 1999,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
      images: [],
      stock: 100,
      sku: 'ELEC-003',
      categoryId: electronics.id
    },
    {
      name: 'Classic Cotton T-Shirt',
      slug: 'classic-cotton-t-shirt',
      description: '100% premium cotton, available in multiple colors. Unisex fit.',
      price: 499,
      comparePrice: 799,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      images: [],
      stock: 200,
      sku: 'CLO-001',
      categoryId: clothing.id
    },
    {
      name: 'Slim Fit Chino Pants',
      slug: 'slim-fit-chino-pants',
      description: 'Versatile chinos perfect for office or casual wear.',
      price: 1299,
      comparePrice: 1999,
      imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
      images: [],
      stock: 75,
      sku: 'CLO-002',
      categoryId: clothing.id
    },
    {
      name: 'Stainless Steel Water Bottle',
      slug: 'stainless-steel-water-bottle',
      description: 'Keeps drinks cold 24hrs, hot 12hrs. 1 litre capacity.',
      price: 799,
      comparePrice: 1299,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
      images: [],
      stock: 150,
      sku: 'HOME-001',
      categoryId: homeKitchen.id
    }
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p
    })
  }

  console.log(`Created ${products.length} products`)
  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
