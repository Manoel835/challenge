import { FastifyReply, FastifyRequest } from 'fastify';
import { UploadUseCase } from '../../../useCases/Upload';
import { PrismaReadingRepository } from '../../repositories/PrismaShopperRepositories';
import { UploadRequest } from '../../../../DataTransferObjects/UploadDTO';

export class UploadController {
	private uploadUseCase: UploadUseCase;

	constructor() {
		const prismaReadingRepository = new PrismaReadingRepository();
		this.uploadUseCase = new UploadUseCase(prismaReadingRepository);
	}

	async handleUpload(
		request: FastifyRequest,
		reply: FastifyReply
	): Promise<void> {
		try {
			const data = request.body as UploadRequest;
			const response = await this.uploadUseCase.execute(data);
			reply.status(200).send(response);
		} catch (error) {
			if ((error as any).message.includes('INVALID_DATA')) {
				reply.status(400).send({
					error_code: 'INVALID_DATA',
					error_description: (error as any).message,
				});
			} else if ((error as any).message.includes('DOUBLE_REPORT')) {
				reply.status(409).send({
					error_code: 'DOUBLE_REPORT',
					error_description: (error as any).message,
				});
			} else {
				reply.status(500).send({
					error_code: 'INTERNAL_ERROR',
					error_description: 'Erro inesperado. ' + (error as any).message,
				});
			}
		}
	}
}
