'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const crypto = require('crypto');
const fs = require('fs');
const v8 = require('v8');

const autocache = (path, mode) => {
    let cache = new Map();
    let loading;
    let removing = new Set();
    let pending = new Map();
    return {
        async cache(key, compute_value) {
            const key_hashed = crypto.createHash('sha1').update(key).digest('hex');
            await (loading ||
                (loading = fs.promises
                    .readFile(path)
                    .then(v8.deserialize)
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
                    .catch(() => { })));
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
            fs.writeFileSync(path, v8.serialize({ schema: 1, cache }));
        },
    };
};

exports.autocache = autocache;
//# sourceMappingURL=index.cjs.js.map
