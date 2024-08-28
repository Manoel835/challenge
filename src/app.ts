import { fastify } from './server';
import { appRoutes } from '../src/modules/infra/http/routes';

async function build() {
	// Registre as rotas
	fastify.register(appRoutes);

	// Rota de fallback para 404 Not Found
	fastify.setNotFoundHandler((request, reply) => {
		reply.status(404).send({ error: 'Not Found' });
	});

	try {
		const address = await fastify.listen({ port: 3000, host: '0.0.0.0' });
		console.log(`Server listening at ${address}`);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
}

build();
