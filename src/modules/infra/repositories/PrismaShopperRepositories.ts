import { PrismaClient, Reading, Prisma } from '@prisma/client';
import { IReadingRepository } from '../../repositories/IShopperRepository';

export class PrismaReadingRepository implements IReadingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createReading(data: Prisma.ReadingCreateInput): Promise<Reading> {
    return this.prisma.reading.create({
      data,
    });
  }

  async read(where: Prisma.ReadingWhereUniqueInput): Promise<Reading | null> {
    return this.prisma.reading.findUnique({
      where,
    });
  }

  async update(params: {
    where: Prisma.ReadingWhereUniqueInput;
    data: Prisma.ReadingUpdateInput;
  }): Promise<Reading> {
    return this.prisma.reading.update({
      where: params.where,
      data: params.data,
    });
  }

  async delete(where: Prisma.ReadingWhereUniqueInput): Promise<Reading> {
    return this.prisma.reading.delete({
      where,
    });
  }

  async findExistingReading(
    customerCode: string,
    measureType: string,
    measureDatetime: Date
  ): Promise<Reading | null> {
    return this.prisma.reading.findFirst({
      where: {
        customerCode,
        measureType,
        measureDateTime: {
          gte: new Date(measureDatetime.getFullYear(), measureDatetime.getMonth(), 1),
          lt: new Date(measureDatetime.getFullYear(), measureDatetime.getMonth() + 1, 1),
        },
      },
    });
  }
}
