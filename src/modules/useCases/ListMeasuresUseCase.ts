import { IReadingRepository } from '../repositories/IShopperRepository';
import { Reading } from '@prisma/client';

interface ListMeasuresRequest {
  customer_code: string;
  measure_type?: string;
}

interface ListMeasuresResponse {
  customer_code: string;
  measures: {
    measure_uuid: string;
    measure_datetime: Date;
    measure_type: string;
    has_confirmed: boolean;
    image_url: string;
  }[];
}

export class ListMeasuresUseCase {
  private readingRepository: IReadingRepository;

  constructor(readingRepository: IReadingRepository) {
    this.readingRepository = readingRepository;
  }

  async execute(data: ListMeasuresRequest): Promise<ListMeasuresResponse> {
    console.log('Iniciando execução do caso de uso ListMeasures');

    this.validateRequest(data);

    const filters = {
      customerCode: data.customer_code,
      ...(data.measure_type && { measureType: data.measure_type.toUpperCase() }),
    };

    const measures = await this.readingRepository.findAllByCustomer(filters);

    if (measures.length === 0) {
      console.log('Nenhuma leitura encontrada.');
      throw new Error('MEASURES_NOT_FOUND: Nenhuma leitura encontrada.');
    }

    const response: ListMeasuresResponse = {
      customer_code: data.customer_code,
      measures: measures.map(measure => ({
        measure_uuid: measure.id,
        measure_datetime: measure.measureDateTime,
        measure_type: measure.measureType,
        has_confirmed: measure.confirmedValue !== null,
        image_url: measure.imageUrl,
      })),
    };

    console.log('Leituras encontradas e retornadas com sucesso');
    return response;
  }

  private validateRequest(data: ListMeasuresRequest): void {
    if (typeof data.customer_code !== 'string') {
      throw new Error('INVALID_DATA: customer_code deve ser uma string.');
    }

    if (data.measure_type && !['WATER', 'GAS'].includes(data.measure_type.toUpperCase())) {
      throw new Error('INVALID_TYPE: Tipo de medição não permitida');
    }
  }
}
