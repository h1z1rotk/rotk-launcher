# ROTK Launcher 2.0.19

Restores the configurable Console shortcut (N by default) for players and staff.
The previous native alias used the debug-console path, whose mode gate could
prevent the console from opening even with a valid binding. The alias now uses
the public gameplay-console event already handled by the ROTK UI.

Players retain public commands such as `/slot`. Moderators retain their existing
`/mod`, `/match` and spectating permissions; opening the console grants no new
server permissions. Custom bindings and the native N workaround are preserved.

The launcher replaces the precisely identified 2.0.16/2.0.17 gameplay proxy at
the next game launch. A running game must be closed before the update applies;
no server restart is needed. The stance and shotgun-sprint behavior is unchanged.

Validation: reproducible native proxy build, action-dispatch regression tests,
profile migration tests, proxy replacement tests, TypeScript checks and launcher
build. The release workflow verifies the bundled proxy and its sidecar before
packaging the installer.
