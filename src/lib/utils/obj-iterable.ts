export function iterable<T extends object>(obj: T) {
	return {
		...obj,
		*[Symbol.iterator]() {
			for (const key of Object.keys(obj)) {
				yield [key, obj[key]];
			}
		}
	};
}

const obj = iterable({ name: 'Builder.io' });
// ..
for (const [key, value] of obj) {
	console.log(key, value);
}
