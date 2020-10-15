import { createHash } from 'crypto';
import { promises, writeFileSync } from 'fs';
import { serialize, deserialize } from 'v8';

export const autocache = (path: string, mode: Mode) => {
	let cache = <Cache>new Map();
	let loading: Promise<void>;
	let removing = new Set<string>();
	let pending = new Map<string, any>();
	return {
		async cache(key: string, compute_value: () => Promise<any>) {
			const key_hashed = createHash('sha1').update(key).digest('hex');
			await (loading ||
				(loading = promises
					.readFile(path)
					.then(deserialize)
					.then((data) => {
						if (data && typeof data === 'object' && data.schema === 1 && data.cache instanceof Map) {
							cache = data.cache;
							for (const [key, [, modes]] of cache) {
								modes.delete(mode);
								if (modes.size === 0) {
									removing.add(key);
								}
							}
						}
					})
					.catch(() => {})));
			let value: any, modes: Set<Mode>;
			if (cache.has(key_hashed)) {
				[value, modes] = cache.get(key_hashed);
			} else if (pending.has(key_hashed)) {
				return pending.get(key_hashed);
			} else {
				const promise = compute_value();
				pending.set(key_hashed, promise);
				value = await promise;
				modes = new Set();
				cache.set(key_hashed, [value, modes]);
				pending.delete(key_hashed);
			}
			removing.delete(key_hashed);
			modes.add(mode);
			return value;
		},
		close() {
			for (const key of removing) {
				cache.delete(key);
			}
			writeFileSync(path, serialize({ schema: 1, cache }));
		},
	};
};

type Mode = string | number | boolean | null | undefined;

type CacheEntry = [any, Set<Mode>];

type Cache = Map<string, CacheEntry>;
