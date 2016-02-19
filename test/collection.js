/* global describe, it */
var Collection = require('../lib/collection.js').Collection;
var assert = require('assert');

describe('collection', function () {
	it('should add items', function () {
		var c = new Collection();
		c.addItem({
			id: 1
		});
		assert.equal(c.length, 1, 'Did not add the items');
	});
	it('should sort items on adding', function () {
		var c = new Collection();
		c.addItem({
			id: 2
		});
		c.addItem({
			id: 1
		});
		assert.equal(c.length, 2, 'Did not add the items');
		assert.equal(c.items[0].id, 1, 'Did not sort the items properly');
		assert.equal(c.items[1].id, 2, 'Did not sort the items properly');
	});
	it('should index items', function () {
		var c = new Collection({
			indexBy: ['type']
		});
		c.addItem({
			id: 1,
			type: 'foo'
		});
		c.addItem({
			id: 2,
			type: 'foo'
		});
		c.addItem({
			id: 3,
			type: 'bar'
		});
		assert.equal(c.length, 3, 'Did not add the items');
		assert(c.getItemsFromIndex('type', {type: 'foo'}), 'Did not create the index');
		assert.equal(c.getItemsFromIndex('type', {type: 'foo'}).length, 2, 'Did not create add the right items to the index');
		assert.equal(c.getItemsFromIndex('type', {type: 'bar'}).length, 1, 'Did not create add the right items to the index');
	});
	it('should index items by multiple keys', function () {
		var c = new Collection({
			indexBy: [{
				keys: ['year', 'month']
			}, 'year']
		});
		c.addItem({
			month: 1,
			year: 1995
		});
		c.addItem({
			month: 1,
			year: 1995
		});
		c.addItem({
			month: 2,
			year: 1995
		});
		c.addItem({
			month: 2,
			year: 1996
		});
		assert.equal(c.length, 4, 'Did not add the items');
		assert(c.getItemsFromIndex(['year', 'month'], {year: 1995, month: 1}), 'Did not create the index');
		assert(c.getItemsFromIndex('year', {year: 1995}), 'Did not create the index');
		assert.equal(c.getItemsFromIndex(['year', 'month'], {year: 1995, month: 1}).length, 2, 'Did not create add the right items to the index');
		assert.equal(c.getItemsFromIndex(['year', 'month'], {year: 1995, month: 2}).length, 1, 'Did not create add the right items to the index');
		assert.equal(c.getItemsFromIndex(['year', 'month'], {year: 1996, month: 2}).length, 1, 'Did not create add the right items to the index');
		assert.equal(c.getItemsFromIndex('year', {year: 1995}).length, 3, 'Did not add items to the right index');
		assert.equal(c.getItemsFromIndex('year', {year: 1996}).length, 1, 'Did not add items to the right index');
	});
});
