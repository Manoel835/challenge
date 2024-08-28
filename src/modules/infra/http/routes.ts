import { FastifyInstance } from 'fastify';
import { UploadController } from '../http/controllers/UploadController';
import { ConfirmController } from '../http/controllers/ConfirmController';

export async function appRoutes(fastify: FastifyInstance) {
  const uploadController = new UploadController();
  const confirmController = new ConfirmController();

  fastify.post('/upload', (request, reply) => uploadController.handleUpload(request, reply));
  fastify.patch('/confirm', (request, reply) => confirmController.handleConfirm(request, reply));
}
