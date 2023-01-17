export function getObjectTypeName(value: unknown): string {
	return toString.call(value).slice(8, -1);
}
