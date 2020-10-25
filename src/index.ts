import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { serialize, deserialize } from 'v8';

type Mode = string | number | boolean | null | undefined;
type Cache = Map<string, [any, Set<Mode>]>;

export const autocache = (path: string, mode: Mode) => {
	path = resolve(path);
	let cache = <Cache>new Map();
	const removing = new Set<string>();
	const pending = new Map<string, any>();
	try {
		const data = deserialize(readFileSync(path));
		if (data && typeof data === 'object' && data.schema === 1 && data.cache instanceof Map) {
			cache = data.cache;
			for (const [key, [, modes]] of cache) {
				modes.delete(mode);
				if (modes.size === 0) {
					removing.add(key);
				}
			}
		}
	} catch {}
	return {
		async cache(key: string, compute_value: () => Promise<any>) {
			const key_hashed = createHash('sha1').update(key).digest('hex');
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
