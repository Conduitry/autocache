const assert = require('assert');
const fs = require('fs');
const { autocache } = require('.');

let count = 0;
const func = async () => {
	count++;
	return {};
};

(async () => {
	await fs.promises.unlink('cache.test').catch(() => {});

	{
		// set value 1 and value 2 in mode 1
		const { cache, close } = autocache('cache.test', 'm1');
		assert.strictEqual(count, 0);
		const v1a = await cache('v1', func);
		assert.strictEqual(count, 1);
		const v1b = await cache('v1', func);
		assert.strictEqual(count, 1);
		assert.strictEqual(v1a, v1b);
		const v2 = await cache('v2', func);
		assert.strictEqual(count, 2);
		assert.notStrictEqual(v1a, v2);
		close();
	}

	{
		// open and close mode 2 - should not wipe values saved in mode 1
		const { cache, close } = autocache('cache.test', 'm2');
		close();
	}

	{
		// check value 2 already exists in mode 2 (from mode 1)
		const { cache, close } = autocache('cache.test', 'm2');
		assert.strictEqual(count, 2);
		const v2 = await cache('v2', func);
		assert.strictEqual(count, 2);
		close();
	}

	{
		// check two parallel calls to value 3 (in mode 1) return the same value
		// also clears value 1, which only exists in mode 1
		const { cache, close } = autocache('cache.test', 'm1');
		const [v3a, v3b] = await Promise.all([cache('v3', func), cache('v3', func)]);
		assert.strictEqual(v3a, v3b);
		close();
	}

	{
		// check that value 1 no longer exists, but value 2 still does
		const { cache, close } = autocache('cache.test', 'm2');
		assert.strictEqual(count, 3);
		const v1 = await cache('v1', func);
		assert.strictEqual(count, 4);
		const v2 = await cache('v2', func);
		assert.strictEqual(count, 4);
		close();
	}

	await fs.promises.unlink('cache.test').catch(() => {});
})();
