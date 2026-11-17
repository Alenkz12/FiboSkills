/** Standalone skill artifact implementation. The backend maintains its own TypeScript version of this protocol. */
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ANALYSIS_LEVELS = void 0;
exports.isWorkspaceRelativePath = isWorkspaceRelativePath;
exports.fingerprintAnalysisValue = fingerprintAnalysisValue;
exports.fingerprintAnalysisRules = fingerprintAnalysisRules;
exports.toAnalysisUnitIdentity = toAnalysisUnitIdentity;
exports.observationIdentity = observationIdentity;
exports.normalizeAnalysisObservations = normalizeAnalysisObservations;
exports.normalizeAnalysisFixedInput = normalizeAnalysisFixedInput;
exports.computeAnalysisUnitInputFingerprint =
  computeAnalysisUnitInputFingerprint;
exports.createAnalysisUnitState = createAnalysisUnitState;
exports.fixedInputFromAnalysisUnitState = fixedInputFromAnalysisUnitState;
exports.parseAnalysisUnitState = parseAnalysisUnitState;
const node_crypto_1 = require('node:crypto');
exports.ANALYSIS_LEVELS = ['repository', 'module', 'collection', 'file'];
/** Accept canonical workspace-relative identities without normalizing traversal. */
function isWorkspaceRelativePath(candidatePath, allowRoot = false) {
  if (candidatePath === '.') return allowRoot;
  return (
    candidatePath.length > 0 &&
    !/[\\:\0?#]/.test(candidatePath) &&
    !candidatePath.startsWith('/') &&
    candidatePath
      .split('/')
      .every(
        (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
      )
  );
}
const SHA256 = /^[a-f0-9]{64}$/;
const STATE_ROOT = '.fibo/analysis/';
function canonicalize(value, location = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return value.map((child, index) =>
      canonicalize(child, location + '[' + index + ']'),
    );
  }
  if (value && typeof value === 'object') {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      throw new Error(
        'Analysis fingerprint input is not plain JSON at ' + location,
      );
    }
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key], location + '.' + key)]),
    );
  }
  throw new Error('Analysis fingerprint input is not JSON at ' + location);
}
function fingerprintAnalysisValue(value) {
  return (0, node_crypto_1.createHash)('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}
function fingerprintAnalysisRules(rules) {
  const required = [
    'prompt',
    'executionPolicyVersion',
    'language',
    'model',
    'runConfiguration',
  ];
  if (
    !rules ||
    typeof rules !== 'object' ||
    Object.keys(rules).sort().join(',') !== [...required].sort().join(',') ||
    !rules.prompt ||
    typeof rules.prompt.version !== 'string' ||
    !rules.prompt.version.trim() ||
    typeof rules.executionPolicyVersion !== 'string' ||
    !rules.executionPolicyVersion.trim() ||
    typeof rules.language !== 'string' ||
    !rules.language.trim()
  ) {
    throw new Error('Explicit analysis rule inputs are required');
  }
  return fingerprintAnalysisValue(rules);
}
function toAnalysisUnitIdentity(unit) {
  const kind =
    unit.level === 'repository'
      ? 'repository'
      : unit.level === 'file'
        ? 'file'
        : 'directory';
  const identity = { id: unit.id, path: unit.path, kind };
  requireUnitIdentity(identity);
  return identity;
}
function observationIdentity(observation) {
  if (observation.kind === 'file') return 'file:' + observation.path;
  if (observation.kind === 'directory-listing') {
    return 'directory-listing:' + observation.path;
  }
  if (observation.kind === 'search') {
    return [
      'search',
      observation.path,
      observation.query,
      String(observation.limit),
    ].join(':');
  }
  return 'template:' + observation.key;
}
/**
 * spec: .fibo/docs/specs/progressive-codebase-understanding/agent-authored-info/spec.md#AC-10
 *
 * Normalize only inputs that the Agent actually consumed. Discovery results retain
 * their request identity, empty result hash and truncation-sensitive result hash.
 */
function normalizeAnalysisObservations(inputs) {
  if (!Array.isArray(inputs)) {
    throw new Error('Analysis observations must be an array');
  }
  const normalized = inputs
    .map((input) => {
      if (!input || typeof input !== 'object') {
        throw new Error('Analysis observation is invalid');
      }
      if (input.kind === 'file') {
        if (
          Object.keys(input).sort().join(',') !==
            ['contentFingerprint', 'kind', 'path'].join(',') ||
          !isWorkspaceRelativePath(input.path) ||
          !SHA256.test(input.contentFingerprint)
        )
          throw new Error('Observed file is invalid');
        return { ...input };
      }
      if (input.kind === 'directory-listing') {
        if (
          Object.keys(input).sort().join(',') !==
            ['kind', 'path', 'resultFingerprint'].join(',') ||
          !isWorkspaceRelativePath(input.path, true) ||
          !SHA256.test(input.resultFingerprint)
        )
          throw new Error('Observed directory listing is invalid');
        return { ...input };
      }
      if (input.kind === 'search') {
        if (
          Object.keys(input).sort().join(',') !==
            ['kind', 'limit', 'path', 'query', 'resultFingerprint'].join(',') ||
          !isWorkspaceRelativePath(input.path, true) ||
          typeof input.query !== 'string' ||
          !input.query.length ||
          Buffer.byteLength(input.query, 'utf8') > 1024 ||
          !Number.isSafeInteger(input.limit) ||
          input.limit < 1 ||
          input.limit > 100 ||
          !SHA256.test(input.resultFingerprint)
        )
          throw new Error('Observed search is invalid');
        return { ...input };
      }
      if (input.kind === 'template') {
        if (
          Object.keys(input).sort().join(',') !==
            ['contentFingerprint', 'key', 'kind'].join(',') ||
          typeof input.key !== 'string' ||
          !/^[a-z-]+:(?:[a-z-]+(?:,[a-z-]+)*)?$/.test(input.key) ||
          !SHA256.test(input.contentFingerprint)
        )
          throw new Error('Observed template is invalid');
        return { ...input };
      }
      throw new Error('Unknown analysis observation kind');
    })
    .sort((left, right) =>
      observationIdentity(left).localeCompare(observationIdentity(right)),
    );
  if (
    normalized.some(
      (input, index) =>
        index > 0 &&
        observationIdentity(normalized[index - 1]) ===
          observationIdentity(input),
    )
  ) {
    throw new Error(
      'Analysis observations must have unique request identities',
    );
  }
  return normalized;
}
function normalizeAnalysisFixedInput(input) {
  if (input.kind === 'file') {
    if (!SHA256.test(input.sourceFingerprint)) {
      throw new Error('File source fingerprint must be SHA-256');
    }
    return { kind: 'file', sourceFingerprint: input.sourceFingerprint };
  }
  if (input.kind !== 'directory' || !Array.isArray(input.children)) {
    throw new Error('Analysis fixed input is invalid');
  }
  const children = input.children
    .map((child) => ({ ...child }))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (
    children.some(
      (child, index) =>
        typeof child.id !== 'string' ||
        !child.id.trim() ||
        !SHA256.test(child.infoFingerprint) ||
        (index > 0 && children[index - 1].id === child.id),
    )
  ) {
    throw new Error(
      'Directory children must have unique identities and SHA-256 article hashes',
    );
  }
  return { kind: 'directory', children };
}
function computeAnalysisUnitInputFingerprint(input) {
  requireUnitIdentity(input.unit);
  if (!SHA256.test(input.rulesFingerprint)) {
    throw new Error('Rules fingerprint must be SHA-256');
  }
  const fixedInput = normalizeAnalysisFixedInput(input.fixedInput);
  if (
    input.unit.kind === 'file'
      ? fixedInput.kind !== 'file'
      : fixedInput.kind !== 'directory'
  ) {
    throw new Error('Fixed input kind differs from the physical unit kind');
  }
  return fingerprintAnalysisValue({
    unit: input.unit,
    fixedInput,
    rulesFingerprint: input.rulesFingerprint,
    observedInputs: normalizeAnalysisObservations(input.observedInputs),
  });
}
function createAnalysisUnitState(input) {
  const fixedInput = normalizeAnalysisFixedInput(input.fixedInput);
  const observedInputs = normalizeAnalysisObservations(input.observedInputs);
  const state = {
    schemaVersion: 2,
    unit: { ...input.unit },
    rulesFingerprint: input.rulesFingerprint,
    inputFingerprint: computeAnalysisUnitInputFingerprint({
      unit: input.unit,
      fixedInput,
      rulesFingerprint: input.rulesFingerprint,
      observedInputs,
    }),
    ...(fixedInput.kind === 'file'
      ? { sourceFingerprint: fixedInput.sourceFingerprint }
      : { children: fixedInput.children }),
    observedInputs,
    infoFingerprint: input.infoFingerprint,
    artifacts: { ...input.artifacts },
    artifactFingerprints: { ...input.artifactFingerprints },
  };
  const accepted = parseAnalysisUnitState(state);
  if (!accepted) throw new Error('Analysis unit state is invalid');
  return accepted;
}
function fixedInputFromAnalysisUnitState(state) {
  return state.unit.kind === 'file'
    ? { kind: 'file', sourceFingerprint: state.sourceFingerprint }
    : { kind: 'directory', children: state.children };
}
function parseAnalysisUnitState(candidate) {
  try {
    const value =
      typeof candidate === 'string'
        ? JSON.parse(candidate)
        : structuredClone(candidate);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    const state = value;
    const fixedField =
      state.unit?.kind === 'file' ? 'sourceFingerprint' : 'children';
    const fields = [
      'schemaVersion',
      'unit',
      'rulesFingerprint',
      'inputFingerprint',
      fixedField,
      'observedInputs',
      'infoFingerprint',
      'artifacts',
      'artifactFingerprints',
    ].sort();
    if (
      Object.keys(state).sort().join(',') !== fields.join(',') ||
      state.schemaVersion !== 2
    )
      return undefined;
    requireUnitIdentity(state.unit);
    if (
      ![
        state.rulesFingerprint,
        state.inputFingerprint,
        state.infoFingerprint,
        state.artifactFingerprints?.info,
        state.artifactFingerprints?.structure,
      ].every((value) => typeof value === 'string' && SHA256.test(value))
    ) {
      return undefined;
    }
    if (
      state.infoFingerprint !== state.artifactFingerprints.info ||
      !state.artifacts ||
      Object.keys(state.artifacts).sort().join(',') !== 'info,structure' ||
      !Object.values(state.artifacts).every(
        (artifact) =>
          typeof artifact === 'string' &&
          artifact.startsWith(STATE_ROOT) &&
          !artifact.includes('\\') &&
          !artifact.split('/').includes('..'),
      )
    )
      return undefined;
    if (
      !state.artifactFingerprints ||
      Object.keys(state.artifactFingerprints).sort().join(',') !==
        'info,structure'
    )
      return undefined;
    const fixedInput =
      state.unit.kind === 'file'
        ? normalizeAnalysisFixedInput({
            kind: 'file',
            sourceFingerprint: state.sourceFingerprint,
          })
        : normalizeAnalysisFixedInput({
            kind: 'directory',
            children: state.children,
          });
    const observedInputs = normalizeAnalysisObservations(state.observedInputs);
    const inputFingerprint = computeAnalysisUnitInputFingerprint({
      unit: state.unit,
      fixedInput,
      rulesFingerprint: state.rulesFingerprint,
      observedInputs,
    });
    if (inputFingerprint !== state.inputFingerprint) return undefined;
    return {
      ...state,
      unit: { ...state.unit },
      ...(fixedInput.kind === 'file'
        ? { sourceFingerprint: fixedInput.sourceFingerprint }
        : { children: fixedInput.children }),
      observedInputs,
      artifacts: { ...state.artifacts },
      artifactFingerprints: { ...state.artifactFingerprints },
    };
  } catch {
    return undefined;
  }
}
function requireUnitIdentity(unit) {
  if (
    !unit ||
    Object.keys(unit).sort().join(',') !== 'id,kind,path' ||
    !['file', 'directory', 'repository'].includes(unit.kind)
  )
    throw new Error('Analysis unit identity is invalid');
  const expectedId =
    unit.kind === 'repository'
      ? 'repository:.'
      : (unit.kind === 'file' ? 'file:' : 'collection:') + unit.path;
  if (
    unit.id !== expectedId ||
    !isWorkspaceRelativePath(unit.path, unit.kind === 'repository') ||
    (unit.kind === 'repository' && unit.path !== '.')
  )
    throw new Error('Analysis unit identity is not canonical');
}

/** Derive every companion from the same validated physical identity. */
function getAnalysisArtifactPaths(unit) {
  if (
    !unit ||
    !exports.ANALYSIS_LEVELS.includes(unit.level) ||
    !isWorkspaceRelativePath(unit.path, unit.level === 'repository') ||
    (unit.level === 'repository' && unit.path !== '.')
  ) {
    throw new Error(
      'Expected a canonical workspace-relative analysis identity',
    );
  }
  const logicalStem =
    unit.level === 'repository'
      ? ''
      : unit.level === 'file'
        ? unit.path + '.'
        : unit.path + '/' + unit.path.split('/').at(-1) + '.';
  const logicalInfoPath = logicalStem + 'info.md';
  const logicalStructurePath = logicalStem + 'structure.json';
  const logicalStatePath = logicalStem + 'state.json';
  return {
    infoPath: STATE_ROOT + logicalInfoPath,
    structurePath: STATE_ROOT + logicalStructurePath,
    statePath: STATE_ROOT + logicalStatePath,
    logicalInfoPath,
    logicalStructurePath,
    logicalStatePath,
  };
}

/** Parse a cache owner without allowing path normalization to hide traversal. */
function analysisUnitIdentityFromId(id) {
  if (typeof id !== 'string')
    throw new Error('Analysis unit id must be a string');
  const separator = id.indexOf(':');
  const prefix = id.slice(0, separator);
  const unitPath = id.slice(separator + 1);
  const kind =
    prefix === 'repository'
      ? 'repository'
      : prefix === 'collection'
        ? 'directory'
        : prefix === 'file'
          ? 'file'
          : undefined;
  if (!kind) throw new Error('Unknown physical analysis unit id');
  const identity = { id, path: unitPath, kind };
  requireUnitIdentity(identity);
  return identity;
}

exports.getAnalysisArtifactPaths = getAnalysisArtifactPaths;
exports.analysisUnitIdentityFromId = analysisUnitIdentityFromId;

const artifactFs = require('node:fs').promises;
const artifactPath = require('node:path');

/** Hash accepted bytes, including the publisher-owned metadata trailer. */
function hashAnalysisBytes(value) {
  return node_crypto_1.createHash('sha256').update(value).digest('hex');
}

/** Match path ownership before touching any cache file. */
function artifactPathsForIdentity(identity) {
  requireUnitIdentity(identity);
  return getAnalysisArtifactPaths({
    level:
      identity.kind === 'repository'
        ? 'repository'
        : identity.kind === 'file'
          ? 'file'
          : 'collection',
    path: identity.path,
  });
}

/** Reject symlink escapes even when the final artifact has not been created. */
async function safeAnalysisPath(workspaceRoot, relativePath) {
  if (!isWorkspaceRelativePath(relativePath))
    throw new Error('Analysis path must be canonical');
  const root = artifactPath.resolve(workspaceRoot);
  const target = artifactPath.resolve(root, ...relativePath.split('/'));
  const contained = (base, candidate) => {
    const relation = artifactPath.relative(base, candidate);
    return (
      relation !== '..' &&
      !relation.startsWith('..' + artifactPath.sep) &&
      !artifactPath.isAbsolute(relation)
    );
  };
  if (!contained(root, target) || target === root)
    throw new Error('Analysis path escaped the workspace');
  const realRoot = await artifactFs.realpath(root);
  let ancestor = target;
  for (;;) {
    try {
      const realAncestor = await artifactFs.realpath(ancestor);
      if (!contained(realRoot, realAncestor))
        throw new Error('Analysis path followed an escaping symbolic link');
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = artifactPath.dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  return target;
}

/** A cancelled or superseded writer may never certify a candidate. */
function requireArtifactWriterCurrent(input) {
  if (input.signal?.aborted || input.isCurrent?.() === false)
    throw new Error('Analysis unit task is cancelled or obsolete');
}

/** Release only temporary files owned by this attempted write. */
async function removeArtifactTemps(fileSystem, targets) {
  await Promise.all(
    targets.map(async (target) => {
      try {
        await fileSystem.rm(target, { recursive: false, force: true });
      } catch {
        /* Retain the publication failure as the primary error. */
      }
    }),
  );
}

/**
 * spec: .fibo/docs/specs/progressive-codebase-understanding/analysis-artifact-triplet/spec.md#AC-05
 *
 * design: .fibo/docs/specs/progressive-codebase-understanding/analysis-artifact-triplet/design.md#D3
 *
 * Certify this skill's public pair only after staging and rechecking its exact bytes and inputs.
 */
async function commitAnalysisArtifactBytes(input) {
  const fileSystem = { ...artifactFs, ...input.fileSystem };
  const identity = input.unit.kind
    ? input.unit
    : toAnalysisUnitIdentity(input.unit);
  const paths = artifactPathsForIdentity(identity);
  const targets = await Promise.all(
    [paths.infoPath, paths.structurePath, paths.statePath].map((relative) =>
      safeAnalysisPath(input.workspaceRoot, relative),
    ),
  );
  const nonce = node_crypto_1.randomUUID();
  const temps = targets.map((target) => target + '.tmp-' + nonce);
  const state = createAnalysisUnitState({
    unit: identity,
    fixedInput: input.fixedInput,
    rulesFingerprint: input.rulesFingerprint,
    observedInputs: input.observedInputs,
    infoFingerprint: hashAnalysisBytes(input.info),
    artifacts: { info: paths.infoPath, structure: paths.structurePath },
    artifactFingerprints: {
      info: hashAnalysisBytes(input.info),
      structure: hashAnalysisBytes(input.structure),
    },
  });
  const bytes = [
    input.info,
    input.structure,
    JSON.stringify(state, null, 2) + '\n',
  ];
  const verify = async () => {
    requireArtifactWriterCurrent(input);
    if (
      typeof input.verifyCurrent !== 'function' ||
      !(await input.verifyCurrent())
    )
      throw new Error('Analysis unit inputs changed before commit');
    requireArtifactWriterCurrent(input);
    for (const relative of [
      paths.infoPath,
      paths.structurePath,
      paths.statePath,
    ])
      await safeAnalysisPath(input.workspaceRoot, relative);
  };
  try {
    requireArtifactWriterCurrent(input);
    await Promise.all(
      targets.map((target) =>
        fileSystem.mkdir(artifactPath.dirname(target), { recursive: true }),
      ),
    );
    await Promise.all(
      temps.map((target, index) => fileSystem.writeFile(target, bytes[index])),
    );
    const staged = await Promise.all(
      temps.map((target) => fileSystem.readFile(target)),
    );
    if (
      staged.some(
        (buffer, index) =>
          hashAnalysisBytes(buffer) !== hashAnalysisBytes(bytes[index]),
      )
    )
      throw new Error(
        'Staged analysis unit bytes failed integrity verification',
      );
    await verify();
    await fileSystem.rename(temps[0], targets[0]);
    await fileSystem.rename(temps[1], targets[1]);
    await input.beforeStateCommit?.();
    await verify();
    await fileSystem.rename(temps[2], targets[2]);
    return state;
  } catch (error) {
    await removeArtifactTemps(fileSystem, temps);
    throw error;
  }
}

/** Verify exact file/child bytes before certifying a migrated state. */
async function verifyAnalysisFixedInput(workspaceRoot, identity, fixedInput) {
  try {
    requireUnitIdentity(identity);
    const input = normalizeAnalysisFixedInput(fixedInput);
    if (identity.kind === 'file') {
      if (input.kind !== 'file') return false;
      const target = await safeAnalysisPath(workspaceRoot, identity.path);
      return (
        hashAnalysisBytes(await artifactFs.readFile(target)) ===
        input.sourceFingerprint
      );
    }
    if (input.kind !== 'directory') return false;
    for (const child of input.children) {
      const childIdentity = analysisUnitIdentityFromId(child.id);
      if (artifactPath.posix.dirname(childIdentity.path) !== identity.path)
        return false;
      const childInfo = await safeAnalysisPath(
        workspaceRoot,
        artifactPathsForIdentity(childIdentity).infoPath,
      );
      if (
        hashAnalysisBytes(await artifactFs.readFile(childInfo)) !==
        child.infoFingerprint
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Move only a revalidated legacy certificate; leave the public bytes untouched. */
async function migrateAnalysisUnitState(input) {
  const fileSystem = { ...artifactFs, ...input.fileSystem };
  const paths = artifactPathsForIdentity(input.state.unit);
  const target = await safeAnalysisPath(input.workspaceRoot, paths.statePath);
  const temp = target + '.tmp-' + node_crypto_1.randomUUID();
  const bytes = JSON.stringify(input.state, null, 2) + '\n';
  try {
    await fileSystem.mkdir(artifactPath.dirname(target), { recursive: true });
    await fileSystem.writeFile(temp, bytes);
    if ((await fileSystem.readFile(temp)).toString('utf8') !== bytes)
      throw new Error('Staged migration state bytes changed');
    if (!(await input.verifyCurrent()))
      throw new Error('Analysis inputs changed during state migration');
    await safeAnalysisPath(input.workspaceRoot, paths.statePath);
    try {
      await fileSystem.stat(target);
      throw new Error('A current-state candidate appeared during migration');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fileSystem.rename(temp, target);
  } catch (error) {
    await removeArtifactTemps(fileSystem, [temp]);
    throw error;
  }
}

exports.hashAnalysisBytes = hashAnalysisBytes;
exports.artifactPathsForIdentity = artifactPathsForIdentity;
exports.safeAnalysisPath = safeAnalysisPath;
exports.commitAnalysisArtifactBytes = commitAnalysisArtifactBytes;
exports.verifyAnalysisFixedInput = verifyAnalysisFixedInput;
exports.migrateAnalysisUnitState = migrateAnalysisUnitState;

const artifactOs = require('node:os');
const PORTABLE_WRITER_VERSION = 'portable-analysis-state-v1';
const PORTABLE_ROLES = [
  'entry',
  'presentation',
  'api-boundary',
  'orchestration',
  'domain-rules',
  'data-contract',
  'state-storage',
  'external-adapter',
  'infrastructure',
  'configuration',
  'extension-point',
  'utility',
  'test-verification',
  'generated-resource',
];
const INFO_TRAILER =
  /---[ \t]*\r?\nname:\s*([^\r\n]*)\r?\n\s*\r?\nupdate-time:\s*([^\r\n]*)\r?\n\s*\r?\ndescription:\s*([^\r\n]*)\r?\n\s*\r?\n---[ \t]*(?:\r?\n)?$/;

/** Keep standalone execution provenance in the actual rule fingerprint. */
function portableRulesFingerprint(rules) {
  fingerprintAnalysisRules(rules);
  return fingerprintAnalysisRules({
    ...rules,
    executionPolicyVersion:
      rules.executionPolicyVersion + ':' + PORTABLE_WRITER_VERSION,
  });
}

/** Runtime source kinds must agree with the physical cache identity. */
function requirePortableUnit(unit) {
  if (!unit || Object.keys(unit).sort().join(',') !== 'id,kind,path,sourceKind')
    throw new Error(
      'Expected a physical unit with id, kind, path and sourceKind',
    );
  const identity = { id: unit.id, path: unit.path, kind: unit.kind };
  requireUnitIdentity(identity);
  if (
    (unit.kind === 'repository' && unit.sourceKind !== 'workspace') ||
    (unit.kind === 'directory' && unit.sourceKind !== 'directory') ||
    (unit.kind === 'file' && !['code', 'config'].includes(unit.sourceKind))
  )
    throw new Error('Contradictory unit source kind');
  return { ...unit };
}

/** A companion describes exactly the unit whose article is being accepted. */
function requirePortableStructure(value, expected) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 2)
    throw new Error('Invalid runtime structure');
  const unit = requirePortableUnit(value.unit);
  const identity = { id: unit.id, path: unit.path, kind: unit.kind };
  const expectedIdentity = {
    id: expected.id,
    path: expected.path,
    kind: expected.kind,
  };
  if (
    fingerprintAnalysisValue(identity) !==
      fingerprintAnalysisValue(expectedIdentity) ||
    (expected.sourceKind && expected.sourceKind !== unit.sourceKind)
  )
    throw new Error('Structure identity differs from the current unit');
  const fields =
    unit.sourceKind === 'code'
      ? 'facts,schemaVersion,unit'
      : 'schemaVersion,unit';
  if (Object.keys(value).sort().join(',') !== fields)
    throw new Error('Invalid structure fields');
  if (unit.sourceKind === 'code') {
    const facts = value.facts;
    if (
      !facts ||
      facts.file_path !== unit.path ||
      typeof facts.file_name !== 'string' ||
      typeof facts.file_type !== 'string' ||
      !['function', 'classes', 'global_variables'].every((key) =>
        Array.isArray(facts[key]),
      )
    )
      throw new Error('Code structure requires actual FileMeta facts');
  }
  return value;
}

/** Generated analysis may only enter through trusted child-article inputs. */
async function portableSourcePath(workspaceRoot, relative, allowRoot = false) {
  if (
    !isWorkspaceRelativePath(relative, allowRoot) ||
    relative === '.fibo' ||
    relative.startsWith('.fibo/')
  )
    throw new Error(
      'Expected a source-workspace path outside generated analysis',
    );
  const root = await artifactFs.realpath(workspaceRoot);
  const target =
    relative === '.' ? root : await safeAnalysisPath(root, relative);
  const actual = await artifactFs.realpath(target);
  const canonical =
    artifactPath.relative(root, actual).split(artifactPath.sep).join('/') ||
    '.';
  if (canonical === '.fibo' || canonical.startsWith('.fibo/'))
    throw new Error('Generated analysis is not source evidence');
  return target;
}

/** Bound reads while retaining a fingerprint of the complete file. */
async function portableSourceFile(workspaceRoot, relative) {
  const target = await portableSourcePath(workspaceRoot, relative);
  const stat = await artifactFs.stat(target);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024)
    throw new Error('Expected a bounded source text file');
  const bytes = await artifactFs.readFile(target);
  if (bytes.length > 2 * 1024 * 1024 || bytes.includes(0))
    throw new Error('Expected a bounded source text file');
  return { bytes, lines: bytes.toString('utf8').split(/\r?\n/) };
}

/** Report truncation explicitly rather than implying a whole file was returned. */
function portableLineRange(lines, args) {
  const start = args.startLine ?? 1;
  const requestedEnd = args.endLine ?? Math.min(lines.length, start + 399);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 1 ||
    start > lines.length ||
    requestedEnd < start
  )
    throw new Error('Invalid source line range');
  let end = Math.min(requestedEnd, lines.length, start + 399);
  while (
    end >= start &&
    Buffer.byteLength(JSON.stringify(lines.slice(start - 1, end))) >
      64 * 1024 - 1024
  )
    end--;
  if (end < start) throw new Error('Source line exceeds result budget');
  return {
    startLine: start,
    endLine: end,
    totalLines: lines.length,
    truncated: end < requestedEnd,
    content: lines
      .slice(start - 1, end)
      .map((line, index) => `${start + index}: ${line}`)
      .join('\n'),
  };
}

/** Preserve every consumed observation; mixed versions poison a session. */
function observePortableInput(session, observation) {
  const identity = observationIdentity(observation);
  const previous = session.observedInputs.find(
    (input) => observationIdentity(input) === identity,
  );
  if (
    previous &&
    fingerprintAnalysisValue(previous) !== fingerprintAnalysisValue(observation)
  ) {
    session.invalidReason = 'Observed inputs changed during analysis';
    throw new Error(session.invalidReason);
  }
  if (!previous) session.observedInputs.push(observation);
  normalizeAnalysisObservations(session.observedInputs);
}

/** Discovery hashes include empty and truncated results, not merely returned file hits. */
async function portableDirectoryListing(workspaceRoot, relative) {
  const target = await portableSourcePath(workspaceRoot, relative, true);
  if (!(await artifactFs.stat(target)).isDirectory())
    throw new Error('Expected a source directory');
  const entries = (await artifactFs.readdir(target, { withFileTypes: true }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((entry) => relative !== '.' || entry.name !== '.fibo');
  return {
    path: relative,
    entries: entries
      .slice(0, 200)
      .map((entry) => ({
        name: entry.name,
        kind: entry.isSymbolicLink()
          ? 'symbolic-link'
          : entry.isDirectory()
            ? 'directory'
            : 'file',
      })),
    truncated: entries.length > 200,
  };
}

/** Replay literal searches with stable traversal and the same bounded return contract. */
async function portableSearch(workspaceRoot, args, observeFile) {
  const relative = args.path ?? '.';
  const limit = args.limit ?? 50;
  if (
    typeof args.query !== 'string' ||
    !args.query.length ||
    Buffer.byteLength(args.query) > 1024 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw new Error('Search requires a bounded literal query and limit');
  await portableSourcePath(workspaceRoot, relative, true);
  const queue = [relative];
  const matches = [];
  let scanned = 0,
    scannedBytes = 0,
    resultBytes = 0,
    truncated = false;
  while (queue.length) {
    if (
      scanned >= 300 ||
      scannedBytes >= 8 * 1024 * 1024 ||
      matches.length >= limit
    ) {
      truncated = true;
      break;
    }
    const current = queue.shift();
    const target = await portableSourcePath(workspaceRoot, current, true);
    const info = await artifactFs.stat(target);
    if (info.isDirectory()) {
      for (const entry of (
        await artifactFs.readdir(target, { withFileTypes: true })
      ).sort((a, b) => a.name.localeCompare(b.name))) {
        if (
          entry.isSymbolicLink() ||
          ['.git', 'node_modules'].includes(entry.name) ||
          (current === '.' && entry.name === '.fibo')
        )
          continue;
        if (queue.length < 2000)
          queue.push(current === '.' ? entry.name : current + '/' + entry.name);
        else truncated = true;
      }
      continue;
    }
    scanned++;
    if (!info.isFile() || info.size > 2 * 1024 * 1024) continue;
    scannedBytes += info.size;
    if (scannedBytes > 8 * 1024 * 1024) {
      truncated = true;
      break;
    }
    let loaded;
    try {
      loaded = await portableSourceFile(workspaceRoot, current);
    } catch {
      continue;
    }
    let returned = false;
    for (let index = 0; index < loaded.lines.length; index++) {
      const text = loaded.lines[index];
      if (!text.includes(args.query)) continue;
      const item = { path: current, line: index + 1, text };
      const bytes = Buffer.byteLength(JSON.stringify(item));
      if (bytes > 8192 || resultBytes + bytes > 64 * 1024 - 1024) {
        truncated = true;
        continue;
      }
      matches.push(item);
      resultBytes += bytes;
      returned = true;
      if (matches.length >= limit) {
        truncated = true;
        break;
      }
    }
    if (returned && observeFile) observeFile(current, loaded.bytes);
  }
  return { matches, truncated };
}

/** Locate resources relative to either the backend module or the distributed skill. */
async function portableResourceDirectory() {
  const bundled = artifactPath.resolve(__dirname, '../references/prompts');
  try {
    if ((await artifactFs.stat(bundled)).isDirectory()) return bundled;
  } catch {
    /* Backend layout uses the sibling prompts directory. */
  }
  return artifactPath.join(__dirname, 'prompts');
}

/** Compose only the selected resources using the existing host-variable protocol. */
async function portableTemplate(unit, language, primaryRole, secondaryRoles) {
  if (
    !PORTABLE_ROLES.includes(primaryRole) ||
    !Array.isArray(secondaryRoles) ||
    secondaryRoles.some((role) => !PORTABLE_ROLES.includes(role)) ||
    secondaryRoles.includes(primaryRole)
  )
    throw new Error(
      'Template requires a primary role and valid supplementary roles',
    );
  const secondary = [...new Set(secondaryRoles)].sort();
  const unitType =
    unit.kind === 'repository'
      ? 'repository'
      : unit.kind === 'directory'
        ? 'directory'
        : unit.sourceKind;
  const directory = await portableResourceDirectory();
  const resource = async (name, suffix) => {
    const content = (
      await artifactFs.readFile(
        artifactPath.join(directory, name + suffix),
        'utf8',
      )
    )
      .replace(/\r\n/g, '\n')
      .trim();
    if (!content) throw new Error('Missing or empty writing resource ' + name);
    return content;
  };
  const parts = [
    await resource('analysisGuide', '.prompt.md'),
    '# Selected unit layout',
    await resource('analysisLayout.' + unitType, '.template.md'),
    '# Primary role template',
    await resource('analysisRole.' + primaryRole, '.template.md'),
  ];
  if (secondary.length) {
    parts.push('# Supplementary role templates');
    for (const role of secondary)
      parts.push(await resource('analysisRole.' + role, '.template.md'));
  }
  parts.push(
    '# Navigation examples',
    await resource('analysisNavigation', '.prompt.md'),
  );
  const variables = {
    UNIT_TYPE: unitType,
    PRIMARY_ROLE: primaryRole,
    SECONDARY_ROLES: secondary.length ? secondary.join(', ') : 'none',
    OUTPUT_LANGUAGE: language,
  };
  const selected = parts.join('\n\n');
  for (const match of selected.matchAll(/<tag\s+value=["']([^"']+)["']\s*\/>/g))
    if (!['code', 'text', 'graph'].includes(match[1]))
      throw new Error('Unsupported navigation tag');
  const content = selected.replace(/\{\{([^{}]*)\}\}/g, (_, name) => {
    if (!Object.prototype.hasOwnProperty.call(variables, name))
      throw new Error('Unknown host variable ' + name);
    return variables[name];
  });
  const encoded = Buffer.from(language, 'utf8')
    .toString('hex')
    .replace(
      /[0-9a-f]/g,
      (digit) => 'abcdefghijklmnop'[Number.parseInt(digit, 16)],
    );
  return {
    key: `${unitType}-language-${encoded}-primary-${primaryRole}:${secondary.join(',')}`,
    unitType,
    primaryRole,
    secondaryRoles: secondary,
    language,
    content,
  };
}

/** Decode a recorded selection so verification can reread exactly its resources. */
function portableTemplateSelection(key, unit, language) {
  const match =
    /^(code|config|directory|repository)-language-([a-p]+)-primary-([a-z-]+):(.*)$/.exec(
      key,
    );
  if (!match || match[2].length % 2 !== 0)
    throw new Error('Invalid template observation');
  const actualLanguage = Buffer.from(
    [...match[2]]
      .map((letter) => 'abcdefghijklmnop'.indexOf(letter).toString(16))
      .join(''),
    'hex',
  ).toString('utf8');
  const unitType =
    unit.kind === 'repository'
      ? 'repository'
      : unit.kind === 'directory'
        ? 'directory'
        : unit.sourceKind;
  if (match[1] !== unitType || actualLanguage !== language)
    throw new Error('Template observation has a foreign host context');
  return {
    primaryRole: match[3],
    secondaryRoles: match[4] ? match[4].split(',') : [],
  };
}

/** Revalidate every tool result actually consumed by the standalone author. */
async function verifyPortableObservations(
  workspaceRoot,
  unit,
  rules,
  observations,
) {
  try {
    for (const input of normalizeAnalysisObservations(observations)) {
      if (input.kind === 'file') {
        if (
          hashAnalysisBytes(
            (await portableSourceFile(workspaceRoot, input.path)).bytes,
          ) !== input.contentFingerprint
        )
          return false;
      } else if (input.kind === 'directory-listing') {
        if (
          fingerprintAnalysisValue(
            await portableDirectoryListing(workspaceRoot, input.path),
          ) !== input.resultFingerprint
        )
          return false;
      } else if (input.kind === 'search') {
        if (
          fingerprintAnalysisValue(
            await portableSearch(workspaceRoot, input),
          ) !== input.resultFingerprint
        )
          return false;
      } else {
        const selection = portableTemplateSelection(
          input.key,
          unit,
          rules.language,
        );
        const current = await portableTemplate(
          unit,
          rules.language,
          selection.primaryRole,
          selection.secondaryRoles,
        );
        if (
          current.key !== input.key ||
          hashAnalysisBytes(current.content) !== input.contentFingerprint
        )
          return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** Recursively establish child currentness; a valid-looking old article is insufficient. */
async function loadPortableCurrent(
  workspaceRoot,
  expected,
  rules,
  visiting = new Set(),
) {
  try {
    const identity = {
      id: expected.id,
      path: expected.path,
      kind: expected.kind,
    };
    requireUnitIdentity(identity);
    if (visiting.has(identity.id)) return undefined;
    visiting = new Set([...visiting, identity.id]);
    const paths = artifactPathsForIdentity(identity);
    const state = parseAnalysisUnitState(
      (
        await artifactFs.readFile(
          await safeAnalysisPath(workspaceRoot, paths.statePath),
        )
      ).toString('utf8'),
    );
    if (
      !state ||
      fingerprintAnalysisValue(state.unit) !==
        fingerprintAnalysisValue(identity) ||
      state.rulesFingerprint !== portableRulesFingerprint(rules) ||
      state.artifacts.info !== paths.infoPath ||
      state.artifacts.structure !== paths.structurePath
    )
      return undefined;
    const [info, structureBytes] = await Promise.all(
      [paths.infoPath, paths.structurePath].map(async (relative) =>
        artifactFs.readFile(await safeAnalysisPath(workspaceRoot, relative)),
      ),
    );
    if (
      hashAnalysisBytes(info) !== state.artifactFingerprints.info ||
      hashAnalysisBytes(structureBytes) !== state.artifactFingerprints.structure
    )
      return undefined;
    const structure = requirePortableStructure(
      JSON.parse(structureBytes.toString('utf8')),
      expected,
    );
    if (
      !(await verifyAnalysisFixedInput(
        workspaceRoot,
        identity,
        fixedInputFromAnalysisUnitState(state),
      )) ||
      !(await verifyPortableObservations(
        workspaceRoot,
        structure.unit,
        rules,
        state.observedInputs,
      ))
    )
      return undefined;
    for (const child of state.children ?? []) {
      const childIdentity = analysisUnitIdentityFromId(child.id);
      if (
        childIdentity.kind === 'repository' ||
        childIdentity.path === identity.path ||
        artifactPath.posix.dirname(childIdentity.path) !== identity.path
      )
        return undefined;
      const current = await loadPortableCurrent(
        workspaceRoot,
        childIdentity,
        rules,
        visiting,
      );
      if (!current || current.state.infoFingerprint !== child.infoFingerprint)
        return undefined;
    }
    return { state, structure, info: info.toString('utf8'), paths };
  } catch {
    return undefined;
  }
}

/** Capture direct-child identities and their accepted bytes before parent writing. */
async function portableChildren(workspaceRoot, unit, rules, children) {
  if (!Array.isArray(children) || new Set(children).size !== children.length)
    throw new Error(
      'Directory analysis requires the complete requested direct-child id list',
    );
  const current = [];
  for (const id of [...children].sort()) {
    const identity = analysisUnitIdentityFromId(id);
    if (
      identity.kind === 'repository' ||
      identity.path === unit.path ||
      artifactPath.posix.dirname(identity.path) !== unit.path
    )
      throw new Error('Child is not directly owned by the parent');
    const accepted = await loadPortableCurrent(workspaceRoot, identity, rules);
    if (!accepted) throw new Error('A direct child is not current: ' + id);
    current.push(accepted);
  }
  return current;
}

/** Keep the machine trailer separate from the article supplied to a parent. */
function portableArticleBody(markdown) {
  const match = INFO_TRAILER.exec(markdown);
  if (!match || (match.index > 0 && markdown[match.index - 1] !== '\n'))
    return { markdown };
  return {
    markdown: markdown.slice(0, match.index).replace(/(?:\r?\n){1,2}$/, ''),
    description: match[3].trim(),
  };
}

/** Derive metadata exactly from the physical unit and first reader-facing prose. */
function serializePortableArticle(markdown, unit) {
  let body = markdown;
  while (portableArticleBody(body).markdown !== body)
    body = portableArticleBody(body).markdown;
  body = body.trimEnd() + '\n';
  if (!body.trim()) throw new Error('A complete article must be nonempty');
  const name =
    unit.kind === 'repository' ? '.' : artifactPath.posix.basename(unit.path);
  const firstProse =
    body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line &&
          !['#', '<', '```', '---'].some((prefix) => line.startsWith(prefix)),
      ) || name;
  const description = firstProse.replace(/\s+/g, ' ').trim();
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return (
    body +
    `\n\n---\nname: ${name}\n\nupdate-time: ${timestamp}\n\ndescription: ${description}\n\n---\n`
  );
}

/** Sessions are temporary tool-owned control data, not additional cache artifacts. */
async function beginPortableSession(input) {
  const unit = requirePortableUnit(input.unit);
  const workspaceRoot = await artifactFs.realpath(input.workspaceRoot);
  const rulesFingerprint = portableRulesFingerprint(input.rules);
  const target = await portableSourcePath(
    workspaceRoot,
    unit.path,
    unit.kind === 'repository',
  );
  const sourceInfo = await artifactFs.stat(target);
  if (unit.kind === 'file' ? !sourceInfo.isFile() : !sourceInfo.isDirectory())
    throw new Error('Unit identity contradicts the source filesystem');
  const session = {
    version: 1,
    writer: PORTABLE_WRITER_VERSION,
    workspaceRoot,
    unit,
    rules: input.rules,
    rulesFingerprint,
    observedInputs: [],
  };
  const output = {
    unit,
    paths: artifactPathsForIdentity({
      id: unit.id,
      path: unit.path,
      kind: unit.kind,
    }),
  };
  if (unit.kind === 'file') {
    const loaded = await portableSourceFile(workspaceRoot, unit.path);
    session.fixedInput = {
      kind: 'file',
      sourceFingerprint: hashAnalysisBytes(loaded.bytes),
    };
    output.source = { path: unit.path, ...portableLineRange(loaded.lines, {}) };
  } else {
    const children = await portableChildren(
      workspaceRoot,
      unit,
      input.rules,
      input.children,
    );
    session.fixedInput = {
      kind: 'directory',
      children: children.map((child) => ({
        id: child.state.unit.id,
        infoFingerprint: child.state.infoFingerprint,
      })),
    };
    output.directChildren = children.map((child) => ({
      unitId: child.state.unit.id,
      infoFingerprint: child.state.infoFingerprint,
      summary:
        portableArticleBody(child.info).description || child.state.unit.path,
    }));
    const listing = await portableDirectoryListing(workspaceRoot, unit.path);
    observePortableInput(session, {
      kind: 'directory-listing',
      path: unit.path,
      resultFingerprint: fingerprintAnalysisValue(listing),
    });
  }
  const directory = await artifactFs.mkdtemp(
    artifactPath.join(artifactOs.tmpdir(), 'fibo-analysis-session-'),
  );
  session.sessionPath = artifactPath.join(directory, 'session.json');
  await artifactFs.writeFile(
    session.sessionPath,
    JSON.stringify(session, null, 2),
  );
  return { ...output, sessionPath: session.sessionPath };
}

/** Refuse arbitrary control files and concurrent writes to one observation ledger. */
async function withPortableSession(input, operation) {
  const sessionPath = artifactPath.resolve(input.sessionPath);
  const directory = artifactPath.dirname(sessionPath);
  if (
    artifactPath.basename(sessionPath) !== 'session.json' ||
    artifactPath.dirname(directory) !==
      artifactPath.resolve(artifactOs.tmpdir()) ||
    !artifactPath.basename(directory).startsWith('fibo-analysis-session-')
  )
    throw new Error('Expected a tool-owned temporary session');
  if (
    (await artifactFs.lstat(directory)).isSymbolicLink() ||
    (await artifactFs.lstat(sessionPath)).isSymbolicLink()
  )
    throw new Error('Session control files cannot be symbolic links');
  const lockPath = sessionPath + '.lock';
  const lock = await artifactFs.open(lockPath, 'wx');
  let session;
  try {
    const content = await artifactFs.readFile(sessionPath, 'utf8');
    if (Buffer.byteLength(content) > 4 * 1024 * 1024)
      throw new Error('Session exceeds its control-data budget');
    session = JSON.parse(content);
    requirePortableUnit(session.unit);
    normalizeAnalysisFixedInput(session.fixedInput);
    normalizeAnalysisObservations(session.observedInputs);
    if (
      session.version !== 1 ||
      session.writer !== PORTABLE_WRITER_VERSION ||
      session.sessionPath !== sessionPath ||
      session.rulesFingerprint !== portableRulesFingerprint(session.rules)
    )
      throw new Error('Session control data is inconsistent');
    if (session.invalidReason) throw new Error(session.invalidReason);
    const result = await operation(session);
    if (!session.completed)
      await artifactFs.writeFile(sessionPath, JSON.stringify(session, null, 2));
    return result;
  } catch (error) {
    if (session?.invalidReason)
      await artifactFs.writeFile(sessionPath, JSON.stringify(session, null, 2));
    throw error;
  } finally {
    await lock.close();
    await artifactFs.rm(lockPath, { force: true });
    if (session?.completed) {
      try {
        await artifactFs.rm(directory, { recursive: true, force: true });
      } catch {
        /* A completed triplet remains valid if temporary-session cleanup fails. */
      }
    }
  }
}

/** Verify fixed inputs, resource selections and recursive child currentness together. */
async function verifyPortableSession(session) {
  const identity = {
    id: session.unit.id,
    path: session.unit.path,
    kind: session.unit.kind,
  };
  if (
    session.invalidReason ||
    !(await verifyAnalysisFixedInput(
      session.workspaceRoot,
      identity,
      session.fixedInput,
    )) ||
    !(await verifyPortableObservations(
      session.workspaceRoot,
      session.unit,
      session.rules,
      session.observedInputs,
    ))
  )
    return false;
  if (session.fixedInput.kind === 'directory') {
    const children = await portableChildren(
      session.workspaceRoot,
      session.unit,
      session.rules,
      session.fixedInput.children.map((child) => child.id),
    );
    if (
      fingerprintAnalysisValue(
        children.map((child) => ({
          id: child.state.unit.id,
          infoFingerprint: child.state.infoFingerprint,
        })),
      ) !== fingerprintAnalysisValue(session.fixedInput.children)
    )
      return false;
  }
  return true;
}

/** All commands are local artifact operations; no command executes project code. */
async function runPortableCommand(command, input) {
  if (command === 'begin') return beginPortableSession(input);
  if (command === 'verify') {
    const unit = requirePortableUnit(input.unit);
    portableRulesFingerprint(input.rules);
    const current = await loadPortableCurrent(
      input.workspaceRoot,
      unit,
      input.rules,
    );
    return current
      ? { current: true, paths: current.paths, unit: current.state.unit }
      : { current: false, reason: 'missing-or-stale-triplet' };
  }
  if (
    !['read', 'child', 'list', 'search', 'template', 'publish'].includes(
      command,
    )
  )
    throw new Error('Unknown analysis artifact command');
  return withPortableSession(input, async (session) => {
    const { workspaceRoot, unit } = session;
    if (command === 'read') {
      const loaded = await portableSourceFile(workspaceRoot, input.path);
      observePortableInput(session, {
        kind: 'file',
        path: input.path,
        contentFingerprint: hashAnalysisBytes(loaded.bytes),
      });
      return { path: input.path, ...portableLineRange(loaded.lines, input) };
    }
    if (command === 'child') {
      const child = session.fixedInput.children?.find(
        (item) => item.id === input.unitId,
      );
      const current =
        child &&
        (await loadPortableCurrent(
          workspaceRoot,
          analysisUnitIdentityFromId(child.id),
          session.rules,
        ));
      if (!current || current.state.infoFingerprint !== child.infoFingerprint)
        throw new Error('Requested child is not a current direct child');
      return {
        unitId: child.id,
        ...portableLineRange(
          portableArticleBody(current.info).markdown.split(/\r?\n/),
          input,
        ),
      };
    }
    if (command === 'list') {
      const result = await portableDirectoryListing(workspaceRoot, input.path);
      observePortableInput(session, {
        kind: 'directory-listing',
        path: input.path,
        resultFingerprint: fingerprintAnalysisValue(result),
      });
      return result;
    }
    if (command === 'search') {
      const result = await portableSearch(workspaceRoot, input, (file, bytes) =>
        observePortableInput(session, {
          kind: 'file',
          path: file,
          contentFingerprint: hashAnalysisBytes(bytes),
        }),
      );
      observePortableInput(session, {
        kind: 'search',
        path: input.path ?? '.',
        query: input.query,
        limit: input.limit ?? 50,
        resultFingerprint: fingerprintAnalysisValue(result),
      });
      return result;
    }
    if (command === 'template') {
      const result = await portableTemplate(
        unit,
        session.rules.language,
        input.primaryRole,
        input.secondaryRoles,
      );
      observePortableInput(session, {
        kind: 'template',
        key: result.key,
        contentFingerprint: hashAnalysisBytes(result.content),
      });
      return result;
    }
    if (!session.observedInputs.some((item) => item.kind === 'template'))
      throw new Error(
        'Read the selected writing template before publishing complete analysis',
      );
    const markdown = await artifactFs.readFile(input.articlePath, 'utf8');
    const structure = requirePortableStructure(
      JSON.parse(await artifactFs.readFile(input.structurePath, 'utf8')),
      unit,
    );
    const state = await commitAnalysisArtifactBytes({
      workspaceRoot,
      unit: { id: unit.id, path: unit.path, kind: unit.kind },
      fixedInput: session.fixedInput,
      rulesFingerprint: session.rulesFingerprint,
      observedInputs: session.observedInputs,
      info: serializePortableArticle(markdown, unit),
      structure: JSON.stringify(structure, null, 2) + '\n',
      verifyCurrent: () => verifyPortableSession(session),
    });
    session.completed = true;
    return {
      status: 'published',
      unit: state.unit,
      paths: artifactPathsForIdentity(state.unit),
    };
  });
}

/** Keep JSON transport separate from reusable functions and never log source data on errors. */
async function portableCommandMain() {
  if (process.argv[2] === '--help') {
    process.stdout.write(
      'Analysis artifacts: begin | read | child | list | search | template | publish | verify. Pass one JSON object on stdin.\n',
    );
    return;
  }
  try {
    let input = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      input += chunk;
      if (Buffer.byteLength(input) > 4 * 1024 * 1024)
        throw new Error('Command input exceeds 4 MiB');
    }
    const result = await runPortableCommand(process.argv[2], JSON.parse(input));
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    process.stdout.write(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }) + '\n',
    );
    process.exitCode = 1;
  }
}

exports.runPortableCommand = runPortableCommand;
if (require.main === module) void portableCommandMain();
