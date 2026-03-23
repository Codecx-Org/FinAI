// prisma/seed.ts
// ✅ Strictly matches schema.prisma shapes and constraints
// ✅ Each business has at least 5 Products, 5 Expenses, 5 Customers, and 5 Orders/Sales.
// ✅ Unique constraints handled for emails, phone numbers, and shortcodes.

import { PrismaClient, OrderStatus } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NUM_BUSINESSES = 15;
const MIN_PER_BUSINESS = 5;
const MAX_PER_BUSINESS = 8;

async function main() {
  console.log('🌱 Starting enriched seed (Schema-Strict)...');

  // === CLEANUP (Reverse dependency order) ===
  await prisma.orderItem.deleteMany({});
  await prisma.sales.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.expenses.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('✅ Database cleaned. Creating data...');

  const hashedPassword = await bcrypt.hash('owner.business', 10);
  
  // Sets to track uniqueness across the entire seed run
  const usedEmails = new Set<string>();
  const usedWhatsapp = new Set<string>();
  const usedShortcodes = new Set<string>();

  const getUniqueEmail = (base: string) => {
    let email = base.toLowerCase();
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${counter}_${base}`.toLowerCase();
      counter++;
    }
    usedEmails.add(email);
    return email;
  };

  const getUniqueWhatsapp = () => {
    let num = `07${faker.string.numeric(8)}`;
    while (usedWhatsapp.has(num)) {
      num = `07${faker.string.numeric(8)}`;
    }
    usedWhatsapp.add(num);
    return num;
  };

  const getUniqueShortcode = () => {
    let code = faker.string.numeric(6);
    while (usedShortcodes.has(code)) {
      code = faker.string.numeric(6);
    }
    usedShortcodes.add(code);
    return code;
  };

  const expenseTypes = [
    'Rent', 'Electricity', 'Water', 'Internet', 'Transport', 'Marketing',
    'Salaries', 'Stock Purchase', 'Repairs', 'Licenses', 'Security', 'Packaging',
  ];

  for (let i = 0; i < NUM_BUSINESSES; i++) {
    // 1. Create Business
    const business = await prisma.business.create({
      data: {
        name: `${faker.company.name()} ${faker.location.city()}`,
        mpesaShortcode: getUniqueShortcode(),
        ownerName: faker.person.fullName(),
        ownerEmail: getUniqueEmail(faker.internet.email()),
        whatsappNumber: getUniqueWhatsapp(),
        ownerPhone: `07${faker.string.numeric(8)}`,
        password: hashedPassword,
        businessType: faker.helpers.arrayElement(['Retail Store', 'Restaurant', 'Services', 'Manufacturing', 'Agriculture', 'Technology']),
        yearsInBusiness: faker.helpers.arrayElement(['0-1', '1-2', '2-5', '5-10', '10+']),
        metadata: {
          county: faker.location.state({ abbreviated: true }),
          industry: faker.commerce.department(),
        },
        createdAt: faker.date.past({ years: 2 }),
      },
    });

    console.log(`  Processing Business [ID: ${business.id}]: ${business.name}...`);

    // 2. Create Products
    const products = [];
    const numProducts = faker.number.int({ min: MIN_PER_BUSINESS, max: MAX_PER_BUSINESS });
    const isStruggling = faker.datatype.boolean({ probability: 0.2 });

    for (let p = 0; p < numProducts; p++) {
      const buyingPrice = faker.number.float({ min: 100, max: 5000, fractionDigits: 2 });
      const margin = isStruggling ? faker.number.float({ min: 0.8, max: 1.1, fractionDigits: 2 }) : faker.number.float({ min: 1.3, max: 2.0, fractionDigits: 2 });
      const price = Number((buyingPrice * margin).toFixed(2));

      const product = await prisma.product.create({
        data: {
          name: faker.commerce.productName(),
          imageUrl: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
          stockQuantity: faker.number.int({ min: 10, max: 500 }),
          price,
          buyingPrice,
          businessId: business.id,
          createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
        },
      });
      products.push(product);
    }

    // 3. Create Customers
    const customers = [];
    const numCustomers = faker.number.int({ min: MIN_PER_BUSINESS, max: MAX_PER_BUSINESS });
    for (let c = 0; c < numCustomers; c++) {
      const customer = await prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          email: getUniqueEmail(faker.internet.email()),
          phone: `07${faker.string.numeric(8)}`,
          businessId: business.id,
          createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
        },
      });
      customers.push(customer);
    }

    // 4. Create Expenses
    const numExpenses = faker.number.int({ min: MIN_PER_BUSINESS, max: MAX_PER_BUSINESS });
    for (let e = 0; e < numExpenses; e++) {
      const isHighExpense = isStruggling && e === 0;
      const amount = isHighExpense ? faker.number.int({ min: 100000, max: 300000 }) : faker.number.int({ min: 2000, max: 50000 });
      const expenseType = faker.helpers.arrayElement(expenseTypes);

      await prisma.expenses.create({
        data: {
          type: expenseType,
          description: faker.lorem.sentence(),
          amount,
          isRecurring: faker.datatype.boolean(),
          frequency: faker.helpers.arrayElement(['monthly', 'quarterly', 'yearly']),
          businessId: business.id,
          createdAt: faker.date.between({ from: business.createdAt, to: new Date() }),
          // Optional: Link to a product if it's a Stock Purchase
          ...(expenseType === 'Stock Purchase' && {
            product: {
              connect: { id: faker.helpers.arrayElement(products).id }
            }
          })
        },
      });
    }

    // 5. Create Orders & Sales
    const numOrders = faker.number.int({ min: MIN_PER_BUSINESS, max: MAX_PER_BUSINESS });
    for (let o = 0; o < numOrders; o++) {
      const customer = faker.helpers.arrayElement(customers);
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const totalAmount = Number((product.price * quantity).toFixed(2));
      const orderDate = faker.date.between({ from: business.createdAt, to: new Date() });

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          totalAmount,
          status: 'paid' as OrderStatus,
          businessId: business.id,
          createdAt: orderDate,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
        },
      });

      await prisma.sales.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          totalAmount,
          businessId: business.id,
          createdAt: orderDate,
        },
      });
    }
  }

  console.log(`🎉 Seed completed successfully!`);
  console.log(`Total Businesses: ${NUM_BUSINESSES}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
