# autocache

A cache that cleans itself.

## Installation

This is not published to npm. Install from Git tags.

## Concept

When using caching to speed up a build, whether a given cache entry is outdated and safe to be removed is often as simple as whether it was unused during the previous build.

However, there are often multiple build modes (prod vs. dev, etc.), and if a particular cache entry has never in the past been used in a particular mode, it not being used in it now is no reason for it to be eliminated.

_However_, certain cache entries are used in multiple build modes, and these should be shared across modes, so simply using different caches for different build modes is inefficient.

_HOWEVER_, having to declare ahead of time what the build modes are or which build modes a given cache entry will be used in is inconvenient. The caching library should be able to note which build modes each cache entry has been previously used in, and once an entry has been _not_ used under builds of each mode that it previously _had_ been used in, it should be automatically removed from the cache.

This was precisely the situation I found myself in, and `autocache` claims to solve all of these problems.

## Usage

```js
import { autocache } from '@conduitry/autocache';

const cache = autocache('/path/to/cache.dat', 'mode name');
```

This library has one named export, `autocache`, which is a function that accepts two arguments, `path` and `mode`.

- `path` is a string of the path of the file that is to be used to persist the cache
- `mode` is any primitive, immutable value representing the current build mode that the program is running in and which will affect when cache entries are eventually removed

```js
const result = await cache.cache('some key', async () => { /* compute the value */ });
// ...
cache.close();
```

The value returned by `autocache` is an object containing two functions, `cache` and `close`. This object is created by a closure and is not a class instance, so it is safe to destructure its methods.

- `cache` is a function to look up or to compute. It returns a `Promise` (resolving to the cached or computed value), and accepts two arguments, `key` and `compute_value`
	- `key` is a string uniquely identifying in some way the operation whose result you want to cache. This is hashed before it's saved or compared, so it can be long without bloating the cache file
	- `compute_value` is a function that is passed no arguments and returns a `Promise` resolving to the desired value. It will only be called if a value corresponding to `key` is not found
- `close` is a function that saves the current state of the cache back to disk, removing any entries it is safe to. It does this synchronously, specifically so that it's safe to run in a `process.on('exit', () => { ... })` callback.

## Details

The cache is persisted to disk as an object sent through `v8.serialize`, so anything you try to cache will need to be serializable by that function.

When the `compute_value` function is called, the `Promise` that it returns will also be used for any future calls issued with the same `key` before the `Promise` resolves.

The response is only persisted to the cache if the `Promise` resolves successfully. Calling `cache.close()` will not save, update, or mark as used any results that were still pending at the time or that threw or returned a `Promise` that rejected.

Along with each cache entry is stored a list of the `mode`s that entry has been used in. Whenever an entry is used (either through a cache hit or a cache miss), the current `mode` is added to that entry's list. The current `mode` is removed from all other entries' lists, and those entries whose list of `mode`s is now empty are not written to disk when `cache.close()` is called.

## License

[MIT](LICENSE)
