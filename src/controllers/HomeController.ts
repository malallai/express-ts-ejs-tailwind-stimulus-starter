import * as express from 'express';
import { Controller } from './Controller';

export class HomeController extends Controller {

	constructor() {
		super();
		this.path = '/';
		this.intializeRoutes();
	}

	private intializeRoutes() {
		this._$(this.get, '', this.index, {slug: "root_path"});
		this._$(this.get, '404', this.not_found);
	}

	public index(req: express.Request, res: express.Response) {
		Controller.render('pages/home/index', req, res, {user_agent: req.get('User-Agent')});
	}

}

