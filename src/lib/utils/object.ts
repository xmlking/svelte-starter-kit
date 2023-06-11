export function getObjectTypeName(value: unknown): string {
	return toString.call(value).slice(8, -1);
}

export function stripEmptyProperties(obj, removeBlanks = true) {
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			if (obj[key] === null || obj[key] === undefined || (removeBlanks && obj[key] === '')) {
				delete obj[key];
			} else if (typeof obj[key] === 'object' && !(obj[key] instanceof Date)) {
				stripEmptyProperties(obj[key], removeBlanks); // Recursively check nested objects
				if (Object.keys(obj[key]).length === 0) {
					delete obj[key];
				}
			}
		}
	}
}

// RUN: ./node_modules/.bin/vitest src/lib/utils/object.ts
// in-source testing
if (import.meta.vitest) {
	const { it, expect } = import.meta.vitest;

	it('Test stripEmptyProperties', async () => {
		const jsonObject = {
			name: 'John',
			age: null,
			dob: new Date('2023-06-05T07:07:00.000Z'),
			address: {
				street: '123 Main St',
				city: '',
				country: undefined,
				postalCode: null
			},
			occupation: undefined
		};
		stripEmptyProperties(jsonObject);
		expect(jsonObject).toStrictEqual({ name: 'John', dob: new Date('2023-06-05T07:07:00.000Z'), address: { street: '123 Main St' } });
	});
}
