import { PrismaClient } from "@prisma/client"

//creates a singleton instance of the prisma client
const prisma = new PrismaClient()

export default prisma
