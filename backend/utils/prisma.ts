import { PrismaClient } from "../generated/prisma/index.js"

//creates a singleton instance of the prisma client
const prisma = new PrismaClient()

export default prisma
