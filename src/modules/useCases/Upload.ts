import { IReadingRepository } from '../repositories/IShopperRepository';
import {
	UploadRequest,
	UploadResponse,
} from '../../DataTransferObjects/UploadDTO';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Reading } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
if (!GEMINI_API_KEY) {
	throw new Error(
		'GEMINI_API_KEY não está definida nas variáveis de ambiente.'
	);
}

export class UploadUseCase {
	private readingRepository: IReadingRepository;

	constructor(readingRepository: IReadingRepository) {
		this.readingRepository = readingRepository;
	}

	async execute(data: UploadRequest): Promise<UploadResponse> {
		console.log('Iniciando execução do caso de uso Upload');
		this.validateRequest(data);

		const existingReading = await this.readingRepository.findExistingReading(
			data.customerCode,
			data.measureType,
			new Date(data.measureDatetime)
		);

		if (existingReading) {
			console.log('Leitura do mês já realizada');
			throw new Error('DOUBLE_REPORT: Leitura do mês já realizada.');
		}

		console.log('Fazendo upload da imagem para a API Gemini');
		const fileUri = await this.uploadImageToGemini(data.image);
		console.log('Imagem carregada para a API Gemini com URI:', fileUri);

		console.log('Obtendo medida da imagem a partir da API Gemini');
		const measureValueStr = await this.getMeasureFromGemini(fileUri);
		console.log('Valor de medida retornado pela API Gemini:', measureValueStr);

		// Extrair o valor numérico da string
		const measureValueMatch = measureValueStr.match(/[\d,\.]+/);
		if (!measureValueMatch) {
			throw new Error(
				'INVALID_DATA: A medida retornada pela API Gemini não contém um número válido.'
			);
		}

		const measureValue = parseFloat(measureValueMatch[0].replace(',', '.'));
		if (isNaN(measureValue)) {
			throw new Error(
				'INVALID_DATA: A medida retornada pela API Gemini não é um número válido.'
			);
		}
		console.log('Medida obtida da API Gemini:', measureValue);
		console.log('Salvando a imagem localmente');
		const imageUrl = await this.saveImageAndGetUrl(data.image);
		console.log('Imagem salva com URL:', imageUrl);

		const measureUuid = uuidv4();

		const newReading: Reading = await this.readingRepository.createReading({
			customerCode: data.customerCode,
			measureDateTime: new Date(data.measureDatetime),
			measureType: data.measureType,
			measureValue: measureValue,
			imageUrl: imageUrl,
			id: measureUuid,
		});

		console.log('Nova leitura criada com sucesso no banco de dados');

		return {
			imageUrl: newReading.imageUrl,
			measureValue: newReading.measureValue,
			measureUuid: newReading.id,
		};
	}

	private validateRequest(data: UploadRequest): void {
		if (
			!data.image ||
			!data.customerCode ||
			!data.measureDatetime ||
			!data.measureType
		) {
			throw new Error(
				'INVALID_DATA: Campos obrigatórios estão faltando ou inválidos.'
			);
		}

		if (!this.validateBase64(data.image)) {
			throw new Error(
				'INVALID_DATA: A imagem fornecida não está em um formato base64 válido.'
			);
		}
	}

	private validateBase64(base64: string): boolean {
		const base64Pattern =
			/^(?:[A-Za-z0-9+\/]{4})*?(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
		return base64Pattern.test(base64);
	}

	private async uploadImageToGemini(base64Image: string): Promise<string> {
		try {
			const buffer = Buffer.from(base64Image, 'base64');
			const tempFilePath = path.join(__dirname, 'temp-image.png');
			fs.writeFileSync(tempFilePath, buffer);

			console.log('Iniciando upload para Gemini com a chave:', GEMINI_API_KEY);
			const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

			const uploadResponse = await fileManager.uploadFile(tempFilePath, {
				mimeType: 'image/png',
				displayName: 'Uploaded Image',
			});

			fs.unlinkSync(tempFilePath);

			return uploadResponse.file.uri;
		} catch (error) {
			console.error(
				'Error uploading image to Gemini:',
				(error as any).response?.data || (error as any).message
			);
			throw new Error(
				'Error uploading image to Gemini: ' + (error as any).message
			);
		}
	}

	private async getMeasureFromGemini(fileUri: string): Promise<string> {
		const maxRetries = 3;
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				console.log(
					'Iniciando análise de imagem no Gemini com a chave:',
					GEMINI_API_KEY
				);
				const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

				let model = genAI.getGenerativeModel({
					model: 'gemini-1.5-pro',
				});

				if (attempt >= 2) {
					console.log(
						'Tentando com o modelo gemini-1.5-flash devido ao erro de limite de contexto'
					);
					model = genAI.getGenerativeModel({
						model: 'gemini-1.5-flash',
					});
				}

				const result = await model.generateContent([
					{
						fileData: {
							fileUri: fileUri,
							mimeType: 'image/png',
						},
					},
					{ text: 'Extract the measurement from the image.' },
				]);

				return result.response.text();
			} catch (error) {
				attempt++;
				console.error(
					`Error getting measure from Gemini, attempt ${attempt} of ${maxRetries}:`,
					(error as any).response?.data || (error as any).message
				);

				if (attempt >= maxRetries) {
					throw new Error(
						'Error getting measure from Gemini: ' + (error as any).message
					);
				}
			}
		}

		throw new Error(
			'Failed to get measure from Gemini after multiple attempts.'
		);
	}

	private async saveImageAndGetUrl(image: string): Promise<string> {
		const buffer = Buffer.from(image, 'base64');
		const imageId = uuidv4();
		const uploadsDirectory = path.join(__dirname, '..', 'uploads');
		const filePath = path.join(uploadsDirectory, `${imageId}.png`);

		try {
			if (!fs.existsSync(uploadsDirectory)) {
				fs.mkdirSync(uploadsDirectory, { recursive: true });
			}

			await fs.promises.writeFile(filePath, buffer);
			return `/uploads/${imageId}.png`; 
		} catch (error) {
			throw new Error('Error saving image: ' + (error as any).message);
		}
	}
}
