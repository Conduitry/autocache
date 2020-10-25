'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const v8 = require('v8');

const autocache = (path$1, mode) => {
    path$1 = path.resolve(path$1);
    let cache = new Map();
    const removing = new Set();
    const pending = new Map();
    const loading = fs.promises
        .readFile(path$1)
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
        .catch(() => { });
    return {
        async cache(key, compute_value) {
            await loading;
            const key_hashed = crypto.createHash('sha1').update(key).digest('hex');
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
            fs.writeFileSync(path$1, v8.serialize({ schema: 1, cache }));
        },
    };
};

exports.autocache = autocache;
//# sourceMappingURL=index.cjs.js.map
