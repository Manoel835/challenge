import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaReadingRepository } from '../../repositories/PrismaShopperRepositories';

export class ListMeasuresController {
    private readingRepository: PrismaReadingRepository;

    constructor() {
        this.readingRepository = new PrismaReadingRepository();
    }

    async handleListMeasures(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const { customer_code } = request.params as { customer_code: string };
            const { measure_type } = request.query as { measure_type?: string };

            // Validação do parâmetro opcional measure_type
            if (measure_type && !['WATER', 'GAS'].includes(measure_type.toUpperCase())) {
                reply.status(400).send({
                    error_code: 'INVALID_TYPE',
                    error_description: 'Tipo de medição não permitida',
                });
                return;
            }

            // Filtrar medidas do cliente
            const filters = {
                customerCode: customer_code,
                ...(measure_type && { measureType: measure_type.toUpperCase() })
            };

            const measures = await this.readingRepository.findAllByCustomer(filters);

            if (measures.length === 0) {
                reply.status(404).send({
                    error_code: 'MEASURES_NOT_FOUND',
                    error_description: 'Nenhuma leitura encontrada.',
                });
                return;
            }

            // Formatar a resposta
            const response = {
                customer_code,
                measures: measures.map(measure => ({
                    measure_uuid: measure.id,
                    measure_datetime: measure.measureDateTime,
                    measure_type: measure.measureType,
                    has_confirmed: measure.confirmedValue !== null,
                    listMeasuresControllerimage_url: measure.imageUrl,
                })),
            };

            reply.status(200).send(response);
        } catch (error) {
            reply.status(500).send({
                error_code: 'INTERNAL_ERROR',
                error_description: 'Erro inesperado. ' + (error as any).message,
            });
        }
    }
}
