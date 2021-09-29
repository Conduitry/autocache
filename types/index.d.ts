export function autocache(
	path: string | null,
	mode: string | number | boolean | null | undefined,
): {
	cache: <T>(key: string, compute_value: () => T | Promise<T>) => Promise<T>;
	close: () => void;
};
