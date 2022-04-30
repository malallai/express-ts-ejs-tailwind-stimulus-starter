import { Server } from './Server';
import { HomeController } from './controllers/HomeController';

const server = new Server(3042);
server.configure({
	controllers: [
		new HomeController()
	]
}).then(r => {
	server.logger.info('Server started');
});

server.listen();
