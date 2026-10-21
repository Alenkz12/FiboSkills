#!/usr/bin/env bash
# sync-helper.sh — Fibo reverse-sync helper (POSIX side)
#
# Subcommands:
#   ensure-index                           Create/reconcile .fibo/index.json v2
#   list-repos                              List repos with uncommitted-status flag
#   list-changes                            List changed files across all repos
#   get-diff --repo <p> --file <f>          Print unified diff of a single file
#   update-index --repo <p> --hash <40SHA>  Advance .fibo/index.json sync baseline
#
# Output: JSON / unified diff to stdout. Only ensure-index and update-index write
# .fibo/index.json. No git mutations beyond read-only queries.
#
# Skill-root contract: references/conventions/commit-sync.md sections 2-4.
set -u

# ─── Path discovery ──────────────────────────────────────────────────
# Repo root = parent of .fibo/ ; resolved by walking up from current dir.
discoverRepoRoot() {
  local dir="${PWD}"
  while [ "${dir}" != "/" ] && [ "${dir}" != "" ]; do
    if [ -d "${dir}/.fibo" ]; then
      printf '%s\n' "${dir}"
      return 0
    fi
    dir="$(dirname "${dir}")"
  done
  printf 'error: cannot locate .fibo/ directory (run inside a Fibo project)\n' >&2
  exit 2
}

REPO_ROOT="$(discoverRepoRoot)"
INDEX_FILE="${REPO_ROOT}/.fibo/index.json"

# ─── Argument validation ─────────────────────────────────────────────
# Reject shell metacharacters in every user-supplied argument before dispatch.
rejectUnsafeArg() {
  local v="$1"
  case "${v}" in
    *';'*|*'|'*|*'`'*|*'$('*|*'&'*) printf 'rejected: unsafe argument\n' >&2; exit 3 ;;
  esac
  # Reject newline / CR explicitly (POSIX case glob can't match \n cleanly)
  if printf '%s' "${v}" | LC_ALL=C grep -q '[[:cntrl:]]'; then
    printf 'rejected: unsafe argument\n' >&2; exit 3
  fi
}

# Path / file blacklist: no `..` segment and no absolute path.
validatePathArg() {
  local v="$1"
  case "${v}" in
    /*|[A-Za-z]:*|*'/../'*|'../'*|*'/..'|'..') printf 'rejected: unsafe argument\n' >&2; exit 3 ;;
  esac
}

# Hash format: exactly 40 lowercase hexadecimal characters.
validateHashArg() {
  local v="$1"
  if ! printf '%s' "${v}" | LC_ALL=C grep -qE '^[0-9a-f]{40}$'; then
    printf 'invalid hash\n' >&2; exit 4
  fi
}

# ─── Schema check ────────────────────────────────────────────────────
assertSchemaV2() {
  if [ ! -f "${INDEX_FILE}" ]; then
    printf 'schema mismatch, expected v2\n' >&2; exit 5
  fi
  python3 - "${INDEX_FILE}" <<'PY'
import json
import sys

try:
    with open(sys.argv[1], 'r', encoding='utf-8') as index_file:
        payload = json.load(index_file)
except (OSError, ValueError):
    print('schema mismatch, expected v2', file=sys.stderr)
    raise SystemExit(5)

if (
    not isinstance(payload, dict)
    or payload.get('schemaVersion') != 2
    or not isinstance(payload.get('repos'), list)
):
    print('schema mismatch, expected v2', file=sys.stderr)
    raise SystemExit(5)
PY
}

# ─── index.json parsing ──────────────────────────────────────────────
# Minimal JSON walker: emit one TSV line per repo as `path\thash\ttime`.
# Why hand-rolled: avoid hard dependency on jq; we control the writer side.
parseRepos() {
  python3 - "${INDEX_FILE}" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = json.load(f)
for r in data.get('repos', []):
    print('\t'.join([r.get('path',''), r.get('lastSyncHash',''), r.get('lastSyncTime','')]))
PY
}

# ─── Binary-extension filter ─────────────────────────────────────────
# Lowercase suffix match; empty path is never filtered.
isBinaryExt() {
  local f="$1"
  local lower
  lower="$(printf '%s' "${f}" | LC_ALL=C tr 'A-Z' 'a-z')"
  case "${lower}" in
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.bmp|*.tiff) return 0 ;;
    *.woff|*.woff2|*.ttf|*.otf|*.eot) return 0 ;;
    *.mp4|*.webm|*.mov|*.avi|*.mkv) return 0 ;;
    *.mp3|*.wav|*.ogg|*.flac|*.m4a) return 0 ;;
    *.zip|*.tar|*.gz|*.tgz|*.7z|*.rar|*.bz2) return 0 ;;
    *.exe|*.dll|*.so|*.dylib|*.a|*.lib|*.o) return 0 ;;
    *.pdf|*.docx|*.xlsx|*.pptx|*.doc|*.xls|*.ppt) return 0 ;;
  esac
  return 1
}

# ─── git wrappers ────────────────────────────────────────────────────
# Always pass git arguments as an array via "$@" to avoid string evaluation.
gitIn() {
  # gitIn <repo-relative-path> <git-args...>
  local repo_rel="$1"; shift
  local abs="${REPO_ROOT}/${repo_rel}"
  (cd "${abs}" && git "$@") 2>/dev/null
}

hasUncommitted() {
  local repo_rel="$1"
  local out
  out="$(gitIn "${repo_rel}" status --porcelain)"
  [ -n "${out}" ] && printf 'true' || printf 'false'
}

# Emit changed-files list for a single repo as TSV: `repo\tfile\tstatus`.
# Base = lastSyncHash (if set) else HEAD-only (single commit).
emitRepoChanges() {
  local repo_rel="$1"
  local base="$2"
  local raw
  if [ -z "${base}" ]; then
    raw="$(gitIn "${repo_rel}" show --name-status --format= HEAD)"
  else
    raw="$(gitIn "${repo_rel}" diff --name-status "${base}..HEAD")"
  fi
  [ -z "${raw}" ] && return 0
  # Parse: lines like "M\tfile" or "R100\told\tnew" (we keep the new name)
  printf '%s\n' "${raw}" | while IFS=$'\t' read -r status f1 f2; do
    [ -z "${status}" ] && continue
    local code file
    code="$(printf '%s' "${status}" | cut -c1)"
    case "${code}" in
      M|A|D|R|C) ;;
      *) continue ;;
    esac
    file="${f1}"
    [ -n "${f2}" ] && file="${f2}"  # rename / copy: report destination
    if isBinaryExt "${file}"; then continue; fi
    printf '%s\t%s\t%s\n' "${repo_rel}" "${file}" "${code}"
  done
}

# Tiny JSON escaper for string values (covers \, ", control chars)
jsonEscape() {
  # Pass the program with -c so stdin remains available for the piped value.
  python3 -c 'import json, sys; print(json.dumps(sys.stdin.read()))'
}

# ─── Subcommand: ensure-index ────────────────────────────────────────
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
cmdEnsureIndex() {
  python3 - "${REPO_ROOT}" "${INDEX_FILE}" <<'PY'
import json
import os
from pathlib import Path
import sys

workspace_root = Path(sys.argv[1])
index_path = Path(sys.argv[2])
max_scan_depth = 3
ignored_directory_names = {
    'node_modules', 'vendor', 'third_party', 'external', 'extern', 'deps',
    'dist', 'build', 'out', 'output', 'release', 'debug', 'target', 'bin',
    'obj', 'generated', 'gen', '__pycache__', '.pytest_cache', '.mypy_cache',
    '.ruff_cache', '.npm', '.pnpm-store', '.yarn', '.parcel-cache', '.next',
    '.nuxt', '.svelte-kit', '.gradle', '.dart_tool', 'coverage', '.nyc_output',
    '.cache', '.temp', 'tmp', 'temp', '.git', '.DS_Store',
}


def exit_with_schema_mismatch():
    print('schema mismatch, expected v2', file=sys.stderr)
    raise SystemExit(5)


def discover_repo_paths():
    repo_paths = []
    if (workspace_root / '.git').exists():
        repo_paths.append('.')

    def walk(directory, relative_directory, depth):
        if depth > max_scan_depth:
            return
        try:
            entries = list(os.scandir(directory))
        except OSError:
            return

        for entry in entries:
            if not entry.is_dir(follow_symlinks=False):
                continue
            if entry.name in ignored_directory_names:
                continue

            relative_path = (
                entry.name
                if not relative_directory
                else f'{relative_directory}/{entry.name}'
            )
            child_directory = Path(entry.path)
            if (child_directory / '.git').exists():
                repo_paths.append(relative_path)
            walk(child_directory, relative_path, depth + 1)

    walk(workspace_root, '', 1)
    return sorted(set(repo_paths))


existing_payload = None
existing_baselines = {}
if index_path.exists():
    try:
        with index_path.open('r', encoding='utf-8') as index_file:
            existing_payload = json.load(index_file)
    except (OSError, ValueError):
        exit_with_schema_mismatch()

    if (
        not isinstance(existing_payload, dict)
        or existing_payload.get('schemaVersion') != 2
        or not isinstance(existing_payload.get('repos'), list)
    ):
        exit_with_schema_mismatch()

    for repo_entry in existing_payload['repos']:
        if not isinstance(repo_entry, dict) or not isinstance(repo_entry.get('path'), str):
            continue
        last_sync_hash = repo_entry.get('lastSyncHash', '')
        last_sync_time = repo_entry.get('lastSyncTime', '')
        existing_baselines[repo_entry['path']] = {
            'lastSyncHash': last_sync_hash if isinstance(last_sync_hash, str) else '',
            'lastSyncTime': last_sync_time if isinstance(last_sync_time, str) else '',
        }

repos = []
for repo_path in discover_repo_paths():
    baseline = existing_baselines.get(repo_path, {})
    repos.append({
        'path': repo_path,
        'lastSyncHash': baseline.get('lastSyncHash', ''),
        'lastSyncTime': baseline.get('lastSyncTime', ''),
    })

next_payload = {'schemaVersion': 2, 'repos': repos}
if existing_payload == next_payload:
    raise SystemExit(0)

temporary_path = index_path.with_name(f'{index_path.name}.tmp-{os.getpid()}')
try:
    with temporary_path.open('w', encoding='utf-8') as temporary_file:
        json.dump(next_payload, temporary_file, indent=2, ensure_ascii=False)
        temporary_file.write('\n')
    os.replace(temporary_path, index_path)
except OSError as error:
    try:
        temporary_path.unlink()
    except OSError:
        pass
    print(f'failed to write .fibo/index.json: {error}', file=sys.stderr)
    raise SystemExit(8)
PY
}

# ─── Subcommand: list-repos ──────────────────────────────────────────
cmdListRepos() {
  assertSchemaV2
  local first=1
  printf '['
  while IFS=$'\t' read -r path _hash _time; do
    [ -z "${path}" ] && continue
    local dirty
    dirty="$(hasUncommitted "${path}")"
    if [ ${first} -eq 1 ]; then first=0; else printf ','; fi
    printf '{"path":%s,"hasUncommittedChanges":%s}' \
      "$(printf '%s' "${path}" | jsonEscape)" "${dirty}"
  done < <(parseRepos)
  printf ']\n'
}

# ─── Subcommand: list-changes ────────────────────────────────────────
cmdListChanges() {
  assertSchemaV2
  local first=1
  printf '['
  while IFS=$'\t' read -r path hash _time; do
    [ -z "${path}" ] && continue
    while IFS=$'\t' read -r repo file status; do
      if [ ${first} -eq 1 ]; then first=0; else printf ','; fi
      printf '{"repo":%s,"file":%s,"status":%s}' \
        "$(printf '%s' "${repo}" | jsonEscape)" \
        "$(printf '%s' "${file}" | jsonEscape)" \
        "$(printf '"%s"' "${status}")"
    done < <(emitRepoChanges "${path}" "${hash}")
  done < <(parseRepos)
  printf ']\n'
}

# ─── Subcommand: get-diff ────────────────────────────────────────────
# A file outside the changed list is a successful no-op with empty output.
cmdGetDiff() {
  assertSchemaV2
  local target_repo="" target_file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --repo) shift; target_repo="$1"; shift ;;
      --file) shift; target_file="$1"; shift ;;
      *) printf 'unknown flag: %s\n' "$1" >&2; exit 6 ;;
    esac
  done
  rejectUnsafeArg "${target_repo}"; validatePathArg "${target_repo}"
  rejectUnsafeArg "${target_file}"; validatePathArg "${target_file}"

  local found_hash="__NONE__"
  while IFS=$'\t' read -r path hash _time; do
    if [ "${path}" = "${target_repo}" ]; then
      found_hash="${hash}"; break
    fi
  done < <(parseRepos)

  if [ "${found_hash}" = "__NONE__" ]; then
    printf 'unknown repo: %s\n' "${target_repo}" >&2; exit 7
  fi

  # Check file is in the changed list before emitting diff
  local in_list=0
  emitRepoChanges "${target_repo}" "${found_hash}" | while IFS=$'\t' read -r _r f _s; do
    [ "${f}" = "${target_file}" ] && exit 99
  done
  if [ $? -eq 99 ]; then in_list=1; fi
  if [ ${in_list} -eq 0 ]; then
    # Absence from the change list is a successful no-op.
    exit 0
  fi

  if [ -z "${found_hash}" ]; then
    gitIn "${target_repo}" show HEAD -- "${target_file}"
  else
    gitIn "${target_repo}" diff "${found_hash}..HEAD" -- "${target_file}"
  fi
}

# ─── Subcommand: update-index ────────────────────────────────────────
# Bumps lastSyncHash/lastSyncTime for one repo without mutating git.
cmdUpdateIndex() {
  assertSchemaV2
  local target_repo="" new_hash=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --repo) shift; target_repo="$1"; shift ;;
      --hash) shift; new_hash="$1"; shift ;;
      *) printf 'unknown flag: %s\n' "$1" >&2; exit 6 ;;
    esac
  done
  rejectUnsafeArg "${target_repo}"; validatePathArg "${target_repo}"
  rejectUnsafeArg "${new_hash}";    validateHashArg "${new_hash}"

  local now
  now="$(date "+%Y-%m-%d %H:%M")"

  python3 - "${INDEX_FILE}" "${target_repo}" "${new_hash}" "${now}" <<'PY'
import json, sys
path, repo, h, t = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
matched = False
for r in data.get('repos', []):
    if r.get('path') == repo:
        r['lastSyncHash'] = h
        r['lastSyncTime'] = t
        matched = True
        break
if not matched:
    sys.stderr.write('unknown repo: ' + repo + '\n')
    sys.exit(7)
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')
PY
}

# ─── Dispatch ────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
  printf 'usage: sync-helper.sh <ensure-index|list-repos|list-changes|get-diff|update-index> [args]\n' >&2
  exit 1
fi

# All positional args after the subcommand pass through the safety filter.
SUB="$1"; shift
for a in "$@"; do rejectUnsafeArg "${a}"; done

case "${SUB}" in
  ensure-index)  cmdEnsureIndex ;;
  list-repos)    cmdListRepos ;;
  list-changes)  cmdListChanges ;;
  get-diff)      cmdGetDiff "$@" ;;
  update-index)  cmdUpdateIndex "$@" ;;
  *) printf 'unknown subcommand: %s\n' "${SUB}" >&2; exit 1 ;;
esac
