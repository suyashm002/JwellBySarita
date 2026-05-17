import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jewelupbysarita.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@jewelupbysarita.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Admin user created:', admin.email);

  // Create categories - Product Types
  const productTypes = [
    { name: 'Rings', slug: 'rings', sortOrder: 1 },
    { name: 'Earrings', slug: 'earrings', sortOrder: 2 },
    { name: 'Pendants', slug: 'pendants', sortOrder: 3 },
    { name: 'Bracelets', slug: 'bracelets', sortOrder: 4 },
    { name: 'Anklets', slug: 'anklets', sortOrder: 5 },
    { name: 'Bangles', slug: 'bangles', sortOrder: 6 },
    { name: 'Idols', slug: 'idols', sortOrder: 7 },
    { name: 'Gifting', slug: 'gifting', sortOrder: 8 },
  ];

  for (const cat of productTypes) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, type: 'PRODUCT_TYPE', isActive: true },
    });
  }
  console.log('Product type categories created');

  // Occasions
  const occasions = [
    { name: 'Daily Wear', slug: 'daily-wear', sortOrder: 1 },
    { name: 'Festive', slug: 'festive', sortOrder: 2 },
    { name: 'Bridal', slug: 'bridal', sortOrder: 3 },
    { name: 'Gifting Collection', slug: 'gifting-collection', sortOrder: 4 },
  ];

  for (const cat of occasions) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, type: 'OCCASION', isActive: true },
    });
  }
  console.log('Occasion categories created');

  // Gemstone Types
  const gemstoneTypes = [
    { name: 'Emerald', slug: 'emerald', sortOrder: 1 },
    { name: 'Ruby', slug: 'ruby', sortOrder: 2 },
    { name: 'Sapphire', slug: 'sapphire', sortOrder: 3 },
    { name: 'Topaz', slug: 'topaz', sortOrder: 4 },
    { name: 'Garnet', slug: 'garnet', sortOrder: 5 },
    { name: 'Amethyst', slug: 'amethyst', sortOrder: 6 },
    { name: 'Pearl', slug: 'pearl', sortOrder: 7 },
    { name: 'Turquoise', slug: 'turquoise', sortOrder: 8 },
  ];

  for (const cat of gemstoneTypes) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, type: 'GEMSTONE_TYPE', isActive: true },
    });
  }
  console.log('Gemstone type categories created');

  // Gemstone Rate Master
  const gemstoneRates = [
    { name: 'Emerald AAA', type: 'EMERALD', qualityGrade: 'AAA', ratePerCarat: 15000 },
    { name: 'Emerald AA', type: 'EMERALD', qualityGrade: 'AA', ratePerCarat: 8000 },
    { name: 'Emerald A', type: 'EMERALD', qualityGrade: 'A', ratePerCarat: 4000 },
    { name: 'Ruby AAA', type: 'RUBY', qualityGrade: 'AAA', ratePerCarat: 20000 },
    { name: 'Ruby AA', type: 'RUBY', qualityGrade: 'AA', ratePerCarat: 12000 },
    { name: 'Ruby A', type: 'RUBY', qualityGrade: 'A', ratePerCarat: 6000 },
    { name: 'Sapphire AAA', type: 'SAPPHIRE', qualityGrade: 'AAA', ratePerCarat: 18000 },
    { name: 'Sapphire AA', type: 'SAPPHIRE', qualityGrade: 'AA', ratePerCarat: 10000 },
    { name: 'Topaz AAA', type: 'TOPAZ', qualityGrade: 'AAA', ratePerCarat: 3000 },
    { name: 'Topaz AA', type: 'TOPAZ', qualityGrade: 'AA', ratePerCarat: 1500 },
    { name: 'Garnet AAA', type: 'GARNET', qualityGrade: 'AAA', ratePerCarat: 2500 },
    { name: 'Garnet AA', type: 'GARNET', qualityGrade: 'AA', ratePerCarat: 1200 },
    { name: 'Amethyst AAA', type: 'AMETHYST', qualityGrade: 'AAA', ratePerCarat: 2000 },
    { name: 'Pearl AAA', type: 'PEARL', qualityGrade: 'AAA', ratePerCarat: 5000 },
    { name: 'Pearl AA', type: 'PEARL', qualityGrade: 'AA', ratePerCarat: 2500 },
    { name: 'Turquoise AAA', type: 'TURQUOISE', qualityGrade: 'AAA', ratePerCarat: 3500 },
  ];

  for (const rate of gemstoneRates) {
    const existing = await prisma.gemstoneRateMaster.findFirst({
      where: { type: rate.type, qualityGrade: rate.qualityGrade },
    });
    if (!existing) {
      await prisma.gemstoneRateMaster.create({
        data: { ...rate, isActive: true, effectiveFrom: new Date() },
      });
    }
  }
  console.log('Gemstone rate master seeded');

  // Default making charge rule (global)
  const existingRule = await prisma.makingChargeRule.findFirst({ where: { scope: 'GLOBAL' } });
  if (!existingRule) {
    await prisma.makingChargeRule.create({
      data: {
        name: 'Default Making Charge',
        type: 'PERCENTAGE',
        value: 15,
        scope: 'GLOBAL',
        isActive: true,
      },
    });
  }
  console.log('Default making charge rule created');

  // Initial silver rate
  const existingRate = await prisma.silverRateLog.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!existingRate) {
    await prisma.silverRateLog.create({
      data: {
        ratePerGram: 90,
        ratePerKg: 90000,
        source: 'MANUAL',
        bufferPercent: 2,
        effectiveRate: 91.8, // 90 * 1.02
      },
    });
  }
  console.log('Initial silver rate seeded');

  // Default settings
  const settings = [
    { key: 'silver_buffer_percent', value: { percent: 2 }, description: 'Buffer % added to MCX silver rate' },
    { key: 'store_name', value: { name: 'Jewelup by Sarita' }, description: 'Store display name' },
    { key: 'store_contact', value: { email: 'info@jewelupbysarita.com', phone: '+91-9876543210', address: 'Jaipur, Rajasthan, India' }, description: 'Store contact information' },
    { key: 'free_shipping_threshold', value: { amount: 2000 }, description: 'Free shipping above this order value' },
    { key: 'cod_threshold', value: { maxAmount: 50000 }, description: 'Max order value for COD' },
    { key: 'price_lock_minutes', value: { minutes: 60 }, description: 'Cart price lock duration in minutes' },
    { key: 'gst_rate', value: { rate: 3, cgst: 1.5, sgst: 1.5 }, description: 'GST rates for jewellery' },
    { key: 'seller_state', value: { state: 'Rajasthan', stateCode: '08' }, description: 'Seller state for GST' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as any },
      create: setting as any,
    });
  }
  console.log('Default settings created');

  // Sample products
  const ringsCategory = await prisma.category.findUnique({ where: { slug: 'rings' } });
  const earringsCategory = await prisma.category.findUnique({ where: { slug: 'earrings' } });
  const pendantsCategory = await prisma.category.findUnique({ where: { slug: 'pendants' } });
  const braceletsCategory = await prisma.category.findUnique({ where: { slug: 'bracelets' } });

  const emeraldAAA = await prisma.gemstoneRateMaster.findFirst({ where: { type: 'EMERALD', qualityGrade: 'AAA' } });
  const rubyAA = await prisma.gemstoneRateMaster.findFirst({ where: { type: 'RUBY', qualityGrade: 'AA' } });
  const sapphireAAA = await prisma.gemstoneRateMaster.findFirst({ where: { type: 'SAPPHIRE', qualityGrade: 'AAA' } });
  const topazAA = await prisma.gemstoneRateMaster.findFirst({ where: { type: 'TOPAZ', qualityGrade: 'AA' } });

  const sampleProducts = [
    {
      sku: 'JWL-RNG-001',
      name: 'Royal Emerald Silver Ring',
      slug: 'royal-emerald-silver-ring',
      description: 'A stunning 925 sterling silver ring adorned with a natural emerald gemstone. Perfect for daily wear and special occasions. BIS hallmarked for purity.',
      shortDescription: 'Sterling silver ring with natural emerald',
      categoryId: ringsCategory!.id,
      silverPurity: 'STERLING_925',
      silverWeightGrams: 8.5,
      makingChargeType: 'PERCENTAGE',
      makingChargeValue: 15,
      additionalCharges: 200,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      stock: 25,
      tags: ['emerald', 'ring', 'daily-wear', 'sterling-silver'],
      gemstones: emeraldAAA ? [{ gemstoneRateId: emeraldAAA.id, caratWeight: 1.2, quantity: 1 }] : [],
    },
    {
      sku: 'JWL-EAR-001',
      name: 'Ruby Drop Earrings',
      slug: 'ruby-drop-earrings',
      description: 'Elegant sterling silver drop earrings featuring natural rubies. Handcrafted in Jaipur with meticulous attention to detail.',
      shortDescription: 'Silver drop earrings with natural rubies',
      categoryId: earringsCategory!.id,
      silverPurity: 'STERLING_925',
      silverWeightGrams: 6.2,
      makingChargeType: 'PERCENTAGE',
      makingChargeValue: 18,
      additionalCharges: 150,
      isActive: true,
      isFeatured: true,
      isNewArrival: true,
      stock: 30,
      tags: ['ruby', 'earrings', 'drop', 'festive'],
      gemstones: rubyAA ? [{ gemstoneRateId: rubyAA.id, caratWeight: 0.8, quantity: 2 }] : [],
    },
    {
      sku: 'JWL-PND-001',
      name: 'Sapphire Elegance Pendant',
      slug: 'sapphire-elegance-pendant',
      description: 'A breathtaking sapphire pendant set in fine silver. The deep blue sapphire is complemented by the lustrous silver setting.',
      shortDescription: 'Fine silver pendant with blue sapphire',
      categoryId: pendantsCategory!.id,
      silverPurity: 'FINE_999',
      silverWeightGrams: 5.0,
      makingChargeType: 'FLAT',
      makingChargeValue: 800,
      additionalCharges: 300,
      isActive: true,
      isFeatured: true,
      stock: 15,
      tags: ['sapphire', 'pendant', 'fine-silver', 'bridal'],
      gemstones: sapphireAAA ? [{ gemstoneRateId: sapphireAAA.id, caratWeight: 1.5, quantity: 1 }] : [],
    },
    {
      sku: 'JWL-BRC-001',
      name: 'Topaz Charm Bracelet',
      slug: 'topaz-charm-bracelet',
      description: 'A delicate sterling silver bracelet with multiple topaz charms. Lightweight and comfortable for everyday wear.',
      shortDescription: 'Silver charm bracelet with topaz stones',
      categoryId: braceletsCategory!.id,
      silverPurity: 'STERLING_925',
      silverWeightGrams: 12.0,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 50,
      additionalCharges: 100,
      isActive: true,
      isNewArrival: true,
      stock: 20,
      tags: ['topaz', 'bracelet', 'charm', 'daily-wear'],
      gemstones: topazAA ? [{ gemstoneRateId: topazAA.id, caratWeight: 0.5, quantity: 5 }] : [],
    },
    {
      sku: 'JWL-RNG-002',
      name: 'Classic Sterling Silver Band',
      slug: 'classic-sterling-silver-band',
      description: 'A timeless sterling silver band ring with a polished finish. Simple yet elegant, perfect for everyday wear.',
      shortDescription: 'Classic polished silver band ring',
      categoryId: ringsCategory!.id,
      silverPurity: 'STERLING_925',
      silverWeightGrams: 5.0,
      makingChargeType: 'FLAT',
      makingChargeValue: 300,
      additionalCharges: 100,
      isActive: true,
      isBestseller: true,
      stock: 50,
      tags: ['ring', 'band', 'classic', 'daily-wear', 'sterling-silver'],
      gemstones: [],
    },
    {
      sku: 'JWL-EAR-002',
      name: 'Pearl Stud Earrings',
      slug: 'pearl-stud-earrings',
      description: 'Elegant pearl stud earrings set in 925 sterling silver. Natural pearls with a beautiful lustre.',
      shortDescription: 'Sterling silver pearl studs',
      categoryId: earringsCategory!.id,
      silverPurity: 'STERLING_925',
      silverWeightGrams: 4.0,
      makingChargeType: 'PERCENTAGE',
      makingChargeValue: 12,
      additionalCharges: 100,
      isActive: true,
      isFeatured: true,
      isBestseller: true,
      stock: 40,
      tags: ['pearl', 'earrings', 'stud', 'daily-wear'],
      gemstones: [],
    },
  ];

  for (const product of sampleProducts) {
    const { gemstones, ...productData } = product;
    const existing = await prisma.product.findUnique({ where: { sku: productData.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          ...productData,
          images: {
            create: [
              {
                url: `https://placehold.co/600x600/f8f4f0/722F37?text=${encodeURIComponent(productData.name.split(' ').slice(0, 2).join('+'))}`,
                altText: productData.name,
                sortOrder: 0,
                isPrimary: true,
              },
              {
                url: `https://placehold.co/600x600/722F37/f8f4f0?text=${encodeURIComponent(productData.sku)}`,
                altText: `${productData.name} - Side View`,
                sortOrder: 1,
                isPrimary: false,
              },
            ],
          },
        },
      });

      // Add gemstones
      for (const gem of gemstones) {
        await prisma.productGemstone.create({
          data: { productId: created.id, ...gem },
        });
      }

      // Add variants for rings
      if (productData.categoryId === ringsCategory!.id) {
        const sizes = ['14', '15', '16', '17', '18', '19', '20'];
        for (const size of sizes) {
          await prisma.productVariant.create({
            data: {
              productId: created.id,
              name: `Ring Size ${size}`,
              type: 'RING_SIZE',
              value: size,
              additionalPrice: 0,
              stock: Math.floor(productData.stock / sizes.length),
              sku: `${productData.sku}-SZ${size}`,
              isActive: true,
            },
          });
        }
      }
    }
  }
  console.log('Sample products created');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
