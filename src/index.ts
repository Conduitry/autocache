import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { serialize, deserialize } from 'v8';

type Mode = string | number | boolean | null | undefined;

export const autocache = (path: string, mode: Mode) => {
	path = resolve(path);
	let cache = new Map<Mode, Map<string, any>>();
	const all_entries = new Map<string, any>();
	const used_entries = new Map<string, any>();
	const pending_entries = new Map<string, Promise<any>>();
	try {
		const data = deserialize(readFileSync(path));
		if (data && typeof data === 'object' && data.schema === 2 && data.cache instanceof Map) {
			cache = data.cache;
			for (const values of cache.values()) {
				for (const [key, value] of values) {
					all_entries.set(key, value);
				}
			}
		}
	} catch {}
	cache.set(mode, used_entries);
	return {
		async cache(key: string, compute_value: () => Promise<any>) {
			const key_hashed = createHash('sha1').update(key).digest('hex');
			let value: any;
			if (all_entries.has(key_hashed)) {
				value = all_entries.get(key_hashed);
			} else if (pending_entries.has(key_hashed)) {
				return pending_entries.get(key_hashed);
			} else {
				const promise = compute_value();
				pending_entries.set(key_hashed, promise);
				value = await promise;
				pending_entries.delete(key_hashed);
				all_entries.set(key_hashed, value);
			}
			used_entries.set(key_hashed, value);
			return value;
		},
		close() {
			writeFileSync(path, serialize({ schema: 2, cache }));
		},
	};
};
