import { FastifyInstance } from 'fastify';
import { UploadController } from '../http/controllers/UploadController';
import { ConfirmController } from '../http/controllers/ConfirmController';
import { ListMeasuresController } from '../http/controllers/ListMeasuresController';

export async function appRoutes(fastify: FastifyInstance) {
  const uploadController = new UploadController();
  const confirmController = new ConfirmController();
  const listMeasuresController = new ListMeasuresController();


  fastify.post('/upload', (request, reply) => uploadController.handleUpload(request, reply));
  fastify.patch('/confirm', (request, reply) => confirmController.handleConfirm(request, reply));
  fastify.get('/:customer_code/list', (request, reply) => listMeasuresController.handleListMeasures(request, reply));

}
