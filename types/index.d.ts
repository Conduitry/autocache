export function autocache(
	path: string,
	mode: string | number | boolean | null | undefined,
): {
	cache: (key: string, compute_value: () => Promise<any>) => Promise<any>;
	close: () => void;
};
