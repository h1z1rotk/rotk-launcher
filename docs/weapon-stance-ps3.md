# Weapon Stance PS3

Launcher 2.0.16 adds the PS3 stance and console bindings to the native DirectInput
proxy. The matching asset pack adds the ROTK Bindings category, translated label,
default actions and the validated male animation graph. Existing user bindings
remain intact. Defaults are V for stance and N for the console.

The existing shotgun sprint v3 byte pair remains unchanged at client RVAs
`1046F98` and `1046FE5`. New guarded sites are actor idle `1659000` (15 bytes) and
the public console action query call `F446E7` (5 bytes). The virtual stance setter is
resolved at vtable + `4D8` and must target the native thunk at `7A2DE`.

The local actor's private sprint rule `6CBAEDC9` is changed only after checking
its allocation, unique ownership and writable protection. The pellet rule
`C8F2471F` remains untouched. New hooks neither replace the Steam/Vivox proxies
nor intercept exceptions. Their addresses do not overlap the crouch cache or
camera hooks. The existing DLL hashes and native tests remain release gates.

Removing the marker disables stance and restores the sprint byte pair; a full
native unhook requires exiting the game. A prepared rollback launcher must ship
the preceding v3 proxy, list this new DLL as retired, and set
`WEAPON_STANCE_ENABLED=false`. That restores the old sprint behavior without the
new idle or console hooks. The coordinated higher-version rollback asset feed
restores the preceding packs and default profile, preserving unrelated updates.

User-profile backup and ownership state live in the launcher's per-installation
`logs/<install-id>/input-profile` directory. Migration and rollback are idempotent
and leave unrelated rebindings intact. Ownership is acquired before installation
and released after rollback, so interrupted writes can be retried.

Validation includes deterministic native rebuilds, guarded setter/input lookup,
existing proxy tests, user-profile migration/revert tests and real Combat Training
testing. Exact artifacts and deployment/rollback policies are recorded with the
release preparation rather than inferred from a mutable latest feed.

Launcher 2.0.19 fixes the console alias: `ROTKConsole` now feeds the native
`ToggleNetworkStats` query, which the existing ROTK UI handles as its public
console toggle. The preceding `F4341D` debug-console query stays untouched;
its downstream native mode/role gate was why N stopped opening the console.
N remains the default and custom console bindings remain configurable. Existing
`ToggleNetworkStats` bindings, including the manual N workaround, also work.
No account role is changed: public `/slot` and moderator spectating still use
the server's existing authorization. The replacement proxy requires a launcher
update and the next game launch; it does not modify a running game.
