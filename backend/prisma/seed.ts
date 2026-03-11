import { PrismaClient, OrderStatus } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create 5 Businesses
  const businesses = [];
  for (let i = 1; i <= 5; i++) {
    const business = await prisma.business.create({
      data: {
        name: `Business ${i}`,
        mpesaShortcode: `17437${i}`,
        ownerName: `Owner ${i}`,
        ownerEmail: `owner${i}@business${i}.com`,
        metadata: { location: 'Nairobi', type: 'Retail' },
      },
    });
    businesses.push(business);
  }

  // 2. Create 20 Customers (4 per business)
  const customers = [];
  for (const business of businesses) {
    for (let i = 1; i <= 4; i++) {
      const customer = await prisma.customer.create({
        data: {
          name: `Customer ${business.id}_${i}`,
          email: `customer${business.id}_${i}@example.com`,
          phone: `254700000${business.id}${i}`,
          businessId: business.id,
        },
      });
      customers.push(customer);
    }
  }

  // 3. Create 10 Products (2 per business)
  const products = [];
  for (const business of businesses) {
    for (let i = 1; i <= 2; i++) {
      const product = await prisma.product.create({
        data: {
          name: `Product ${business.id}_${i}`,
          stockQuantity: 100,
          price: 500 + (i * 100),
          buyingPrice: 300 + (i * 100),
          businessId: business.id,
        },
      });
      products.push(product);
    }
  }

  // 4. Create 50 Orders (10 per business)
  const orders = [];
  for (const business of businesses) {
    const businessCustomers = customers.filter(c => c.businessId === business.id);
    for (let i = 1; i <= 10; i++) {
      const customer = businessCustomers[i % businessCustomers.length];
      const order = await prisma.order.create({
        data: {
          customerId: customer!.id,
          totalAmount: 0, // Will update after adding items
          status: OrderStatus.created,
          businessId: business.id,
        },
      });
      orders.push(order);
    }
  }

  // 5. Create OrderItems, Sales and Update Order Totals
  for (const order of orders) {
    const businessProducts = products.filter(p => p.businessId === order.businessId);
    const product = businessProducts[0]; // Just take one for simplicity
    const quantity = 2;
    const totalAmount = product!.price * quantity;

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product!.id,
        quantity: quantity,
      },
    });

    await prisma.sales.create({
      data: {
        orderId: order.id,
        productId: product!.id,
        quantity: quantity,
        totalAmount: totalAmount,
        businessId: order.businessId,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: totalAmount },
    });
  }

  // 6. Create 25 Expenses (5 per business)
  for (const business of businesses) {
    for (let i = 1; i <= 5; i++) {
      await prisma.expenses.create({
        data: {
          type: i % 2 === 0 ? 'Rent' : 'Utilities',
          amount: 1000 + (i * 200),
          description: `Monthly ${i % 2 === 0 ? 'Rent' : 'Utilities'} for ${business.name}`,
          businessId: business.id,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
