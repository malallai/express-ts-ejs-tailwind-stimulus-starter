import express from 'express';
import * as path from 'path';
import expresslayouts from 'express-ejs-layouts';
import { Controller } from './controllers/Controller';
import cookieParser from 'cookie-parser';
import consola, { Consola } from 'consola';
import I18n from 'i18n';
import fs from 'fs';

export class Server {

	private static instance: Server;
	
	public app: express.Application;
	public port: number;
	public logger: Consola = consola;
	public i18n: I18n.I18n

	constructor(port: number) {
		Server.instance = this;
		this.app = express();
		this.port = port;
		this.i18n = new I18n.I18n();
	}
	
	public async configure(args: AppOptions): Promise<void> {
		await this.initializeI18n();
		await this.initializeViews();
		this.initializeMiddlewares();
		this.initializeControllers(args.controllers);
		this.notFoundMiddleware();
	}

	private async initializeI18n(): Promise<void> {
		const localesPath = path.join(__dirname, 'locales');
		let locales: string[] = [];
		const files: string[] = fs.readdirSync(localesPath);
		files.forEach(file => {
			const locale = file.split('.')[0];
			locales.push(locale);
		});

		await this.i18n.configure({
			locales: locales,
			defaultLocale: 'en',
			directory: localesPath
		});

		this.app.locals.locales = this.i18n.getLocales();
	}

	private async initializeViews(): Promise<void> {
		this.app.set('layout', './layouts/default');
		this.app.set('views', path.resolve(__dirname, 'views'));
		this.app.set('view engine', 'ejs');

		this.app.locals.__$ = Controller.__$;
	}

	private initializeMiddlewares(): void {
		this.app.use(expresslayouts);
		this.app.use(cookieParser());
		this.app.use(express.static(path.join(__dirname, 'assets')));
		this.app.use(express.urlencoded({extended: false}));
		this.app.use(express.json());
		this.app.use(this.i18n.init);
		this.app.use(Controller.stimulusReload);
		this.app.use(Controller.getLngCookie);
	}

	private notFoundMiddleware(): void {
		this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
			if (!req.route)
				res.render('errors/404', {layout: 'layouts/errors'})
			next();
		});
	}

	private initializeControllers(controllers: any): void {
		controllers.forEach((controller: any) => {
			this.app.use('/', controller.getRouter());
		});
	}

	public listen(): void {
		this.app.listen(this.port, () => {
			return this.logger.success(`Server listening on port ${this.port}`);
		});
	}

	public static get(): Server {
		return this.instance;
	}

}

interface AppOptions {
	controllers?: Controller[];
}