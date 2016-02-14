export class Theme {
	constructor (site) {
		this.site = site;
	}

	renderContentItem (item, done) {
		done(null, item);
	}

	renderContentIndex (items, done) {
		done(null, item);
	}
}
