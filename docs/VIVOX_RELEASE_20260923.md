# Vivox proxy built from source (launcher 2.0.19)

Launcher 2.0.19 stops shipping the supplied `vivoxsdk_x64_v5_compat.dll` of
2026-09-20 (`7a6da1dd…`, 198,656 bytes) and ships the reproducible build of
`native/vivoxproxy` instead:

- SHA-256: `efcd07a32def7c9c8ab9e571a3827223b8a5490ea8d75572907e990bf9b3a301`
- Size: 71,680 bytes; AMD64 PE32+ DLL, Zig 0.15.2 (`build:vivox:source`).
- CI builds the sources twice and requires this exact hash.

What changes for players:

- `DllMain` deletes `rotk-crouch-parity.log` next to the proxy at process
  start. The patch-v2 worker appends one line per crouch blend transition and
  the file was never rotated: installs reached tens of megabytes, reopened on
  every append, which players reported as lag. Each session now starts empty.
- The supplied binary's extra behaviour that never existed in these sources
  (the `/voice/v1/refresh` call and the `X-ROTK-AC-Flag` grant header) is
  dropped on purpose, by operator decision.

The server attestation policy (migration 0085) still pins the 2.0.15 proxy
`766a7c84…`; it did not follow 2.0.16 either, so the new hash needs the same
treatment as the previous one if enforcement is ever turned on.
