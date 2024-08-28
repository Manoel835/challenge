import { FastifyInstance } from 'fastify';
import { UploadController } from '../http/controllers/UploadController';

export async function uploadRoutes(fastify: FastifyInstance) {
  const uploadController = new UploadController();

  fastify.post('/upload', (request, reply) => uploadController.handleUpload(request, reply));
}
