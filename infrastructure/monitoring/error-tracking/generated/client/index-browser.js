
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.ErrorScalarFieldEnum = {
  id: 'id',
  fingerprint: 'fingerprint',
  message: 'message',
  category: 'category',
  severity: 'severity',
  errorType: 'errorType',
  stack: 'stack',
  context: 'context',
  service: 'service',
  version: 'version',
  environment: 'environment',
  timestamp: 'timestamp',
  traceId: 'traceId',
  spanId: 'spanId',
  parentSpanId: 'parentSpanId',
  metadata: 'metadata',
  userId: 'userId',
  sessionId: 'sessionId',
  requestId: 'requestId',
  userAgent: 'userAgent',
  ipAddress: 'ipAddress',
  endpoint: 'endpoint',
  method: 'method',
  statusCode: 'statusCode',
  responseTime: 'responseTime',
  memoryUsage: 'memoryUsage',
  customData: 'customData',
  count: 'count',
  firstSeen: 'firstSeen',
  lastSeen: 'lastSeen',
  resolved: 'resolved',
  resolvedAt: 'resolvedAt',
  resolvedBy: 'resolvedBy',
  resolution: 'resolution',
  tags: 'tags',
  affectedUsers: 'affectedUsers',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ErrorCorrelationScalarFieldEnum = {
  id: 'id',
  errorId: 'errorId',
  relatedErrorId: 'relatedErrorId',
  correlationType: 'correlationType',
  confidence: 'confidence',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecoveryExecutionScalarFieldEnum = {
  id: 'id',
  errorId: 'errorId',
  strategy: 'strategy',
  action: 'action',
  status: 'status',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  nextRetryAt: 'nextRetryAt',
  result: 'result',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ErrorPatternScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  pattern: 'pattern',
  category: 'category',
  severity: 'severity',
  tags: 'tags',
  recoveryActions: 'recoveryActions',
  matchCount: 'matchCount',
  lastMatched: 'lastMatched',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ErrorAggregationScalarFieldEnum = {
  id: 'id',
  fingerprint: 'fingerprint',
  timeWindow: 'timeWindow',
  count: 'count',
  errorCount: 'errorCount',
  affectedUsers: 'affectedUsers',
  avgResponseTime: 'avgResponseTime',
  firstSeen: 'firstSeen',
  lastSeen: 'lastSeen',
  trend: 'trend',
  hourlyDistribution: 'hourlyDistribution',
  topAffectedEndpoints: 'topAffectedEndpoints',
  topAffectedUsers: 'topAffectedUsers',
  byService: 'byService',
  bySeverity: 'bySeverity',
  byEndpoint: 'byEndpoint',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertConfigurationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  condition: 'condition',
  threshold: 'threshold',
  timeWindow: 'timeWindow',
  severity: 'severity',
  services: 'services',
  categories: 'categories',
  actions: 'actions',
  isActive: 'isActive',
  lastTriggered: 'lastTriggered',
  triggerCount: 'triggerCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertHistoryScalarFieldEnum = {
  id: 'id',
  configId: 'configId',
  triggeredAt: 'triggeredAt',
  resolvedAt: 'resolvedAt',
  alertType: 'alertType',
  severity: 'severity',
  message: 'message',
  details: 'details',
  actionsTaken: 'actionsTaken',
  acknowledged: 'acknowledged',
  acknowledgedBy: 'acknowledgedBy',
  acknowledgedAt: 'acknowledgedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Error: 'Error',
  ErrorCorrelation: 'ErrorCorrelation',
  RecoveryExecution: 'RecoveryExecution',
  ErrorPattern: 'ErrorPattern',
  ErrorAggregation: 'ErrorAggregation',
  AlertConfiguration: 'AlertConfiguration',
  AlertHistory: 'AlertHistory'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
