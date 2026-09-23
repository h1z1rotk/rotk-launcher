# Launcher 2.0.20: DllMain stack overflow of 2.0.19

Launcher 2.0.19 added `crouch_delete_stale_log()` to the proxy's `DllMain`
with a 64 KiB `WCHAR path[32768]` **on the stack**. BR1315 loads the proxy on
a path where that does not fit: most game processes died about three seconds
after start with `0xC00000FD` (stack overflow), before login. Server-side on
2026-09-23, only 224 of 1,872 accounts that attested with 2.0.19 reached
login, against 1,780 of 1,918 on 2.0.17. 2.0.19 was withdrawn (release back to
draft, 2.0.17 latest again) within the hour.

2.0.20 makes that buffer `static` (process attach runs once, under the loader
lock). Proxy: `199f0d288f5bec010c5cf20802eb1dc162d27a05b57699268666e93575fec6dd`,
71,680 bytes, reproducible from `native/vivoxproxy` with Zig 0.15.2.

`npm run test:native:dllmain-stack` (part of `build:vivox`, so of CI and the
release gate) loads the shipped proxy from a 32 KiB thread and requires the
stale `rotk-crouch-parity.log` to be deleted. It fails on the 2.0.19 proxy
(`ERROR_DLL_INIT_FAILED`) and passes on 2.0.20. The earlier PowerShell
`LoadLibrary` check ran on a 1 MiB stack and could not see the defect.
