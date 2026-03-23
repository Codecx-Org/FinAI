// prisma/seed.ts
// ✅ Strictly 50–80 records per table (exactly in the ranges below)
// Business: 55 | Product: 65 | Customer: 70 | Expenses: 60 | Order: 58 | OrderItem: 58 | Sales: 58
// All relations respected, realistic Kenyan-style data, proper ordering, totalAmount calculated

import { PrismaClient } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NUM_BUSINESSES = 55;
const NUM_PRODUCTS = 65;
const NUM_CUSTOMERS = 70;
const NUM_EXPENSES = 60;
const NUM_ORDERS = 58;

async function main() {
  console.log('🌱 Starting strict seed (50–80 records per table)...');

  // === CLEANUP (reverse dependency order) ===
  await prisma.orderItem.deleteMany({});
  await prisma.sales.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.expenses.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('✅ Database cleaned. Creating data...');

  const businesses: any[] = [];
  const productsByBusiness = new Map<number, any[]>();
  const customersByBusiness = new Map<number, any[]>();

  const hashedPassword = await bcrypt.hash('owner.business', 10);

  // ── 1. BUSINESSES (exactly 55) ─────────────────────────────────────
  console.log('Creating 55 businesses...');
  for (let i = 0; i < NUM_BUSINESSES; i++) {
    const business = await prisma.business.create({
      data: {
        name: `${faker.company.name()} ${faker.location.city()} Branch`,
        mpesaShortcode: faker.string.numeric(6),
        ownerName: faker.person.fullName(),
        ownerEmail: faker.internet.email({ provider: 'gmail.com' }),
        whatsappNumber: `07${faker.string.numeric(8)}`,
        ownerPhone: `07${faker.string.numeric(8)}`,
        password: hashedPassword,
        businessType: faker.helpers.arrayElement(['Retail Store', 'Restaurant', 'Services', 'Manufacturing', 'Agriculture', 'Technology']),
        yearsInBusiness: faker.helpers.arrayElement(['0-1', '1-2', '2-5', '5-10', '10+']),
        metadata: {
          county: faker.location.state({ abbreviated: true }),
          registrationDate: faker.date.past({ years: 4 }).toISOString(),
        },
        createdAt: faker.date.past({ years: 3 }),
      },
    });
    businesses.push(business);
    productsByBusiness.set(business.id, []);
    customersByBusiness.set(business.id, []);
  }

  // ── 2. PRODUCTS (exactly 65) ───────────────────────────────────────
  console.log('Creating 65 products...');
  const allProducts: any[] = [];

  // First give every business at least 1 product
  for (const business of businesses) {
    const price = faker.number.float({ min: 150, max: 12500, fractionDigits: 2 });
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        imageUrl: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
        stockQuantity: faker.number.int({ min: 5, max: 380 }),
        price,
        buyingPrice: faker.number.float({ min: price * 0.4, max: price * 0.75, fractionDigits: 2 }),
        businessId: business.id,
        createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
      },
    });
    productsByBusiness.get(business.id)!.push(product);
    allProducts.push(product);
  }

  // Remaining 10 products randomly distributed
  for (let i = 0; i < NUM_PRODUCTS - NUM_BUSINESSES; i++) {
    const business = faker.helpers.arrayElement(businesses);
    const price = faker.number.float({ min: 150, max: 12500, fractionDigits: 2 });
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        imageUrl: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
        stockQuantity: faker.number.int({ min: 5, max: 380 }),
        price,
        buyingPrice: faker.number.float({ min: price * 0.4, max: price * 0.75, fractionDigits: 2 }),
        businessId: business.id,
        createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
      },
    });
    productsByBusiness.get(business.id)!.push(product);
    allProducts.push(product);
  }

  // ── 3. CUSTOMERS (exactly 70) ──────────────────────────────────────
  console.log('Creating 70 customers...');

  // First give every business at least 1 customer
  for (const business of businesses) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: `+254${faker.string.numeric(9)}`,
        businessId: business.id,
        createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
      },
    });
    customersByBusiness.get(business.id)!.push(customer);
  }

  // Remaining 15 customers randomly distributed
  for (let i = 0; i < NUM_CUSTOMERS - NUM_BUSINESSES; i++) {
    const business = faker.helpers.arrayElement(businesses);
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        phone: `+254${faker.string.numeric(9)}`,
        businessId: business.id,
        createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
      },
    });
    customersByBusiness.get(business.id)!.push(customer);
  }

  // ── 4. EXPENSES (exactly 60) ───────────────────────────────────────
  console.log('Creating 60 expenses...');
  const expenseTypes = [
    'Rent', 'Electricity', 'Water', 'Internet', 'Transport', 'Marketing',
    'Salaries', 'Stock Purchase', 'Repairs', 'Licenses', 'Security', 'Packaging',
  ];

  for (let i = 0; i < NUM_EXPENSES; i++) {
    const business = faker.helpers.arrayElement(businesses);
    const amount = faker.number.int({ min: 4500, max: 750000 });
    const isRecurring = faker.datatype.boolean({ probability: 0.7 });

    await prisma.expenses.create({
      data: {
        type: faker.helpers.arrayElement(expenseTypes),
        description: isRecurring ? null : faker.lorem.sentence(8),
        amount,
        isRecurring,
        frequency: isRecurring ? faker.helpers.arrayElement(['monthly', 'quarterly']) : null,
        nextDueDate: isRecurring ? faker.date.future({ years: 1 }) : null,
        businessId: business.id as number,
        createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
      },
    });
  }

  // ── 5. ORDERS + ORDERITEMS + SALES (exactly 58 orders, 58 items, 58 sales) ──
  console.log('Creating 58 orders with 1 item each...');

  const orderStatuses = ['drafted', 'created', 'pending', 'paid', 'canceled', 'failed'] as const;

  for (let i = 0; i < NUM_ORDERS; i++) {
    const business = faker.helpers.arrayElement(businesses);
    const customer = faker.helpers.arrayElement(customersByBusiness.get(business.id)!);
    const product = faker.helpers.arrayElement(productsByBusiness.get(business.id)!);

    const status = faker.helpers.arrayElement(orderStatuses);
    const orderDate = faker.date.between({ from: customer.createdAt!, to: new Date() });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        totalAmount: 0,
        status,
        createdAt: orderDate,
        businessId: business.id,
      },
    });

    const quantity = faker.number.int({ min: 1, max: 8 });
    const itemTotal = product.price * quantity;

    // OrderItem
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity,
      },
    });

    // Sales (mirrors the sale)
    await prisma.sales.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity,
        totalAmount: itemTotal,
        createdAt: orderDate,
        businessId: business.id,
      },
    });

    // Update order total
    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: itemTotal },
    });
  }

  console.log('🎉 Seed completed successfully!');
  console.log(`   Businesses   : ${NUM_BUSINESSES}`);
  console.log(`   Products     : ${NUM_PRODUCTS}`);
  console.log(`   Customers    : ${NUM_CUSTOMERS}`);
  console.log(`   Expenses     : ${NUM_EXPENSES}`);
  console.log(`   Orders       : ${NUM_ORDERS}`);
  console.log(`   OrderItems   : ${NUM_ORDERS}`);
  console.log(`   Sales        : ${NUM_ORDERS}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });