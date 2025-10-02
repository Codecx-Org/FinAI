import { FlowProducer, Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as fs from 'fs-extra';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import prisma from '../utils/prisma';
import { Pick } from '@prisma/client/runtime/library';

// Redis connection (reuse from your redisService or define here)
const connection = new IORedis('redis://localhost:6379'); // Adjust URL as needed

// Queue for the workflow
const orderQueue = new Queue('order-completion-queue', { connection });


// Directories for CSV files
const SALES_DIR = path.join(__dirname, '../../Sales');
const INVENTORY_TRENDS_DIR = path.join(__dirname, '../../Inventory_Trends');

//Ensures that the directories for the AI to access are available
fs.ensureDirSync(SALES_DIR);
fs.ensureDirSync(INVENTORY_TRENDS_DIR);

// Job processors (steps as workers)
// Each worker processes a specific job type with retries

// Worker for Step 1: Store sales
new Worker(
  'store-sale',
  async (job: Job<{ orderId: number }>) => {
    const { orderId } = job.data;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: true } } },
    });

    if (!order || !order.orderItems.length) {
      throw new Error('Order or items not found');
    }

    const sales: any[] = [];
    for (const item of order.orderItems) {
      const sale = await prisma.sales.create({
        data: {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          totalAmount: item.quantity * item.product.price,
        },
      });
      sales.push(sale);
    }

    return { sales }; // Return for potential child access (optional)
  },
  { connection, attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
);

// Worker for Step 2: Append sales to CSV
new Worker(
  'append-sales-csv',
  async (job: Job<{ orderId: number }>) => {
    const { orderId } = job.data;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: true } } },
    });

    if (!order || !order.orderItems.length) {
      throw new Error('Order or items not found');
    }

    for (const item of order.orderItems) {
      const product = item.product;
      const csvPath = path.join(SALES_DIR, `${product.id}_${product.name.replace(/\s/g, '_')}.csv`);

      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
          { id: 'date', title: 'Date' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'total_amount', title: 'Total Amount' },
        ],
        append: fs.existsSync(csvPath),
      });

      const record = {
        date: new Date().toISOString(),
        quantity: item.quantity,
        total_amount: item.quantity * product.price,
      };

      await csvWriter.writeRecords([record]);
    }

    return { message: 'Sales data appended to CSVs' };
  },
  { connection, attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
);

// Worker for Step 3: Update inventory
new Worker(
  'update-inventory',
  async (job: Job<{ orderId: number }>) => {
    const { orderId } = job.data;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order || !order.orderItems.length) {
      throw new Error('Order or items not found');
    }

    const updates = [];
    for (const item of order.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const preQty = product.stockQuantity;
      const newQty = preQty - item.quantity;

      if (newQty < 0) {
        throw new Error(`Insufficient stock for product ${product.id}`);
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: newQty },
      });

      updates.push({ productId: product.id, name: product.name, preQty, newQty });
    }

    return updates;
  },
  { connection, attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
);

// Worker for Step 4: Append inventory trends to CSV
new Worker(
  'append-inventory-trends-csv',
  async (job: Job<{ updates: { productId: number; name: string; preQty: number; newQty: number }[] }>) => {
    const { updates } = job.data;
    for (const update of updates) {
      const csvPath = path.join(INVENTORY_TRENDS_DIR, `${update.productId}_${update.name.replace(/\s/g, '_')}.csv`);

      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
          { id: 'date', title: 'Date' },
          { id: 'product_id', title: 'Product ID' },
          { id: 'product_name', title: 'Product Name' },
          { id: 'pre_qty', title: 'Pre Quantity' },
          { id: 'new_qty', title: 'New Quantity' },
        ],
        append: fs.existsSync(csvPath),
      });

      const record = {
        date: new Date().toISOString(),
        product_id: update.productId,
        product_name: update.name,
        pre_qty: update.preQty,
        new_qty: update.newQty,
      };

      await csvWriter.writeRecords([record]);
    }

    return { message: 'Inventory trends appended to CSVs' };
  },
  { connection, attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
);

// Function to trigger the workflow (add flow)
export async function runOrderCompletionWorkflow(orderId: number) {
  const flowProducer = new FlowProducer({ connection });

  try {
    // Add sequential flow: append-inventory-trends-csv <- update-inventory <- append-sales-csv <- store-sale
    await flowProducer.add({
      name: 'store-sale',
      queueName: 'order-completion-queue',
      data: { orderId },
      children: [
        {
          name: 'append-sales-csv',
          queueName: 'order-completion-queue',
          data: { orderId },
          children: [
            {
              name: 'update-inventory',
              queueName: 'order-completion-queue',
              data: { orderId },
              children: [
                {
                  name: 'append-inventory-trends-csv',
                  queueName: 'order-completion-queue',
                  data: { orderId }, // Updates will be computed in parent job
                },
              ],
            },
          ],
        },
      ],
    });

    console.log(`Workflow started for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to start workflow for order ${orderId}:`, error);
    throw error;
  }
}
