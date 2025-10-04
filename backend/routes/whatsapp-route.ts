import { Router, type Request, type Response } from "express";
import WhatsAppService from "../services/whatsapp-service.js";
import { Twilio } from "twilio";

const router = Router()

const whastAppService = new WhatsAppService()
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
const businessNumber = process.env.TWILIO_WHATSAPP_NUMBER
router.post("/twilio-callback", async (req: Request, res: Response) => {
    
    try {
        console.log(req.body)
        const order = await whastAppService.captureOrder(req.body)
        if (!order){
            return res.status(404)
        }
       
        if (order.customer?.phone){
            client.messages.create({
                body: `Your order has been processed ${order.id}\nTotal amount ${order.totalAmount}`,
                from: businessNumber!,
                to: order.customer.phone
            })
        }
        return res.status(200).json({"message": "ok"})
    } catch(error){
        res.status(500).json({"message": "internal server error"})
    }
})

export default router