export function reducePipe (initial, transforms) {
	return transforms.reduce(function (stream, transform) {
		return stream.pipe(transform);
	}, initial);
}
