import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaReadingRepository } from '../../repositories/PrismaShopperRepositories';

export class ConfirmController {
    private readingRepository: PrismaReadingRepository;

    constructor() {
        this.readingRepository = new PrismaReadingRepository();
    }

    async handleConfirm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const { measure_uuid, confirmed_value } = request.body as { measure_uuid: string; confirmed_value: number };

            // Validação de tipos de dados
            if (typeof measure_uuid !== 'string' || typeof confirmed_value !== 'number') {
                reply.status(400).send({
                    error_code: 'INVALID_DATA',
                    error_description: 'measure_uuid deve ser uma string e confirmed_value deve ser um número.',
                });
                return;
            }

            // Verificação se a leitura existe
            const existingReading = await this.readingRepository.read({ id: measure_uuid });
            if (!existingReading) {
                reply.status(404).send({
                    error_code: 'MEASURE_NOT_FOUND',
                    error_description: 'Leitura do mês já realizada.',
                });
                return;
            }

            // Verificação se a leitura já foi confirmada
            if (existingReading.confirmedValue !== null) {
                reply.status(409).send({
                    error_code: 'CONFIRMATION_DUPLICATE',
                    error_description: 'Leitura do mês já realizada.',
                });
                return;
            }

            // Atualização do valor confirmado
            await this.readingRepository.update({
                where: { id: measure_uuid },
                data: { measureValue: confirmed_value, confirmedValue: confirmed_value },
            });

            // Resposta de sucesso
            reply.status(200).send({ success: true });
        } catch (error) {
            reply.status(500).send({
                error_code: 'INTERNAL_ERROR',
                error_description: 'Erro inesperado. ' + (error as any).message,
            });
        }
    }
}
