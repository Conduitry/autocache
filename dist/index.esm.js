import { createHash } from 'crypto';
import { promises, writeFileSync } from 'fs';
import { deserialize, serialize } from 'v8';

const autocache = (path, mode) => {
    let cache = new Map();
    const removing = new Set();
    const pending = new Map();
    const loading = promises
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
        .catch(() => { });
    return {
        async cache(key, compute_value) {
            await loading;
            const key_hashed = createHash('sha1').update(key).digest('hex');
            let value, modes;
            if (cache.has(key_hashed)) {
                [value, modes] = cache.get(key_hashed);
            }
            else if (pending.has(key_hashed)) {
                return pending.get(key_hashed);
            }
            else {
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

export { autocache };
//# sourceMappingURL=index.esm.js.map
