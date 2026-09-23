param(
    [string]$ProxyPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Launcher 2.0.19 shipped a proxy whose DllMain put a 64 KiB buffer on the
# stack; BR1315 died in PreInitialize (0xC00000FD). Load the shipped proxy from
# a 32 KiB thread and require the stale crouch log to be gone afterwards.
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
if ([string]::IsNullOrWhiteSpace($ProxyPath)) {
    $ProxyPath = Join-Path $repoRoot "resources\patches\vivoxsdk_x64.dll"
}
$source = Join-Path $PSScriptRoot "tests\dllmain_small_stack_test.c"
$work = Join-Path $PSScriptRoot "dist\tests\dllmain-small-stack"
$output = Join-Path $PSScriptRoot "dist\tests\dllmain_small_stack_test.exe"

$zig = Get-Command -Name "zig" -CommandType Application -ErrorAction Stop
$version = ([string](& $zig.Source version)).Trim()
if ($LASTEXITCODE -ne 0 -or $version -ne "0.15.2") {
    throw "Expected Zig 0.15.2, found '$version'."
}
New-Item -ItemType Directory -Path $work -Force | Out-Null
& $zig.Source cc -target x86_64-windows-gnu -O2 -municode -Wall -Wextra -Werror -o $output $source
if ($LASTEXITCODE -ne 0) {
    throw "DllMain small-stack test build failed with exit code $LASTEXITCODE."
}

# A private copy: the loaded module stays mapped until the test process exits.
$probeDir = Join-Path $work ([guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $probeDir -Force | Out-Null
$copy = Join-Path $probeDir "vivoxsdk_x64.dll"
Copy-Item -LiteralPath $ProxyPath -Destination $copy
& $output $copy
if ($LASTEXITCODE -ne 0) {
    throw "The Vivox proxy does not load on a small thread stack (exit $LASTEXITCODE)."
}
