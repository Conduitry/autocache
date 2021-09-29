import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { deserialize, serialize } from 'v8';

const autocache = (path, mode) => {
    if (path == null) {
        return {
            async cache(key, compute_value) {
                return compute_value();
            },
            close() { },
        };
    }
    const resolved_path = resolve(path);
    let cache = new Map();
    const all_entries = new Map();
    const used_entries = new Map();
    const pending_entries = new Map();
    try {
        const data = deserialize(readFileSync(resolved_path));
        if (data && typeof data === 'object' && data.schema === 2 && data.cache instanceof Map) {
            cache = data.cache;
            for (const values of cache.values()) {
                for (const [key, value] of values) {
                    all_entries.set(key, value);
                }
            }
        }
    }
    catch { }
    cache.set(mode, used_entries);
    return {
        async cache(key, compute_value) {
            const key_hashed = createHash('sha1').update(key).digest('hex');
            let value;
            if (all_entries.has(key_hashed)) {
                value = all_entries.get(key_hashed);
            }
            else if (pending_entries.has(key_hashed)) {
                return pending_entries.get(key_hashed);
            }
            else {
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
            writeFileSync(resolved_path, serialize({ schema: 2, cache }));
        },
    };
};

export { autocache };
//# sourceMappingURL=index.esm.js.map
