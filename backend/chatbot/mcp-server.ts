import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ProductService } from "../services/products-service.js";
import { CustomerService } from "../services/customer-service.js";
import { OrderService } from "../services/orders-services.js";
import { SalesService } from "../services/sales-service.js";
import { PaymentService } from "../services/payment-service.js";
import { BusinessService } from "../services/business-service.js";

import { ExpenseService } from "../services/expense-service.js";
import axios from "axios";
const productService = new ProductService();
const customerService = new CustomerService();
const orderService = new OrderService();
const salesService = new SalesService();
const paymentService = new PaymentService();
const businessService = new BusinessService();
const expenseService = new ExpenseService();

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_INTERNAL_URL || "http://localhost:3001";

const server = new Server(
  {
    name: "fin-ai-chatbot",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 * Each tool corresponds to a service method.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      //forusiness contxt
      {
        name: "getBusinessById",
        description: "Get business details by ID",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
          required: ["businessId"],
        },
      },
      // Product Tools
      {
        name: "getAllProducts",
        description: "List all products in the inventory",
        inputSchema: {
          type: "object",
          properties: { businessId: { type: "number" } },
          required: ["businessId"],
        },
      },
      {
        name: "get_product",
        description: "Get details of a specific product by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            businessId: { type: "number" },
          },
          required: ["id", "businessId"],
        },
      },
      {
        name: "create_product",
        description: "Create a new product",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            stockQuantity: { type: "number" },
            price: { type: "number" },
            buyingPrice: { type: "number" },
            businessId: { type: "number" },
          },
          required: ["name", "stockQuantity", "price", "buyingPrice", "businessId"],
        },
      },
      // Customer Tools
      {
        name: "list_customers",
        description: "List all customers",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
          required: ["businessId"],
        },
      },
      {
        name: "create_customer",
        description: "Create a new customer",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
          },
          required: ["name"],
        },
      },
      // Order Tools
      {
        name: "list_orders",
        description: "List all orders",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_order",
        description: "Get details of a specific order by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_order",
        description: "Create a new order",
        inputSchema: {
          type: "object",
          properties: {
            customerId: { type: "number" },
            totalAmount: { type: "number" },
            status: { type: "string", enum: ["created", "pending", "paid", "shipped", "delivered", "cancelled", "failed"] },
            orderItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "number" },
                  quantity: { type: "number" },
                },
                required: ["productId", "quantity"],
              },
            },
          },
          required: ["customerId", "totalAmount", "status"],
        },
      },
      // Sales Tools
      {
        name: "list_sales",
        description: "List all sales records",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_sale",
        description: "Create a new sale record",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "number" },
            productId: { type: "number" },
            quantity: { type: "number" },
            totalAmount: { type: "number" },
          },
          required: ["orderId", "productId", "quantity", "totalAmount"],
        },
      },
      // Payment Tools
      {
        name: "initiate_payment",
        description: "Initiate an STK Push payment for an order",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "number" },
            phone: { type: "string", description: "Phone number to receive STK push (e.g. 0712345678)" },
            amount: { type: "number" },
          },
          required: ["orderId", "phone", "amount"],
        },
      },
      {
        name: "check_payment_status",
        description: "Check the payment status of an order",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "number" },
          },
          required: ["orderId"],
        },
      },
      // Expense Tools
      {
        name: "list_expenses",
        description: "List all expenses for a business",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
          required: ["businessId"],
        },
      },
      {
        name: "get_expense",
        description: "Get details of a specific expense by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_expense",
        description: "Create a new expense record",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Type of expense (e.g. Rent, Salaries, Stock Purchase)" },
            amount: { type: "number" },
            businessId: { type: "number" },
            description: { type: "string" },
            isRecurring: { type: "boolean" },
            frequency: { type: "string", enum: ["monthly", "quarterly"] },
            nextDueDate: { type: "string", description: "ISO date string for the next due date if recurring" },
          },
          required: ["type", "amount", "businessId"],
        },
      },
      // WhatsApp Tools
      {
        name: "whatsapp_send_text",
        description: "Send a text message to a WhatsApp number",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient phone number (e.g. 0712345678)" },
            text: { type: "string" },
          },
          required: ["to", "text"],
        },
      },
      {
        name: "whatsapp_send_media",
        description: "Send an image/media message to a WhatsApp number",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient phone number (e.g. 0712345678)" },
            imageUrl: { type: "string", description: "URL or local path to the image" },
            caption: { type: "string" },
          },
          required: ["to", "imageUrl"],
        },
      },
      {
        name: "whatsapp_broadcast_advert",
        description: "Broadcast an advertisement (text + optional image) to all or specific customers",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
            text: { type: "string" },
            imageUrl: { type: "string" },
            customerIds: { type: "array", items: { type: "number" }, description: "Optional list of customer IDs. If omitted, sends to all customers." },
          },
          required: ["businessId", "text"],
        },
      },
      // Summary Tool
      {
        name: "get_business_summary",
        description: "Get a comprehensive financial and operational summary of the business",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
          required: ["businessId"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Extract businessId from context
  const { name, arguments: rawArgs = {} } = request.params;
  const args = (rawArgs || {}) as Record<string, any>;
  
  console.log(`[MCP SERVER] Tool called: ${name}`);
  console.log(`[MCP SERVER] Raw request.params:`, JSON.stringify(request.params, null, 2));
  console.log(`[MCP SERVER] Context received:`, JSON.stringify((request as any).context || (request.params as any)?.context));
  
  const businessIdRaw = (args as any).businessId;

  if (!businessIdRaw) {
    return {
      content: [{ type: "text", text: "Business context missing. Please log in." }],
      isError: true,
    };
  }

  const safeBusinessId = Number(businessIdRaw);
  if (isNaN(safeBusinessId) || safeBusinessId <= 0) {
    return {
      content: [{ type: "text", text: "Invalid businessId provided." }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "getBusinessById":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await businessService.getBusinessById(safeBusinessId)) 
          }] 
        };

      case "getAllProducts":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await productService.getAllProducts(safeBusinessId)) 
          }] 
        };

      case "get_product":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await productService.getProduct(Number(args?.id), safeBusinessId)) 
          }] 
        };

      case "create_product":
        // Fix: Properly construct the product object
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await productService.createProduct({
              name: args.name,
              stockQuantity: Number(args.stockQuantity),
              price: Number(args.price),
              buyingPrice: Number(args.buyingPrice),
              businessId: safeBusinessId
            })) 
          }] 
        };

      case "list_customers":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await customerService.getAllCustomers(safeBusinessId)) 
          }] 
        };

      case "create_customer":
        // Fix: Properly construct the customer object
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await customerService.createCustomer({
              name: args.name,
              email: args.email || null,
              phone: args.phone || null,
              businessId: safeBusinessId
            })) 
          }] 
        };

      case "list_orders":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await orderService.getAllOrders(safeBusinessId)) 
          }] 
        };

      case "get_order":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await orderService.getOrder(Number(args?.id))) 
          }] 
        };

      case "create_order":
        // Fix: Properly construct the order object
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await orderService.createOrder({
              customerId: Number(args.customerId),
              totalAmount: Number(args.totalAmount),
              status: args.status,
              orderItems: args.orderItems || [],
              businessId: safeBusinessId
            })) 
          }] 
        };

      case "list_sales":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await salesService.getAllSales(safeBusinessId)) 
          }] 
        };

      case "create_sale":
        // Fix: Properly construct the sale object
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await salesService.createSale({
              orderId: Number(args.orderId),
              productId: Number(args.productId),
              quantity: Number(args.quantity),
              totalAmount: Number(args.totalAmount),
              businessId: safeBusinessId
            })) 
          }] 
        };

      case "initiate_payment":
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify(await paymentService.initiateSTKPush(
              Number(args?.orderId), 
              String(args?.phone), 
              Number(args?.amount)
            )) 
          }] 
        };

      case "check_payment_status":
        const order = await orderService.getOrder(Number(args?.orderId));
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              orderId: order.id, 
              status: order.status,
              businessId: safeBusinessId 
            }) 
          }] 
        };
      // Expense Tools
      case "list_expenses":
      return {
         content: [{
         type: "text",
         text: JSON.stringify(
        await expenseService.getAllExpenses(safeBusinessId)
        )
       }]
      };

      case "get_expense":
       return {
       content: [{
       type: "text",
       text: JSON.stringify(
        await expenseService.getExpense(Number(args?.id))
       )
      }]
     };

     case "create_expense":
      return {
           content: [{
          type: "text",
           text: JSON.stringify(
            await expenseService.createExpense({
          type: args.type,
          amount: Number(args.amount),
          description: args.description || "",
          isRecurring: Boolean(args.isRecurring),
          frequency: args.frequency || null,
          nextDueDate: args.nextDueDate || null, // ← Keep as string, don't convert to Date
          businessId: safeBusinessId
        })
      )
    }]
  };
      
      case "whatsapp_send_text":
        const textRes = await axios.post(`${WHATSAPP_SERVICE_URL}/send-text`, args);
        return { content: [{ type: "text", text: JSON.stringify(textRes.data) }] };
      
      case "whatsapp_send_media":
        const mediaRes = await axios.post(`${WHATSAPP_SERVICE_URL}/send-media`, args);
        return { content: [{ type: "text", text: JSON.stringify(mediaRes.data) }] };

      case "whatsapp_broadcast_advert":
        const { businessId, text, imageUrl, customerIds } = args as any;
        const customers = await customerService.getAllCustomers(Number(businessId));
        const targets = customerIds 
            ? customers.filter(c => customerIds.includes(c.id))
            : customers;
        
        const results = [];
        for (const target of targets) {
            if (target.phone) {
                try {
                    if (imageUrl) {
                        await axios.post(`${WHATSAPP_SERVICE_URL}/send-media`, { to: target.phone, imageUrl, caption: text });
                    } else {
                        await axios.post(`${WHATSAPP_SERVICE_URL}/send-text`, { to: target.phone, text });
                    }
                    results.push({ id: target.id, success: true });
                } catch (err: any) {
                    results.push({ id: target.id, success: false, error: err.message });
                }
                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        return { content: [{ type: "text", text: JSON.stringify({ broadcastCount: results.length, details: results }) }] };

      case "get_business_summary":
        const bId = Number(args?.businessId);
        const [products, allOrders, allSales, allExpenses] = await Promise.all([
          productService.getAllProducts(bId),
          orderService.getAllOrders(bId),
          salesService.getAllSales(bId),
          expenseService.getAllExpenses(bId),
        ]);

        const totalRevenue = allSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalExpenses = allExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const lowStock = products.filter(p => p.stockQuantity < 5);
        const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'created');

        return { content: [{ type: "text", text: JSON.stringify({
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          productCount: products.length,
          lowStockCount: lowStock.length,
          pendingOrdersCount: pendingOrders.length,
          summary: `Business has KES ${totalRevenue} in revenue and KES ${totalExpenses} in expenses. ${lowStock.length} items are low on stock.`
        }) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * Start the server.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Fin-AI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});