import { Twilio } from "twilio";
import { OrderService } from "./orders-services.js";
import { CustomerService } from "./customer-service.js";
import { ProductService } from "./products-service.js";
import { OrderStatus } from "../generated/prisma/index.js";
import { NotFoundError } from "../utils/types/errors.js";

//integrate the twilio service
const orderService = new OrderService()
const customerService = new CustomerService()
const productService = new ProductService()
class WhatsAppService {
    async captureOrder({name: customerName, product: productName, quantity, phone: customerPhone}: {
        name: string,
        product: string,
        quantity: number,
        phone: string
    }){
        const customer = await customerService.createCustomer({
            name: customerName,
            phone: customerPhone
        })

        const product = await productService.getProductFilter({ name: productName })
        if (product.length > 0 && product[0]) {
            const order = await orderService.createOrder({
                customerId: customer.id,
                totalAmount: quantity * product[0].price,
                status: OrderStatus.created,
                orderItems: [{
                    productId: product[0].id,
                    quantity: quantity,
                }]
            })
            return order
        }
    }
}

export default WhatsAppService