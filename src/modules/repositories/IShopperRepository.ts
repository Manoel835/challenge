import { Reading, Prisma } from '@prisma/client';

export interface IReadingRepository {
  createReading(data: Prisma.ReadingCreateInput): Promise<Reading>;
  read(where: Prisma.ReadingWhereUniqueInput): Promise<Reading | null>;
  update(params: {
    where: Prisma.ReadingWhereUniqueInput;
    data: Prisma.ReadingUpdateInput;
  }): Promise<Reading>;
  delete(where: Prisma.ReadingWhereUniqueInput): Promise<Reading>;
  findExistingReading(
    customerCode: string,
    measureType: string,
    measureDatetime: Date
  ): Promise<Reading | null>;
}
