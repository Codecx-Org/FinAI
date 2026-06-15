// prisma/seed.ts
import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Matching constants from mobile app
const BUSINESS_TYPES = ['Retail Shop', 'Restaurant', 'Service Business', 'Manufacturing', 'Agriculture', 'Technology', 'Other'];
const YEARS_IN_BUSINESS = ['Less than 1 year', '1-2 years', '3-5 years', '6-10 years', 'More than 10 years'];
const EXPENSE_TYPES = ['Rent', 'Electricity', 'Water', 'Internet', 'Transport', 'Marketing', 'Salaries', 'Stock Purchase', 'Repairs', 'Licenses', 'Security', 'Packaging'];
const ORDER_STATUSES = ['drafted', 'created', 'pending', 'paid', 'canceled', 'failed'] as const;

async function main() {
  console.log('🌱 Starting strict seed with extensive Demo Accounts...');

  // === CLEANUP (reverse dependency order) ===
  await prisma.businessAchievement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.sales.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.expenses.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('✅ Database cleaned. Creating data...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const businesses = [];

  // ── 1. CREATE 2 EXTENSIVE DEMO BUSINESSES ────────────────────────────
  console.log('Creating Demo Businesses (demo1@bizsawa.com & demo2@bizsawa.com)...');

  const demo1 = await prisma.business.create({
    data: {
      name: 'Demo Retail Shop',
      mpesaShortcode: faker.string.numeric(6),
      ownerName: 'Alice Retail',
      ownerEmail: 'demo1@bizsawa.com',
      whatsappNumber: `07${faker.string.numeric(8)}`,
      ownerPhone: `07${faker.string.numeric(8)}`,
      password: hashedPassword,
      businessType: 'Retail Shop',
      yearsInBusiness: '3-5 years',
      createdAt: faker.date.past({ years: 2 }),
    },
  });

  const demo2 = await prisma.business.create({
    data: {
      name: 'Demo Service Tech',
      mpesaShortcode: faker.string.numeric(6),
      ownerName: 'Bob Services',
      ownerEmail: 'demo2@bizsawa.com',
      whatsappNumber: `07${faker.string.numeric(8)}`,
      ownerPhone: `07${faker.string.numeric(8)}`,
      password: hashedPassword,
      businessType: 'Technology',
      yearsInBusiness: '6-10 years',
      createdAt: faker.date.past({ years: 3 }),
    },
  });

  businesses.push(demo1, demo2);

  // ── 2. POPULATE DEMO BUSINESSES (EXTENSIVE DATA) ─────────────────────
  for (const demoBiz of [demo1, demo2]) {
    console.log(`Generating extensive data for ${demoBiz.name}...`);
    
    // Achievements
    await prisma.businessAchievement.createMany({
      data: [
        { title: 'First Sale', description: 'Completed your first sale!', earned: true, businessId: demoBiz.id },
        { title: '100 Customers', description: 'Reached 100 total customers.', earned: true, businessId: demoBiz.id },
        { title: 'Power User', description: 'Logged in 30 days in a row.', earned: false, businessId: demoBiz.id },
      ]
    });

    // 50 Products
    const products = [];
    for (let i = 0; i < 50; i++) {
      const price = faker.number.float({ min: 100, max: 5000, fractionDigits: 2 });
      products.push(await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          imageUrl: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
          stockQuantity: faker.number.int({ min: 10, max: 500 }),
          price,
          buyingPrice: price * 0.6, // 40% margin
          businessId: demoBiz.id,
          createdAt: faker.date.between({ from: demoBiz.createdAt, to: new Date() }),
        }
      }));
    }

    // 50 Customers
    const customers = [];
    for (let i = 0; i < 50; i++) {
      customers.push(await prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          phone: `+254${faker.string.numeric(9)}`,
          businessId: demoBiz.id,
          createdAt: faker.date.between({ from: demoBiz.createdAt, to: new Date() }),
        }
      }));
    }

    // 40 Expenses
    for (let i = 0; i < 40; i++) {
      const isRecurring = faker.datatype.boolean({ probability: 0.3 });
      await prisma.expenses.create({
        data: {
          type: faker.helpers.arrayElement(EXPENSE_TYPES),
          description: faker.lorem.sentence(5),
          amount: faker.number.int({ min: 1000, max: 50000 }),
          isRecurring,
          frequency: isRecurring ? 'monthly' : null,
          businessId: demoBiz.id,
          createdAt: faker.date.between({ from: demoBiz.createdAt, to: new Date() }),
        }
      });
    }

    // 150 Orders + OrderItems + Sales
    for (let i = 0; i < 150; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const product = faker.helpers.arrayElement(products);
      const status = faker.helpers.arrayElement(ORDER_STATUSES);
      const orderDate = faker.date.between({ from: customer.createdAt, to: new Date() });
      const quantity = faker.number.int({ min: 1, max: 5 });
      const itemTotal = product.price * quantity;

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          totalAmount: itemTotal,
          status,
          createdAt: orderDate,
          businessId: demoBiz.id,
        }
      });

      await prisma.orderItem.create({
        data: { orderId: order.id, productId: product.id, quantity }
      });

      // Mirror as Sale if Paid
      if (status === 'paid' || status === 'created') {
        await prisma.sales.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity,
            totalAmount: itemTotal,
            createdAt: orderDate,
            businessId: demoBiz.id,
          }
        });
      }
    }
  }

  // ── 3. CREATE 53 RANDOM BACKGROUND BUSINESSES (LIGHT DATA) ───────────
  console.log('Creating 53 random background businesses...');
  for (let i = 0; i < 53; i++) {
    const business = await prisma.business.create({
      data: {
        name: `${faker.company.name()} Branch`,
        mpesaShortcode: faker.string.numeric(6),
        ownerName: faker.person.fullName(),
        ownerEmail: faker.internet.email({ provider: 'gmail.com' }),
        whatsappNumber: `07${faker.string.numeric(8)}`,
        password: hashedPassword,
        businessType: faker.helpers.arrayElement(BUSINESS_TYPES),
        yearsInBusiness: faker.helpers.arrayElement(YEARS_IN_BUSINESS),
        createdAt: faker.date.past({ years: 1 }),
      },
    });
    businesses.push(business);

    // Give each random business just 1 product and 1 customer to satisfy relations
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        stockQuantity: 10,
        price: 500,
        buyingPrice: 300,
        businessId: business.id,
      }
    });

    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        businessId: business.id,
      }
    });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        totalAmount: 500,
        status: 'paid',
        businessId: business.id,
      }
    });

    await prisma.orderItem.create({
      data: { orderId: order.id, productId: product.id, quantity: 1 }
    });
  }

  console.log('🎉 Seed completed successfully!');
  console.log(`   Demo Businesses Generated: 2 (demo1@bizsawa.com, demo2@bizsawa.com)`);
  console.log(`   Total Businesses: ${businesses.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
