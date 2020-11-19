export function autocache(
	path: string,
	mode: string | number | boolean | null | undefined,
): {
	cache: <T>(key: string, compute_value: () => T | Promise<T>) => Promise<T>;
	close: () => void;
};
