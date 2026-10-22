# The nightly game theory build, started by Windows Task Scheduler at 3 am (Biku, 2026-10-18).
#
# If a script waits in inbox\game-theory, it moves it to inbox\game-theory\building, keeps the
# laptop awake, and starts Claude Code alone with the instructions in nightly-game-theory.md. If no
# script waits, it does nothing and Claude is not started at all. Everything it does is logged in
# scheduled\logs.

$ErrorActionPreference = 'Stop'
$root = 'F:\Video Studio'
$inbox = Join-Path $root 'inbox\game-theory'
$building = Join-Path $inbox 'building'
$logs = Join-Path $root 'scheduled\logs'
New-Item -ItemType Directory -Force $building, $logs | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd'
$log = Join-Path $logs "$stamp.log"
function Note($text) { "$(Get-Date -Format 'HH:mm:ss')  $text" | Add-Content -Encoding utf8 $log }

# The oldest script that waits (a .md or .txt file).
$script = Get-ChildItem $inbox -File | Where-Object { $_.Extension -in '.md', '.txt' -and $_.Name -notlike 'REPORT-*' } |
  Sort-Object LastWriteTime | Select-Object -First 1
if (-not $script) { Note 'No script waits. Nothing to do.'; exit 0 }
$moved = Join-Path $building $script.Name
Move-Item $script.FullName $moved
Note "Building $($script.Name)"

# Keep the laptop awake while this runs (it may sleep again afterwards).
Add-Type -Namespace Studio -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);'
[Studio.Power]::SetThreadExecutionState([uint32]2147483649) | Out-Null  # continuous, system required

# Claude Code: the copy that comes with the editor extension, the newest one.
$ext = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" -Directory -Filter 'anthropic.claude-code-*' |
  Sort-Object Name -Descending | Select-Object -First 1
$claude = Join-Path $ext.FullName 'resources\native-binary\claude.exe'
if (-not (Test-Path $claude)) { Note "Claude Code not found at $claude"; exit 1 }

# Long jobs (voices, renders) need more than the few minutes a command gets by default.
$env:BASH_DEFAULT_TIMEOUT_MS = '3600000'
$env:BASH_MAX_TIMEOUT_MS = '7200000'
$env:CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS = '7200000'

# Only the studio's own commands and files. Drawing something new means code under engine\src and
# shared\src, so those may be written too (then the tests must pass); no git, nothing deleted, and
# not the PowerShell tool (its rules work differently).
$allowed = @(
  'Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
  'Edit(/runs/**)', 'Write(/runs/**)', 'Edit(/inbox/**)', 'Write(/inbox/**)',
  'Edit(/engine/src/**)', 'Write(/engine/src/**)', 'Edit(/shared/src/**)', 'Write(/shared/src/**)',
  'Edit(/library/**)', 'Write(/library/**)', 'Edit(/styles/**)', 'Edit(/knowledge/**)', 'Write(/knowledge/**)',
  'Edit(/BUILD-STATUS.md)', 'Edit(/.cache/**)', 'Write(/.cache/**)',
  'Bash(npm run *)', 'Bash(npm test*)', 'Bash(npx prettier *)', 'Bash(python *)', 'Bash(ffmpeg *)',
  'Bash(ls *)', 'Bash(cat *)', 'Bash(head *)', 'Bash(tail *)', 'Bash(grep *)', 'Bash(mkdir *)', 'Bash(cp *)'
)
$denied = @('PowerShell', 'Bash(git *)', 'Bash(rm *)', 'Bash(del *)', 'Edit(/CLAUDE.md)', 'Edit(/.claude/**)')

$prompt = "inbox/game-theory/building/$($script.Name)`n`n" + (Get-Content -Raw (Join-Path $root 'scheduled\nightly-game-theory.md'))
Set-Location $root
$prompt | & $claude -p 'Follow the instructions given on stdin. The script to build is named on their first line.' `
  --permission-mode dontAsk --allowedTools @allowed --disallowedTools @denied `
  --max-turns 400 --output-format json *> (Join-Path $logs "$stamp-claude.json")
Note "Claude finished with exit code $LASTEXITCODE"
[Studio.Power]::SetThreadExecutionState([uint32]2147483648) | Out-Null  # back to normal
