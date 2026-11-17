#!/usr/bin/env node
/**
 * Persist model-generated HTML using Fibo's temporary-file protocol.
 * Node built-ins preserve the original bytes and produce one Markdown reference.
 * The caller supplies the display title, so no HTML parser dependency is needed.
 */
import { constants, promises as fs } from 'node:fs';
import { createHash, randomInt } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs, TextDecoder } from 'node:util';

const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_OWNER_BYTES = 4096;

/** Read one bounded snapshot, preserving BOM and line endings. */
async function readSource(inputPath) {
  if (inputPath === '-') {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of process.stdin) {
      totalBytes += chunk.length;
      if (totalBytes > MAX_HTML_BYTES) throw new Error('HTML exceeds the 5 MiB limit');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks, totalBytes);
  }
  const entry = await fs.lstat(inputPath);
  if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('HTML input must be a regular file');
  const handle = await fs.open(inputPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const snapshot = await handle.stat();
    if (!snapshot.isFile()) throw new Error('HTML input must be a regular file');
    if (snapshot.size > MAX_HTML_BYTES) throw new Error('HTML exceeds the 5 MiB limit');
    // A bounded read also catches a source that grows after the initial stat.
    const bytes = Buffer.alloc(MAX_HTML_BYTES + 1);
    let totalBytes = 0;
    while (totalBytes < bytes.length) {
      const { bytesRead } = await handle.read(bytes, totalBytes, bytes.length - totalBytes, null);
      if (!bytesRead) break;
      totalBytes += bytesRead;
    }
    return bytes.subarray(0, totalBytes);
  } finally {
    await handle.close();
  }
}

/** Enforce the host's byte/UTF-8 contract without rewriting or executing HTML. */
function validateSource(bytes) {
  if (bytes.length > MAX_HTML_BYTES) throw new Error('HTML exceeds the 5 MiB limit');
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error('HTML must contain valid UTF-8 text');
  }
  if (!source.trim() || source.includes('\0')) throw new Error('HTML must be nonempty and contain no NUL bytes');
}

/** Bind ownership to the current project's canonical path, not the skill folder. */
async function resolveWorkspace(value) {
  if (!value || !path.isAbsolute(value)) throw new Error('--workspace-root must be the absolute current project root');
  const workspace = await fs.realpath(value);
  if (!(await fs.stat(workspace)).isDirectory()) throw new Error('Workspace root must be a directory');
  return workspace;
}

/** Create private resource directories and reject symlink parents. */
async function ensureDirectories(root, segments) {
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      await fs.mkdir(current, { mode: 0o700 });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const entry = await fs.lstat(current);
    if (!entry.isDirectory() || entry.isSymbolicLink() || await fs.realpath(current) !== current) {
      throw new Error(`Artifact directory must be a real directory: ${current}`);
    }
  }
  return current;
}

/** Write only a newly allocated file; failed writes remove their own partial file. */
async function writeExclusive(destination, bytes) {
  const handle = await fs.open(destination, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.close();
  } catch (error) {
    await handle.close().catch(() => {});
    await fs.unlink(destination).catch(() => {});
    throw error;
  }
}

/** Encode a local destination once and escape the Markdown image caption. */
function markdownReference(title, destination) {
  const label = title.replace(/[\r\n]/g, ' ').replace(/[\\[\]]/g, '\\$&');
  const address = encodeURI(destination.split(path.sep).join('/')).replace(/[?#]/g, character => encodeURIComponent(character));
  return `![${label}](<${address}>)`;
}

/** Publish a numeric HTML file and its project-bound owner before returning a link. */
async function createArtifact(workspace, bytes, title) {
  const owner = Buffer.from(JSON.stringify({
    workspaceHash: createHash('sha256').update(workspace, 'utf8').digest('hex'),
    title,
  }), 'utf8');
  if (owner.length > MAX_OWNER_BYTES) throw new Error('Shorten --title: owner metadata exceeds 4096 bytes');
  const directory = await ensureDirectories(await fs.realpath(tmpdir()), ['fibo-temp', 'html']);
  for (let attempt = 0; attempt < 10; attempt++) {
    const digits = `${randomInt(1_000_000_000, 10_000_000_000)}${randomInt(1_000_000_000, 10_000_000_000)}`;
    const destination = path.join(directory, `${digits}.html`);
    try {
      await writeExclusive(destination, bytes);
    } catch (error) {
      if (error.code === 'EEXIST') continue;
      throw error;
    }
    try {
      await writeExclusive(path.join(directory, `${digits}.owner.json`), owner);
    } catch (error) {
      await fs.unlink(destination);
      if (error.code === 'EEXIST') continue;
      throw error;
    }
    return markdownReference(title, destination);
  }
  throw new Error('Unable to allocate a unique temporary HTML artifact');
}

/** Read caller input and emit only a completed Markdown reference. */
async function main() {
  const { values } = parseArgs({
    options: {
      'workspace-root': { type: 'string' },
      title: { type: 'string' },
      input: { type: 'string', default: '-' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });
  if (values.help) {
    process.stdout.write('Usage: node html_artifact.mjs --workspace-root <absolute-project-root> --title <page-title> [--input <file|->]\nReads UTF-8 HTML from stdin by default; prints one Markdown preview reference.\n');
    return;
  }
  const title = values.title?.replace(/\s+/g, ' ').trim();
  if (!title || title.includes('\0')) throw new Error('--title must be a meaningful page title matching the HTML <title>');
  const workspace = await resolveWorkspace(values['workspace-root']);
  const bytes = await readSource(values.input);
  validateSource(bytes);
  process.stdout.write(`${await createArtifact(workspace, bytes, title)}\n`);
}

main().catch(error => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
