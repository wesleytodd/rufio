import camel from 'camel-case';

export function proxyEvents (item, dest, events) {
	for (let i in events) {
		proxyEvent(item, dest, i, events[i]);
	}
}

export function proxyEvent (item, dest, evt, proxyEvt) {
	item.on(evt, dest.emit.bind(dest, camel(proxyEvt), item));
}
