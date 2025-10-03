import { PrismaClient } from "../generated/prisma/client"

//creates a singleton instance of the prisma client
const prisma = new PrismaClient()

export default prisma
