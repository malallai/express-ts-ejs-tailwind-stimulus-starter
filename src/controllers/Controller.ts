import * as express from 'express';
import { RequestHandler } from 'express';
import { Server } from "../Server";

export class Controller {

	public router: express.Router = express.Router();
	public path: string = '';
	private static routes: RouteOptions[] = [];

	public getRouter(): express.Router {
		return this.router;
	}

	public get(path: string, handler: RequestHandler): void {
		this.getRouter().get(path, handler);
	}

	public post(path: string, handler: RequestHandler): void {
		this.getRouter().post(path, handler);
	}

	public put(path: string, handler: RequestHandler): void {
		this.getRouter().put(path, handler);
	}

	public delete(path: string, handler: RequestHandler): void {
		this.getRouter().delete(path, handler);
	}

	public patch(path: string, handler: RequestHandler): void {
		this.getRouter().patch(path, handler);
	}

	public _$(method: any, subpath: string, handler: RequestHandler, options?: RouteOptions): void {
		let path = this.getPath(subpath);
		let slug = `${subpath.replace('\/', '_')}_path`;
		if (options && options.slug)
			slug = options.slug;

		method.call(this, path, handler);
		this.newRoute(path, slug, subpath, handler);
	}

	public static render(view: string, req: express.Request, res: express.Response, options?: object): void {
		res.render(view, {...options, layout: req.app.locals.layout});
	}

	public static __$(slug: string, options?: {}): string | undefined {
		let routeOptions = Controller.routes.find(element => element.slug === slug);
		if (!routeOptions || !routeOptions.route) return "/not_found";
		let route = routeOptions.route;

		if (options) {
			Object.entries(options).forEach(([key, value]) => {
				if (typeof value === 'string') {
					route = route.replace(`:${key}`, value);
					route = route.replace(`:${key}?`, value);
				}
			});
		}
		return route;
	}

	private getPath(subpath: string): string {
		return this.path + (this.path.endsWith('/') ? '' : '/') + subpath;
	}

	private newRoute(route: string, slug: string, subpath: string, handler: RequestHandler): void {
		Controller.routes.push({slug: slug, subpath: subpath, route: route, handler: handler});
	}

	public not_found(req: express.Request, res: express.Response) {
		res.render('errors/404', {layout: 'layouts/errors'})
	}

	public static getLngCookie(req: express.Request, res: express.Response, next: express.NextFunction): void {
		let currentLocale = req.cookies.i18_selected_lang;
		if (!currentLocale) currentLocale = Server.get().i18n.getLocale();
		res.locals.currentLocale = currentLocale;
		res.setLocale(currentLocale);
		next();
	}

	public static stimulusReload(req: express.Request, res: express.Response, next: express.NextFunction): void {
		let stimulusReload = req.query.stimulusReload;
		let layout = './layouts/default';
		if (stimulusReload)
			layout = './layouts/stimulus';
		req.app.locals.layout = layout;
		next();
	}
}

interface RouteOptions {
	slug?: string,
	subpath?: string,
	route?: string,
	handler?: RequestHandler;
}