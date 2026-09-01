import { Buffer } from 'node:buffer';
import { execFileSync as nodeExecFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The OpenAPI source is deliberately kept separate from the cached contract.
 * This helper never prints the source URL, an Authorization header, or a
 * response body.  The cache is intended to be consumed by a later audit
 * helper, not to be a replacement for the server's source code.
 */

export const SOURCE_SCHEMA_VERSION = 1;
export const CACHE_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_REDIRECTS = 4;
export const DEFAULT_MAX_DOCUMENTS = 32;

export const REPO_ROOT = resolve(
  fileURLToPath(new URL('../..', import.meta.url)),
);
export const DEFAULT_SOURCE_PATH = join(
  REPO_ROOT,
  '.agent-local',
  'sources',
  'openapi-source.json',
);
export const DEFAULT_CACHE_DIR = join(
  REPO_ROOT,
  '.agent-local',
  'openapi-cache',
);

const HTTP_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]);
// Swagger discovery normally needs no query string. `group` is the one common,
// non-secret SpringDoc selector we support; rejecting every other key prevents
// signed URLs and unknown credentials from entering the local raw cache.
const SAFE_URL_QUERY_KEYS = new Set(['group']);
const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const SAFE_SHA = /^[a-f0-9]{7,64}$/i;

const ERROR_MESSAGES = Object.freeze({
  SOURCE_NOT_FOUND: 'OpenAPI source configuration is unavailable.',
  SOURCE_INVALID_JSON: 'OpenAPI source configuration is not valid JSON.',
  SOURCE_INVALID: 'OpenAPI source configuration is invalid.',
  SOURCE_URL_INVALID: 'OpenAPI source URL is invalid.',
  SOURCE_URL_PROTOCOL: 'OpenAPI source URL must use HTTPS.',
  SOURCE_URL_CREDENTIALS: 'OpenAPI source URL contains credentials.',
  SOURCE_CONFIG_ORIGIN: 'OpenAPI config URL must use the source origin.',
  AUTH_ENV_INVALID: 'OpenAPI bearer environment variable name is invalid.',
  AUTH_ENV_MISSING: 'OpenAPI bearer environment variable is unavailable.',
  CONFIG_INVALID: 'SpringDoc swagger-config is invalid.',
  CONFIG_EMPTY: 'SpringDoc swagger-config has no API documents.',
  DOCUMENT_INVALID: 'OpenAPI document is invalid.',
  CROSS_ORIGIN_URL: 'OpenAPI document URL is cross-origin.',
  CROSS_ORIGIN_REDIRECT: 'OpenAPI redirect is cross-origin.',
  REDIRECT_INVALID: 'OpenAPI redirect is invalid.',
  REDIRECT_LIMIT: 'OpenAPI redirect limit exceeded.',
  NON_JSON_CONTENT: 'OpenAPI endpoint returned non-JSON content.',
  RESPONSE_TOO_LARGE: 'OpenAPI response exceeded the size limit.',
  INVALID_JSON: 'OpenAPI endpoint returned invalid JSON.',
  REQUEST_TIMEOUT: 'OpenAPI endpoint request timed out.',
  NETWORK_UNAVAILABLE: 'OpenAPI endpoint is unavailable.',
  HTTP_401: 'OpenAPI endpoint rejected authentication.',
  HTTP_403: 'OpenAPI endpoint rejected access.',
  HTTP_404: 'OpenAPI endpoint was not found.',
  HTTP_ERROR: 'OpenAPI endpoint returned an error.',
  CACHE_INVALID: 'OpenAPI cache is invalid.',
  LOCAL_PATH_INVALID:
    'OpenAPI source and cache paths must stay under .agent-local.',
  REFRESH_IN_PROGRESS: 'Another OpenAPI refresh is already in progress.',
  REFERENCE_INVALID:
    'OpenAPI document contains an unresolved or external reference.',
  INTERNAL_ERROR: 'OpenAPI contract helper failed.',
});

export class OpenApiContractError extends Error {
  constructor(
    code,
    message = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR,
  ) {
    super(message);
    this.name = 'OpenApiContractError';
    this.code = code;
  }
}

function fail(code) {
  throw new OpenApiContractError(code);
}

function asObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
}

function asNonEmptyString(value, code = 'SOURCE_INVALID') {
  if (typeof value !== 'string' || value.trim() === '') fail(code);
  return value.trim();
}

function hasUnsafeQuery(url) {
  for (const key of url.searchParams.keys()) {
    if (!SAFE_URL_QUERY_KEYS.has(key.toLowerCase())) return true;
  }
  return false;
}

function isLoopbackHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0'
  );
}

function parseSafeUrl(value, { allowLoopbackHttp = true } = {}) {
  const raw = asNonEmptyString(value, 'SOURCE_URL_INVALID');
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail('SOURCE_URL_INVALID');
  }

  if (url.username || url.password || hasUnsafeQuery(url)) {
    fail('SOURCE_URL_CREDENTIALS');
  }
  if (
    url.protocol !== 'https:' &&
    !(
      allowLoopbackHttp &&
      url.protocol === 'http:' &&
      isLoopbackHostname(url.hostname)
    )
  ) {
    fail('SOURCE_URL_PROTOCOL');
  }
  return url;
}

function assertSameOrigin(url, sourceOrigin, code = 'CROSS_ORIGIN_URL') {
  if (url.origin !== sourceOrigin) fail(code);
}

function isControlCharacter(character) {
  const codePoint = character.codePointAt(0);
  return codePoint <= 0x1f || codePoint === 0x7f;
}

function hasControlCharacter(value) {
  return [...value].some(isControlCharacter);
}

function stripControlCharacters(value) {
  return [...value]
    .filter(character => !isControlCharacter(character))
    .join('');
}

function normalizeLabel(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const label = stripControlCharacters(value.trim());
  if (!label || label.length > 256 || /^https?:\/\//i.test(label))
    return fallback;
  return label;
}

function validateSafeIdentifier(value, code = 'SOURCE_INVALID') {
  const identifier = asNonEmptyString(value, code);
  if (!SAFE_ID.test(identifier)) fail(code);
  return identifier;
}

function validateAuth(auth) {
  if (auth === undefined) return { kind: 'none' };
  const authObject = asObject(auth);
  if (!authObject) fail('SOURCE_INVALID');

  if (authObject.kind === 'none') {
    if (Object.keys(authObject).some(key => key !== 'kind'))
      fail('SOURCE_INVALID');
    return { kind: 'none' };
  }
  if (authObject.kind !== 'bearer-env') fail('SOURCE_INVALID');
  if (Object.keys(authObject).some(key => !['kind', 'envName'].includes(key))) {
    fail('SOURCE_INVALID');
  }
  const envName = asNonEmptyString(authObject.envName, 'AUTH_ENV_INVALID');
  if (!/^[A-Z][A-Z0-9_]*$/.test(envName)) fail('AUTH_ENV_INVALID');
  return { kind: 'bearer-env', envName };
}

function validateFreshness(freshness) {
  if (freshness === undefined)
    return { maxAgeSeconds: DEFAULT_MAX_AGE_SECONDS };
  const object = asObject(freshness);
  if (!object || Object.keys(object).some(key => key !== 'maxAgeSeconds')) {
    fail('SOURCE_INVALID');
  }
  const maxAgeSeconds = object.maxAgeSeconds;
  if (
    typeof maxAgeSeconds !== 'number' ||
    !Number.isFinite(maxAgeSeconds) ||
    maxAgeSeconds <= 0 ||
    maxAgeSeconds > 31_536_000
  ) {
    fail('SOURCE_INVALID');
  }
  return { maxAgeSeconds };
}

function validateServerRepository(serverRepository) {
  if (serverRepository === undefined) return undefined;
  const object = asObject(serverRepository);
  if (!object) fail('SOURCE_INVALID');
  const allowed = ['owner', 'name', 'branch', 'deployWorkflow'];
  if (Object.keys(object).some(key => !allowed.includes(key)))
    fail('SOURCE_INVALID');
  const owner = validateSafeIdentifier(object.owner, 'SOURCE_INVALID');
  const name = validateSafeIdentifier(object.name, 'SOURCE_INVALID');
  const branch = validateSafeIdentifier(
    object.branch ?? 'main',
    'SOURCE_INVALID',
  );
  const deployWorkflow = asNonEmptyString(
    object.deployWorkflow,
    'SOURCE_INVALID',
  );
  if (deployWorkflow.length > 256 || hasControlCharacter(deployWorkflow)) {
    fail('SOURCE_INVALID');
  }
  return { owner, name, branch, deployWorkflow };
}

/** Validate and return a redacted, normalized source configuration. */
export function validateSource(source) {
  const object = asObject(source);
  if (!object) fail('SOURCE_INVALID');

  const allowed = [
    'schemaVersion',
    'version',
    'sourceId',
    'swaggerUiUrl',
    'swaggerConfigUrl',
    'targetEnvironment',
    'freshness',
    'auth',
    'serverRepository',
  ];
  if (Object.keys(object).some(key => !allowed.includes(key)))
    fail('SOURCE_INVALID');

  const version =
    object.schemaVersion ?? object.version ?? SOURCE_SCHEMA_VERSION;
  if (version !== SOURCE_SCHEMA_VERSION) fail('SOURCE_INVALID');
  if (
    object.schemaVersion !== undefined &&
    object.version !== undefined &&
    object.schemaVersion !== object.version
  ) {
    fail('SOURCE_INVALID');
  }

  const sourceId = validateSafeIdentifier(object.sourceId, 'SOURCE_INVALID');
  const swaggerUiUrl = parseSafeUrl(object.swaggerUiUrl);
  const swaggerConfigUrl =
    object.swaggerConfigUrl === undefined
      ? undefined
      : parseSafeUrl(object.swaggerConfigUrl);
  if (swaggerConfigUrl)
    assertSameOrigin(
      swaggerConfigUrl,
      swaggerUiUrl.origin,
      'SOURCE_CONFIG_ORIGIN',
    );

  const targetEnvironment = asNonEmptyString(
    object.targetEnvironment,
    'SOURCE_INVALID',
  );
  if (
    targetEnvironment.length > 128 ||
    hasControlCharacter(targetEnvironment)
  ) {
    fail('SOURCE_INVALID');
  }

  return {
    schemaVersion: SOURCE_SCHEMA_VERSION,
    sourceId,
    swaggerUiUrl: swaggerUiUrl.href,
    swaggerConfigUrl: swaggerConfigUrl?.href,
    targetEnvironment,
    freshness: validateFreshness(object.freshness),
    auth: validateAuth(object.auth),
    serverRepository: validateServerRepository(object.serverRepository),
  };
}

const DOCUMENTATION_KEYS = new Set([
  'description',
  'summary',
  'example',
  'examples',
  'externalDocs',
]);

// Values below these keys are keyed by user-defined names rather than OpenAPI
// annotation names. Only the map key itself is protected; its value is parsed
// again as a normal schema, parameter, response, or media object.
const NAME_MAP_KEYS = new Set([
  '$defs',
  'callbacks',
  'content',
  'definitions',
  'dependentRequired',
  'dependentSchemas',
  'encoding',
  'headers',
  'links',
  'mapping',
  'parameters',
  'paths',
  'patternProperties',
  'properties',
  'requestBodies',
  'responses',
  'schemas',
  'scopes',
  'securityDefinitions',
  'variables',
]);

// These JSON Schema values are contract data, not schema objects. Their
// object keys must remain intact even when they match OpenAPI annotation keys.
const LITERAL_VALUE_KEYS = new Set(['const', 'default', 'enum']);

function stripDocumentation(value, context = 'object') {
  if (Array.isArray(value)) {
    const itemContext = context === 'literal' ? 'literal' : 'object';
    return value.map(item => stripDocumentation(item, itemContext));
  }
  if (!asObject(value)) return value;
  const insideNameMap = context === 'name-map';
  const insideLiteral = context === 'literal';
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          insideLiteral || insideNameMap || !DOCUMENTATION_KEYS.has(key),
      )
      .map(([key, nested]) => [
        key,
        stripDocumentation(
          nested,
          insideLiteral
            ? 'literal'
            : insideNameMap
              ? 'object'
              : LITERAL_VALUE_KEYS.has(key)
                ? 'literal'
                : NAME_MAP_KEYS.has(key)
                  ? 'name-map'
                  : 'object',
        ),
      ]),
  );
}

function compareCodeUnits(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!asObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => compareCodeUnits(left, right))
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
}

/** JSON with deterministic object key ordering. Arrays retain contract order. */
export function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  const input =
    typeof value === 'string' || value instanceof Uint8Array
      ? value
      : canonicalJson(value);
  return createHash('sha256').update(input).digest('hex');
}

export function canonicalizePath(path) {
  const canonical = String(path)
    .replace(/\{[^{}]+\}/g, '{}')
    .replace(/(^|\/):[^/]+(?=\/|$)/g, '$1{}');
  return canonical.length > 1 ? canonical.replace(/\/+$/, '') : canonical;
}

function decodeJsonPointerSegment(segment) {
  let decoded;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    fail('REFERENCE_INVALID');
  }
  return decoded.replace(/~1/g, '/').replace(/~0/g, '~');
}

function validateLocalReference(root, reference) {
  if (reference === '#') return root;
  if (typeof reference !== 'string' || !reference.startsWith('#/')) {
    fail('REFERENCE_INVALID');
  }
  let current = root;
  for (const segment of reference.slice(2).split('/')) {
    const key = decodeJsonPointerSegment(segment);
    if (
      (asObject(current) === null && !Array.isArray(current)) ||
      !Object.hasOwn(current, key)
    ) {
      fail('REFERENCE_INVALID');
    }
    current = current[key];
  }
  return current;
}

function validateDocumentReferences(value, root, seen = new WeakSet()) {
  if (Array.isArray(value)) {
    if (seen.has(value)) return;
    seen.add(value);
    for (const nested of value) validateDocumentReferences(nested, root, seen);
    return;
  }
  const object = asObject(value);
  if (!object || seen.has(object)) return;
  seen.add(object);
  if (Object.hasOwn(object, '$ref')) validateLocalReference(root, object.$ref);
  for (const nested of Object.values(object)) {
    validateDocumentReferences(nested, root, seen);
  }
}

export function validateOpenApiDocument(document) {
  const object = asObject(document);
  if (!object || (!isOpenApiDocument(object) && !isSwaggerDocument(object))) {
    fail('DOCUMENT_INVALID');
  }
  if (!asObject(object.paths)) fail('DOCUMENT_INVALID');
  validateDocumentReferences(object, object);
  return object;
}

function isOpenApiDocument(value) {
  return asObject(value) !== null && typeof value.openapi === 'string';
}

function isSwaggerDocument(value) {
  return asObject(value) !== null && typeof value.swagger === 'string';
}

function fingerprintSchemaSummary(summary) {
  return summary === undefined ? undefined : sha256(summary);
}

function schemaSummary(
  schema,
  document,
  resolvingReferences = new Set(),
  resolvedReferenceSummaries = new Map(),
  documentationStripped = false,
) {
  if (schema === undefined) return undefined;
  if (Array.isArray(schema)) {
    return schema.map(item =>
      schemaSummary(
        item,
        document,
        resolvingReferences,
        resolvedReferenceSummaries,
        documentationStripped,
      ),
    );
  }
  const object = asObject(schema);
  if (!object) return schema;

  const cleaned = documentationStripped ? object : stripDocumentation(object);
  const result = Object.fromEntries(
    Object.entries(cleaned).map(([key, value]) => [
      key,
      schemaSummary(
        value,
        document,
        resolvingReferences,
        resolvedReferenceSummaries,
        true,
      ),
    ]),
  );
  if (
    typeof cleaned.$ref === 'string' &&
    !resolvingReferences.has(cleaned.$ref)
  ) {
    const nextReferences = new Set(resolvingReferences).add(cleaned.$ref);
    const cacheKey = canonicalJson([
      cleaned.$ref,
      [...nextReferences].sort(compareCodeUnits),
    ]);
    if (resolvedReferenceSummaries.has(cacheKey)) {
      result.resolved = resolvedReferenceSummaries.get(cacheKey);
    } else {
      const resolved = schemaSummary(
        validateLocalReference(document, cleaned.$ref),
        document,
        nextReferences,
        resolvedReferenceSummaries,
        false,
      );
      resolvedReferenceSummaries.set(cacheKey, resolved);
      result.resolved = resolved;
    }
  }
  return stableValue(result);
}

function contentSummary(content, document, resolvedReferenceSummaries) {
  const object = asObject(content);
  if (!object) return [];
  return Object.entries(object)
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([mediaType, media]) => {
      const schema = asObject(media)?.schema;
      const summary =
        schema === undefined
          ? undefined
          : schemaSummary(
              schema,
              document,
              new Set(),
              resolvedReferenceSummaries,
            );
      return {
        mediaType,
        ...(summary === undefined ? {} : { schema: summary }),
        schemaFingerprint: fingerprintSchemaSummary(summary),
      };
    });
}

function parameterSummary(parameters, document, resolvedReferenceSummaries) {
  if (!Array.isArray(parameters)) return [];
  return parameters
    .filter(asObject)
    .map(parameter => {
      const summary =
        parameter.schema === undefined
          ? undefined
          : schemaSummary(
              parameter.schema,
              document,
              new Set(),
              resolvedReferenceSummaries,
            );
      return {
        name: typeof parameter.name === 'string' ? parameter.name : '',
        in: typeof parameter.in === 'string' ? parameter.in : '',
        required: Boolean(parameter.required),
        style:
          typeof parameter.style === 'string' ? parameter.style : undefined,
        explode:
          typeof parameter.explode === 'boolean'
            ? parameter.explode
            : undefined,
        allowEmptyValue:
          typeof parameter.allowEmptyValue === 'boolean'
            ? parameter.allowEmptyValue
            : undefined,
        ...(summary === undefined ? {} : { schema: summary }),
        schemaFingerprint: fingerprintSchemaSummary(summary),
        content: contentSummary(
          parameter.content,
          document,
          resolvedReferenceSummaries,
        ),
        contractFingerprint: sha256(stripDocumentation(parameter)),
      };
    })
    .sort((left, right) =>
      compareCodeUnits(`${left.in}:${left.name}`, `${right.in}:${right.name}`),
    );
}

function requestSummary(requestBody, document, resolvedReferenceSummaries) {
  const object = asObject(requestBody);
  if (!object) return null;
  return {
    required: Boolean(object.required),
    content: contentSummary(
      object.content,
      document,
      resolvedReferenceSummaries,
    ),
    contractFingerprint: sha256(stripDocumentation(object)),
  };
}

function responseSummary(responses, document, resolvedReferenceSummaries) {
  const object = asObject(responses);
  if (!object) return [];
  return Object.entries(object)
    .sort(([left], [right]) =>
      left.localeCompare(right, undefined, { numeric: true }),
    )
    .map(([status, response]) => {
      const responseObject = asObject(response) ?? {};
      return {
        status,
        content: contentSummary(
          responseObject.content,
          document,
          resolvedReferenceSummaries,
        ),
        ...(responseObject.schema === undefined
          ? {}
          : {
              schema: schemaSummary(
                responseObject.schema,
                document,
                new Set(),
                resolvedReferenceSummaries,
              ),
            }),
        headers: Object.keys(asObject(responseObject.headers) ?? {}).sort(),
        contractFingerprint: sha256(stripDocumentation(responseObject)),
      };
    });
}

function securitySummary(security) {
  if (!Array.isArray(security)) return null;
  return security
    .filter(asObject)
    .map(requirement =>
      Object.fromEntries(
        Object.entries(requirement)
          .sort(([left], [right]) => compareCodeUnits(left, right))
          .map(([scheme, scopes]) => [
            scheme,
            Array.isArray(scopes)
              ? scopes
                  .filter(scope => typeof scope === 'string')
                  .sort(compareCodeUnits)
              : [],
          ]),
      ),
    )
    .sort((left, right) =>
      compareCodeUnits(canonicalJson(left), canonicalJson(right)),
    );
}

function resolveParameter(
  parameter,
  document,
  resolvingReferences = new Set(),
) {
  const object = asObject(parameter);
  if (!object) return null;
  if (typeof object.$ref !== 'string') return object;
  if (resolvingReferences.has(object.$ref)) fail('REFERENCE_INVALID');
  const resolved = validateLocalReference(document, object.$ref);
  if (!asObject(resolved)) fail('DOCUMENT_INVALID');
  return resolveParameter(
    resolved,
    document,
    new Set(resolvingReferences).add(object.$ref),
  );
}

function mergeOperationParameters(
  pathParameters,
  operationParameters,
  document,
) {
  const merged = new Map();
  let anonymousIndex = 0;
  for (const parameter of [
    ...(Array.isArray(pathParameters) ? pathParameters : []),
    ...(Array.isArray(operationParameters) ? operationParameters : []),
  ]) {
    const resolved = resolveParameter(parameter, document);
    if (!resolved) continue;
    const identity =
      typeof resolved.in === 'string' && typeof resolved.name === 'string'
        ? `${resolved.in}\u0000${resolved.name}`
        : `\u0000anonymous-${anonymousIndex++}`;
    // Operation parameters are appended last and therefore replace path-level
    // entries with the same OpenAPI (in, name) identity.
    merged.set(identity, resolved);
  }
  return [...merged.values()];
}

function operationSummary({
  group,
  path,
  method,
  operation,
  pathItem,
  document,
  documentHash,
  sourceMethod,
  resolvedReferenceSummaries,
}) {
  const operationObject = asObject(operation) ?? {};
  const pathObject = asObject(pathItem) ?? {};
  const parameters = mergeOperationParameters(
    pathObject.parameters,
    operationObject.parameters,
    document,
  );
  const security = Object.hasOwn(operationObject, 'security')
    ? operationObject.security
    : document.security;
  const normalizedSecurity = securitySummary(security);
  const parametersResult = parameterSummary(
    parameters,
    document,
    resolvedReferenceSummaries,
  );
  const request = requestSummary(
    operationObject.requestBody,
    document,
    resolvedReferenceSummaries,
  );
  const responses = responseSummary(
    operationObject.responses,
    document,
    resolvedReferenceSummaries,
  );

  const result = {
    group,
    operationId:
      typeof operationObject.operationId === 'string'
        ? operationObject.operationId
        : '',
    method,
    path,
    canonicalPath: canonicalizePath(path),
    tags: Array.isArray(operationObject.tags)
      ? [
          ...new Set(
            operationObject.tags.filter(tag => typeof tag === 'string'),
          ),
        ].sort()
      : [],
    deprecated: operationObject.deprecated === true,
    source: {
      documentHash,
      jsonPointer: `/paths/${String(path).replace(/~/g, '~0').replace(/\//g, '~1')}/${String(sourceMethod).replace(/~/g, '~0').replace(/\//g, '~1')}`,
    },
    parameters: parametersResult,
    request,
    responses,
    security: normalizedSecurity,
  };

  return {
    ...result,
    fingerprints: {
      parameters: sha256(stripDocumentation(parametersResult)),
      request: sha256(stripDocumentation(request)),
      responses: sha256(stripDocumentation(responses)),
      security: sha256(stripDocumentation(normalizedSecurity)),
    },
  };
}

function withoutOperationSource(operation) {
  return Object.fromEntries(
    Object.entries(operation).filter(([key]) => key !== 'source'),
  );
}

/** Return a stable, contract-only operation index for a group of documents. */
export function normalizeOpenApiDocuments(documents) {
  if (!Array.isArray(documents)) fail('DOCUMENT_INVALID');
  const operations = [];
  const documentSummaries = [];

  for (const entry of documents) {
    const document = validateOpenApiDocument(entry.document ?? entry);
    const resolvedReferenceSummaries = new Map();
    const group = normalizeLabel(entry.group, 'default');
    const rawHash = entry.documentHash ?? sha256(canonicalJson(document));
    const dialect =
      typeof document.openapi === 'string'
        ? `openapi-${document.openapi}`
        : `swagger-${document.swagger}`;
    const infoVersion = normalizeLabel(
      asObject(document.info)?.version,
      undefined,
    );
    const title = normalizeLabel(asObject(document.info)?.title, undefined);
    const contractHash = sha256(
      stripDocumentation({
        paths: document.paths,
        components: document.components,
        definitions: document.definitions,
        parameters: document.parameters,
        responses: document.responses,
        security: document.security,
        securityDefinitions: document.securityDefinitions,
        consumes: document.consumes,
        produces: document.produces,
        basePath: document.basePath,
        schemes: document.schemes,
      }),
    );
    let operationCount = 0;

    for (const [path, pathItemValue] of Object.entries(document.paths)) {
      if (!path.startsWith('/')) continue;
      const pathItem = asObject(pathItemValue);
      if (!pathItem) continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        const lowerMethod = method.toLowerCase();
        if (!HTTP_METHODS.has(lowerMethod)) continue;
        operations.push(
          operationSummary({
            group,
            path,
            method: lowerMethod,
            operation,
            pathItem,
            document,
            documentHash: rawHash,
            sourceMethod: method,
            resolvedReferenceSummaries,
          }),
        );
        operationCount += 1;
      }
    }
    documentSummaries.push({
      group,
      documentHash: rawHash,
      contractHash,
      dialect,
      ...(infoVersion ? { infoVersion } : {}),
      ...(title ? { title } : {}),
      operationCount,
    });
  }

  operations.sort((left, right) =>
    compareCodeUnits(
      [
        left.group,
        left.canonicalPath,
        left.method,
        left.path,
        left.operationId,
      ].join('\u0000'),
      [
        right.group,
        right.canonicalPath,
        right.method,
        right.path,
        right.operationId,
      ].join('\u0000'),
    ),
  );
  documentSummaries.sort((left, right) =>
    compareCodeUnits(
      [left.group, left.documentHash].join('\u0000'),
      [right.group, right.documentHash].join('\u0000'),
    ),
  );
  const contractDocuments = documentSummaries.map(
    ({ group, contractHash, dialect, infoVersion, operationCount }) => ({
      group,
      contractHash,
      dialect,
      ...(infoVersion ? { infoVersion } : {}),
      operationCount,
    }),
  );
  return {
    documents: documentSummaries,
    operations,
    normalizedHash: sha256({
      documents: contractDocuments,
      operations: operations.map(withoutOperationSource),
    }),
  };
}

function groupFromUrl(url) {
  const segments = url.pathname.split('/').filter(Boolean);
  return normalizeLabel(segments.at(-1), 'default');
}

/** Extract same-origin SpringDoc group URLs from a swagger-config response. */
export function discoverDocumentEntries(
  config,
  { configUrl, sourceOrigin } = {},
) {
  const object = asObject(config);
  if (!object) fail('CONFIG_INVALID');

  if (isOpenApiDocument(object) || isSwaggerDocument(object)) {
    return [{ group: 'default', url: configUrl }];
  }

  const rawEntries = [];
  if (Array.isArray(object.urls)) {
    for (const entry of object.urls) {
      if (typeof entry === 'string') rawEntries.push({ url: entry });
      else if (asObject(entry) && typeof entry.url === 'string')
        rawEntries.push(entry);
      else fail('CONFIG_INVALID');
    }
  } else if (typeof object.url === 'string') {
    rawEntries.push({ url: object.url });
  } else {
    fail('CONFIG_INVALID');
  }
  if (rawEntries.length === 0) fail('CONFIG_EMPTY');
  if (rawEntries.length > DEFAULT_MAX_DOCUMENTS) fail('CONFIG_INVALID');

  const base = configUrl ? new URL(configUrl) : undefined;
  const origin = sourceOrigin ?? base?.origin;
  if (!origin) fail('CONFIG_INVALID');
  const resolved = rawEntries.map((entry, index) => {
    let url;
    try {
      url = parseSafeUrl(new URL(entry.url, base).href);
    } catch (error) {
      if (error instanceof OpenApiContractError) throw error;
      fail('SOURCE_URL_INVALID');
    }
    assertSameOrigin(url, origin);
    return {
      group:
        normalizeLabel(entry.name, groupFromUrl(url)) ?? `group-${index + 1}`,
      url: url.href,
    };
  });

  resolved.sort((left, right) =>
    compareCodeUnits(
      [left.group, left.url].join('\u0000'),
      [right.group, right.url].join('\u0000'),
    ),
  );
  const seenGroups = new Map();
  return resolved.map(entry => {
    const count = (seenGroups.get(entry.group) ?? 0) + 1;
    seenGroups.set(entry.group, count);
    return count === 1 ? entry : { ...entry, group: `${entry.group}-${count}` };
  });
}

function isWithinDirectory(directory, candidate) {
  const relativePath = relative(directory, candidate);
  return (
    relativePath === '' ||
    (relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  );
}

function assertNoSymbolicLinkComponents(root, candidate) {
  let current = root;
  const segments = relative(root, candidate).split(sep).filter(Boolean);
  for (const segment of [undefined, ...segments]) {
    if (segment !== undefined) current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) fail('LOCAL_PATH_INVALID');
    } catch (error) {
      if (error instanceof OpenApiContractError) throw error;
      if (error?.code === 'ENOENT') return;
      fail('LOCAL_PATH_INVALID');
    }
  }
}

function resolvePaths(options = {}) {
  const root = resolve(options.repoRoot ?? REPO_ROOT);
  const localRoot = join(root, '.agent-local');
  const sourcesRoot = join(localRoot, 'sources');
  const cacheRoot = join(localRoot, 'openapi-cache');
  const sourcePath = options.sourcePath
    ? isAbsolute(options.sourcePath)
      ? options.sourcePath
      : resolve(root, options.sourcePath)
    : join(sourcesRoot, 'openapi-source.json');
  const cacheDir = options.cacheDir
    ? isAbsolute(options.cacheDir)
      ? options.cacheDir
      : resolve(root, options.cacheDir)
    : cacheRoot;
  if (
    !isWithinDirectory(sourcesRoot, sourcePath) ||
    !isWithinDirectory(cacheRoot, cacheDir)
  ) {
    fail('LOCAL_PATH_INVALID');
  }
  assertNoSymbolicLinkComponents(root, sourcePath);
  assertNoSymbolicLinkComponents(root, cacheDir);
  return { root, sourcePath, cacheDir };
}

function readJsonFile(path, code) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    fail(code);
  }
  try {
    return JSON.parse(text);
  } catch {
    fail(code === 'SOURCE_NOT_FOUND' ? 'SOURCE_INVALID_JSON' : 'CACHE_INVALID');
  }
}

export function loadSource({ sourcePath, repoRoot = REPO_ROOT } = {}) {
  const { sourcePath: resolved } = resolvePaths({ repoRoot, sourcePath });
  return validateSource(readJsonFile(resolved, 'SOURCE_NOT_FOUND'));
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    fail('INVALID_JSON');
  }
}

async function readResponseText(response, maxResponseBytes) {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxResponseBytes) fail('RESPONSE_TOO_LARGE');
    return new TextDecoder().decode(bytes);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxResponseBytes) {
        await reader.cancel();
        fail('RESPONSE_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(
    Buffer.concat(chunks.map(chunk => Buffer.from(chunk))),
  );
}

function httpErrorCode(status) {
  if (status === 401) return 'HTTP_401';
  if (status === 403) return 'HTTP_403';
  if (status === 404) return 'HTTP_404';
  return 'HTTP_ERROR';
}

async function fetchJson(
  url,
  {
    sourceOrigin,
    auth,
    env = process.env,
    fetchImpl = globalThis.fetch,
    timeoutMs,
    maxResponseBytes,
    maxRedirects,
  },
) {
  if (typeof fetchImpl !== 'function') fail('NETWORK_UNAVAILABLE');
  let current = parseSafeUrl(url);
  assertSameOrigin(current, sourceOrigin);
  const token = auth.kind === 'bearer-env' ? env[auth.envName] : undefined;
  if (auth.kind === 'bearer-env' && !token) fail('AUTH_ENV_MISSING');

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = new Headers({ accept: 'application/json' });
      if (token) headers.set('authorization', `Bearer ${token}`);
      const response = await fetchImpl(current, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        if (redirect === maxRedirects) fail('REDIRECT_LIMIT');
        const location = response.headers.get('location');
        if (!location) fail('REDIRECT_INVALID');
        let next;
        try {
          next = parseSafeUrl(new URL(location, current).href);
        } catch (error) {
          if (error instanceof OpenApiContractError) throw error;
          fail('REDIRECT_INVALID');
        }
        assertSameOrigin(next, sourceOrigin, 'CROSS_ORIGIN_REDIRECT');
        current = next;
        continue;
      }
      if (!response.ok) fail(httpErrorCode(response.status));

      const contentType = response.headers
        .get('content-type')
        ?.split(';', 1)[0]
        .trim()
        .toLowerCase();
      if (
        contentType &&
        contentType !== 'application/json' &&
        !contentType.endsWith('+json') &&
        contentType !== 'text/json'
      ) {
        fail('NON_JSON_CONTENT');
      }
      // Keep the same abort deadline alive while consuming the untrusted body.
      const text = await readResponseText(response, maxResponseBytes);
      if (!text.trim().startsWith('{')) fail('NON_JSON_CONTENT');
      return { value: parseJsonText(text), text };
    } catch (error) {
      if (error instanceof OpenApiContractError) throw error;
      if (error?.name === 'AbortError') fail('REQUEST_TIMEOUT');
      fail('NETWORK_UNAVAILABLE');
    } finally {
      clearTimeout(timer);
    }
  }
  fail('REDIRECT_LIMIT');
}

function sanitizedFailureCode(error) {
  if (error instanceof OpenApiContractError && /^[A-Z0-9_]+$/.test(error.code))
    return error.code;
  return 'INTERNAL_ERROR';
}

function nowDate(now) {
  const value = typeof now === 'function' ? now() : now;
  const date = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function iso(date) {
  return date.toISOString();
}

function readCurrentCache(cacheDir) {
  const path = join(cacheDir, 'current.json');
  if (!existsSync(path)) return null;
  try {
    assertNoSymbolicLinkComponents(cacheDir, path);
    const current = readJsonFile(path, 'CACHE_INVALID');
    if (
      !asObject(current) ||
      current.schemaVersion !== CACHE_SCHEMA_VERSION ||
      !asObject(current.latest) ||
      !asObject(current.metadata)
    ) {
      return null;
    }
    return current;
  } catch {
    return null;
  }
}

function readCacheMetadata(cacheDir) {
  const current = readCurrentCache(cacheDir);
  if (current) return current.metadata;
  const path = join(cacheDir, 'metadata.json');
  if (!existsSync(path)) return null;
  try {
    assertNoSymbolicLinkComponents(cacheDir, path);
    return readJsonFile(path, 'CACHE_INVALID');
  } catch {
    return null;
  }
}

function readLatest(cacheDir) {
  try {
    const current = readCurrentCache(cacheDir);
    const path = join(cacheDir, 'latest.json');
    if (!current && !existsSync(path)) return null;
    if (!current) assertNoSymbolicLinkComponents(cacheDir, path);
    const latest = current?.latest ?? readJsonFile(path, 'CACHE_INVALID');
    if (
      !asObject(latest) ||
      latest.schemaVersion !== CACHE_SCHEMA_VERSION ||
      !Array.isArray(latest.documents) ||
      !Array.isArray(latest.operations) ||
      typeof latest.normalizedHash !== 'string'
    ) {
      return null;
    }
    return latest;
  } catch {
    return null;
  }
}

function atomicWrite(path, contents, cacheDir) {
  if (!isWithinDirectory(cacheDir, path)) fail('LOCAL_PATH_INVALID');
  const parent = dirname(path);
  assertNoSymbolicLinkComponents(cacheDir, parent);
  mkdirSync(parent, { recursive: true });
  assertNoSymbolicLinkComponents(cacheDir, parent);
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, contents, { encoding: 'utf8', mode: 0o600 });
    renameSync(temporaryPath, path);
  } catch (error) {
    try {
      // A failed temporary write must not affect the last valid cache.
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    } catch {
      // Ignore cleanup failures; the temporary file is inside the cache dir.
    }
    throw error;
  }
}

function atomicWriteJson(path, value, cacheDir) {
  atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`, cacheDir);
}

function readRefreshLock(lockPath) {
  try {
    const value = JSON.parse(readFileSync(lockPath, 'utf8'));
    return asObject(value);
  } catch {
    return null;
  }
}

function acquireRefreshLock(root, cacheDir, now) {
  assertNoSymbolicLinkComponents(root, cacheDir);
  mkdirSync(cacheDir, { recursive: true });
  assertNoSymbolicLinkComponents(root, cacheDir);
  const lockPath = join(cacheDir, '.refresh.lock');
  const token = randomUUID();
  const owner = {
    pid: process.pid,
    token,
    startedAt: iso(now),
  };

  try {
    writeFileSync(lockPath, `${JSON.stringify(owner)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  } catch (error) {
    if (error?.code === 'EEXIST') fail('REFRESH_IN_PROGRESS');
    throw error;
  }
  return () => {
    try {
      if (readRefreshLock(lockPath)?.token === token) unlinkSync(lockPath);
    } catch {
      // A replaced or already removed lock belongs to no work in this run.
    }
  };
}

function commitCurrentCache(cacheDir, latest, metadata) {
  // One atomic pointer prevents a new index from being paired with metadata
  // from another refresh generation. Standalone files are compatibility mirrors.
  atomicWriteJson(
    join(cacheDir, 'current.json'),
    {
      schemaVersion: CACHE_SCHEMA_VERSION,
      latest,
      metadata,
    },
    cacheDir,
  );
  try {
    atomicWriteJson(join(cacheDir, 'latest.json'), latest, cacheDir);
    atomicWriteJson(join(cacheDir, 'metadata.json'), metadata, cacheDir);
  } catch {
    // current.json remains a complete, authoritative generation.
  }
}

function validSha(value) {
  return typeof value === 'string' && SAFE_SHA.test(value)
    ? value.toLowerCase()
    : undefined;
}

function deploymentEvidence(
  source,
  { repoRoot, execFileSyncImpl = nodeExecFileSync } = {},
) {
  const repository = source.serverRepository;
  if (!repository) return undefined;
  const repo = `${repository.owner}/${repository.name}`;
  const baseOptions = {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 8_000,
    stdio: ['ignore', 'pipe', 'ignore'],
  };
  let run;
  try {
    const output = execFileSyncImpl(
      'gh',
      [
        'run',
        'list',
        '--repo',
        repo,
        '--workflow',
        repository.deployWorkflow,
        '--branch',
        repository.branch,
        '--status',
        'success',
        '--limit',
        '1',
        '--json',
        'databaseId,headSha,status,conclusion',
      ],
      baseOptions,
    );
    const parsed = JSON.parse(String(output));
    if (Array.isArray(parsed) && parsed.length > 0 && asObject(parsed[0]))
      run = parsed[0];
  } catch {
    return {
      state: 'unavailable',
      repository: repo,
      branch: repository.branch,
      workflow: repository.deployWorkflow,
    };
  }

  let branchHeadSha;
  try {
    const ref = `repos/${repo}/commits/${encodeURIComponent(repository.branch)}`;
    const output = execFileSyncImpl(
      'gh',
      ['api', ref, '--jq', '.sha'],
      baseOptions,
    );
    branchHeadSha = validSha(String(output).trim());
  } catch {
    // A successful workflow is still useful evidence even if the branch lookup
    // is temporarily unavailable.
  }

  const workflowSha = validSha(run?.headSha);
  const runId =
    run?.databaseId === undefined ? undefined : String(run.databaseId);
  const state =
    workflowSha && branchHeadSha
      ? workflowSha === branchHeadSha
        ? 'aligned'
        : 'mismatch'
      : workflowSha
        ? 'run-found'
        : branchHeadSha
          ? 'branch-found'
          : 'not-found';
  return {
    state,
    repository: repo,
    branch: repository.branch,
    workflow: repository.deployWorkflow,
    ...(workflowSha ? { workflowRunSha: workflowSha } : {}),
    ...(branchHeadSha ? { branchHeadSha } : {}),
    ...(runId && /^[0-9]+$/.test(runId)
      ? {
          runId,
          runUrl: `https://github.com/${repository.owner}/${repository.name}/actions/runs/${runId}`,
        }
      : {}),
  };
}

function baseFailureMetadata({
  existingMetadata,
  existingLatest,
  source,
  checkedAt,
  state,
  failureCode,
}) {
  const metadata = {
    schemaVersion: CACHE_SCHEMA_VERSION,
    state,
    ...(source?.sourceId
      ? { sourceId: source.sourceId }
      : existingMetadata?.sourceId
        ? { sourceId: existingMetadata.sourceId }
        : {}),
    targetEnvironment:
      source?.targetEnvironment ??
      existingMetadata?.targetEnvironment ??
      'unknown',
    checkedAt: iso(checkedAt),
    ...(existingMetadata?.fetchedAt
      ? { fetchedAt: existingMetadata.fetchedAt }
      : {}),
    ...(existingMetadata?.freshUntil
      ? { freshUntil: existingMetadata.freshUntil }
      : {}),
    documentHashes: Array.isArray(existingMetadata?.documentHashes)
      ? existingMetadata.documentHashes.filter(validSha)
      : [],
    documentCount: Number.isInteger(existingMetadata?.documentCount)
      ? existingMetadata.documentCount
      : (existingLatest?.documents.length ?? 0),
    operationCount: Number.isInteger(existingMetadata?.operationCount)
      ? existingMetadata.operationCount
      : (existingLatest?.operations.length ?? 0),
    ...(validSha(existingMetadata?.normalizedHash)
      ? { normalizedHash: existingMetadata.normalizedHash }
      : existingLatest?.normalizedHash
        ? { normalizedHash: existingLatest.normalizedHash }
        : {}),
    ...(validSha(existingMetadata?.previousNormalizedHash)
      ? { previousNormalizedHash: existingMetadata.previousNormalizedHash }
      : {}),
    failureCode,
  };
  if (asObject(existingMetadata?.deploymentEvidence)) {
    metadata.deploymentEvidence = existingMetadata.deploymentEvidence;
  }
  return metadata;
}

function failureState(existingLatest, error) {
  if (existingLatest) return 'stale';
  const unavailable = new Set([
    'AUTH_ENV_MISSING',
    'HTTP_401',
    'HTTP_403',
    'HTTP_404',
    'HTTP_ERROR',
    'NETWORK_UNAVAILABLE',
    'REQUEST_TIMEOUT',
    'REDIRECT_INVALID',
    'REDIRECT_LIMIT',
    'CROSS_ORIGIN_REDIRECT',
    'REFRESH_IN_PROGRESS',
  ]);
  return unavailable.has(sanitizedFailureCode(error))
    ? 'unavailable'
    : 'invalid';
}

/** Fetch, validate, normalize, and atomically cache all configured documents. */
export async function refreshOpenApi(options = {}) {
  const checkedAt = nowDate(options.now);
  let paths;
  try {
    paths = resolvePaths(options);
  } catch (error) {
    const contractError =
      error instanceof OpenApiContractError
        ? error
        : new OpenApiContractError('INTERNAL_ERROR');
    const metadata = baseFailureMetadata({
      existingMetadata: null,
      existingLatest: null,
      source: undefined,
      checkedAt,
      state: 'invalid',
      failureCode: sanitizedFailureCode(contractError),
    });
    return {
      state: metadata.state,
      metadata,
      error: contractError,
      preserved: false,
    };
  }

  let releaseRefreshLock;
  try {
    releaseRefreshLock = acquireRefreshLock(
      paths.root,
      paths.cacheDir,
      checkedAt,
    );
  } catch (error) {
    const contractError =
      error instanceof OpenApiContractError
        ? error
        : new OpenApiContractError('INTERNAL_ERROR');
    const existingMetadata = readCacheMetadata(paths.cacheDir);
    const existingLatest = readLatest(paths.cacheDir);
    const metadata = baseFailureMetadata({
      existingMetadata,
      existingLatest,
      source: undefined,
      checkedAt,
      state: 'unavailable',
      failureCode: sanitizedFailureCode(contractError),
    });
    return {
      state: metadata.state,
      metadata,
      error: contractError,
      preserved: Boolean(existingLatest),
    };
  }

  try {
    const existingMetadata = readCacheMetadata(paths.cacheDir);
    const existingLatest = readLatest(paths.cacheDir);
    let source;
    try {
      source = loadSource({
        sourcePath: paths.sourcePath,
        repoRoot: paths.root,
      });
      const sourceUrl = new URL(source.swaggerUiUrl);
      const configUrl = source.swaggerConfigUrl
        ? new URL(source.swaggerConfigUrl)
        : new URL('/v3/api-docs/swagger-config', sourceUrl.origin);
      const requestOptions = {
        sourceOrigin: sourceUrl.origin,
        auth: source.auth,
        env: options.env,
        fetchImpl: options.fetchImpl,
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxResponseBytes:
          options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
        maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
      };
      const configResponse = await fetchJson(configUrl.href, requestOptions);
      const entries = discoverDocumentEntries(configResponse.value, {
        configUrl: configUrl.href,
        sourceOrigin: sourceUrl.origin,
      });
      const fetchedDocuments = [];
      // The discovery document contains source URLs rather than the API contract.
      // Do not persist it; only validated OpenAPI documents belong in raw history.
      const rawDocuments = [];
      for (const entry of entries) {
        const response = await fetchJson(entry.url, requestOptions);
        const document = validateOpenApiDocument(response.value);
        const hash = sha256(response.text);
        fetchedDocuments.push({
          group: entry.group,
          document,
          documentHash: hash,
        });
        rawDocuments.push({ text: response.text, hash });
      }
      const normalized = normalizeOpenApiDocuments(fetchedDocuments);
      const fetchedAt = checkedAt;
      const freshUntil = new Date(
        fetchedAt.getTime() + source.freshness.maxAgeSeconds * 1000,
      );
      const latest = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sourceId: source.sourceId,
        targetEnvironment: source.targetEnvironment,
        fetchedAt: iso(fetchedAt),
        documents: normalized.documents,
        operations: normalized.operations,
        normalizedHash: normalized.normalizedHash,
      };
      const normalizedSnapshot = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sourceId: source.sourceId,
        targetEnvironment: source.targetEnvironment,
        documents: normalized.documents.map(
          ({ group, contractHash, dialect, infoVersion, operationCount }) => ({
            group,
            contractHash,
            dialect,
            ...(infoVersion ? { infoVersion } : {}),
            operationCount,
          }),
        ),
        operations: normalized.operations,
        normalizedHash: normalized.normalizedHash,
      };
      const metadata = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        state: 'fresh',
        sourceId: source.sourceId,
        targetEnvironment: source.targetEnvironment,
        checkedAt: iso(checkedAt),
        fetchedAt: iso(fetchedAt),
        freshUntil: iso(freshUntil),
        documentHashes: fetchedDocuments
          .map(entry => entry.documentHash)
          .sort(compareCodeUnits),
        documentCount: fetchedDocuments.length,
        operationCount: normalized.operations.length,
        normalizedHash: normalized.normalizedHash,
        ...(existingLatest?.normalizedHash &&
        existingLatest.normalizedHash !== normalized.normalizedHash
          ? { previousNormalizedHash: existingLatest.normalizedHash }
          : existingMetadata?.previousNormalizedHash
            ? {
                previousNormalizedHash: existingMetadata.previousNormalizedHash,
              }
            : {}),
      };
      const evidence = deploymentEvidence(source, {
        repoRoot: paths.root,
        execFileSyncImpl: options.execFileSyncImpl,
      });
      if (evidence) metadata.deploymentEvidence = evidence;

      for (const raw of rawDocuments) {
        const rawPath = join(paths.cacheDir, 'raw', `${raw.hash}.json`);
        if (!existsSync(rawPath)) {
          atomicWrite(rawPath, raw.text, paths.cacheDir);
        }
      }
      const normalizedPath = join(
        paths.cacheDir,
        'normalized',
        `${normalized.normalizedHash}.json`,
      );
      if (!existsSync(normalizedPath)) {
        atomicWriteJson(normalizedPath, normalizedSnapshot, paths.cacheDir);
      }
      commitCurrentCache(paths.cacheDir, latest, metadata);
      return { state: 'fresh', metadata, latest };
    } catch (error) {
      const contractError =
        error instanceof OpenApiContractError
          ? error
          : new OpenApiContractError('INTERNAL_ERROR');
      const metadata = baseFailureMetadata({
        existingMetadata,
        existingLatest,
        source,
        checkedAt,
        state: failureState(existingLatest, contractError),
        failureCode: sanitizedFailureCode(contractError),
      });
      try {
        if (existingLatest) {
          commitCurrentCache(paths.cacheDir, existingLatest, metadata);
        } else {
          atomicWriteJson(
            join(paths.cacheDir, 'metadata.json'),
            metadata,
            paths.cacheDir,
          );
        }
      } catch {
        // Preserve the original, sanitized failure for the caller.
      }
      return {
        state: metadata.state,
        metadata,
        error: contractError,
        preserved: Boolean(existingLatest),
      };
    }
  } finally {
    releaseRefreshLock();
  }
}

function sanitizeMetadata(metadata, { now = new Date() } = {}) {
  if (!asObject(metadata)) return { state: 'unavailable' };
  const state = ['fresh', 'stale', 'invalid', 'unavailable'].includes(
    metadata.state,
  )
    ? metadata.state
    : 'invalid';
  let effectiveState = state;
  const freshUntilTime = Date.parse(metadata.freshUntil ?? '');
  if (
    effectiveState === 'fresh' &&
    (!Number.isFinite(freshUntilTime) || freshUntilTime <= now.getTime())
  ) {
    effectiveState = 'stale';
  }
  const result = {
    state: effectiveState,
    ...(typeof metadata.sourceId === 'string' && SAFE_ID.test(metadata.sourceId)
      ? { sourceId: metadata.sourceId }
      : {}),
    ...(typeof metadata.targetEnvironment === 'string'
      ? { targetEnvironment: metadata.targetEnvironment.slice(0, 128) }
      : {}),
    ...(typeof metadata.checkedAt === 'string'
      ? { checkedAt: metadata.checkedAt }
      : {}),
    ...(typeof metadata.fetchedAt === 'string'
      ? { fetchedAt: metadata.fetchedAt }
      : {}),
    ...(typeof metadata.freshUntil === 'string'
      ? { freshUntil: metadata.freshUntil }
      : {}),
    ...(Array.isArray(metadata.documentHashes)
      ? { documentHashes: metadata.documentHashes.filter(validSha) }
      : {}),
    ...(Number.isInteger(metadata.documentCount)
      ? { documentCount: metadata.documentCount }
      : {}),
    ...(Number.isInteger(metadata.operationCount)
      ? { operationCount: metadata.operationCount }
      : {}),
    ...(validSha(metadata.normalizedHash)
      ? { normalizedHash: metadata.normalizedHash }
      : {}),
    ...(validSha(metadata.previousNormalizedHash)
      ? { previousNormalizedHash: metadata.previousNormalizedHash }
      : {}),
    ...(typeof metadata.failureCode === 'string' &&
    /^[A-Z0-9_]+$/.test(metadata.failureCode)
      ? { failureCode: metadata.failureCode }
      : {}),
  };
  if (asObject(metadata.deploymentEvidence)) {
    const evidence = metadata.deploymentEvidence;
    result.deploymentEvidence = {
      ...(typeof evidence.state === 'string'
        ? { state: evidence.state.slice(0, 32) }
        : {}),
      ...(validSha(evidence.workflowRunSha)
        ? { workflowRunSha: evidence.workflowRunSha }
        : {}),
      ...(validSha(evidence.branchHeadSha)
        ? { branchHeadSha: evidence.branchHeadSha }
        : {}),
      ...(typeof evidence.runId === 'string' && /^[0-9]+$/.test(evidence.runId)
        ? { runId: evidence.runId }
        : {}),
    };
  }
  return result;
}

/** Read cache metadata and derive freshness without exposing source details. */
export function getCacheStatus(options = {}) {
  const paths = resolvePaths(options);
  const metadata = readCacheMetadata(paths.cacheDir);
  const summary = sanitizeMetadata(metadata, { now: nowDate(options.now) });
  if (metadata && summary.state !== metadata.state) {
    try {
      const nextMetadata = { ...metadata, state: summary.state };
      const latest = readLatest(paths.cacheDir);
      if (latest) commitCurrentCache(paths.cacheDir, latest, nextMetadata);
      else {
        atomicWriteJson(
          join(paths.cacheDir, 'metadata.json'),
          nextMetadata,
          paths.cacheDir,
        );
      }
    } catch {
      // Status remains useful even if the freshness marker cannot be persisted.
    }
  }
  return summary;
}

function parseCli(argv) {
  const args = [...argv];
  const command = args.shift() ?? 'status';
  if (!['status', 'refresh', 'self-test'].includes(command)) {
    throw new OpenApiContractError('SOURCE_INVALID');
  }
  let sourcePath;
  while (args.length > 0) {
    const argument = args.shift();
    if (argument !== '--source' || !args[0])
      throw new OpenApiContractError('SOURCE_INVALID');
    sourcePath = args.shift();
  }
  return { command, sourcePath };
}

export async function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseCli(argv);
  } catch {
    console.error(
      'Usage: node .agent/scripts/openapi-contract.mjs <status|refresh|self-test> [--source <path>]',
    );
    return 2;
  }
  if (parsed.command === 'self-test') {
    console.log('Run: node --test .agent/scripts/openapi-contract.test.mjs');
    return 0;
  }
  const options = parsed.sourcePath ? { sourcePath: parsed.sourcePath } : {};
  if (parsed.command === 'status') {
    const status = getCacheStatus(options);
    console.log(JSON.stringify(status));
    return status.state === 'fresh' ? 0 : 1;
  }
  const result = await refreshOpenApi(options);
  if (result.error) {
    console.error(
      `OpenAPI refresh failed: ${sanitizedFailureCode(result.error)}. Previous cache preserved: ${result.preserved ? 'yes' : 'no'}.`,
    );
    return 1;
  }
  console.log(
    `OpenAPI refresh complete: state=${result.metadata.state}, documents=${result.metadata.documentCount}, operations=${result.metadata.operationCount}.`,
  );
  return 0;
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main()
    .then(code => {
      if (code) process.exitCode = code;
    })
    .catch(() => {
      console.error('OpenAPI contract helper failed: INTERNAL_ERROR.');
      process.exitCode = 1;
    });
}
