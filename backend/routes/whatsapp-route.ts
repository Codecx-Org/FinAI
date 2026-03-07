import { Router } from "express";
import WhatsAppService from "../services/whatsapp-service.js";
import { Twilio } from "twilio";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router()
const whatsappService = new WhatsAppService()
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const businessNumber = process.env.TWILIO_WHATSAPP_NUMBER

router.post("/twilio-callback", asyncHandler(async (req, res) => {
    console.log(req.body)
    const order = await whatsappService.captureOrder(req.body)
    
    if (!order) {
        return res.status(404).json({ message: "Product or customer not found" });
    }
   
    if (order.customer?.phone) {
        await client.messages.create({
            body: `Your order has been processed ${order.id}\nTotal amount ${order.totalAmount}`,
            from: businessNumber!,
            to: order.customer.phone
        })
    }
    
    return res.status(200).json({ message: "ok" })
}))

export default router
