# sync-helper.ps1 - Fibo reverse-sync helper (Windows side)
#
# Mirrors sync-helper.sh exactly. Subcommands:
#   ensure-index                           Create/reconcile .fibo/index.json v2
#   list-repos                              List repos with uncommitted-status flag
#   list-changes                            List changed files across all repos
#   get-diff --repo <p> --file <f>          Print unified diff of a single file
#   update-index --repo <p> --hash <40SHA>  Advance .fibo/index.json sync baseline
#
# Output: JSON / unified diff to stdout. Only ensure-index and update-index write
# .fibo/index.json. Requires PowerShell 5.1+ (built-in on Windows 10+).
#
# Skill-root contract: references/conventions/commit-sync.md sections 2-4.

$ErrorActionPreference = 'Stop'

# --- Path discovery ---
# Repo root = parent of .fibo/ ; resolved by walking up from current dir.
function Find-RepoRoot {
    $dir = (Get-Location).Path
    while ($dir -and $dir.Length -gt 0) {
        if (Test-Path (Join-Path $dir '.fibo')) { return $dir }
        $parent = Split-Path -Parent $dir
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
    [Console]::Error.WriteLine('error: cannot locate .fibo/ directory (run inside a Fibo project)')
    exit 2
}

$script:RepoRoot  = Find-RepoRoot
$script:IndexFile = Join-Path $script:RepoRoot '.fibo/index.json'

# --- Argument validation ---
# Reject shell metacharacters in every user-supplied argument before dispatch.
function Test-UnsafeArg([string]$v) {
    if ($v -match '[;|`&]' -or $v -match '\$\(' -or $v -match "`n" -or $v -match "`r") {
        [Console]::Error.WriteLine('rejected: unsafe argument')
        exit 3
    }
}

# Path / file blacklist: no `..` segment and no absolute path.
function Test-PathArg([string]$v) {
    if ($v -match '^/' -or $v -match '^[A-Za-z]:') {
        [Console]::Error.WriteLine('rejected: unsafe argument'); exit 3
    }
    if ($v -eq '..' -or $v -match '(^|/)\.\.(/|$)') {
        [Console]::Error.WriteLine('rejected: unsafe argument'); exit 3
    }
}

# Hash format: exactly 40 lowercase hexadecimal characters.
function Test-HashArg([string]$v) {
    if ($v -notmatch '^[0-9a-f]{40}$') {
        [Console]::Error.WriteLine('invalid hash'); exit 4
    }
}

# --- Schema validation ---
function Assert-SchemaV2 {
    if (-not (Test-Path $script:IndexFile)) {
        [Console]::Error.WriteLine('schema mismatch, expected v2'); exit 5
    }
    try {
        $data = Get-Content -Raw -Encoding UTF8 $script:IndexFile | ConvertFrom-Json
    } catch {
        [Console]::Error.WriteLine('schema mismatch, expected v2'); exit 5
    }
    if ($data.schemaVersion -ne 2 -or $null -eq $data.repos) {
        [Console]::Error.WriteLine('schema mismatch, expected v2'); exit 5
    }
    return $data
}

# --- Repository discovery ---
$script:MaxRepoScanDepth = 3
$script:IgnoredDirectoryNames = [System.Collections.Generic.HashSet[string]]::new(
    [System.StringComparer]::Ordinal
)
@(
    'node_modules','vendor','third_party','external','extern','deps',
    'dist','build','out','output','release','debug','target','bin','obj','generated','gen',
    '__pycache__','.pytest_cache','.mypy_cache','.ruff_cache',
    '.npm','.pnpm-store','.yarn','.parcel-cache','.next','.nuxt','.svelte-kit',
    '.gradle','.dart_tool','coverage','.nyc_output','.cache','.temp','tmp','temp',
    '.git','.DS_Store'
) | ForEach-Object { [void]$script:IgnoredDirectoryNames.Add($_) }

function Add-NestedRepoPaths {
    param(
        [string]$Directory,
        [string]$RelativeDirectory,
        [int]$Depth,
        [System.Collections.Generic.List[string]]$RepoPaths
    )
    if ($Depth -gt $script:MaxRepoScanDepth) { return }

    $entries = @(Get-ChildItem -LiteralPath $Directory -Directory -Force -ErrorAction SilentlyContinue)
    foreach ($entry in $entries) {
        if ($script:IgnoredDirectoryNames.Contains($entry.Name)) { continue }
        if (($entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }

        $relativePath = if ([string]::IsNullOrEmpty($RelativeDirectory)) {
            $entry.Name
        } else {
            "$RelativeDirectory/$($entry.Name)"
        }
        if (Test-Path -LiteralPath (Join-Path $entry.FullName '.git')) {
            [void]$RepoPaths.Add($relativePath)
        }
        Add-NestedRepoPaths `
            -Directory $entry.FullName `
            -RelativeDirectory $relativePath `
            -Depth ($Depth + 1) `
            -RepoPaths $RepoPaths
    }
}

function Get-RepoPaths {
    $repoPaths = [System.Collections.Generic.List[string]]::new()
    if (Test-Path -LiteralPath (Join-Path $script:RepoRoot '.git')) {
        [void]$repoPaths.Add('.')
    }
    Add-NestedRepoPaths `
        -Directory $script:RepoRoot `
        -RelativeDirectory '' `
        -Depth 1 `
        -RepoPaths $repoPaths
    return @($repoPaths | Sort-Object -Unique -CaseSensitive)
}

# --- Binary-extension filter ---
$script:BinaryExts = @(
    '.png','.jpg','.jpeg','.gif','.webp','.ico','.bmp','.tiff',
    '.woff','.woff2','.ttf','.otf','.eot',
    '.mp4','.webm','.mov','.avi','.mkv',
    '.mp3','.wav','.ogg','.flac','.m4a',
    '.zip','.tar','.gz','.tgz','.7z','.rar','.bz2',
    '.exe','.dll','.so','.dylib','.a','.lib','.o',
    '.pdf','.docx','.xlsx','.pptx','.doc','.xls','.ppt'
)
function Test-BinaryExt([string]$file) {
    $lower = $file.ToLowerInvariant()
    foreach ($ext in $script:BinaryExts) { if ($lower.EndsWith($ext)) { return $true } }
    return $false
}

# --- git wrapper ---
# Always pass git arguments as an @() array to avoid string evaluation.
function Invoke-GitIn {
    param(
        [string]$RepoRel,
        [string[]]$Args
    )
    $abs = Join-Path $script:RepoRoot $RepoRel
    Push-Location $abs
    try {
        $out = & git @Args 2>$null
        if ($null -eq $out) { return '' }
        return ($out -join "`n")
    } finally {
        Pop-Location
    }
}

function Test-HasUncommitted([string]$RepoRel) {
    $out = Invoke-GitIn -RepoRel $RepoRel -Args @('status','--porcelain')
    if ($out -and $out.Trim().Length -gt 0) { return $true } else { return $false }
}

# Emit changed-files list for a single repo as array of [pscustomobject].
# Base = lastSyncHash (if set) else HEAD-only (single commit).
function Get-RepoChanges {
    param([string]$RepoRel, [string]$Base)
    if ([string]::IsNullOrEmpty($Base)) {
        $raw = Invoke-GitIn -RepoRel $RepoRel -Args @('show','--name-status','--format=','HEAD')
    } else {
        $raw = Invoke-GitIn -RepoRel $RepoRel -Args @('diff','--name-status',"$Base..HEAD")
    }
    if (-not $raw) { return @() }

    $result = @()
    foreach ($line in $raw -split "`n") {
        $line = $line.Trim()
        if (-not $line) { continue }
        $parts = $line -split "`t"
        if ($parts.Count -lt 2) { continue }
        $status = $parts[0]
        $code = $status.Substring(0,1)
        if ($code -notmatch '^[MADRC]$') { continue }
        # Rename/copy: prefer destination (last field)
        $file = $parts[-1]
        if (Test-BinaryExt $file) { continue }
        $result += [pscustomobject]@{
            repo   = $RepoRel
            file   = $file
            status = $code
        }
    }
    return $result
}

# Compact JSON without trailing newline (matches .sh output)
function ConvertTo-CompactJson([object]$obj) {
    return (ConvertTo-Json -InputObject $obj -Compress -Depth 10)
}

# --- Subcommand: ensure-index ---
# The distributed helper must not depend on project-local design documents.
#
# Missing indexes are initialized from repositories discovered at sync time.
#
# Existing valid v2 baselines are preserved for matching repositories.
#
# Malformed or unsupported indexes fail before the existing file is replaced.
#
# Synchronization owns this project metadata. Discovering repositories here
# prevents terminal switches from changing document-sync state, while validating
# before writing protects an existing baseline from destructive replacement.
function Invoke-EnsureIndex {
    $existingPayload = $null
    $existingBaselines = @{}
    if (Test-Path -LiteralPath $script:IndexFile) {
        $existingPayload = Assert-SchemaV2
        foreach ($repoEntry in @($existingPayload.repos)) {
            if ($repoEntry.path -isnot [string]) { continue }
            $lastSyncHash = if ($repoEntry.lastSyncHash -is [string]) {
                $repoEntry.lastSyncHash
            } else { '' }
            $lastSyncTime = if ($repoEntry.lastSyncTime -is [string]) {
                $repoEntry.lastSyncTime
            } else { '' }
            $existingBaselines[$repoEntry.path] = [pscustomobject]@{
                lastSyncHash = $lastSyncHash
                lastSyncTime = $lastSyncTime
            }
        }
    }

    $repos = @()
    foreach ($repoPath in @(Get-RepoPaths)) {
        $lastSyncHash = ''
        $lastSyncTime = ''
        if ($existingBaselines.ContainsKey($repoPath)) {
            $lastSyncHash = $existingBaselines[$repoPath].lastSyncHash
            $lastSyncTime = $existingBaselines[$repoPath].lastSyncTime
        }
        $repos += [pscustomobject][ordered]@{
            path = $repoPath
            lastSyncHash = $lastSyncHash
            lastSyncTime = $lastSyncTime
        }
    }

    $nextPayload = [pscustomobject][ordered]@{
        schemaVersion = 2
        repos = @($repos)
    }
    $json = ConvertTo-Json -InputObject $nextPayload -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    try {
        [System.IO.File]::WriteAllText($script:IndexFile, $json + "`n", $utf8NoBom)
    } catch {
        [Console]::Error.WriteLine("failed to write .fibo/index.json: $($_.Exception.Message)")
        exit 8
    }
}

# --- Subcommand: list-repos ---
function Invoke-ListRepos {
    $data = Assert-SchemaV2
    $out = @()
    foreach ($r in $data.repos) {
        $out += [pscustomobject]@{
            path                  = $r.path
            hasUncommittedChanges = (Test-HasUncommitted $r.path)
        }
    }
    # Force array shape even for 0/1 entries
    Write-Output (ConvertTo-CompactJson @($out))
}

# --- Subcommand: list-changes ---
function Invoke-ListChanges {
    $data = Assert-SchemaV2
    $all = @()
    foreach ($r in $data.repos) {
        $all += (Get-RepoChanges -RepoRel $r.path -Base $r.lastSyncHash)
    }
    Write-Output (ConvertTo-CompactJson @($all))
}

# --- Subcommand: get-diff ---
# A file outside the changed list is a successful no-op with empty output.
function Invoke-GetDiff([string[]]$Rest) {
    $data = Assert-SchemaV2
    $targetRepo = ''; $targetFile = ''
    $i = 0
    while ($i -lt $Rest.Count) {
        switch ($Rest[$i]) {
            '--repo' { $i++; $targetRepo = $Rest[$i]; $i++ }
            '--file' { $i++; $targetFile = $Rest[$i]; $i++ }
            default  { [Console]::Error.WriteLine("unknown flag: $($Rest[$i])"); exit 6 }
        }
    }
    Test-UnsafeArg $targetRepo; Test-PathArg $targetRepo
    Test-UnsafeArg $targetFile; Test-PathArg $targetFile

    $match = $data.repos | Where-Object { $_.path -eq $targetRepo } | Select-Object -First 1
    if (-not $match) {
        [Console]::Error.WriteLine("unknown repo: $targetRepo"); exit 7
    }

    $changes = Get-RepoChanges -RepoRel $targetRepo -Base $match.lastSyncHash
    $hit = $changes | Where-Object { $_.file -eq $targetFile } | Select-Object -First 1
    if (-not $hit) { return }   # Absence from the change list is a successful no-op.

    if ([string]::IsNullOrEmpty($match.lastSyncHash)) {
        $diff = Invoke-GitIn -RepoRel $targetRepo -Args @('show','HEAD','--',$targetFile)
    } else {
        $diff = Invoke-GitIn -RepoRel $targetRepo -Args @('diff',"$($match.lastSyncHash)..HEAD",'--',$targetFile)
    }
    if ($diff) { Write-Output $diff }
}

# --- Subcommand: update-index ---
# Bumps lastSyncHash/lastSyncTime for one repo without mutating git.
function Invoke-UpdateIndex([string[]]$Rest) {
    $data = Assert-SchemaV2
    $targetRepo = ''; $newHash = ''
    $i = 0
    while ($i -lt $Rest.Count) {
        switch ($Rest[$i]) {
            '--repo' { $i++; $targetRepo = $Rest[$i]; $i++ }
            '--hash' { $i++; $newHash    = $Rest[$i]; $i++ }
            default  { [Console]::Error.WriteLine("unknown flag: $($Rest[$i])"); exit 6 }
        }
    }
    Test-UnsafeArg $targetRepo; Test-PathArg $targetRepo
    Test-UnsafeArg $newHash;    Test-HashArg $newHash

    $matched = $false
    foreach ($r in $data.repos) {
        if ($r.path -eq $targetRepo) {
            $r.lastSyncHash = $newHash
            $r.lastSyncTime = (Get-Date -Format 'yyyy-MM-dd HH:mm')
            $matched = $true
            break
        }
    }
    if (-not $matched) {
        [Console]::Error.WriteLine("unknown repo: $targetRepo"); exit 7
    }

    # Preserve UTF-8 without BOM; trailing newline for diff-friendliness
    $json = ConvertTo-Json -InputObject $data -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($script:IndexFile, $json + "`n", $utf8NoBom)
}

# --- Dispatch ---
if ($args.Count -lt 1) {
    [Console]::Error.WriteLine('usage: sync-helper.ps1 <ensure-index|list-repos|list-changes|get-diff|update-index> [args]')
    exit 1
}

$sub = $args[0]
$rest = @()
if ($args.Count -gt 1) { $rest = $args[1..($args.Count - 1)] }

# All positional args after the subcommand pass through the safety filter.
foreach ($a in $rest) { Test-UnsafeArg $a }

switch ($sub) {
    'ensure-index'  { Invoke-EnsureIndex }
    'list-repos'    { Invoke-ListRepos }
    'list-changes'  { Invoke-ListChanges }
    'get-diff'      { Invoke-GetDiff $rest }
    'update-index'  { Invoke-UpdateIndex $rest }
    default {
        [Console]::Error.WriteLine("unknown subcommand: $sub")
        exit 1
    }
}
