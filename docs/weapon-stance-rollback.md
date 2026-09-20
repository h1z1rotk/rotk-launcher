# Prepared rollback 2.0.17

This recovery build restores the exact shotgun sprint v3 DLL shipped before the
stance update (36fba203… / 25,088 bytes). It disables the new stance/console
profile migration and removes only actions owned by that migration, preserving
all unrelated user bindings. Steam, Vivox, crouch, deathcomm and other mainline
updates remain at the same revision as 2.0.16.

Coordinate publication with the prepared 1.13.13 asset feed and matching server
integrity/version policy. Keep this branch and release in draft until rollback
is requested. No source editing or local client repair is needed by players.
