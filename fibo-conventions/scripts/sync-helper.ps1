# sync-helper.ps1 - Fibo reverse-sync helper (Windows side)
#
# Mirrors sync-helper.sh exactly. Subcommands (see spec AC-10..AC-28):
#   list-repos                              List repos with uncommitted-status flag
#   list-changes                            List changed files across all repos
#   get-diff --repo <p> --file <f>          Print unified diff of a single file
#   update-index --repo <p> --hash <40SHA>  Advance .fibo/index.json sync baseline
#
# Output: JSON / unified diff to stdout. Only update-index writes a file
# (.fibo/index.json). Requires PowerShell 5.1+ (built-in on Windows 10+).
#
# Reference: .fibo/docs/specs/fibo-index-v2-sync-scripts/spec.md

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
# Shell-injection blacklist applies to every user-supplied arg (AC-23).
function Test-UnsafeArg([string]$v) {
    if ($v -match '[;|`&]' -or $v -match '\$\(' -or $v -match "`n" -or $v -match "`r") {
        [Console]::Error.WriteLine('rejected: unsafe argument')
        exit 3
    }
}

# Path / file blacklist (AC-21): no `..` segment, no absolute path
function Test-PathArg([string]$v) {
    if ($v -match '^/' -or $v -match '^[A-Za-z]:') {
        [Console]::Error.WriteLine('rejected: unsafe argument'); exit 3
    }
    if ($v -eq '..' -or $v -match '(^|/)\.\.(/|$)') {
        [Console]::Error.WriteLine('rejected: unsafe argument'); exit 3
    }
}

# Hash format (AC-18): exactly 40 lowercase hex chars
function Test-HashArg([string]$v) {
    if ($v -notmatch '^[0-9a-f]{40}$') {
        [Console]::Error.WriteLine('invalid hash'); exit 4
    }
}

# --- Schema check (AC-06) ---
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

# --- Binary-extension filter (AC-20) ---
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
# Always pass git args as @() array (AC-22), never via string concat.
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
# Empty output + exit 0 if file is not in the changed list (AC-19).
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
    if (-not $hit) { return }   # AC-19: silent success

    if ([string]::IsNullOrEmpty($match.lastSyncHash)) {
        $diff = Invoke-GitIn -RepoRel $targetRepo -Args @('show','HEAD','--',$targetFile)
    } else {
        $diff = Invoke-GitIn -RepoRel $targetRepo -Args @('diff',"$($match.lastSyncHash)..HEAD",'--',$targetFile)
    }
    if ($diff) { Write-Output $diff }
}

# --- Subcommand: update-index ---
# Bumps lastSyncHash/lastSyncTime for one repo. Does NOT touch git (AC-16).
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
    [Console]::Error.WriteLine('usage: sync-helper.ps1 <list-repos|list-changes|get-diff|update-index> [args]')
    exit 1
}

$sub = $args[0]
$rest = @()
if ($args.Count -gt 1) { $rest = $args[1..($args.Count - 1)] }

# All positional args after the subcommand pass through the safety filter.
foreach ($a in $rest) { Test-UnsafeArg $a }

switch ($sub) {
    'list-repos'    { Invoke-ListRepos }
    'list-changes'  { Invoke-ListChanges }
    'get-diff'      { Invoke-GetDiff $rest }
    'update-index'  { Invoke-UpdateIndex $rest }
    default {
        [Console]::Error.WriteLine("unknown subcommand: $sub")
        exit 1
    }
}
