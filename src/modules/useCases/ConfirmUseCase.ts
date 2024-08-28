import { IReadingRepository } from '../repositories/IShopperRepository';
import { Reading } from '@prisma/client';

interface ConfirmRequest {
	measure_uuid: string;
	confirmed_value: number;
}

interface ConfirmResponse {
	success: boolean;
}

export class ConfirmUseCase {
	private readingRepository: IReadingRepository;

	constructor(readingRepository: IReadingRepository) {
		this.readingRepository = readingRepository;
	}

	async execute(data: ConfirmRequest): Promise<ConfirmResponse> {
		console.log('Iniciando execução do caso de uso Confirm');
		this.validateRequest(data);

		const existingReading = await this.readingRepository.read({
			id: data.measure_uuid,
		});

		if (!existingReading) {
			console.log('Leitura não encontrada');
			throw new Error('MEASURE_NOT_FOUND: Leitura do mês já realizada.');
		}

		if (existingReading.confirmedValue !== null) {
			console.log('Leitura já confirmada');
			throw new Error('CONFIRMATION_DUPLICATE: Leitura do mês já realizada.');
		}

		console.log('Atualizando o valor confirmado');
		await this.readingRepository.update({
			where: { id: data.measure_uuid },
			data: {
				measureValue: data.confirmed_value,
				confirmedValue: data.confirmed_value as number | null,
			},
		});

		console.log('Leitura confirmada com sucesso');
		return { success: true };
	}

	private validateRequest(data: ConfirmRequest): void {
		if (
			typeof data.measure_uuid !== 'string' ||
			typeof data.confirmed_value !== 'number'
		) {
			throw new Error(
				'INVALID_DATA: measure_uuid deve ser uma string e confirmed_value deve ser um número.'
			);
		}
	}
}
