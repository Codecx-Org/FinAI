import { FlowProducer, Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import * as fs from 'fs-extra';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { redisService } from '../services/redis-service.js';
import prisma from '../utils/prisma.js';

// Redis connection (shared with redisService)
const connection = new Redis('redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 1000, 30000),
});
const workerConnection = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: null
})

// Queue for the workflow
export const orderQueue = new Queue('order-completion-queue', { connection });


// Directories for CSV files
const SALES_DIR = path.join(__dirname, '../Model/Sales');
const INVENTORY_TRENDS_DIR = path.join(__dirname, '../Models/Inventory');
fs.ensureDirSync(SALES_DIR);
fs.ensureDirSync(INVENTORY_TRENDS_DIR);

// Job processors (workers)
// Step 1: Store sales
new Worker(
  'order-completion-queue',
  async (job: Job) => {
    if (job.name === 'store-sale') {
      const { orderId } = job.data;
      console.log(`Processing store-sale for order ${orderId}`);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true } } },
      });

      if (!order || !order.orderItems.length) {
        throw new Error('Order or items not found');
      }

      const sales = [];
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

      return { sales };
    }
  },
  {
    connection: workerConnection 
  }
);

// Step 2: Append sales to CSV
new Worker(
  'order-completion-queue',
  async (job: Job) => {
    if (job.name === 'append-sales-csv') {
      const { orderId } = job.data;
      console.log(`Processing append-sales-csv for order ${orderId}`);

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
    }
  },
  {
    connection: workerConnection
  }
);

// Step 3: Update inventory
new Worker(
  'order-completion-queue',
  async (job: Job) => {
    if (job.name === 'update-inventory') {
      const { orderId } = job.data;
      console.log(`Processing update-inventory for order ${orderId}`);

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

      return updates; // Pass to child job
    }
  },
  {
    connection: workerConnection
  }
);

// Step 4: Append inventory trends to CSV
new Worker(
  'order-completion-queue',
  async (job: Job) => {
    if (job.name === 'append-inventory-trends-csv') {
      const { updates } = job.data; // From parent job (update-inventory)
      console.log(`Processing append-inventory-trends-csv`);

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
    }
  },
  {
    connection: workerConnection
  }
);

// Workflow: Add jobs to queue using FlowProducer
export async function runOrderCompletionWorkflow(orderId: number) {
  const flowProducer = new FlowProducer({ connection });

  try {
    // Define flow: Sequential execution (each job waits for parent completion)
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
                  data: { orderId }, // Updates passed dynamically below
                },
              ],
            },
          ],
        },
      ],
    });

    console.log(`Workflow enqueued for order ${orderId}`);
  } catch (error: any) {
    console.error(`Failed to enqueue workflow for order ${orderId}:`, error);
    await redisService.publish('workflow:failed', JSON.stringify({ orderId, error: error.message }));
    throw error;
  }
}

