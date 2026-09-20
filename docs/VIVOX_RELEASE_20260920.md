# Vivox compatibility release input

Launcher 2.0.16 ships the release owner's `vivoxsdk_x64_v5_compat.dll`,
provided on 2026-09-20, as `resources/patches/vivoxsdk_x64.dll`.

- SHA-256: `7a6da1dd688fbc62e880535315c7c47f1f36441c1e8a3992d8bf2f9c54a13f55`
- Size: 198,656 bytes; AMD64 PE32+ DLL.
- Its 54 named exports and ordinals match the prior proxy.
- The official `vivoxsdk_x64_v5.dll` runtime remains unchanged.

This is a supplied binary, not a reproducible build of the reference C sources
currently in this repository. `build:vivox` verifies its pinned bytes and runs
the existing native checks, including the real SDK/proxy volume ABI test.
`build:vivox:source` builds the reference implementation into
`native/vivoxproxy/dist/` for development. CI still checks that reference build
twice for reproducibility, independently of the shipped artifact. Preparing or
packaging a release never overwrites the supplied DLL. Signing excludes this
hash-pinned input, as it already excludes the official PresentMon executable.

The launcher verifies and installs the new proxy before every game launch,
including existing installations. It preserves the verified original Vivox 4
backup and refreshes the crouch marker and attestation override to the new hash.
No game process needs to be modified while it is running.

The prepared 2.0.17 rollback restores the previous proxy
`766a7c84b10b0c9f2a6f3edb3c58ab8c8e2ffb6b358c0cef52966db82eb6957a`
through the same replacement path and retains the existing shotgun sprint patch.
Reference-source tests do not by themselves prove the supplied binary's in-game
voice or hook behavior; the runtime ABI checks exercise the actual supplied DLL.
