# 0.1.7

- Expose CJS and ESM builds with `pkg.exports`

# 0.1.6

- Allow bypassing cache by passing a `path` of `null` to `autocache`
- Fix `pkg.engines`, which should have indicated Node `>=12`, not Node `^12`

# 0.1.5

- Improve published types with generics

# 0.1.4

- Make loading cache synchronous to avoid race condition with closing cache before it's loaded

# 0.1.3

- Resolve cache path once upon instantiation

# 0.1.2

- Start loading saved cache immediately upon instantiation

# 0.1.1

- Add a schema version to the saved cache file so that it is discarded if appropriate after library upgrades

# 0.1.0

- Initial release
