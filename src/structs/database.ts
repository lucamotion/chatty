import { PrismaClient } from "../generated/prisma/client.js";
import { IPrismaClientProvider } from "../types/interfaces.js";

export class PrismaClientProvider implements IPrismaClientProvider {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  getClient() {
    return this.client;
  }
}
