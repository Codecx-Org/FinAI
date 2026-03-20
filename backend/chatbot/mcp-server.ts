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
import { ExpenseService } from "../services/expense-service.js";

const productService = new ProductService();
const customerService = new CustomerService();
const orderService = new OrderService();
const salesService = new SalesService();
const paymentService = new PaymentService();
const expensesService = new ExpenseService();

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
      // Product Tools
      {
        name: "list_products",
        description: "List all products in the inventory",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
        },
      },
      {
        name: "get_product",
        description: "Get details of a specific product by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
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
            businessId: { type: "number" },
          },
          required: ["name", "businessId"],
        },
      },
      // Order Tools
      {
        name: "list_orders",
        description: "List all orders",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
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
            businessId: { type: "number" },
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
          required: ["customerId", "totalAmount", "status", "businessId"],
        },
      },
      // Sales Tools
      {
        name: "list_sales",
        description: "List all sales records",
        inputSchema: {
          type: "object",
          properties: {
            businessId: { type: "number" },
          },
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
            businessId: { type: "number" },
          },
          required: ["orderId", "productId", "quantity", "totalAmount", "businessId"],
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
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_products":
        return { content: [{ type: "text", text: JSON.stringify(await productService.getAllProducts(args?.businessId ? Number(args.businessId) : undefined)) }] };
      case "get_product":
        return { content: [{ type: "text", text: JSON.stringify(await productService.getProduct(Number(args?.id))) }] };
      case "create_product":
        return { content: [{ type: "text", text: JSON.stringify(await productService.createProduct(args as any)) }] };
      case "list_customers":
        return { content: [{ type: "text", text: JSON.stringify(await customerService.getAllCustomers(args?.businessId ? Number(args.businessId) : undefined)) }] };
      case "create_customer":
        return { content: [{ type: "text", text: JSON.stringify(await customerService.createCustomer(args as any)) }] };
      case "list_orders":
        return { content: [{ type: "text", text: JSON.stringify(await orderService.getAllOrders(args?.businessId ? Number(args.businessId) : undefined)) }] };
      case "get_order":
        return { content: [{ type: "text", text: JSON.stringify(await orderService.getOrder(Number(args?.id))) }] };
      case "create_order":
        return { content: [{ type: "text", text: JSON.stringify(await orderService.createOrder(args as any)) }] };
      case "list_sales":
        return { content: [{ type: "text", text: JSON.stringify(await salesService.getAllSales(args?.businessId ? Number(args.businessId) : undefined)) }] };
      case "create_sale":
        return { content: [{ type: "text", text: JSON.stringify(await salesService.createSale(args as any)) }] };
      case "initiate_payment":
        return { content: [{ type: "text", text: JSON.stringify(await paymentService.initiateSTKPush(Number(args?.orderId), String(args?.phone), Number(args?.amount))) }] };
      case "check_payment_status":
        const order = await orderService.getOrder(Number(args?.orderId));
        return { content: [{ type: "text", text: JSON.stringify({ orderId: order.id, status: order.status }) }] };
      case "list_expenses":
        return { content: [{ type: "text", text: JSON.stringify(await expensesService.getAllExpenses(args?.businessId ? Number(args.businessId) : undefined)) }] };
      case "get_expense":
        return { content: [{ type: "text", text: JSON.stringify(await expensesService.getExpense(Number(args?.id))) }] };
      case "create_expense":
        const expenseData = {
          ...args,
          nextDueDate: args?.nextDueDate ? new Date(String(args.nextDueDate)) : undefined,
          businessId: Number(args?.businessId),
          amount: Number(args?.amount),
        };
        return { content: [{ type: "text", text: JSON.stringify(await expensesService.createExpense(expenseData as any)) }] };
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
