// prisma/seed-njuki.ts
import { PrismaClient, OrderStatus } from '../generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Optimized Seed for Njuki Fruit Business...');

  const email = 'njuki@gmail.com';
  const oneYearAgo = new Date('2025-03-27');
  
  // 0. Targeted Cleanup
  const existingBusiness = await prisma.business.findUnique({
    where: { ownerEmail: email },
  });

  if (existingBusiness) {
    console.log(`🧹 Cleaning up existing data for ${email}...`);
    const bId = existingBusiness.id;
    await prisma.orderItem.deleteMany({ where: { order: { businessId: bId } } });
    await prisma.sales.deleteMany({ where: { businessId: bId } });
    await prisma.order.deleteMany({ where: { businessId: bId } });
    await prisma.expenses.deleteMany({ where: { businessId: bId } });
    await prisma.product.deleteMany({ where: { businessId: bId } });
    await prisma.customer.deleteMany({ where: { businessId: bId } });
    await prisma.business.delete({ where: { id: bId } });
    console.log('✅ Cleanup complete.');
  }

  const hashedPassword = await bcrypt.hash('owner.password', 10);

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Njuki Fresh Fruits & Delights',
      mpesaShortcode: faker.string.numeric(6),
      ownerName: 'Njuki',
      ownerEmail: email,
      whatsappNumber: `07${faker.string.numeric(8)}`,
      ownerPhone: `07${faker.string.numeric(8)}`,
      password: hashedPassword,
      businessType: 'Retail Store',
      yearsInBusiness: '2-5',
      metadata: { county: 'Nairobi', industry: 'Agriculture' },
      createdAt: oneYearAgo,
    },
  });

  // 2. Create Products
  const fruitData = [
    { name: 'Mangoes (Kent)', buyingPrice: 30, price: 60, stockQuantity: 150, category: 'Stone Fruits' },
    { name: 'Apples (Pink Lady)', buyingPrice: 40, price: 80, stockQuantity: 200, category: 'Pomes' },
    { name: 'Bananas (Sweet)', buyingPrice: 10, price: 25, stockQuantity: 5, category: 'Tropical' },
    { name: 'Avocados (Hass)', buyingPrice: 20, price: 50, stockQuantity: 100, category: 'Berries' },
    { name: 'Pineapples', buyingPrice: 80, price: 150, stockQuantity: 40, category: 'Tropical' },
    { name: 'Oranges (Valencia)', buyingPrice: 25, price: 55, stockQuantity: 120, category: 'Citrus' },
  ];

  const products = await Promise.all(fruitData.map(f => 
    prisma.product.create({
      data: { ...f, businessId: business.id, createdAt: oneYearAgo, imageUrl: `https://loremflickr.com/400/400/fruit,${f.name.split(' ')[0].toLowerCase()}` }
    })
  ));

  // 3. Create Customers in batch
  const customerData = Array.from({ length: 50 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: `07${faker.string.numeric(8)}`,
    businessId: business.id,
    createdAt: oneYearAgo,
  }));
  await prisma.customer.createMany({ data: customerData });
  const customers = await prisma.customer.findMany({ where: { businessId: business.id } });

  // 4. Create Expenses in batch
  const expenseData = [];
  for (let m = 0; m < 12; m++) {
    const expenseDate = new Date(oneYearAgo);
    expenseDate.setMonth(expenseDate.getMonth() + m);
    expenseData.push(
      { type: 'Rent', amount: 8000, businessId: business.id, createdAt: expenseDate, description: 'Monthly Rent' },
      { type: 'Transport', amount: 4000, businessId: business.id, createdAt: expenseDate, description: 'Logistics' },
      { type: 'Packaging', amount: 2000, businessId: business.id, createdAt: expenseDate, description: 'Supply' },
      { type: 'Electricity', amount: 1000, businessId: business.id, createdAt: expenseDate, description: 'Utilities' }
    );
  }
  await prisma.expenses.createMany({ data: expenseData });

  // 5. Batch Create Orders and Sales (Highly Optimized)
  console.log('⏳ Generating a year of sales via batching...');
  
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(oneYearAgo);
    monthStart.setMonth(monthStart.getMonth() + m);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const ordersToCreate = [];
    const salesContext = []; // Temporary store to link items/sales later
    let monthlyGrossProfit = 0;

    // Pre-calculate all sales for the month in memory
    while (monthlyGrossProfit < 65000) {
      const product = faker.helpers.arrayElement(products);
      const customer = faker.helpers.arrayElement(customers);
      const quantity = faker.number.int({ min: 5, max: 15 });
      const totalAmount = product.price * quantity;
      const itemGrossProfit = (product.price - product.buyingPrice) * quantity;
      const orderDate = faker.date.between({ from: monthStart, to: monthEnd });

      ordersToCreate.push({
        customerId: customer.id,
        totalAmount,
        status: 'paid' as OrderStatus,
        businessId: business.id,
        createdAt: orderDate,
      });

      salesContext.push({ productId: product.id, quantity, totalAmount, createdAt: orderDate });
      monthlyGrossProfit += itemGrossProfit;
    }

    // 1. Bulk Insert Orders
    await prisma.order.createMany({ data: ordersToCreate });
    
    // 2. Fetch created orders for this month to get IDs
    const createdOrders = await prisma.order.findMany({
      where: { businessId: business.id, createdAt: { gte: monthStart, lt: monthEnd } },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    // 3. Prepare OrderItems and Sales using IDs
    // Note: We sort both arrays by date to ensure mapping matches as closely as possible
    const sortedContext = salesContext.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const orderItemsToCreate = createdOrders.map((order, index) => ({
      orderId: order.id,
      productId: sortedContext[index].productId,
      quantity: sortedContext[index].quantity,
    }));

    const finalSalesToCreate = createdOrders.map((order, index) => ({
      orderId: order.id,
      productId: sortedContext[index].productId,
      quantity: sortedContext[index].quantity,
      totalAmount: sortedContext[index].totalAmount,
      businessId: business.id,
      createdAt: sortedContext[index].createdAt,
    }));

    // 4. Bulk Insert Items and Sales
    await prisma.orderItem.createMany({ data: orderItemsToCreate });
    await prisma.sales.createMany({ data: finalSalesToCreate });

    console.log(`   - ${monthStart.toLocaleString('default', { month: 'short', year: 'numeric' })}: ${createdOrders.length} sales created.`);
  }

  console.log(`✅ Seed completed successfully!`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
