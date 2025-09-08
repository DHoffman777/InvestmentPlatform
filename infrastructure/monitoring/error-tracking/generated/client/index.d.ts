
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Error
 * 
 */
export type Error = $Result.DefaultSelection<Prisma.$ErrorPayload>
/**
 * Model ErrorCorrelation
 * 
 */
export type ErrorCorrelation = $Result.DefaultSelection<Prisma.$ErrorCorrelationPayload>
/**
 * Model RecoveryExecution
 * 
 */
export type RecoveryExecution = $Result.DefaultSelection<Prisma.$RecoveryExecutionPayload>
/**
 * Model ErrorPattern
 * 
 */
export type ErrorPattern = $Result.DefaultSelection<Prisma.$ErrorPatternPayload>
/**
 * Model ErrorAggregation
 * 
 */
export type ErrorAggregation = $Result.DefaultSelection<Prisma.$ErrorAggregationPayload>
/**
 * Model AlertConfiguration
 * 
 */
export type AlertConfiguration = $Result.DefaultSelection<Prisma.$AlertConfigurationPayload>
/**
 * Model AlertHistory
 * 
 */
export type AlertHistory = $Result.DefaultSelection<Prisma.$AlertHistoryPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Errors
 * const errors = await prisma.error.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Errors
   * const errors = await prisma.error.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.error`: Exposes CRUD operations for the **Error** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Errors
    * const errors = await prisma.error.findMany()
    * ```
    */
  get error(): Prisma.ErrorDelegate<ExtArgs>;

  /**
   * `prisma.errorCorrelation`: Exposes CRUD operations for the **ErrorCorrelation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ErrorCorrelations
    * const errorCorrelations = await prisma.errorCorrelation.findMany()
    * ```
    */
  get errorCorrelation(): Prisma.ErrorCorrelationDelegate<ExtArgs>;

  /**
   * `prisma.recoveryExecution`: Exposes CRUD operations for the **RecoveryExecution** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RecoveryExecutions
    * const recoveryExecutions = await prisma.recoveryExecution.findMany()
    * ```
    */
  get recoveryExecution(): Prisma.RecoveryExecutionDelegate<ExtArgs>;

  /**
   * `prisma.errorPattern`: Exposes CRUD operations for the **ErrorPattern** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ErrorPatterns
    * const errorPatterns = await prisma.errorPattern.findMany()
    * ```
    */
  get errorPattern(): Prisma.ErrorPatternDelegate<ExtArgs>;

  /**
   * `prisma.errorAggregation`: Exposes CRUD operations for the **ErrorAggregation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ErrorAggregations
    * const errorAggregations = await prisma.errorAggregation.findMany()
    * ```
    */
  get errorAggregation(): Prisma.ErrorAggregationDelegate<ExtArgs>;

  /**
   * `prisma.alertConfiguration`: Exposes CRUD operations for the **AlertConfiguration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AlertConfigurations
    * const alertConfigurations = await prisma.alertConfiguration.findMany()
    * ```
    */
  get alertConfiguration(): Prisma.AlertConfigurationDelegate<ExtArgs>;

  /**
   * `prisma.alertHistory`: Exposes CRUD operations for the **AlertHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AlertHistories
    * const alertHistories = await prisma.alertHistory.findMany()
    * ```
    */
  get alertHistory(): Prisma.AlertHistoryDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Error: 'Error',
    ErrorCorrelation: 'ErrorCorrelation',
    RecoveryExecution: 'RecoveryExecution',
    ErrorPattern: 'ErrorPattern',
    ErrorAggregation: 'ErrorAggregation',
    AlertConfiguration: 'AlertConfiguration',
    AlertHistory: 'AlertHistory'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "error" | "errorCorrelation" | "recoveryExecution" | "errorPattern" | "errorAggregation" | "alertConfiguration" | "alertHistory"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Error: {
        payload: Prisma.$ErrorPayload<ExtArgs>
        fields: Prisma.ErrorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ErrorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ErrorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          findFirst: {
            args: Prisma.ErrorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ErrorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          findMany: {
            args: Prisma.ErrorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>[]
          }
          create: {
            args: Prisma.ErrorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          createMany: {
            args: Prisma.ErrorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ErrorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>[]
          }
          delete: {
            args: Prisma.ErrorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          update: {
            args: Prisma.ErrorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          deleteMany: {
            args: Prisma.ErrorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ErrorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ErrorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPayload>
          }
          aggregate: {
            args: Prisma.ErrorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateError>
          }
          groupBy: {
            args: Prisma.ErrorGroupByArgs<ExtArgs>
            result: $Utils.Optional<ErrorGroupByOutputType>[]
          }
          count: {
            args: Prisma.ErrorCountArgs<ExtArgs>
            result: $Utils.Optional<ErrorCountAggregateOutputType> | number
          }
        }
      }
      ErrorCorrelation: {
        payload: Prisma.$ErrorCorrelationPayload<ExtArgs>
        fields: Prisma.ErrorCorrelationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ErrorCorrelationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ErrorCorrelationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          findFirst: {
            args: Prisma.ErrorCorrelationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ErrorCorrelationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          findMany: {
            args: Prisma.ErrorCorrelationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>[]
          }
          create: {
            args: Prisma.ErrorCorrelationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          createMany: {
            args: Prisma.ErrorCorrelationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ErrorCorrelationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>[]
          }
          delete: {
            args: Prisma.ErrorCorrelationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          update: {
            args: Prisma.ErrorCorrelationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          deleteMany: {
            args: Prisma.ErrorCorrelationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ErrorCorrelationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ErrorCorrelationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorCorrelationPayload>
          }
          aggregate: {
            args: Prisma.ErrorCorrelationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateErrorCorrelation>
          }
          groupBy: {
            args: Prisma.ErrorCorrelationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ErrorCorrelationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ErrorCorrelationCountArgs<ExtArgs>
            result: $Utils.Optional<ErrorCorrelationCountAggregateOutputType> | number
          }
        }
      }
      RecoveryExecution: {
        payload: Prisma.$RecoveryExecutionPayload<ExtArgs>
        fields: Prisma.RecoveryExecutionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecoveryExecutionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecoveryExecutionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          findFirst: {
            args: Prisma.RecoveryExecutionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecoveryExecutionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          findMany: {
            args: Prisma.RecoveryExecutionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>[]
          }
          create: {
            args: Prisma.RecoveryExecutionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          createMany: {
            args: Prisma.RecoveryExecutionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecoveryExecutionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>[]
          }
          delete: {
            args: Prisma.RecoveryExecutionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          update: {
            args: Prisma.RecoveryExecutionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          deleteMany: {
            args: Prisma.RecoveryExecutionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecoveryExecutionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RecoveryExecutionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecoveryExecutionPayload>
          }
          aggregate: {
            args: Prisma.RecoveryExecutionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecoveryExecution>
          }
          groupBy: {
            args: Prisma.RecoveryExecutionGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecoveryExecutionGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecoveryExecutionCountArgs<ExtArgs>
            result: $Utils.Optional<RecoveryExecutionCountAggregateOutputType> | number
          }
        }
      }
      ErrorPattern: {
        payload: Prisma.$ErrorPatternPayload<ExtArgs>
        fields: Prisma.ErrorPatternFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ErrorPatternFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ErrorPatternFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          findFirst: {
            args: Prisma.ErrorPatternFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ErrorPatternFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          findMany: {
            args: Prisma.ErrorPatternFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>[]
          }
          create: {
            args: Prisma.ErrorPatternCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          createMany: {
            args: Prisma.ErrorPatternCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ErrorPatternCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>[]
          }
          delete: {
            args: Prisma.ErrorPatternDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          update: {
            args: Prisma.ErrorPatternUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          deleteMany: {
            args: Prisma.ErrorPatternDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ErrorPatternUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ErrorPatternUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorPatternPayload>
          }
          aggregate: {
            args: Prisma.ErrorPatternAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateErrorPattern>
          }
          groupBy: {
            args: Prisma.ErrorPatternGroupByArgs<ExtArgs>
            result: $Utils.Optional<ErrorPatternGroupByOutputType>[]
          }
          count: {
            args: Prisma.ErrorPatternCountArgs<ExtArgs>
            result: $Utils.Optional<ErrorPatternCountAggregateOutputType> | number
          }
        }
      }
      ErrorAggregation: {
        payload: Prisma.$ErrorAggregationPayload<ExtArgs>
        fields: Prisma.ErrorAggregationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ErrorAggregationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ErrorAggregationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          findFirst: {
            args: Prisma.ErrorAggregationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ErrorAggregationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          findMany: {
            args: Prisma.ErrorAggregationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>[]
          }
          create: {
            args: Prisma.ErrorAggregationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          createMany: {
            args: Prisma.ErrorAggregationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ErrorAggregationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>[]
          }
          delete: {
            args: Prisma.ErrorAggregationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          update: {
            args: Prisma.ErrorAggregationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          deleteMany: {
            args: Prisma.ErrorAggregationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ErrorAggregationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ErrorAggregationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ErrorAggregationPayload>
          }
          aggregate: {
            args: Prisma.ErrorAggregationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateErrorAggregation>
          }
          groupBy: {
            args: Prisma.ErrorAggregationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ErrorAggregationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ErrorAggregationCountArgs<ExtArgs>
            result: $Utils.Optional<ErrorAggregationCountAggregateOutputType> | number
          }
        }
      }
      AlertConfiguration: {
        payload: Prisma.$AlertConfigurationPayload<ExtArgs>
        fields: Prisma.AlertConfigurationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AlertConfigurationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AlertConfigurationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          findFirst: {
            args: Prisma.AlertConfigurationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AlertConfigurationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          findMany: {
            args: Prisma.AlertConfigurationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>[]
          }
          create: {
            args: Prisma.AlertConfigurationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          createMany: {
            args: Prisma.AlertConfigurationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AlertConfigurationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>[]
          }
          delete: {
            args: Prisma.AlertConfigurationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          update: {
            args: Prisma.AlertConfigurationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          deleteMany: {
            args: Prisma.AlertConfigurationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AlertConfigurationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AlertConfigurationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertConfigurationPayload>
          }
          aggregate: {
            args: Prisma.AlertConfigurationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlertConfiguration>
          }
          groupBy: {
            args: Prisma.AlertConfigurationGroupByArgs<ExtArgs>
            result: $Utils.Optional<AlertConfigurationGroupByOutputType>[]
          }
          count: {
            args: Prisma.AlertConfigurationCountArgs<ExtArgs>
            result: $Utils.Optional<AlertConfigurationCountAggregateOutputType> | number
          }
        }
      }
      AlertHistory: {
        payload: Prisma.$AlertHistoryPayload<ExtArgs>
        fields: Prisma.AlertHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AlertHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AlertHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          findFirst: {
            args: Prisma.AlertHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AlertHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          findMany: {
            args: Prisma.AlertHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>[]
          }
          create: {
            args: Prisma.AlertHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          createMany: {
            args: Prisma.AlertHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AlertHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>[]
          }
          delete: {
            args: Prisma.AlertHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          update: {
            args: Prisma.AlertHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          deleteMany: {
            args: Prisma.AlertHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AlertHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AlertHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertHistoryPayload>
          }
          aggregate: {
            args: Prisma.AlertHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlertHistory>
          }
          groupBy: {
            args: Prisma.AlertHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<AlertHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.AlertHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<AlertHistoryCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ErrorCountOutputType
   */

  export type ErrorCountOutputType = {
    correlations: number
    relatedErrors: number
    recoveryExecutions: number
  }

  export type ErrorCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    correlations?: boolean | ErrorCountOutputTypeCountCorrelationsArgs
    relatedErrors?: boolean | ErrorCountOutputTypeCountRelatedErrorsArgs
    recoveryExecutions?: boolean | ErrorCountOutputTypeCountRecoveryExecutionsArgs
  }

  // Custom InputTypes
  /**
   * ErrorCountOutputType without action
   */
  export type ErrorCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCountOutputType
     */
    select?: ErrorCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ErrorCountOutputType without action
   */
  export type ErrorCountOutputTypeCountCorrelationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorCorrelationWhereInput
  }

  /**
   * ErrorCountOutputType without action
   */
  export type ErrorCountOutputTypeCountRelatedErrorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorCorrelationWhereInput
  }

  /**
   * ErrorCountOutputType without action
   */
  export type ErrorCountOutputTypeCountRecoveryExecutionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecoveryExecutionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Error
   */

  export type AggregateError = {
    _count: ErrorCountAggregateOutputType | null
    _avg: ErrorAvgAggregateOutputType | null
    _sum: ErrorSumAggregateOutputType | null
    _min: ErrorMinAggregateOutputType | null
    _max: ErrorMaxAggregateOutputType | null
  }

  export type ErrorAvgAggregateOutputType = {
    statusCode: number | null
    responseTime: number | null
    count: number | null
  }

  export type ErrorSumAggregateOutputType = {
    statusCode: number | null
    responseTime: number | null
    count: number | null
  }

  export type ErrorMinAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    message: string | null
    category: string | null
    severity: string | null
    errorType: string | null
    stack: string | null
    service: string | null
    version: string | null
    environment: string | null
    timestamp: Date | null
    traceId: string | null
    spanId: string | null
    parentSpanId: string | null
    userId: string | null
    sessionId: string | null
    requestId: string | null
    userAgent: string | null
    ipAddress: string | null
    endpoint: string | null
    method: string | null
    statusCode: number | null
    responseTime: number | null
    count: number | null
    firstSeen: Date | null
    lastSeen: Date | null
    resolved: boolean | null
    resolvedAt: Date | null
    resolvedBy: string | null
    resolution: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorMaxAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    message: string | null
    category: string | null
    severity: string | null
    errorType: string | null
    stack: string | null
    service: string | null
    version: string | null
    environment: string | null
    timestamp: Date | null
    traceId: string | null
    spanId: string | null
    parentSpanId: string | null
    userId: string | null
    sessionId: string | null
    requestId: string | null
    userAgent: string | null
    ipAddress: string | null
    endpoint: string | null
    method: string | null
    statusCode: number | null
    responseTime: number | null
    count: number | null
    firstSeen: Date | null
    lastSeen: Date | null
    resolved: boolean | null
    resolvedAt: Date | null
    resolvedBy: string | null
    resolution: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorCountAggregateOutputType = {
    id: number
    fingerprint: number
    message: number
    category: number
    severity: number
    errorType: number
    stack: number
    context: number
    service: number
    version: number
    environment: number
    timestamp: number
    traceId: number
    spanId: number
    parentSpanId: number
    metadata: number
    userId: number
    sessionId: number
    requestId: number
    userAgent: number
    ipAddress: number
    endpoint: number
    method: number
    statusCode: number
    responseTime: number
    memoryUsage: number
    customData: number
    count: number
    firstSeen: number
    lastSeen: number
    resolved: number
    resolvedAt: number
    resolvedBy: number
    resolution: number
    tags: number
    affectedUsers: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ErrorAvgAggregateInputType = {
    statusCode?: true
    responseTime?: true
    count?: true
  }

  export type ErrorSumAggregateInputType = {
    statusCode?: true
    responseTime?: true
    count?: true
  }

  export type ErrorMinAggregateInputType = {
    id?: true
    fingerprint?: true
    message?: true
    category?: true
    severity?: true
    errorType?: true
    stack?: true
    service?: true
    version?: true
    environment?: true
    timestamp?: true
    traceId?: true
    spanId?: true
    parentSpanId?: true
    userId?: true
    sessionId?: true
    requestId?: true
    userAgent?: true
    ipAddress?: true
    endpoint?: true
    method?: true
    statusCode?: true
    responseTime?: true
    count?: true
    firstSeen?: true
    lastSeen?: true
    resolved?: true
    resolvedAt?: true
    resolvedBy?: true
    resolution?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorMaxAggregateInputType = {
    id?: true
    fingerprint?: true
    message?: true
    category?: true
    severity?: true
    errorType?: true
    stack?: true
    service?: true
    version?: true
    environment?: true
    timestamp?: true
    traceId?: true
    spanId?: true
    parentSpanId?: true
    userId?: true
    sessionId?: true
    requestId?: true
    userAgent?: true
    ipAddress?: true
    endpoint?: true
    method?: true
    statusCode?: true
    responseTime?: true
    count?: true
    firstSeen?: true
    lastSeen?: true
    resolved?: true
    resolvedAt?: true
    resolvedBy?: true
    resolution?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorCountAggregateInputType = {
    id?: true
    fingerprint?: true
    message?: true
    category?: true
    severity?: true
    errorType?: true
    stack?: true
    context?: true
    service?: true
    version?: true
    environment?: true
    timestamp?: true
    traceId?: true
    spanId?: true
    parentSpanId?: true
    metadata?: true
    userId?: true
    sessionId?: true
    requestId?: true
    userAgent?: true
    ipAddress?: true
    endpoint?: true
    method?: true
    statusCode?: true
    responseTime?: true
    memoryUsage?: true
    customData?: true
    count?: true
    firstSeen?: true
    lastSeen?: true
    resolved?: true
    resolvedAt?: true
    resolvedBy?: true
    resolution?: true
    tags?: true
    affectedUsers?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ErrorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Error to aggregate.
     */
    where?: ErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Errors to fetch.
     */
    orderBy?: ErrorOrderByWithRelationInput | ErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Errors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Errors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Errors
    **/
    _count?: true | ErrorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ErrorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ErrorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ErrorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ErrorMaxAggregateInputType
  }

  export type GetErrorAggregateType<T extends ErrorAggregateArgs> = {
        [P in keyof T & keyof AggregateError]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateError[P]>
      : GetScalarType<T[P], AggregateError[P]>
  }




  export type ErrorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorWhereInput
    orderBy?: ErrorOrderByWithAggregationInput | ErrorOrderByWithAggregationInput[]
    by: ErrorScalarFieldEnum[] | ErrorScalarFieldEnum
    having?: ErrorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ErrorCountAggregateInputType | true
    _avg?: ErrorAvgAggregateInputType
    _sum?: ErrorSumAggregateInputType
    _min?: ErrorMinAggregateInputType
    _max?: ErrorMaxAggregateInputType
  }

  export type ErrorGroupByOutputType = {
    id: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack: string | null
    context: JsonValue | null
    service: string
    version: string
    environment: string
    timestamp: Date
    traceId: string | null
    spanId: string | null
    parentSpanId: string | null
    metadata: JsonValue | null
    userId: string | null
    sessionId: string | null
    requestId: string | null
    userAgent: string | null
    ipAddress: string | null
    endpoint: string | null
    method: string | null
    statusCode: number | null
    responseTime: number | null
    memoryUsage: JsonValue | null
    customData: JsonValue | null
    count: number
    firstSeen: Date
    lastSeen: Date
    resolved: boolean
    resolvedAt: Date | null
    resolvedBy: string | null
    resolution: string | null
    tags: string[]
    affectedUsers: string[]
    createdAt: Date
    updatedAt: Date
    _count: ErrorCountAggregateOutputType | null
    _avg: ErrorAvgAggregateOutputType | null
    _sum: ErrorSumAggregateOutputType | null
    _min: ErrorMinAggregateOutputType | null
    _max: ErrorMaxAggregateOutputType | null
  }

  type GetErrorGroupByPayload<T extends ErrorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ErrorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ErrorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ErrorGroupByOutputType[P]>
            : GetScalarType<T[P], ErrorGroupByOutputType[P]>
        }
      >
    >


  export type ErrorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    message?: boolean
    category?: boolean
    severity?: boolean
    errorType?: boolean
    stack?: boolean
    context?: boolean
    service?: boolean
    version?: boolean
    environment?: boolean
    timestamp?: boolean
    traceId?: boolean
    spanId?: boolean
    parentSpanId?: boolean
    metadata?: boolean
    userId?: boolean
    sessionId?: boolean
    requestId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    endpoint?: boolean
    method?: boolean
    statusCode?: boolean
    responseTime?: boolean
    memoryUsage?: boolean
    customData?: boolean
    count?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    resolved?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    resolution?: boolean
    tags?: boolean
    affectedUsers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    correlations?: boolean | Error$correlationsArgs<ExtArgs>
    relatedErrors?: boolean | Error$relatedErrorsArgs<ExtArgs>
    recoveryExecutions?: boolean | Error$recoveryExecutionsArgs<ExtArgs>
    _count?: boolean | ErrorCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["error"]>

  export type ErrorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    message?: boolean
    category?: boolean
    severity?: boolean
    errorType?: boolean
    stack?: boolean
    context?: boolean
    service?: boolean
    version?: boolean
    environment?: boolean
    timestamp?: boolean
    traceId?: boolean
    spanId?: boolean
    parentSpanId?: boolean
    metadata?: boolean
    userId?: boolean
    sessionId?: boolean
    requestId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    endpoint?: boolean
    method?: boolean
    statusCode?: boolean
    responseTime?: boolean
    memoryUsage?: boolean
    customData?: boolean
    count?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    resolved?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    resolution?: boolean
    tags?: boolean
    affectedUsers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["error"]>

  export type ErrorSelectScalar = {
    id?: boolean
    fingerprint?: boolean
    message?: boolean
    category?: boolean
    severity?: boolean
    errorType?: boolean
    stack?: boolean
    context?: boolean
    service?: boolean
    version?: boolean
    environment?: boolean
    timestamp?: boolean
    traceId?: boolean
    spanId?: boolean
    parentSpanId?: boolean
    metadata?: boolean
    userId?: boolean
    sessionId?: boolean
    requestId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    endpoint?: boolean
    method?: boolean
    statusCode?: boolean
    responseTime?: boolean
    memoryUsage?: boolean
    customData?: boolean
    count?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    resolved?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    resolution?: boolean
    tags?: boolean
    affectedUsers?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ErrorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    correlations?: boolean | Error$correlationsArgs<ExtArgs>
    relatedErrors?: boolean | Error$relatedErrorsArgs<ExtArgs>
    recoveryExecutions?: boolean | Error$recoveryExecutionsArgs<ExtArgs>
    _count?: boolean | ErrorCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ErrorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ErrorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Error"
    objects: {
      correlations: Prisma.$ErrorCorrelationPayload<ExtArgs>[]
      relatedErrors: Prisma.$ErrorCorrelationPayload<ExtArgs>[]
      recoveryExecutions: Prisma.$RecoveryExecutionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fingerprint: string
      message: string
      category: string
      severity: string
      errorType: string
      stack: string | null
      context: Prisma.JsonValue | null
      service: string
      version: string
      environment: string
      timestamp: Date
      traceId: string | null
      spanId: string | null
      parentSpanId: string | null
      metadata: Prisma.JsonValue | null
      userId: string | null
      sessionId: string | null
      requestId: string | null
      userAgent: string | null
      ipAddress: string | null
      endpoint: string | null
      method: string | null
      statusCode: number | null
      responseTime: number | null
      memoryUsage: Prisma.JsonValue | null
      customData: Prisma.JsonValue | null
      count: number
      firstSeen: Date
      lastSeen: Date
      resolved: boolean
      resolvedAt: Date | null
      resolvedBy: string | null
      resolution: string | null
      tags: string[]
      affectedUsers: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["error"]>
    composites: {}
  }

  type ErrorGetPayload<S extends boolean | null | undefined | ErrorDefaultArgs> = $Result.GetResult<Prisma.$ErrorPayload, S>

  type ErrorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ErrorFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ErrorCountAggregateInputType | true
    }

  export interface ErrorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Error'], meta: { name: 'Error' } }
    /**
     * Find zero or one Error that matches the filter.
     * @param {ErrorFindUniqueArgs} args - Arguments to find a Error
     * @example
     * // Get one Error
     * const error = await prisma.error.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ErrorFindUniqueArgs>(args: SelectSubset<T, ErrorFindUniqueArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Error that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ErrorFindUniqueOrThrowArgs} args - Arguments to find a Error
     * @example
     * // Get one Error
     * const error = await prisma.error.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ErrorFindUniqueOrThrowArgs>(args: SelectSubset<T, ErrorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Error that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorFindFirstArgs} args - Arguments to find a Error
     * @example
     * // Get one Error
     * const error = await prisma.error.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ErrorFindFirstArgs>(args?: SelectSubset<T, ErrorFindFirstArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Error that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorFindFirstOrThrowArgs} args - Arguments to find a Error
     * @example
     * // Get one Error
     * const error = await prisma.error.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ErrorFindFirstOrThrowArgs>(args?: SelectSubset<T, ErrorFindFirstOrThrowArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Errors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Errors
     * const errors = await prisma.error.findMany()
     * 
     * // Get first 10 Errors
     * const errors = await prisma.error.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const errorWithIdOnly = await prisma.error.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ErrorFindManyArgs>(args?: SelectSubset<T, ErrorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Error.
     * @param {ErrorCreateArgs} args - Arguments to create a Error.
     * @example
     * // Create one Error
     * const Error = await prisma.error.create({
     *   data: {
     *     // ... data to create a Error
     *   }
     * })
     * 
     */
    create<T extends ErrorCreateArgs>(args: SelectSubset<T, ErrorCreateArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Errors.
     * @param {ErrorCreateManyArgs} args - Arguments to create many Errors.
     * @example
     * // Create many Errors
     * const error = await prisma.error.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ErrorCreateManyArgs>(args?: SelectSubset<T, ErrorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Errors and returns the data saved in the database.
     * @param {ErrorCreateManyAndReturnArgs} args - Arguments to create many Errors.
     * @example
     * // Create many Errors
     * const error = await prisma.error.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Errors and only return the `id`
     * const errorWithIdOnly = await prisma.error.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ErrorCreateManyAndReturnArgs>(args?: SelectSubset<T, ErrorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Error.
     * @param {ErrorDeleteArgs} args - Arguments to delete one Error.
     * @example
     * // Delete one Error
     * const Error = await prisma.error.delete({
     *   where: {
     *     // ... filter to delete one Error
     *   }
     * })
     * 
     */
    delete<T extends ErrorDeleteArgs>(args: SelectSubset<T, ErrorDeleteArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Error.
     * @param {ErrorUpdateArgs} args - Arguments to update one Error.
     * @example
     * // Update one Error
     * const error = await prisma.error.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ErrorUpdateArgs>(args: SelectSubset<T, ErrorUpdateArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Errors.
     * @param {ErrorDeleteManyArgs} args - Arguments to filter Errors to delete.
     * @example
     * // Delete a few Errors
     * const { count } = await prisma.error.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ErrorDeleteManyArgs>(args?: SelectSubset<T, ErrorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Errors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Errors
     * const error = await prisma.error.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ErrorUpdateManyArgs>(args: SelectSubset<T, ErrorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Error.
     * @param {ErrorUpsertArgs} args - Arguments to update or create a Error.
     * @example
     * // Update or create a Error
     * const error = await prisma.error.upsert({
     *   create: {
     *     // ... data to create a Error
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Error we want to update
     *   }
     * })
     */
    upsert<T extends ErrorUpsertArgs>(args: SelectSubset<T, ErrorUpsertArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Errors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCountArgs} args - Arguments to filter Errors to count.
     * @example
     * // Count the number of Errors
     * const count = await prisma.error.count({
     *   where: {
     *     // ... the filter for the Errors we want to count
     *   }
     * })
    **/
    count<T extends ErrorCountArgs>(
      args?: Subset<T, ErrorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ErrorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Error.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ErrorAggregateArgs>(args: Subset<T, ErrorAggregateArgs>): Prisma.PrismaPromise<GetErrorAggregateType<T>>

    /**
     * Group by Error.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ErrorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ErrorGroupByArgs['orderBy'] }
        : { orderBy?: ErrorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ErrorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetErrorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Error model
   */
  readonly fields: ErrorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Error.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ErrorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    correlations<T extends Error$correlationsArgs<ExtArgs> = {}>(args?: Subset<T, Error$correlationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findMany"> | Null>
    relatedErrors<T extends Error$relatedErrorsArgs<ExtArgs> = {}>(args?: Subset<T, Error$relatedErrorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findMany"> | Null>
    recoveryExecutions<T extends Error$recoveryExecutionsArgs<ExtArgs> = {}>(args?: Subset<T, Error$recoveryExecutionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Error model
   */ 
  interface ErrorFieldRefs {
    readonly id: FieldRef<"Error", 'String'>
    readonly fingerprint: FieldRef<"Error", 'String'>
    readonly message: FieldRef<"Error", 'String'>
    readonly category: FieldRef<"Error", 'String'>
    readonly severity: FieldRef<"Error", 'String'>
    readonly errorType: FieldRef<"Error", 'String'>
    readonly stack: FieldRef<"Error", 'String'>
    readonly context: FieldRef<"Error", 'Json'>
    readonly service: FieldRef<"Error", 'String'>
    readonly version: FieldRef<"Error", 'String'>
    readonly environment: FieldRef<"Error", 'String'>
    readonly timestamp: FieldRef<"Error", 'DateTime'>
    readonly traceId: FieldRef<"Error", 'String'>
    readonly spanId: FieldRef<"Error", 'String'>
    readonly parentSpanId: FieldRef<"Error", 'String'>
    readonly metadata: FieldRef<"Error", 'Json'>
    readonly userId: FieldRef<"Error", 'String'>
    readonly sessionId: FieldRef<"Error", 'String'>
    readonly requestId: FieldRef<"Error", 'String'>
    readonly userAgent: FieldRef<"Error", 'String'>
    readonly ipAddress: FieldRef<"Error", 'String'>
    readonly endpoint: FieldRef<"Error", 'String'>
    readonly method: FieldRef<"Error", 'String'>
    readonly statusCode: FieldRef<"Error", 'Int'>
    readonly responseTime: FieldRef<"Error", 'Int'>
    readonly memoryUsage: FieldRef<"Error", 'Json'>
    readonly customData: FieldRef<"Error", 'Json'>
    readonly count: FieldRef<"Error", 'Int'>
    readonly firstSeen: FieldRef<"Error", 'DateTime'>
    readonly lastSeen: FieldRef<"Error", 'DateTime'>
    readonly resolved: FieldRef<"Error", 'Boolean'>
    readonly resolvedAt: FieldRef<"Error", 'DateTime'>
    readonly resolvedBy: FieldRef<"Error", 'String'>
    readonly resolution: FieldRef<"Error", 'String'>
    readonly tags: FieldRef<"Error", 'String[]'>
    readonly affectedUsers: FieldRef<"Error", 'String[]'>
    readonly createdAt: FieldRef<"Error", 'DateTime'>
    readonly updatedAt: FieldRef<"Error", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Error findUnique
   */
  export type ErrorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter, which Error to fetch.
     */
    where: ErrorWhereUniqueInput
  }

  /**
   * Error findUniqueOrThrow
   */
  export type ErrorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter, which Error to fetch.
     */
    where: ErrorWhereUniqueInput
  }

  /**
   * Error findFirst
   */
  export type ErrorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter, which Error to fetch.
     */
    where?: ErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Errors to fetch.
     */
    orderBy?: ErrorOrderByWithRelationInput | ErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Errors.
     */
    cursor?: ErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Errors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Errors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Errors.
     */
    distinct?: ErrorScalarFieldEnum | ErrorScalarFieldEnum[]
  }

  /**
   * Error findFirstOrThrow
   */
  export type ErrorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter, which Error to fetch.
     */
    where?: ErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Errors to fetch.
     */
    orderBy?: ErrorOrderByWithRelationInput | ErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Errors.
     */
    cursor?: ErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Errors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Errors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Errors.
     */
    distinct?: ErrorScalarFieldEnum | ErrorScalarFieldEnum[]
  }

  /**
   * Error findMany
   */
  export type ErrorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter, which Errors to fetch.
     */
    where?: ErrorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Errors to fetch.
     */
    orderBy?: ErrorOrderByWithRelationInput | ErrorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Errors.
     */
    cursor?: ErrorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Errors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Errors.
     */
    skip?: number
    distinct?: ErrorScalarFieldEnum | ErrorScalarFieldEnum[]
  }

  /**
   * Error create
   */
  export type ErrorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * The data needed to create a Error.
     */
    data: XOR<ErrorCreateInput, ErrorUncheckedCreateInput>
  }

  /**
   * Error createMany
   */
  export type ErrorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Errors.
     */
    data: ErrorCreateManyInput | ErrorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Error createManyAndReturn
   */
  export type ErrorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Errors.
     */
    data: ErrorCreateManyInput | ErrorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Error update
   */
  export type ErrorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * The data needed to update a Error.
     */
    data: XOR<ErrorUpdateInput, ErrorUncheckedUpdateInput>
    /**
     * Choose, which Error to update.
     */
    where: ErrorWhereUniqueInput
  }

  /**
   * Error updateMany
   */
  export type ErrorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Errors.
     */
    data: XOR<ErrorUpdateManyMutationInput, ErrorUncheckedUpdateManyInput>
    /**
     * Filter which Errors to update
     */
    where?: ErrorWhereInput
  }

  /**
   * Error upsert
   */
  export type ErrorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * The filter to search for the Error to update in case it exists.
     */
    where: ErrorWhereUniqueInput
    /**
     * In case the Error found by the `where` argument doesn't exist, create a new Error with this data.
     */
    create: XOR<ErrorCreateInput, ErrorUncheckedCreateInput>
    /**
     * In case the Error was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ErrorUpdateInput, ErrorUncheckedUpdateInput>
  }

  /**
   * Error delete
   */
  export type ErrorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
    /**
     * Filter which Error to delete.
     */
    where: ErrorWhereUniqueInput
  }

  /**
   * Error deleteMany
   */
  export type ErrorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Errors to delete
     */
    where?: ErrorWhereInput
  }

  /**
   * Error.correlations
   */
  export type Error$correlationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    where?: ErrorCorrelationWhereInput
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    cursor?: ErrorCorrelationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ErrorCorrelationScalarFieldEnum | ErrorCorrelationScalarFieldEnum[]
  }

  /**
   * Error.relatedErrors
   */
  export type Error$relatedErrorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    where?: ErrorCorrelationWhereInput
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    cursor?: ErrorCorrelationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ErrorCorrelationScalarFieldEnum | ErrorCorrelationScalarFieldEnum[]
  }

  /**
   * Error.recoveryExecutions
   */
  export type Error$recoveryExecutionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    where?: RecoveryExecutionWhereInput
    orderBy?: RecoveryExecutionOrderByWithRelationInput | RecoveryExecutionOrderByWithRelationInput[]
    cursor?: RecoveryExecutionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecoveryExecutionScalarFieldEnum | RecoveryExecutionScalarFieldEnum[]
  }

  /**
   * Error without action
   */
  export type ErrorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Error
     */
    select?: ErrorSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorInclude<ExtArgs> | null
  }


  /**
   * Model ErrorCorrelation
   */

  export type AggregateErrorCorrelation = {
    _count: ErrorCorrelationCountAggregateOutputType | null
    _avg: ErrorCorrelationAvgAggregateOutputType | null
    _sum: ErrorCorrelationSumAggregateOutputType | null
    _min: ErrorCorrelationMinAggregateOutputType | null
    _max: ErrorCorrelationMaxAggregateOutputType | null
  }

  export type ErrorCorrelationAvgAggregateOutputType = {
    confidence: number | null
  }

  export type ErrorCorrelationSumAggregateOutputType = {
    confidence: number | null
  }

  export type ErrorCorrelationMinAggregateOutputType = {
    id: string | null
    errorId: string | null
    relatedErrorId: string | null
    correlationType: string | null
    confidence: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorCorrelationMaxAggregateOutputType = {
    id: string | null
    errorId: string | null
    relatedErrorId: string | null
    correlationType: string | null
    confidence: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorCorrelationCountAggregateOutputType = {
    id: number
    errorId: number
    relatedErrorId: number
    correlationType: number
    confidence: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ErrorCorrelationAvgAggregateInputType = {
    confidence?: true
  }

  export type ErrorCorrelationSumAggregateInputType = {
    confidence?: true
  }

  export type ErrorCorrelationMinAggregateInputType = {
    id?: true
    errorId?: true
    relatedErrorId?: true
    correlationType?: true
    confidence?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorCorrelationMaxAggregateInputType = {
    id?: true
    errorId?: true
    relatedErrorId?: true
    correlationType?: true
    confidence?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorCorrelationCountAggregateInputType = {
    id?: true
    errorId?: true
    relatedErrorId?: true
    correlationType?: true
    confidence?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ErrorCorrelationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorCorrelation to aggregate.
     */
    where?: ErrorCorrelationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorCorrelations to fetch.
     */
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ErrorCorrelationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorCorrelations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorCorrelations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ErrorCorrelations
    **/
    _count?: true | ErrorCorrelationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ErrorCorrelationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ErrorCorrelationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ErrorCorrelationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ErrorCorrelationMaxAggregateInputType
  }

  export type GetErrorCorrelationAggregateType<T extends ErrorCorrelationAggregateArgs> = {
        [P in keyof T & keyof AggregateErrorCorrelation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateErrorCorrelation[P]>
      : GetScalarType<T[P], AggregateErrorCorrelation[P]>
  }




  export type ErrorCorrelationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorCorrelationWhereInput
    orderBy?: ErrorCorrelationOrderByWithAggregationInput | ErrorCorrelationOrderByWithAggregationInput[]
    by: ErrorCorrelationScalarFieldEnum[] | ErrorCorrelationScalarFieldEnum
    having?: ErrorCorrelationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ErrorCorrelationCountAggregateInputType | true
    _avg?: ErrorCorrelationAvgAggregateInputType
    _sum?: ErrorCorrelationSumAggregateInputType
    _min?: ErrorCorrelationMinAggregateInputType
    _max?: ErrorCorrelationMaxAggregateInputType
  }

  export type ErrorCorrelationGroupByOutputType = {
    id: string
    errorId: string
    relatedErrorId: string
    correlationType: string
    confidence: number
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ErrorCorrelationCountAggregateOutputType | null
    _avg: ErrorCorrelationAvgAggregateOutputType | null
    _sum: ErrorCorrelationSumAggregateOutputType | null
    _min: ErrorCorrelationMinAggregateOutputType | null
    _max: ErrorCorrelationMaxAggregateOutputType | null
  }

  type GetErrorCorrelationGroupByPayload<T extends ErrorCorrelationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ErrorCorrelationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ErrorCorrelationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ErrorCorrelationGroupByOutputType[P]>
            : GetScalarType<T[P], ErrorCorrelationGroupByOutputType[P]>
        }
      >
    >


  export type ErrorCorrelationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    errorId?: boolean
    relatedErrorId?: boolean
    correlationType?: boolean
    confidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    error?: boolean | ErrorDefaultArgs<ExtArgs>
    relatedError?: boolean | ErrorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["errorCorrelation"]>

  export type ErrorCorrelationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    errorId?: boolean
    relatedErrorId?: boolean
    correlationType?: boolean
    confidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    error?: boolean | ErrorDefaultArgs<ExtArgs>
    relatedError?: boolean | ErrorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["errorCorrelation"]>

  export type ErrorCorrelationSelectScalar = {
    id?: boolean
    errorId?: boolean
    relatedErrorId?: boolean
    correlationType?: boolean
    confidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ErrorCorrelationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    error?: boolean | ErrorDefaultArgs<ExtArgs>
    relatedError?: boolean | ErrorDefaultArgs<ExtArgs>
  }
  export type ErrorCorrelationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    error?: boolean | ErrorDefaultArgs<ExtArgs>
    relatedError?: boolean | ErrorDefaultArgs<ExtArgs>
  }

  export type $ErrorCorrelationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ErrorCorrelation"
    objects: {
      error: Prisma.$ErrorPayload<ExtArgs>
      relatedError: Prisma.$ErrorPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      errorId: string
      relatedErrorId: string
      correlationType: string
      confidence: number
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["errorCorrelation"]>
    composites: {}
  }

  type ErrorCorrelationGetPayload<S extends boolean | null | undefined | ErrorCorrelationDefaultArgs> = $Result.GetResult<Prisma.$ErrorCorrelationPayload, S>

  type ErrorCorrelationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ErrorCorrelationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ErrorCorrelationCountAggregateInputType | true
    }

  export interface ErrorCorrelationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ErrorCorrelation'], meta: { name: 'ErrorCorrelation' } }
    /**
     * Find zero or one ErrorCorrelation that matches the filter.
     * @param {ErrorCorrelationFindUniqueArgs} args - Arguments to find a ErrorCorrelation
     * @example
     * // Get one ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ErrorCorrelationFindUniqueArgs>(args: SelectSubset<T, ErrorCorrelationFindUniqueArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ErrorCorrelation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ErrorCorrelationFindUniqueOrThrowArgs} args - Arguments to find a ErrorCorrelation
     * @example
     * // Get one ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ErrorCorrelationFindUniqueOrThrowArgs>(args: SelectSubset<T, ErrorCorrelationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ErrorCorrelation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationFindFirstArgs} args - Arguments to find a ErrorCorrelation
     * @example
     * // Get one ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ErrorCorrelationFindFirstArgs>(args?: SelectSubset<T, ErrorCorrelationFindFirstArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ErrorCorrelation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationFindFirstOrThrowArgs} args - Arguments to find a ErrorCorrelation
     * @example
     * // Get one ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ErrorCorrelationFindFirstOrThrowArgs>(args?: SelectSubset<T, ErrorCorrelationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ErrorCorrelations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ErrorCorrelations
     * const errorCorrelations = await prisma.errorCorrelation.findMany()
     * 
     * // Get first 10 ErrorCorrelations
     * const errorCorrelations = await prisma.errorCorrelation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const errorCorrelationWithIdOnly = await prisma.errorCorrelation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ErrorCorrelationFindManyArgs>(args?: SelectSubset<T, ErrorCorrelationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ErrorCorrelation.
     * @param {ErrorCorrelationCreateArgs} args - Arguments to create a ErrorCorrelation.
     * @example
     * // Create one ErrorCorrelation
     * const ErrorCorrelation = await prisma.errorCorrelation.create({
     *   data: {
     *     // ... data to create a ErrorCorrelation
     *   }
     * })
     * 
     */
    create<T extends ErrorCorrelationCreateArgs>(args: SelectSubset<T, ErrorCorrelationCreateArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ErrorCorrelations.
     * @param {ErrorCorrelationCreateManyArgs} args - Arguments to create many ErrorCorrelations.
     * @example
     * // Create many ErrorCorrelations
     * const errorCorrelation = await prisma.errorCorrelation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ErrorCorrelationCreateManyArgs>(args?: SelectSubset<T, ErrorCorrelationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ErrorCorrelations and returns the data saved in the database.
     * @param {ErrorCorrelationCreateManyAndReturnArgs} args - Arguments to create many ErrorCorrelations.
     * @example
     * // Create many ErrorCorrelations
     * const errorCorrelation = await prisma.errorCorrelation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ErrorCorrelations and only return the `id`
     * const errorCorrelationWithIdOnly = await prisma.errorCorrelation.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ErrorCorrelationCreateManyAndReturnArgs>(args?: SelectSubset<T, ErrorCorrelationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ErrorCorrelation.
     * @param {ErrorCorrelationDeleteArgs} args - Arguments to delete one ErrorCorrelation.
     * @example
     * // Delete one ErrorCorrelation
     * const ErrorCorrelation = await prisma.errorCorrelation.delete({
     *   where: {
     *     // ... filter to delete one ErrorCorrelation
     *   }
     * })
     * 
     */
    delete<T extends ErrorCorrelationDeleteArgs>(args: SelectSubset<T, ErrorCorrelationDeleteArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ErrorCorrelation.
     * @param {ErrorCorrelationUpdateArgs} args - Arguments to update one ErrorCorrelation.
     * @example
     * // Update one ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ErrorCorrelationUpdateArgs>(args: SelectSubset<T, ErrorCorrelationUpdateArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ErrorCorrelations.
     * @param {ErrorCorrelationDeleteManyArgs} args - Arguments to filter ErrorCorrelations to delete.
     * @example
     * // Delete a few ErrorCorrelations
     * const { count } = await prisma.errorCorrelation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ErrorCorrelationDeleteManyArgs>(args?: SelectSubset<T, ErrorCorrelationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ErrorCorrelations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ErrorCorrelations
     * const errorCorrelation = await prisma.errorCorrelation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ErrorCorrelationUpdateManyArgs>(args: SelectSubset<T, ErrorCorrelationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ErrorCorrelation.
     * @param {ErrorCorrelationUpsertArgs} args - Arguments to update or create a ErrorCorrelation.
     * @example
     * // Update or create a ErrorCorrelation
     * const errorCorrelation = await prisma.errorCorrelation.upsert({
     *   create: {
     *     // ... data to create a ErrorCorrelation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ErrorCorrelation we want to update
     *   }
     * })
     */
    upsert<T extends ErrorCorrelationUpsertArgs>(args: SelectSubset<T, ErrorCorrelationUpsertArgs<ExtArgs>>): Prisma__ErrorCorrelationClient<$Result.GetResult<Prisma.$ErrorCorrelationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ErrorCorrelations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationCountArgs} args - Arguments to filter ErrorCorrelations to count.
     * @example
     * // Count the number of ErrorCorrelations
     * const count = await prisma.errorCorrelation.count({
     *   where: {
     *     // ... the filter for the ErrorCorrelations we want to count
     *   }
     * })
    **/
    count<T extends ErrorCorrelationCountArgs>(
      args?: Subset<T, ErrorCorrelationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ErrorCorrelationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ErrorCorrelation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ErrorCorrelationAggregateArgs>(args: Subset<T, ErrorCorrelationAggregateArgs>): Prisma.PrismaPromise<GetErrorCorrelationAggregateType<T>>

    /**
     * Group by ErrorCorrelation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorCorrelationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ErrorCorrelationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ErrorCorrelationGroupByArgs['orderBy'] }
        : { orderBy?: ErrorCorrelationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ErrorCorrelationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetErrorCorrelationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ErrorCorrelation model
   */
  readonly fields: ErrorCorrelationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ErrorCorrelation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ErrorCorrelationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    error<T extends ErrorDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ErrorDefaultArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    relatedError<T extends ErrorDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ErrorDefaultArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ErrorCorrelation model
   */ 
  interface ErrorCorrelationFieldRefs {
    readonly id: FieldRef<"ErrorCorrelation", 'String'>
    readonly errorId: FieldRef<"ErrorCorrelation", 'String'>
    readonly relatedErrorId: FieldRef<"ErrorCorrelation", 'String'>
    readonly correlationType: FieldRef<"ErrorCorrelation", 'String'>
    readonly confidence: FieldRef<"ErrorCorrelation", 'Float'>
    readonly metadata: FieldRef<"ErrorCorrelation", 'Json'>
    readonly createdAt: FieldRef<"ErrorCorrelation", 'DateTime'>
    readonly updatedAt: FieldRef<"ErrorCorrelation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ErrorCorrelation findUnique
   */
  export type ErrorCorrelationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter, which ErrorCorrelation to fetch.
     */
    where: ErrorCorrelationWhereUniqueInput
  }

  /**
   * ErrorCorrelation findUniqueOrThrow
   */
  export type ErrorCorrelationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter, which ErrorCorrelation to fetch.
     */
    where: ErrorCorrelationWhereUniqueInput
  }

  /**
   * ErrorCorrelation findFirst
   */
  export type ErrorCorrelationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter, which ErrorCorrelation to fetch.
     */
    where?: ErrorCorrelationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorCorrelations to fetch.
     */
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorCorrelations.
     */
    cursor?: ErrorCorrelationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorCorrelations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorCorrelations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorCorrelations.
     */
    distinct?: ErrorCorrelationScalarFieldEnum | ErrorCorrelationScalarFieldEnum[]
  }

  /**
   * ErrorCorrelation findFirstOrThrow
   */
  export type ErrorCorrelationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter, which ErrorCorrelation to fetch.
     */
    where?: ErrorCorrelationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorCorrelations to fetch.
     */
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorCorrelations.
     */
    cursor?: ErrorCorrelationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorCorrelations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorCorrelations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorCorrelations.
     */
    distinct?: ErrorCorrelationScalarFieldEnum | ErrorCorrelationScalarFieldEnum[]
  }

  /**
   * ErrorCorrelation findMany
   */
  export type ErrorCorrelationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter, which ErrorCorrelations to fetch.
     */
    where?: ErrorCorrelationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorCorrelations to fetch.
     */
    orderBy?: ErrorCorrelationOrderByWithRelationInput | ErrorCorrelationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ErrorCorrelations.
     */
    cursor?: ErrorCorrelationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorCorrelations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorCorrelations.
     */
    skip?: number
    distinct?: ErrorCorrelationScalarFieldEnum | ErrorCorrelationScalarFieldEnum[]
  }

  /**
   * ErrorCorrelation create
   */
  export type ErrorCorrelationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * The data needed to create a ErrorCorrelation.
     */
    data: XOR<ErrorCorrelationCreateInput, ErrorCorrelationUncheckedCreateInput>
  }

  /**
   * ErrorCorrelation createMany
   */
  export type ErrorCorrelationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ErrorCorrelations.
     */
    data: ErrorCorrelationCreateManyInput | ErrorCorrelationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ErrorCorrelation createManyAndReturn
   */
  export type ErrorCorrelationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ErrorCorrelations.
     */
    data: ErrorCorrelationCreateManyInput | ErrorCorrelationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ErrorCorrelation update
   */
  export type ErrorCorrelationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * The data needed to update a ErrorCorrelation.
     */
    data: XOR<ErrorCorrelationUpdateInput, ErrorCorrelationUncheckedUpdateInput>
    /**
     * Choose, which ErrorCorrelation to update.
     */
    where: ErrorCorrelationWhereUniqueInput
  }

  /**
   * ErrorCorrelation updateMany
   */
  export type ErrorCorrelationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ErrorCorrelations.
     */
    data: XOR<ErrorCorrelationUpdateManyMutationInput, ErrorCorrelationUncheckedUpdateManyInput>
    /**
     * Filter which ErrorCorrelations to update
     */
    where?: ErrorCorrelationWhereInput
  }

  /**
   * ErrorCorrelation upsert
   */
  export type ErrorCorrelationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * The filter to search for the ErrorCorrelation to update in case it exists.
     */
    where: ErrorCorrelationWhereUniqueInput
    /**
     * In case the ErrorCorrelation found by the `where` argument doesn't exist, create a new ErrorCorrelation with this data.
     */
    create: XOR<ErrorCorrelationCreateInput, ErrorCorrelationUncheckedCreateInput>
    /**
     * In case the ErrorCorrelation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ErrorCorrelationUpdateInput, ErrorCorrelationUncheckedUpdateInput>
  }

  /**
   * ErrorCorrelation delete
   */
  export type ErrorCorrelationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
    /**
     * Filter which ErrorCorrelation to delete.
     */
    where: ErrorCorrelationWhereUniqueInput
  }

  /**
   * ErrorCorrelation deleteMany
   */
  export type ErrorCorrelationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorCorrelations to delete
     */
    where?: ErrorCorrelationWhereInput
  }

  /**
   * ErrorCorrelation without action
   */
  export type ErrorCorrelationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorCorrelation
     */
    select?: ErrorCorrelationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ErrorCorrelationInclude<ExtArgs> | null
  }


  /**
   * Model RecoveryExecution
   */

  export type AggregateRecoveryExecution = {
    _count: RecoveryExecutionCountAggregateOutputType | null
    _avg: RecoveryExecutionAvgAggregateOutputType | null
    _sum: RecoveryExecutionSumAggregateOutputType | null
    _min: RecoveryExecutionMinAggregateOutputType | null
    _max: RecoveryExecutionMaxAggregateOutputType | null
  }

  export type RecoveryExecutionAvgAggregateOutputType = {
    attempts: number | null
    maxAttempts: number | null
  }

  export type RecoveryExecutionSumAggregateOutputType = {
    attempts: number | null
    maxAttempts: number | null
  }

  export type RecoveryExecutionMinAggregateOutputType = {
    id: string | null
    errorId: string | null
    strategy: string | null
    action: string | null
    status: string | null
    attempts: number | null
    maxAttempts: number | null
    startedAt: Date | null
    completedAt: Date | null
    nextRetryAt: Date | null
    errorMessage: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecoveryExecutionMaxAggregateOutputType = {
    id: string | null
    errorId: string | null
    strategy: string | null
    action: string | null
    status: string | null
    attempts: number | null
    maxAttempts: number | null
    startedAt: Date | null
    completedAt: Date | null
    nextRetryAt: Date | null
    errorMessage: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecoveryExecutionCountAggregateOutputType = {
    id: number
    errorId: number
    strategy: number
    action: number
    status: number
    attempts: number
    maxAttempts: number
    startedAt: number
    completedAt: number
    nextRetryAt: number
    result: number
    errorMessage: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RecoveryExecutionAvgAggregateInputType = {
    attempts?: true
    maxAttempts?: true
  }

  export type RecoveryExecutionSumAggregateInputType = {
    attempts?: true
    maxAttempts?: true
  }

  export type RecoveryExecutionMinAggregateInputType = {
    id?: true
    errorId?: true
    strategy?: true
    action?: true
    status?: true
    attempts?: true
    maxAttempts?: true
    startedAt?: true
    completedAt?: true
    nextRetryAt?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecoveryExecutionMaxAggregateInputType = {
    id?: true
    errorId?: true
    strategy?: true
    action?: true
    status?: true
    attempts?: true
    maxAttempts?: true
    startedAt?: true
    completedAt?: true
    nextRetryAt?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecoveryExecutionCountAggregateInputType = {
    id?: true
    errorId?: true
    strategy?: true
    action?: true
    status?: true
    attempts?: true
    maxAttempts?: true
    startedAt?: true
    completedAt?: true
    nextRetryAt?: true
    result?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RecoveryExecutionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecoveryExecution to aggregate.
     */
    where?: RecoveryExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryExecutions to fetch.
     */
    orderBy?: RecoveryExecutionOrderByWithRelationInput | RecoveryExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecoveryExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RecoveryExecutions
    **/
    _count?: true | RecoveryExecutionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RecoveryExecutionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RecoveryExecutionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecoveryExecutionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecoveryExecutionMaxAggregateInputType
  }

  export type GetRecoveryExecutionAggregateType<T extends RecoveryExecutionAggregateArgs> = {
        [P in keyof T & keyof AggregateRecoveryExecution]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecoveryExecution[P]>
      : GetScalarType<T[P], AggregateRecoveryExecution[P]>
  }




  export type RecoveryExecutionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecoveryExecutionWhereInput
    orderBy?: RecoveryExecutionOrderByWithAggregationInput | RecoveryExecutionOrderByWithAggregationInput[]
    by: RecoveryExecutionScalarFieldEnum[] | RecoveryExecutionScalarFieldEnum
    having?: RecoveryExecutionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecoveryExecutionCountAggregateInputType | true
    _avg?: RecoveryExecutionAvgAggregateInputType
    _sum?: RecoveryExecutionSumAggregateInputType
    _min?: RecoveryExecutionMinAggregateInputType
    _max?: RecoveryExecutionMaxAggregateInputType
  }

  export type RecoveryExecutionGroupByOutputType = {
    id: string
    errorId: string
    strategy: string
    action: string
    status: string
    attempts: number
    maxAttempts: number
    startedAt: Date
    completedAt: Date | null
    nextRetryAt: Date | null
    result: JsonValue | null
    errorMessage: string | null
    createdAt: Date
    updatedAt: Date
    _count: RecoveryExecutionCountAggregateOutputType | null
    _avg: RecoveryExecutionAvgAggregateOutputType | null
    _sum: RecoveryExecutionSumAggregateOutputType | null
    _min: RecoveryExecutionMinAggregateOutputType | null
    _max: RecoveryExecutionMaxAggregateOutputType | null
  }

  type GetRecoveryExecutionGroupByPayload<T extends RecoveryExecutionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecoveryExecutionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecoveryExecutionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecoveryExecutionGroupByOutputType[P]>
            : GetScalarType<T[P], RecoveryExecutionGroupByOutputType[P]>
        }
      >
    >


  export type RecoveryExecutionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    errorId?: boolean
    strategy?: boolean
    action?: boolean
    status?: boolean
    attempts?: boolean
    maxAttempts?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRetryAt?: boolean
    result?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    error?: boolean | ErrorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recoveryExecution"]>

  export type RecoveryExecutionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    errorId?: boolean
    strategy?: boolean
    action?: boolean
    status?: boolean
    attempts?: boolean
    maxAttempts?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRetryAt?: boolean
    result?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    error?: boolean | ErrorDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recoveryExecution"]>

  export type RecoveryExecutionSelectScalar = {
    id?: boolean
    errorId?: boolean
    strategy?: boolean
    action?: boolean
    status?: boolean
    attempts?: boolean
    maxAttempts?: boolean
    startedAt?: boolean
    completedAt?: boolean
    nextRetryAt?: boolean
    result?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RecoveryExecutionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    error?: boolean | ErrorDefaultArgs<ExtArgs>
  }
  export type RecoveryExecutionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    error?: boolean | ErrorDefaultArgs<ExtArgs>
  }

  export type $RecoveryExecutionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RecoveryExecution"
    objects: {
      error: Prisma.$ErrorPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      errorId: string
      strategy: string
      action: string
      status: string
      attempts: number
      maxAttempts: number
      startedAt: Date
      completedAt: Date | null
      nextRetryAt: Date | null
      result: Prisma.JsonValue | null
      errorMessage: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["recoveryExecution"]>
    composites: {}
  }

  type RecoveryExecutionGetPayload<S extends boolean | null | undefined | RecoveryExecutionDefaultArgs> = $Result.GetResult<Prisma.$RecoveryExecutionPayload, S>

  type RecoveryExecutionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RecoveryExecutionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RecoveryExecutionCountAggregateInputType | true
    }

  export interface RecoveryExecutionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RecoveryExecution'], meta: { name: 'RecoveryExecution' } }
    /**
     * Find zero or one RecoveryExecution that matches the filter.
     * @param {RecoveryExecutionFindUniqueArgs} args - Arguments to find a RecoveryExecution
     * @example
     * // Get one RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecoveryExecutionFindUniqueArgs>(args: SelectSubset<T, RecoveryExecutionFindUniqueArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one RecoveryExecution that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RecoveryExecutionFindUniqueOrThrowArgs} args - Arguments to find a RecoveryExecution
     * @example
     * // Get one RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecoveryExecutionFindUniqueOrThrowArgs>(args: SelectSubset<T, RecoveryExecutionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first RecoveryExecution that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionFindFirstArgs} args - Arguments to find a RecoveryExecution
     * @example
     * // Get one RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecoveryExecutionFindFirstArgs>(args?: SelectSubset<T, RecoveryExecutionFindFirstArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first RecoveryExecution that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionFindFirstOrThrowArgs} args - Arguments to find a RecoveryExecution
     * @example
     * // Get one RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecoveryExecutionFindFirstOrThrowArgs>(args?: SelectSubset<T, RecoveryExecutionFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more RecoveryExecutions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RecoveryExecutions
     * const recoveryExecutions = await prisma.recoveryExecution.findMany()
     * 
     * // Get first 10 RecoveryExecutions
     * const recoveryExecutions = await prisma.recoveryExecution.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recoveryExecutionWithIdOnly = await prisma.recoveryExecution.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecoveryExecutionFindManyArgs>(args?: SelectSubset<T, RecoveryExecutionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a RecoveryExecution.
     * @param {RecoveryExecutionCreateArgs} args - Arguments to create a RecoveryExecution.
     * @example
     * // Create one RecoveryExecution
     * const RecoveryExecution = await prisma.recoveryExecution.create({
     *   data: {
     *     // ... data to create a RecoveryExecution
     *   }
     * })
     * 
     */
    create<T extends RecoveryExecutionCreateArgs>(args: SelectSubset<T, RecoveryExecutionCreateArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many RecoveryExecutions.
     * @param {RecoveryExecutionCreateManyArgs} args - Arguments to create many RecoveryExecutions.
     * @example
     * // Create many RecoveryExecutions
     * const recoveryExecution = await prisma.recoveryExecution.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecoveryExecutionCreateManyArgs>(args?: SelectSubset<T, RecoveryExecutionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RecoveryExecutions and returns the data saved in the database.
     * @param {RecoveryExecutionCreateManyAndReturnArgs} args - Arguments to create many RecoveryExecutions.
     * @example
     * // Create many RecoveryExecutions
     * const recoveryExecution = await prisma.recoveryExecution.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RecoveryExecutions and only return the `id`
     * const recoveryExecutionWithIdOnly = await prisma.recoveryExecution.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecoveryExecutionCreateManyAndReturnArgs>(args?: SelectSubset<T, RecoveryExecutionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a RecoveryExecution.
     * @param {RecoveryExecutionDeleteArgs} args - Arguments to delete one RecoveryExecution.
     * @example
     * // Delete one RecoveryExecution
     * const RecoveryExecution = await prisma.recoveryExecution.delete({
     *   where: {
     *     // ... filter to delete one RecoveryExecution
     *   }
     * })
     * 
     */
    delete<T extends RecoveryExecutionDeleteArgs>(args: SelectSubset<T, RecoveryExecutionDeleteArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one RecoveryExecution.
     * @param {RecoveryExecutionUpdateArgs} args - Arguments to update one RecoveryExecution.
     * @example
     * // Update one RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecoveryExecutionUpdateArgs>(args: SelectSubset<T, RecoveryExecutionUpdateArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more RecoveryExecutions.
     * @param {RecoveryExecutionDeleteManyArgs} args - Arguments to filter RecoveryExecutions to delete.
     * @example
     * // Delete a few RecoveryExecutions
     * const { count } = await prisma.recoveryExecution.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecoveryExecutionDeleteManyArgs>(args?: SelectSubset<T, RecoveryExecutionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecoveryExecutions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RecoveryExecutions
     * const recoveryExecution = await prisma.recoveryExecution.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecoveryExecutionUpdateManyArgs>(args: SelectSubset<T, RecoveryExecutionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one RecoveryExecution.
     * @param {RecoveryExecutionUpsertArgs} args - Arguments to update or create a RecoveryExecution.
     * @example
     * // Update or create a RecoveryExecution
     * const recoveryExecution = await prisma.recoveryExecution.upsert({
     *   create: {
     *     // ... data to create a RecoveryExecution
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RecoveryExecution we want to update
     *   }
     * })
     */
    upsert<T extends RecoveryExecutionUpsertArgs>(args: SelectSubset<T, RecoveryExecutionUpsertArgs<ExtArgs>>): Prisma__RecoveryExecutionClient<$Result.GetResult<Prisma.$RecoveryExecutionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of RecoveryExecutions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionCountArgs} args - Arguments to filter RecoveryExecutions to count.
     * @example
     * // Count the number of RecoveryExecutions
     * const count = await prisma.recoveryExecution.count({
     *   where: {
     *     // ... the filter for the RecoveryExecutions we want to count
     *   }
     * })
    **/
    count<T extends RecoveryExecutionCountArgs>(
      args?: Subset<T, RecoveryExecutionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecoveryExecutionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RecoveryExecution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecoveryExecutionAggregateArgs>(args: Subset<T, RecoveryExecutionAggregateArgs>): Prisma.PrismaPromise<GetRecoveryExecutionAggregateType<T>>

    /**
     * Group by RecoveryExecution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecoveryExecutionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecoveryExecutionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecoveryExecutionGroupByArgs['orderBy'] }
        : { orderBy?: RecoveryExecutionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecoveryExecutionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecoveryExecutionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RecoveryExecution model
   */
  readonly fields: RecoveryExecutionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RecoveryExecution.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecoveryExecutionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    error<T extends ErrorDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ErrorDefaultArgs<ExtArgs>>): Prisma__ErrorClient<$Result.GetResult<Prisma.$ErrorPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RecoveryExecution model
   */ 
  interface RecoveryExecutionFieldRefs {
    readonly id: FieldRef<"RecoveryExecution", 'String'>
    readonly errorId: FieldRef<"RecoveryExecution", 'String'>
    readonly strategy: FieldRef<"RecoveryExecution", 'String'>
    readonly action: FieldRef<"RecoveryExecution", 'String'>
    readonly status: FieldRef<"RecoveryExecution", 'String'>
    readonly attempts: FieldRef<"RecoveryExecution", 'Int'>
    readonly maxAttempts: FieldRef<"RecoveryExecution", 'Int'>
    readonly startedAt: FieldRef<"RecoveryExecution", 'DateTime'>
    readonly completedAt: FieldRef<"RecoveryExecution", 'DateTime'>
    readonly nextRetryAt: FieldRef<"RecoveryExecution", 'DateTime'>
    readonly result: FieldRef<"RecoveryExecution", 'Json'>
    readonly errorMessage: FieldRef<"RecoveryExecution", 'String'>
    readonly createdAt: FieldRef<"RecoveryExecution", 'DateTime'>
    readonly updatedAt: FieldRef<"RecoveryExecution", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RecoveryExecution findUnique
   */
  export type RecoveryExecutionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryExecution to fetch.
     */
    where: RecoveryExecutionWhereUniqueInput
  }

  /**
   * RecoveryExecution findUniqueOrThrow
   */
  export type RecoveryExecutionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryExecution to fetch.
     */
    where: RecoveryExecutionWhereUniqueInput
  }

  /**
   * RecoveryExecution findFirst
   */
  export type RecoveryExecutionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryExecution to fetch.
     */
    where?: RecoveryExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryExecutions to fetch.
     */
    orderBy?: RecoveryExecutionOrderByWithRelationInput | RecoveryExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecoveryExecutions.
     */
    cursor?: RecoveryExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecoveryExecutions.
     */
    distinct?: RecoveryExecutionScalarFieldEnum | RecoveryExecutionScalarFieldEnum[]
  }

  /**
   * RecoveryExecution findFirstOrThrow
   */
  export type RecoveryExecutionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryExecution to fetch.
     */
    where?: RecoveryExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryExecutions to fetch.
     */
    orderBy?: RecoveryExecutionOrderByWithRelationInput | RecoveryExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecoveryExecutions.
     */
    cursor?: RecoveryExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryExecutions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecoveryExecutions.
     */
    distinct?: RecoveryExecutionScalarFieldEnum | RecoveryExecutionScalarFieldEnum[]
  }

  /**
   * RecoveryExecution findMany
   */
  export type RecoveryExecutionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter, which RecoveryExecutions to fetch.
     */
    where?: RecoveryExecutionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecoveryExecutions to fetch.
     */
    orderBy?: RecoveryExecutionOrderByWithRelationInput | RecoveryExecutionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RecoveryExecutions.
     */
    cursor?: RecoveryExecutionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecoveryExecutions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecoveryExecutions.
     */
    skip?: number
    distinct?: RecoveryExecutionScalarFieldEnum | RecoveryExecutionScalarFieldEnum[]
  }

  /**
   * RecoveryExecution create
   */
  export type RecoveryExecutionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * The data needed to create a RecoveryExecution.
     */
    data: XOR<RecoveryExecutionCreateInput, RecoveryExecutionUncheckedCreateInput>
  }

  /**
   * RecoveryExecution createMany
   */
  export type RecoveryExecutionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RecoveryExecutions.
     */
    data: RecoveryExecutionCreateManyInput | RecoveryExecutionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RecoveryExecution createManyAndReturn
   */
  export type RecoveryExecutionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many RecoveryExecutions.
     */
    data: RecoveryExecutionCreateManyInput | RecoveryExecutionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecoveryExecution update
   */
  export type RecoveryExecutionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * The data needed to update a RecoveryExecution.
     */
    data: XOR<RecoveryExecutionUpdateInput, RecoveryExecutionUncheckedUpdateInput>
    /**
     * Choose, which RecoveryExecution to update.
     */
    where: RecoveryExecutionWhereUniqueInput
  }

  /**
   * RecoveryExecution updateMany
   */
  export type RecoveryExecutionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RecoveryExecutions.
     */
    data: XOR<RecoveryExecutionUpdateManyMutationInput, RecoveryExecutionUncheckedUpdateManyInput>
    /**
     * Filter which RecoveryExecutions to update
     */
    where?: RecoveryExecutionWhereInput
  }

  /**
   * RecoveryExecution upsert
   */
  export type RecoveryExecutionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * The filter to search for the RecoveryExecution to update in case it exists.
     */
    where: RecoveryExecutionWhereUniqueInput
    /**
     * In case the RecoveryExecution found by the `where` argument doesn't exist, create a new RecoveryExecution with this data.
     */
    create: XOR<RecoveryExecutionCreateInput, RecoveryExecutionUncheckedCreateInput>
    /**
     * In case the RecoveryExecution was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecoveryExecutionUpdateInput, RecoveryExecutionUncheckedUpdateInput>
  }

  /**
   * RecoveryExecution delete
   */
  export type RecoveryExecutionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
    /**
     * Filter which RecoveryExecution to delete.
     */
    where: RecoveryExecutionWhereUniqueInput
  }

  /**
   * RecoveryExecution deleteMany
   */
  export type RecoveryExecutionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecoveryExecutions to delete
     */
    where?: RecoveryExecutionWhereInput
  }

  /**
   * RecoveryExecution without action
   */
  export type RecoveryExecutionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecoveryExecution
     */
    select?: RecoveryExecutionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecoveryExecutionInclude<ExtArgs> | null
  }


  /**
   * Model ErrorPattern
   */

  export type AggregateErrorPattern = {
    _count: ErrorPatternCountAggregateOutputType | null
    _avg: ErrorPatternAvgAggregateOutputType | null
    _sum: ErrorPatternSumAggregateOutputType | null
    _min: ErrorPatternMinAggregateOutputType | null
    _max: ErrorPatternMaxAggregateOutputType | null
  }

  export type ErrorPatternAvgAggregateOutputType = {
    matchCount: number | null
  }

  export type ErrorPatternSumAggregateOutputType = {
    matchCount: number | null
  }

  export type ErrorPatternMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    pattern: string | null
    category: string | null
    severity: string | null
    matchCount: number | null
    lastMatched: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorPatternMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    pattern: string | null
    category: string | null
    severity: string | null
    matchCount: number | null
    lastMatched: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorPatternCountAggregateOutputType = {
    id: number
    name: number
    description: number
    pattern: number
    category: number
    severity: number
    tags: number
    recoveryActions: number
    matchCount: number
    lastMatched: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ErrorPatternAvgAggregateInputType = {
    matchCount?: true
  }

  export type ErrorPatternSumAggregateInputType = {
    matchCount?: true
  }

  export type ErrorPatternMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    pattern?: true
    category?: true
    severity?: true
    matchCount?: true
    lastMatched?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorPatternMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    pattern?: true
    category?: true
    severity?: true
    matchCount?: true
    lastMatched?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorPatternCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    pattern?: true
    category?: true
    severity?: true
    tags?: true
    recoveryActions?: true
    matchCount?: true
    lastMatched?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ErrorPatternAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorPattern to aggregate.
     */
    where?: ErrorPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorPatterns to fetch.
     */
    orderBy?: ErrorPatternOrderByWithRelationInput | ErrorPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ErrorPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ErrorPatterns
    **/
    _count?: true | ErrorPatternCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ErrorPatternAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ErrorPatternSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ErrorPatternMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ErrorPatternMaxAggregateInputType
  }

  export type GetErrorPatternAggregateType<T extends ErrorPatternAggregateArgs> = {
        [P in keyof T & keyof AggregateErrorPattern]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateErrorPattern[P]>
      : GetScalarType<T[P], AggregateErrorPattern[P]>
  }




  export type ErrorPatternGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorPatternWhereInput
    orderBy?: ErrorPatternOrderByWithAggregationInput | ErrorPatternOrderByWithAggregationInput[]
    by: ErrorPatternScalarFieldEnum[] | ErrorPatternScalarFieldEnum
    having?: ErrorPatternScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ErrorPatternCountAggregateInputType | true
    _avg?: ErrorPatternAvgAggregateInputType
    _sum?: ErrorPatternSumAggregateInputType
    _min?: ErrorPatternMinAggregateInputType
    _max?: ErrorPatternMaxAggregateInputType
  }

  export type ErrorPatternGroupByOutputType = {
    id: string
    name: string
    description: string
    pattern: string
    category: string
    severity: string
    tags: string[]
    recoveryActions: string[]
    matchCount: number
    lastMatched: Date | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: ErrorPatternCountAggregateOutputType | null
    _avg: ErrorPatternAvgAggregateOutputType | null
    _sum: ErrorPatternSumAggregateOutputType | null
    _min: ErrorPatternMinAggregateOutputType | null
    _max: ErrorPatternMaxAggregateOutputType | null
  }

  type GetErrorPatternGroupByPayload<T extends ErrorPatternGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ErrorPatternGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ErrorPatternGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ErrorPatternGroupByOutputType[P]>
            : GetScalarType<T[P], ErrorPatternGroupByOutputType[P]>
        }
      >
    >


  export type ErrorPatternSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    pattern?: boolean
    category?: boolean
    severity?: boolean
    tags?: boolean
    recoveryActions?: boolean
    matchCount?: boolean
    lastMatched?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["errorPattern"]>

  export type ErrorPatternSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    pattern?: boolean
    category?: boolean
    severity?: boolean
    tags?: boolean
    recoveryActions?: boolean
    matchCount?: boolean
    lastMatched?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["errorPattern"]>

  export type ErrorPatternSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    pattern?: boolean
    category?: boolean
    severity?: boolean
    tags?: boolean
    recoveryActions?: boolean
    matchCount?: boolean
    lastMatched?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ErrorPatternPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ErrorPattern"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string
      pattern: string
      category: string
      severity: string
      tags: string[]
      recoveryActions: string[]
      matchCount: number
      lastMatched: Date | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["errorPattern"]>
    composites: {}
  }

  type ErrorPatternGetPayload<S extends boolean | null | undefined | ErrorPatternDefaultArgs> = $Result.GetResult<Prisma.$ErrorPatternPayload, S>

  type ErrorPatternCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ErrorPatternFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ErrorPatternCountAggregateInputType | true
    }

  export interface ErrorPatternDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ErrorPattern'], meta: { name: 'ErrorPattern' } }
    /**
     * Find zero or one ErrorPattern that matches the filter.
     * @param {ErrorPatternFindUniqueArgs} args - Arguments to find a ErrorPattern
     * @example
     * // Get one ErrorPattern
     * const errorPattern = await prisma.errorPattern.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ErrorPatternFindUniqueArgs>(args: SelectSubset<T, ErrorPatternFindUniqueArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ErrorPattern that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ErrorPatternFindUniqueOrThrowArgs} args - Arguments to find a ErrorPattern
     * @example
     * // Get one ErrorPattern
     * const errorPattern = await prisma.errorPattern.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ErrorPatternFindUniqueOrThrowArgs>(args: SelectSubset<T, ErrorPatternFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ErrorPattern that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternFindFirstArgs} args - Arguments to find a ErrorPattern
     * @example
     * // Get one ErrorPattern
     * const errorPattern = await prisma.errorPattern.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ErrorPatternFindFirstArgs>(args?: SelectSubset<T, ErrorPatternFindFirstArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ErrorPattern that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternFindFirstOrThrowArgs} args - Arguments to find a ErrorPattern
     * @example
     * // Get one ErrorPattern
     * const errorPattern = await prisma.errorPattern.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ErrorPatternFindFirstOrThrowArgs>(args?: SelectSubset<T, ErrorPatternFindFirstOrThrowArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ErrorPatterns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ErrorPatterns
     * const errorPatterns = await prisma.errorPattern.findMany()
     * 
     * // Get first 10 ErrorPatterns
     * const errorPatterns = await prisma.errorPattern.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const errorPatternWithIdOnly = await prisma.errorPattern.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ErrorPatternFindManyArgs>(args?: SelectSubset<T, ErrorPatternFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ErrorPattern.
     * @param {ErrorPatternCreateArgs} args - Arguments to create a ErrorPattern.
     * @example
     * // Create one ErrorPattern
     * const ErrorPattern = await prisma.errorPattern.create({
     *   data: {
     *     // ... data to create a ErrorPattern
     *   }
     * })
     * 
     */
    create<T extends ErrorPatternCreateArgs>(args: SelectSubset<T, ErrorPatternCreateArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ErrorPatterns.
     * @param {ErrorPatternCreateManyArgs} args - Arguments to create many ErrorPatterns.
     * @example
     * // Create many ErrorPatterns
     * const errorPattern = await prisma.errorPattern.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ErrorPatternCreateManyArgs>(args?: SelectSubset<T, ErrorPatternCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ErrorPatterns and returns the data saved in the database.
     * @param {ErrorPatternCreateManyAndReturnArgs} args - Arguments to create many ErrorPatterns.
     * @example
     * // Create many ErrorPatterns
     * const errorPattern = await prisma.errorPattern.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ErrorPatterns and only return the `id`
     * const errorPatternWithIdOnly = await prisma.errorPattern.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ErrorPatternCreateManyAndReturnArgs>(args?: SelectSubset<T, ErrorPatternCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ErrorPattern.
     * @param {ErrorPatternDeleteArgs} args - Arguments to delete one ErrorPattern.
     * @example
     * // Delete one ErrorPattern
     * const ErrorPattern = await prisma.errorPattern.delete({
     *   where: {
     *     // ... filter to delete one ErrorPattern
     *   }
     * })
     * 
     */
    delete<T extends ErrorPatternDeleteArgs>(args: SelectSubset<T, ErrorPatternDeleteArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ErrorPattern.
     * @param {ErrorPatternUpdateArgs} args - Arguments to update one ErrorPattern.
     * @example
     * // Update one ErrorPattern
     * const errorPattern = await prisma.errorPattern.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ErrorPatternUpdateArgs>(args: SelectSubset<T, ErrorPatternUpdateArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ErrorPatterns.
     * @param {ErrorPatternDeleteManyArgs} args - Arguments to filter ErrorPatterns to delete.
     * @example
     * // Delete a few ErrorPatterns
     * const { count } = await prisma.errorPattern.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ErrorPatternDeleteManyArgs>(args?: SelectSubset<T, ErrorPatternDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ErrorPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ErrorPatterns
     * const errorPattern = await prisma.errorPattern.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ErrorPatternUpdateManyArgs>(args: SelectSubset<T, ErrorPatternUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ErrorPattern.
     * @param {ErrorPatternUpsertArgs} args - Arguments to update or create a ErrorPattern.
     * @example
     * // Update or create a ErrorPattern
     * const errorPattern = await prisma.errorPattern.upsert({
     *   create: {
     *     // ... data to create a ErrorPattern
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ErrorPattern we want to update
     *   }
     * })
     */
    upsert<T extends ErrorPatternUpsertArgs>(args: SelectSubset<T, ErrorPatternUpsertArgs<ExtArgs>>): Prisma__ErrorPatternClient<$Result.GetResult<Prisma.$ErrorPatternPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ErrorPatterns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternCountArgs} args - Arguments to filter ErrorPatterns to count.
     * @example
     * // Count the number of ErrorPatterns
     * const count = await prisma.errorPattern.count({
     *   where: {
     *     // ... the filter for the ErrorPatterns we want to count
     *   }
     * })
    **/
    count<T extends ErrorPatternCountArgs>(
      args?: Subset<T, ErrorPatternCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ErrorPatternCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ErrorPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ErrorPatternAggregateArgs>(args: Subset<T, ErrorPatternAggregateArgs>): Prisma.PrismaPromise<GetErrorPatternAggregateType<T>>

    /**
     * Group by ErrorPattern.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorPatternGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ErrorPatternGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ErrorPatternGroupByArgs['orderBy'] }
        : { orderBy?: ErrorPatternGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ErrorPatternGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetErrorPatternGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ErrorPattern model
   */
  readonly fields: ErrorPatternFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ErrorPattern.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ErrorPatternClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ErrorPattern model
   */ 
  interface ErrorPatternFieldRefs {
    readonly id: FieldRef<"ErrorPattern", 'String'>
    readonly name: FieldRef<"ErrorPattern", 'String'>
    readonly description: FieldRef<"ErrorPattern", 'String'>
    readonly pattern: FieldRef<"ErrorPattern", 'String'>
    readonly category: FieldRef<"ErrorPattern", 'String'>
    readonly severity: FieldRef<"ErrorPattern", 'String'>
    readonly tags: FieldRef<"ErrorPattern", 'String[]'>
    readonly recoveryActions: FieldRef<"ErrorPattern", 'String[]'>
    readonly matchCount: FieldRef<"ErrorPattern", 'Int'>
    readonly lastMatched: FieldRef<"ErrorPattern", 'DateTime'>
    readonly isActive: FieldRef<"ErrorPattern", 'Boolean'>
    readonly createdAt: FieldRef<"ErrorPattern", 'DateTime'>
    readonly updatedAt: FieldRef<"ErrorPattern", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ErrorPattern findUnique
   */
  export type ErrorPatternFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter, which ErrorPattern to fetch.
     */
    where: ErrorPatternWhereUniqueInput
  }

  /**
   * ErrorPattern findUniqueOrThrow
   */
  export type ErrorPatternFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter, which ErrorPattern to fetch.
     */
    where: ErrorPatternWhereUniqueInput
  }

  /**
   * ErrorPattern findFirst
   */
  export type ErrorPatternFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter, which ErrorPattern to fetch.
     */
    where?: ErrorPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorPatterns to fetch.
     */
    orderBy?: ErrorPatternOrderByWithRelationInput | ErrorPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorPatterns.
     */
    cursor?: ErrorPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorPatterns.
     */
    distinct?: ErrorPatternScalarFieldEnum | ErrorPatternScalarFieldEnum[]
  }

  /**
   * ErrorPattern findFirstOrThrow
   */
  export type ErrorPatternFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter, which ErrorPattern to fetch.
     */
    where?: ErrorPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorPatterns to fetch.
     */
    orderBy?: ErrorPatternOrderByWithRelationInput | ErrorPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorPatterns.
     */
    cursor?: ErrorPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorPatterns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorPatterns.
     */
    distinct?: ErrorPatternScalarFieldEnum | ErrorPatternScalarFieldEnum[]
  }

  /**
   * ErrorPattern findMany
   */
  export type ErrorPatternFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter, which ErrorPatterns to fetch.
     */
    where?: ErrorPatternWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorPatterns to fetch.
     */
    orderBy?: ErrorPatternOrderByWithRelationInput | ErrorPatternOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ErrorPatterns.
     */
    cursor?: ErrorPatternWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorPatterns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorPatterns.
     */
    skip?: number
    distinct?: ErrorPatternScalarFieldEnum | ErrorPatternScalarFieldEnum[]
  }

  /**
   * ErrorPattern create
   */
  export type ErrorPatternCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * The data needed to create a ErrorPattern.
     */
    data: XOR<ErrorPatternCreateInput, ErrorPatternUncheckedCreateInput>
  }

  /**
   * ErrorPattern createMany
   */
  export type ErrorPatternCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ErrorPatterns.
     */
    data: ErrorPatternCreateManyInput | ErrorPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ErrorPattern createManyAndReturn
   */
  export type ErrorPatternCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ErrorPatterns.
     */
    data: ErrorPatternCreateManyInput | ErrorPatternCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ErrorPattern update
   */
  export type ErrorPatternUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * The data needed to update a ErrorPattern.
     */
    data: XOR<ErrorPatternUpdateInput, ErrorPatternUncheckedUpdateInput>
    /**
     * Choose, which ErrorPattern to update.
     */
    where: ErrorPatternWhereUniqueInput
  }

  /**
   * ErrorPattern updateMany
   */
  export type ErrorPatternUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ErrorPatterns.
     */
    data: XOR<ErrorPatternUpdateManyMutationInput, ErrorPatternUncheckedUpdateManyInput>
    /**
     * Filter which ErrorPatterns to update
     */
    where?: ErrorPatternWhereInput
  }

  /**
   * ErrorPattern upsert
   */
  export type ErrorPatternUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * The filter to search for the ErrorPattern to update in case it exists.
     */
    where: ErrorPatternWhereUniqueInput
    /**
     * In case the ErrorPattern found by the `where` argument doesn't exist, create a new ErrorPattern with this data.
     */
    create: XOR<ErrorPatternCreateInput, ErrorPatternUncheckedCreateInput>
    /**
     * In case the ErrorPattern was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ErrorPatternUpdateInput, ErrorPatternUncheckedUpdateInput>
  }

  /**
   * ErrorPattern delete
   */
  export type ErrorPatternDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
    /**
     * Filter which ErrorPattern to delete.
     */
    where: ErrorPatternWhereUniqueInput
  }

  /**
   * ErrorPattern deleteMany
   */
  export type ErrorPatternDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorPatterns to delete
     */
    where?: ErrorPatternWhereInput
  }

  /**
   * ErrorPattern without action
   */
  export type ErrorPatternDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorPattern
     */
    select?: ErrorPatternSelect<ExtArgs> | null
  }


  /**
   * Model ErrorAggregation
   */

  export type AggregateErrorAggregation = {
    _count: ErrorAggregationCountAggregateOutputType | null
    _avg: ErrorAggregationAvgAggregateOutputType | null
    _sum: ErrorAggregationSumAggregateOutputType | null
    _min: ErrorAggregationMinAggregateOutputType | null
    _max: ErrorAggregationMaxAggregateOutputType | null
  }

  export type ErrorAggregationAvgAggregateOutputType = {
    count: number | null
    errorCount: number | null
    affectedUsers: number | null
    avgResponseTime: number | null
    hourlyDistribution: number | null
  }

  export type ErrorAggregationSumAggregateOutputType = {
    count: number | null
    errorCount: number | null
    affectedUsers: number | null
    avgResponseTime: number | null
    hourlyDistribution: number[]
  }

  export type ErrorAggregationMinAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    timeWindow: Date | null
    count: number | null
    errorCount: number | null
    affectedUsers: number | null
    avgResponseTime: number | null
    firstSeen: Date | null
    lastSeen: Date | null
    trend: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorAggregationMaxAggregateOutputType = {
    id: string | null
    fingerprint: string | null
    timeWindow: Date | null
    count: number | null
    errorCount: number | null
    affectedUsers: number | null
    avgResponseTime: number | null
    firstSeen: Date | null
    lastSeen: Date | null
    trend: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ErrorAggregationCountAggregateOutputType = {
    id: number
    fingerprint: number
    timeWindow: number
    count: number
    errorCount: number
    affectedUsers: number
    avgResponseTime: number
    firstSeen: number
    lastSeen: number
    trend: number
    hourlyDistribution: number
    topAffectedEndpoints: number
    topAffectedUsers: number
    byService: number
    bySeverity: number
    byEndpoint: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ErrorAggregationAvgAggregateInputType = {
    count?: true
    errorCount?: true
    affectedUsers?: true
    avgResponseTime?: true
    hourlyDistribution?: true
  }

  export type ErrorAggregationSumAggregateInputType = {
    count?: true
    errorCount?: true
    affectedUsers?: true
    avgResponseTime?: true
    hourlyDistribution?: true
  }

  export type ErrorAggregationMinAggregateInputType = {
    id?: true
    fingerprint?: true
    timeWindow?: true
    count?: true
    errorCount?: true
    affectedUsers?: true
    avgResponseTime?: true
    firstSeen?: true
    lastSeen?: true
    trend?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorAggregationMaxAggregateInputType = {
    id?: true
    fingerprint?: true
    timeWindow?: true
    count?: true
    errorCount?: true
    affectedUsers?: true
    avgResponseTime?: true
    firstSeen?: true
    lastSeen?: true
    trend?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ErrorAggregationCountAggregateInputType = {
    id?: true
    fingerprint?: true
    timeWindow?: true
    count?: true
    errorCount?: true
    affectedUsers?: true
    avgResponseTime?: true
    firstSeen?: true
    lastSeen?: true
    trend?: true
    hourlyDistribution?: true
    topAffectedEndpoints?: true
    topAffectedUsers?: true
    byService?: true
    bySeverity?: true
    byEndpoint?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ErrorAggregationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorAggregation to aggregate.
     */
    where?: ErrorAggregationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorAggregations to fetch.
     */
    orderBy?: ErrorAggregationOrderByWithRelationInput | ErrorAggregationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ErrorAggregationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorAggregations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorAggregations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ErrorAggregations
    **/
    _count?: true | ErrorAggregationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ErrorAggregationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ErrorAggregationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ErrorAggregationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ErrorAggregationMaxAggregateInputType
  }

  export type GetErrorAggregationAggregateType<T extends ErrorAggregationAggregateArgs> = {
        [P in keyof T & keyof AggregateErrorAggregation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateErrorAggregation[P]>
      : GetScalarType<T[P], AggregateErrorAggregation[P]>
  }




  export type ErrorAggregationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ErrorAggregationWhereInput
    orderBy?: ErrorAggregationOrderByWithAggregationInput | ErrorAggregationOrderByWithAggregationInput[]
    by: ErrorAggregationScalarFieldEnum[] | ErrorAggregationScalarFieldEnum
    having?: ErrorAggregationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ErrorAggregationCountAggregateInputType | true
    _avg?: ErrorAggregationAvgAggregateInputType
    _sum?: ErrorAggregationSumAggregateInputType
    _min?: ErrorAggregationMinAggregateInputType
    _max?: ErrorAggregationMaxAggregateInputType
  }

  export type ErrorAggregationGroupByOutputType = {
    id: string
    fingerprint: string
    timeWindow: Date | null
    count: number
    errorCount: number
    affectedUsers: number
    avgResponseTime: number | null
    firstSeen: Date
    lastSeen: Date
    trend: string
    hourlyDistribution: number[]
    topAffectedEndpoints: JsonValue | null
    topAffectedUsers: JsonValue | null
    byService: JsonValue | null
    bySeverity: JsonValue | null
    byEndpoint: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ErrorAggregationCountAggregateOutputType | null
    _avg: ErrorAggregationAvgAggregateOutputType | null
    _sum: ErrorAggregationSumAggregateOutputType | null
    _min: ErrorAggregationMinAggregateOutputType | null
    _max: ErrorAggregationMaxAggregateOutputType | null
  }

  type GetErrorAggregationGroupByPayload<T extends ErrorAggregationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ErrorAggregationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ErrorAggregationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ErrorAggregationGroupByOutputType[P]>
            : GetScalarType<T[P], ErrorAggregationGroupByOutputType[P]>
        }
      >
    >


  export type ErrorAggregationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    timeWindow?: boolean
    count?: boolean
    errorCount?: boolean
    affectedUsers?: boolean
    avgResponseTime?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    trend?: boolean
    hourlyDistribution?: boolean
    topAffectedEndpoints?: boolean
    topAffectedUsers?: boolean
    byService?: boolean
    bySeverity?: boolean
    byEndpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["errorAggregation"]>

  export type ErrorAggregationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fingerprint?: boolean
    timeWindow?: boolean
    count?: boolean
    errorCount?: boolean
    affectedUsers?: boolean
    avgResponseTime?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    trend?: boolean
    hourlyDistribution?: boolean
    topAffectedEndpoints?: boolean
    topAffectedUsers?: boolean
    byService?: boolean
    bySeverity?: boolean
    byEndpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["errorAggregation"]>

  export type ErrorAggregationSelectScalar = {
    id?: boolean
    fingerprint?: boolean
    timeWindow?: boolean
    count?: boolean
    errorCount?: boolean
    affectedUsers?: boolean
    avgResponseTime?: boolean
    firstSeen?: boolean
    lastSeen?: boolean
    trend?: boolean
    hourlyDistribution?: boolean
    topAffectedEndpoints?: boolean
    topAffectedUsers?: boolean
    byService?: boolean
    bySeverity?: boolean
    byEndpoint?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ErrorAggregationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ErrorAggregation"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fingerprint: string
      timeWindow: Date | null
      count: number
      errorCount: number
      affectedUsers: number
      avgResponseTime: number | null
      firstSeen: Date
      lastSeen: Date
      trend: string
      hourlyDistribution: number[]
      topAffectedEndpoints: Prisma.JsonValue | null
      topAffectedUsers: Prisma.JsonValue | null
      byService: Prisma.JsonValue | null
      bySeverity: Prisma.JsonValue | null
      byEndpoint: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["errorAggregation"]>
    composites: {}
  }

  type ErrorAggregationGetPayload<S extends boolean | null | undefined | ErrorAggregationDefaultArgs> = $Result.GetResult<Prisma.$ErrorAggregationPayload, S>

  type ErrorAggregationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ErrorAggregationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ErrorAggregationCountAggregateInputType | true
    }

  export interface ErrorAggregationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ErrorAggregation'], meta: { name: 'ErrorAggregation' } }
    /**
     * Find zero or one ErrorAggregation that matches the filter.
     * @param {ErrorAggregationFindUniqueArgs} args - Arguments to find a ErrorAggregation
     * @example
     * // Get one ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ErrorAggregationFindUniqueArgs>(args: SelectSubset<T, ErrorAggregationFindUniqueArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ErrorAggregation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ErrorAggregationFindUniqueOrThrowArgs} args - Arguments to find a ErrorAggregation
     * @example
     * // Get one ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ErrorAggregationFindUniqueOrThrowArgs>(args: SelectSubset<T, ErrorAggregationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ErrorAggregation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationFindFirstArgs} args - Arguments to find a ErrorAggregation
     * @example
     * // Get one ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ErrorAggregationFindFirstArgs>(args?: SelectSubset<T, ErrorAggregationFindFirstArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ErrorAggregation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationFindFirstOrThrowArgs} args - Arguments to find a ErrorAggregation
     * @example
     * // Get one ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ErrorAggregationFindFirstOrThrowArgs>(args?: SelectSubset<T, ErrorAggregationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ErrorAggregations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ErrorAggregations
     * const errorAggregations = await prisma.errorAggregation.findMany()
     * 
     * // Get first 10 ErrorAggregations
     * const errorAggregations = await prisma.errorAggregation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const errorAggregationWithIdOnly = await prisma.errorAggregation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ErrorAggregationFindManyArgs>(args?: SelectSubset<T, ErrorAggregationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ErrorAggregation.
     * @param {ErrorAggregationCreateArgs} args - Arguments to create a ErrorAggregation.
     * @example
     * // Create one ErrorAggregation
     * const ErrorAggregation = await prisma.errorAggregation.create({
     *   data: {
     *     // ... data to create a ErrorAggregation
     *   }
     * })
     * 
     */
    create<T extends ErrorAggregationCreateArgs>(args: SelectSubset<T, ErrorAggregationCreateArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ErrorAggregations.
     * @param {ErrorAggregationCreateManyArgs} args - Arguments to create many ErrorAggregations.
     * @example
     * // Create many ErrorAggregations
     * const errorAggregation = await prisma.errorAggregation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ErrorAggregationCreateManyArgs>(args?: SelectSubset<T, ErrorAggregationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ErrorAggregations and returns the data saved in the database.
     * @param {ErrorAggregationCreateManyAndReturnArgs} args - Arguments to create many ErrorAggregations.
     * @example
     * // Create many ErrorAggregations
     * const errorAggregation = await prisma.errorAggregation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ErrorAggregations and only return the `id`
     * const errorAggregationWithIdOnly = await prisma.errorAggregation.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ErrorAggregationCreateManyAndReturnArgs>(args?: SelectSubset<T, ErrorAggregationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ErrorAggregation.
     * @param {ErrorAggregationDeleteArgs} args - Arguments to delete one ErrorAggregation.
     * @example
     * // Delete one ErrorAggregation
     * const ErrorAggregation = await prisma.errorAggregation.delete({
     *   where: {
     *     // ... filter to delete one ErrorAggregation
     *   }
     * })
     * 
     */
    delete<T extends ErrorAggregationDeleteArgs>(args: SelectSubset<T, ErrorAggregationDeleteArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ErrorAggregation.
     * @param {ErrorAggregationUpdateArgs} args - Arguments to update one ErrorAggregation.
     * @example
     * // Update one ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ErrorAggregationUpdateArgs>(args: SelectSubset<T, ErrorAggregationUpdateArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ErrorAggregations.
     * @param {ErrorAggregationDeleteManyArgs} args - Arguments to filter ErrorAggregations to delete.
     * @example
     * // Delete a few ErrorAggregations
     * const { count } = await prisma.errorAggregation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ErrorAggregationDeleteManyArgs>(args?: SelectSubset<T, ErrorAggregationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ErrorAggregations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ErrorAggregations
     * const errorAggregation = await prisma.errorAggregation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ErrorAggregationUpdateManyArgs>(args: SelectSubset<T, ErrorAggregationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ErrorAggregation.
     * @param {ErrorAggregationUpsertArgs} args - Arguments to update or create a ErrorAggregation.
     * @example
     * // Update or create a ErrorAggregation
     * const errorAggregation = await prisma.errorAggregation.upsert({
     *   create: {
     *     // ... data to create a ErrorAggregation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ErrorAggregation we want to update
     *   }
     * })
     */
    upsert<T extends ErrorAggregationUpsertArgs>(args: SelectSubset<T, ErrorAggregationUpsertArgs<ExtArgs>>): Prisma__ErrorAggregationClient<$Result.GetResult<Prisma.$ErrorAggregationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ErrorAggregations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationCountArgs} args - Arguments to filter ErrorAggregations to count.
     * @example
     * // Count the number of ErrorAggregations
     * const count = await prisma.errorAggregation.count({
     *   where: {
     *     // ... the filter for the ErrorAggregations we want to count
     *   }
     * })
    **/
    count<T extends ErrorAggregationCountArgs>(
      args?: Subset<T, ErrorAggregationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ErrorAggregationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ErrorAggregation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ErrorAggregationAggregateArgs>(args: Subset<T, ErrorAggregationAggregateArgs>): Prisma.PrismaPromise<GetErrorAggregationAggregateType<T>>

    /**
     * Group by ErrorAggregation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ErrorAggregationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ErrorAggregationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ErrorAggregationGroupByArgs['orderBy'] }
        : { orderBy?: ErrorAggregationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ErrorAggregationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetErrorAggregationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ErrorAggregation model
   */
  readonly fields: ErrorAggregationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ErrorAggregation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ErrorAggregationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ErrorAggregation model
   */ 
  interface ErrorAggregationFieldRefs {
    readonly id: FieldRef<"ErrorAggregation", 'String'>
    readonly fingerprint: FieldRef<"ErrorAggregation", 'String'>
    readonly timeWindow: FieldRef<"ErrorAggregation", 'DateTime'>
    readonly count: FieldRef<"ErrorAggregation", 'Int'>
    readonly errorCount: FieldRef<"ErrorAggregation", 'Int'>
    readonly affectedUsers: FieldRef<"ErrorAggregation", 'Int'>
    readonly avgResponseTime: FieldRef<"ErrorAggregation", 'Float'>
    readonly firstSeen: FieldRef<"ErrorAggregation", 'DateTime'>
    readonly lastSeen: FieldRef<"ErrorAggregation", 'DateTime'>
    readonly trend: FieldRef<"ErrorAggregation", 'String'>
    readonly hourlyDistribution: FieldRef<"ErrorAggregation", 'Int[]'>
    readonly topAffectedEndpoints: FieldRef<"ErrorAggregation", 'Json'>
    readonly topAffectedUsers: FieldRef<"ErrorAggregation", 'Json'>
    readonly byService: FieldRef<"ErrorAggregation", 'Json'>
    readonly bySeverity: FieldRef<"ErrorAggregation", 'Json'>
    readonly byEndpoint: FieldRef<"ErrorAggregation", 'Json'>
    readonly createdAt: FieldRef<"ErrorAggregation", 'DateTime'>
    readonly updatedAt: FieldRef<"ErrorAggregation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ErrorAggregation findUnique
   */
  export type ErrorAggregationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter, which ErrorAggregation to fetch.
     */
    where: ErrorAggregationWhereUniqueInput
  }

  /**
   * ErrorAggregation findUniqueOrThrow
   */
  export type ErrorAggregationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter, which ErrorAggregation to fetch.
     */
    where: ErrorAggregationWhereUniqueInput
  }

  /**
   * ErrorAggregation findFirst
   */
  export type ErrorAggregationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter, which ErrorAggregation to fetch.
     */
    where?: ErrorAggregationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorAggregations to fetch.
     */
    orderBy?: ErrorAggregationOrderByWithRelationInput | ErrorAggregationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorAggregations.
     */
    cursor?: ErrorAggregationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorAggregations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorAggregations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorAggregations.
     */
    distinct?: ErrorAggregationScalarFieldEnum | ErrorAggregationScalarFieldEnum[]
  }

  /**
   * ErrorAggregation findFirstOrThrow
   */
  export type ErrorAggregationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter, which ErrorAggregation to fetch.
     */
    where?: ErrorAggregationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorAggregations to fetch.
     */
    orderBy?: ErrorAggregationOrderByWithRelationInput | ErrorAggregationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ErrorAggregations.
     */
    cursor?: ErrorAggregationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorAggregations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorAggregations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ErrorAggregations.
     */
    distinct?: ErrorAggregationScalarFieldEnum | ErrorAggregationScalarFieldEnum[]
  }

  /**
   * ErrorAggregation findMany
   */
  export type ErrorAggregationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter, which ErrorAggregations to fetch.
     */
    where?: ErrorAggregationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ErrorAggregations to fetch.
     */
    orderBy?: ErrorAggregationOrderByWithRelationInput | ErrorAggregationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ErrorAggregations.
     */
    cursor?: ErrorAggregationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ErrorAggregations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ErrorAggregations.
     */
    skip?: number
    distinct?: ErrorAggregationScalarFieldEnum | ErrorAggregationScalarFieldEnum[]
  }

  /**
   * ErrorAggregation create
   */
  export type ErrorAggregationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * The data needed to create a ErrorAggregation.
     */
    data: XOR<ErrorAggregationCreateInput, ErrorAggregationUncheckedCreateInput>
  }

  /**
   * ErrorAggregation createMany
   */
  export type ErrorAggregationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ErrorAggregations.
     */
    data: ErrorAggregationCreateManyInput | ErrorAggregationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ErrorAggregation createManyAndReturn
   */
  export type ErrorAggregationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ErrorAggregations.
     */
    data: ErrorAggregationCreateManyInput | ErrorAggregationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ErrorAggregation update
   */
  export type ErrorAggregationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * The data needed to update a ErrorAggregation.
     */
    data: XOR<ErrorAggregationUpdateInput, ErrorAggregationUncheckedUpdateInput>
    /**
     * Choose, which ErrorAggregation to update.
     */
    where: ErrorAggregationWhereUniqueInput
  }

  /**
   * ErrorAggregation updateMany
   */
  export type ErrorAggregationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ErrorAggregations.
     */
    data: XOR<ErrorAggregationUpdateManyMutationInput, ErrorAggregationUncheckedUpdateManyInput>
    /**
     * Filter which ErrorAggregations to update
     */
    where?: ErrorAggregationWhereInput
  }

  /**
   * ErrorAggregation upsert
   */
  export type ErrorAggregationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * The filter to search for the ErrorAggregation to update in case it exists.
     */
    where: ErrorAggregationWhereUniqueInput
    /**
     * In case the ErrorAggregation found by the `where` argument doesn't exist, create a new ErrorAggregation with this data.
     */
    create: XOR<ErrorAggregationCreateInput, ErrorAggregationUncheckedCreateInput>
    /**
     * In case the ErrorAggregation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ErrorAggregationUpdateInput, ErrorAggregationUncheckedUpdateInput>
  }

  /**
   * ErrorAggregation delete
   */
  export type ErrorAggregationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
    /**
     * Filter which ErrorAggregation to delete.
     */
    where: ErrorAggregationWhereUniqueInput
  }

  /**
   * ErrorAggregation deleteMany
   */
  export type ErrorAggregationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ErrorAggregations to delete
     */
    where?: ErrorAggregationWhereInput
  }

  /**
   * ErrorAggregation without action
   */
  export type ErrorAggregationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ErrorAggregation
     */
    select?: ErrorAggregationSelect<ExtArgs> | null
  }


  /**
   * Model AlertConfiguration
   */

  export type AggregateAlertConfiguration = {
    _count: AlertConfigurationCountAggregateOutputType | null
    _avg: AlertConfigurationAvgAggregateOutputType | null
    _sum: AlertConfigurationSumAggregateOutputType | null
    _min: AlertConfigurationMinAggregateOutputType | null
    _max: AlertConfigurationMaxAggregateOutputType | null
  }

  export type AlertConfigurationAvgAggregateOutputType = {
    threshold: number | null
    timeWindow: number | null
    triggerCount: number | null
  }

  export type AlertConfigurationSumAggregateOutputType = {
    threshold: number | null
    timeWindow: number | null
    triggerCount: number | null
  }

  export type AlertConfigurationMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    condition: string | null
    threshold: number | null
    timeWindow: number | null
    isActive: boolean | null
    lastTriggered: Date | null
    triggerCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlertConfigurationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    condition: string | null
    threshold: number | null
    timeWindow: number | null
    isActive: boolean | null
    lastTriggered: Date | null
    triggerCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlertConfigurationCountAggregateOutputType = {
    id: number
    name: number
    description: number
    condition: number
    threshold: number
    timeWindow: number
    severity: number
    services: number
    categories: number
    actions: number
    isActive: number
    lastTriggered: number
    triggerCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AlertConfigurationAvgAggregateInputType = {
    threshold?: true
    timeWindow?: true
    triggerCount?: true
  }

  export type AlertConfigurationSumAggregateInputType = {
    threshold?: true
    timeWindow?: true
    triggerCount?: true
  }

  export type AlertConfigurationMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    condition?: true
    threshold?: true
    timeWindow?: true
    isActive?: true
    lastTriggered?: true
    triggerCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlertConfigurationMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    condition?: true
    threshold?: true
    timeWindow?: true
    isActive?: true
    lastTriggered?: true
    triggerCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlertConfigurationCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    condition?: true
    threshold?: true
    timeWindow?: true
    severity?: true
    services?: true
    categories?: true
    actions?: true
    isActive?: true
    lastTriggered?: true
    triggerCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AlertConfigurationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertConfiguration to aggregate.
     */
    where?: AlertConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertConfigurations to fetch.
     */
    orderBy?: AlertConfigurationOrderByWithRelationInput | AlertConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AlertConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertConfigurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertConfigurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AlertConfigurations
    **/
    _count?: true | AlertConfigurationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AlertConfigurationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AlertConfigurationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AlertConfigurationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AlertConfigurationMaxAggregateInputType
  }

  export type GetAlertConfigurationAggregateType<T extends AlertConfigurationAggregateArgs> = {
        [P in keyof T & keyof AggregateAlertConfiguration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlertConfiguration[P]>
      : GetScalarType<T[P], AggregateAlertConfiguration[P]>
  }




  export type AlertConfigurationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AlertConfigurationWhereInput
    orderBy?: AlertConfigurationOrderByWithAggregationInput | AlertConfigurationOrderByWithAggregationInput[]
    by: AlertConfigurationScalarFieldEnum[] | AlertConfigurationScalarFieldEnum
    having?: AlertConfigurationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AlertConfigurationCountAggregateInputType | true
    _avg?: AlertConfigurationAvgAggregateInputType
    _sum?: AlertConfigurationSumAggregateInputType
    _min?: AlertConfigurationMinAggregateInputType
    _max?: AlertConfigurationMaxAggregateInputType
  }

  export type AlertConfigurationGroupByOutputType = {
    id: string
    name: string
    description: string | null
    condition: string
    threshold: number | null
    timeWindow: number | null
    severity: string[]
    services: string[]
    categories: string[]
    actions: JsonValue
    isActive: boolean
    lastTriggered: Date | null
    triggerCount: number
    createdAt: Date
    updatedAt: Date
    _count: AlertConfigurationCountAggregateOutputType | null
    _avg: AlertConfigurationAvgAggregateOutputType | null
    _sum: AlertConfigurationSumAggregateOutputType | null
    _min: AlertConfigurationMinAggregateOutputType | null
    _max: AlertConfigurationMaxAggregateOutputType | null
  }

  type GetAlertConfigurationGroupByPayload<T extends AlertConfigurationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AlertConfigurationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AlertConfigurationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AlertConfigurationGroupByOutputType[P]>
            : GetScalarType<T[P], AlertConfigurationGroupByOutputType[P]>
        }
      >
    >


  export type AlertConfigurationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    condition?: boolean
    threshold?: boolean
    timeWindow?: boolean
    severity?: boolean
    services?: boolean
    categories?: boolean
    actions?: boolean
    isActive?: boolean
    lastTriggered?: boolean
    triggerCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["alertConfiguration"]>

  export type AlertConfigurationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    condition?: boolean
    threshold?: boolean
    timeWindow?: boolean
    severity?: boolean
    services?: boolean
    categories?: boolean
    actions?: boolean
    isActive?: boolean
    lastTriggered?: boolean
    triggerCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["alertConfiguration"]>

  export type AlertConfigurationSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    condition?: boolean
    threshold?: boolean
    timeWindow?: boolean
    severity?: boolean
    services?: boolean
    categories?: boolean
    actions?: boolean
    isActive?: boolean
    lastTriggered?: boolean
    triggerCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $AlertConfigurationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AlertConfiguration"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      condition: string
      threshold: number | null
      timeWindow: number | null
      severity: string[]
      services: string[]
      categories: string[]
      actions: Prisma.JsonValue
      isActive: boolean
      lastTriggered: Date | null
      triggerCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["alertConfiguration"]>
    composites: {}
  }

  type AlertConfigurationGetPayload<S extends boolean | null | undefined | AlertConfigurationDefaultArgs> = $Result.GetResult<Prisma.$AlertConfigurationPayload, S>

  type AlertConfigurationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AlertConfigurationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AlertConfigurationCountAggregateInputType | true
    }

  export interface AlertConfigurationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AlertConfiguration'], meta: { name: 'AlertConfiguration' } }
    /**
     * Find zero or one AlertConfiguration that matches the filter.
     * @param {AlertConfigurationFindUniqueArgs} args - Arguments to find a AlertConfiguration
     * @example
     * // Get one AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AlertConfigurationFindUniqueArgs>(args: SelectSubset<T, AlertConfigurationFindUniqueArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AlertConfiguration that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AlertConfigurationFindUniqueOrThrowArgs} args - Arguments to find a AlertConfiguration
     * @example
     * // Get one AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AlertConfigurationFindUniqueOrThrowArgs>(args: SelectSubset<T, AlertConfigurationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AlertConfiguration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationFindFirstArgs} args - Arguments to find a AlertConfiguration
     * @example
     * // Get one AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AlertConfigurationFindFirstArgs>(args?: SelectSubset<T, AlertConfigurationFindFirstArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AlertConfiguration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationFindFirstOrThrowArgs} args - Arguments to find a AlertConfiguration
     * @example
     * // Get one AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AlertConfigurationFindFirstOrThrowArgs>(args?: SelectSubset<T, AlertConfigurationFindFirstOrThrowArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AlertConfigurations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AlertConfigurations
     * const alertConfigurations = await prisma.alertConfiguration.findMany()
     * 
     * // Get first 10 AlertConfigurations
     * const alertConfigurations = await prisma.alertConfiguration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const alertConfigurationWithIdOnly = await prisma.alertConfiguration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AlertConfigurationFindManyArgs>(args?: SelectSubset<T, AlertConfigurationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AlertConfiguration.
     * @param {AlertConfigurationCreateArgs} args - Arguments to create a AlertConfiguration.
     * @example
     * // Create one AlertConfiguration
     * const AlertConfiguration = await prisma.alertConfiguration.create({
     *   data: {
     *     // ... data to create a AlertConfiguration
     *   }
     * })
     * 
     */
    create<T extends AlertConfigurationCreateArgs>(args: SelectSubset<T, AlertConfigurationCreateArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AlertConfigurations.
     * @param {AlertConfigurationCreateManyArgs} args - Arguments to create many AlertConfigurations.
     * @example
     * // Create many AlertConfigurations
     * const alertConfiguration = await prisma.alertConfiguration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AlertConfigurationCreateManyArgs>(args?: SelectSubset<T, AlertConfigurationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AlertConfigurations and returns the data saved in the database.
     * @param {AlertConfigurationCreateManyAndReturnArgs} args - Arguments to create many AlertConfigurations.
     * @example
     * // Create many AlertConfigurations
     * const alertConfiguration = await prisma.alertConfiguration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AlertConfigurations and only return the `id`
     * const alertConfigurationWithIdOnly = await prisma.alertConfiguration.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AlertConfigurationCreateManyAndReturnArgs>(args?: SelectSubset<T, AlertConfigurationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AlertConfiguration.
     * @param {AlertConfigurationDeleteArgs} args - Arguments to delete one AlertConfiguration.
     * @example
     * // Delete one AlertConfiguration
     * const AlertConfiguration = await prisma.alertConfiguration.delete({
     *   where: {
     *     // ... filter to delete one AlertConfiguration
     *   }
     * })
     * 
     */
    delete<T extends AlertConfigurationDeleteArgs>(args: SelectSubset<T, AlertConfigurationDeleteArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AlertConfiguration.
     * @param {AlertConfigurationUpdateArgs} args - Arguments to update one AlertConfiguration.
     * @example
     * // Update one AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AlertConfigurationUpdateArgs>(args: SelectSubset<T, AlertConfigurationUpdateArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AlertConfigurations.
     * @param {AlertConfigurationDeleteManyArgs} args - Arguments to filter AlertConfigurations to delete.
     * @example
     * // Delete a few AlertConfigurations
     * const { count } = await prisma.alertConfiguration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AlertConfigurationDeleteManyArgs>(args?: SelectSubset<T, AlertConfigurationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AlertConfigurations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AlertConfigurations
     * const alertConfiguration = await prisma.alertConfiguration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AlertConfigurationUpdateManyArgs>(args: SelectSubset<T, AlertConfigurationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AlertConfiguration.
     * @param {AlertConfigurationUpsertArgs} args - Arguments to update or create a AlertConfiguration.
     * @example
     * // Update or create a AlertConfiguration
     * const alertConfiguration = await prisma.alertConfiguration.upsert({
     *   create: {
     *     // ... data to create a AlertConfiguration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AlertConfiguration we want to update
     *   }
     * })
     */
    upsert<T extends AlertConfigurationUpsertArgs>(args: SelectSubset<T, AlertConfigurationUpsertArgs<ExtArgs>>): Prisma__AlertConfigurationClient<$Result.GetResult<Prisma.$AlertConfigurationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AlertConfigurations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationCountArgs} args - Arguments to filter AlertConfigurations to count.
     * @example
     * // Count the number of AlertConfigurations
     * const count = await prisma.alertConfiguration.count({
     *   where: {
     *     // ... the filter for the AlertConfigurations we want to count
     *   }
     * })
    **/
    count<T extends AlertConfigurationCountArgs>(
      args?: Subset<T, AlertConfigurationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AlertConfigurationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AlertConfiguration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AlertConfigurationAggregateArgs>(args: Subset<T, AlertConfigurationAggregateArgs>): Prisma.PrismaPromise<GetAlertConfigurationAggregateType<T>>

    /**
     * Group by AlertConfiguration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertConfigurationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AlertConfigurationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AlertConfigurationGroupByArgs['orderBy'] }
        : { orderBy?: AlertConfigurationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AlertConfigurationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAlertConfigurationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AlertConfiguration model
   */
  readonly fields: AlertConfigurationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AlertConfiguration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AlertConfigurationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AlertConfiguration model
   */ 
  interface AlertConfigurationFieldRefs {
    readonly id: FieldRef<"AlertConfiguration", 'String'>
    readonly name: FieldRef<"AlertConfiguration", 'String'>
    readonly description: FieldRef<"AlertConfiguration", 'String'>
    readonly condition: FieldRef<"AlertConfiguration", 'String'>
    readonly threshold: FieldRef<"AlertConfiguration", 'Float'>
    readonly timeWindow: FieldRef<"AlertConfiguration", 'Int'>
    readonly severity: FieldRef<"AlertConfiguration", 'String[]'>
    readonly services: FieldRef<"AlertConfiguration", 'String[]'>
    readonly categories: FieldRef<"AlertConfiguration", 'String[]'>
    readonly actions: FieldRef<"AlertConfiguration", 'Json'>
    readonly isActive: FieldRef<"AlertConfiguration", 'Boolean'>
    readonly lastTriggered: FieldRef<"AlertConfiguration", 'DateTime'>
    readonly triggerCount: FieldRef<"AlertConfiguration", 'Int'>
    readonly createdAt: FieldRef<"AlertConfiguration", 'DateTime'>
    readonly updatedAt: FieldRef<"AlertConfiguration", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AlertConfiguration findUnique
   */
  export type AlertConfigurationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter, which AlertConfiguration to fetch.
     */
    where: AlertConfigurationWhereUniqueInput
  }

  /**
   * AlertConfiguration findUniqueOrThrow
   */
  export type AlertConfigurationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter, which AlertConfiguration to fetch.
     */
    where: AlertConfigurationWhereUniqueInput
  }

  /**
   * AlertConfiguration findFirst
   */
  export type AlertConfigurationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter, which AlertConfiguration to fetch.
     */
    where?: AlertConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertConfigurations to fetch.
     */
    orderBy?: AlertConfigurationOrderByWithRelationInput | AlertConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertConfigurations.
     */
    cursor?: AlertConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertConfigurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertConfigurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertConfigurations.
     */
    distinct?: AlertConfigurationScalarFieldEnum | AlertConfigurationScalarFieldEnum[]
  }

  /**
   * AlertConfiguration findFirstOrThrow
   */
  export type AlertConfigurationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter, which AlertConfiguration to fetch.
     */
    where?: AlertConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertConfigurations to fetch.
     */
    orderBy?: AlertConfigurationOrderByWithRelationInput | AlertConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertConfigurations.
     */
    cursor?: AlertConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertConfigurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertConfigurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertConfigurations.
     */
    distinct?: AlertConfigurationScalarFieldEnum | AlertConfigurationScalarFieldEnum[]
  }

  /**
   * AlertConfiguration findMany
   */
  export type AlertConfigurationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter, which AlertConfigurations to fetch.
     */
    where?: AlertConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertConfigurations to fetch.
     */
    orderBy?: AlertConfigurationOrderByWithRelationInput | AlertConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AlertConfigurations.
     */
    cursor?: AlertConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertConfigurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertConfigurations.
     */
    skip?: number
    distinct?: AlertConfigurationScalarFieldEnum | AlertConfigurationScalarFieldEnum[]
  }

  /**
   * AlertConfiguration create
   */
  export type AlertConfigurationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * The data needed to create a AlertConfiguration.
     */
    data: XOR<AlertConfigurationCreateInput, AlertConfigurationUncheckedCreateInput>
  }

  /**
   * AlertConfiguration createMany
   */
  export type AlertConfigurationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AlertConfigurations.
     */
    data: AlertConfigurationCreateManyInput | AlertConfigurationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertConfiguration createManyAndReturn
   */
  export type AlertConfigurationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AlertConfigurations.
     */
    data: AlertConfigurationCreateManyInput | AlertConfigurationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertConfiguration update
   */
  export type AlertConfigurationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * The data needed to update a AlertConfiguration.
     */
    data: XOR<AlertConfigurationUpdateInput, AlertConfigurationUncheckedUpdateInput>
    /**
     * Choose, which AlertConfiguration to update.
     */
    where: AlertConfigurationWhereUniqueInput
  }

  /**
   * AlertConfiguration updateMany
   */
  export type AlertConfigurationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AlertConfigurations.
     */
    data: XOR<AlertConfigurationUpdateManyMutationInput, AlertConfigurationUncheckedUpdateManyInput>
    /**
     * Filter which AlertConfigurations to update
     */
    where?: AlertConfigurationWhereInput
  }

  /**
   * AlertConfiguration upsert
   */
  export type AlertConfigurationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * The filter to search for the AlertConfiguration to update in case it exists.
     */
    where: AlertConfigurationWhereUniqueInput
    /**
     * In case the AlertConfiguration found by the `where` argument doesn't exist, create a new AlertConfiguration with this data.
     */
    create: XOR<AlertConfigurationCreateInput, AlertConfigurationUncheckedCreateInput>
    /**
     * In case the AlertConfiguration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AlertConfigurationUpdateInput, AlertConfigurationUncheckedUpdateInput>
  }

  /**
   * AlertConfiguration delete
   */
  export type AlertConfigurationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
    /**
     * Filter which AlertConfiguration to delete.
     */
    where: AlertConfigurationWhereUniqueInput
  }

  /**
   * AlertConfiguration deleteMany
   */
  export type AlertConfigurationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertConfigurations to delete
     */
    where?: AlertConfigurationWhereInput
  }

  /**
   * AlertConfiguration without action
   */
  export type AlertConfigurationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertConfiguration
     */
    select?: AlertConfigurationSelect<ExtArgs> | null
  }


  /**
   * Model AlertHistory
   */

  export type AggregateAlertHistory = {
    _count: AlertHistoryCountAggregateOutputType | null
    _min: AlertHistoryMinAggregateOutputType | null
    _max: AlertHistoryMaxAggregateOutputType | null
  }

  export type AlertHistoryMinAggregateOutputType = {
    id: string | null
    configId: string | null
    triggeredAt: Date | null
    resolvedAt: Date | null
    alertType: string | null
    severity: string | null
    message: string | null
    acknowledged: boolean | null
    acknowledgedBy: string | null
    acknowledgedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlertHistoryMaxAggregateOutputType = {
    id: string | null
    configId: string | null
    triggeredAt: Date | null
    resolvedAt: Date | null
    alertType: string | null
    severity: string | null
    message: string | null
    acknowledged: boolean | null
    acknowledgedBy: string | null
    acknowledgedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AlertHistoryCountAggregateOutputType = {
    id: number
    configId: number
    triggeredAt: number
    resolvedAt: number
    alertType: number
    severity: number
    message: number
    details: number
    actionsTaken: number
    acknowledged: number
    acknowledgedBy: number
    acknowledgedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AlertHistoryMinAggregateInputType = {
    id?: true
    configId?: true
    triggeredAt?: true
    resolvedAt?: true
    alertType?: true
    severity?: true
    message?: true
    acknowledged?: true
    acknowledgedBy?: true
    acknowledgedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlertHistoryMaxAggregateInputType = {
    id?: true
    configId?: true
    triggeredAt?: true
    resolvedAt?: true
    alertType?: true
    severity?: true
    message?: true
    acknowledged?: true
    acknowledgedBy?: true
    acknowledgedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AlertHistoryCountAggregateInputType = {
    id?: true
    configId?: true
    triggeredAt?: true
    resolvedAt?: true
    alertType?: true
    severity?: true
    message?: true
    details?: true
    actionsTaken?: true
    acknowledged?: true
    acknowledgedBy?: true
    acknowledgedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AlertHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertHistory to aggregate.
     */
    where?: AlertHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertHistories to fetch.
     */
    orderBy?: AlertHistoryOrderByWithRelationInput | AlertHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AlertHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AlertHistories
    **/
    _count?: true | AlertHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AlertHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AlertHistoryMaxAggregateInputType
  }

  export type GetAlertHistoryAggregateType<T extends AlertHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateAlertHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlertHistory[P]>
      : GetScalarType<T[P], AggregateAlertHistory[P]>
  }




  export type AlertHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AlertHistoryWhereInput
    orderBy?: AlertHistoryOrderByWithAggregationInput | AlertHistoryOrderByWithAggregationInput[]
    by: AlertHistoryScalarFieldEnum[] | AlertHistoryScalarFieldEnum
    having?: AlertHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AlertHistoryCountAggregateInputType | true
    _min?: AlertHistoryMinAggregateInputType
    _max?: AlertHistoryMaxAggregateInputType
  }

  export type AlertHistoryGroupByOutputType = {
    id: string
    configId: string
    triggeredAt: Date
    resolvedAt: Date | null
    alertType: string
    severity: string
    message: string
    details: JsonValue | null
    actionsTaken: JsonValue | null
    acknowledged: boolean
    acknowledgedBy: string | null
    acknowledgedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: AlertHistoryCountAggregateOutputType | null
    _min: AlertHistoryMinAggregateOutputType | null
    _max: AlertHistoryMaxAggregateOutputType | null
  }

  type GetAlertHistoryGroupByPayload<T extends AlertHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AlertHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AlertHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AlertHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], AlertHistoryGroupByOutputType[P]>
        }
      >
    >


  export type AlertHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    configId?: boolean
    triggeredAt?: boolean
    resolvedAt?: boolean
    alertType?: boolean
    severity?: boolean
    message?: boolean
    details?: boolean
    actionsTaken?: boolean
    acknowledged?: boolean
    acknowledgedBy?: boolean
    acknowledgedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["alertHistory"]>

  export type AlertHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    configId?: boolean
    triggeredAt?: boolean
    resolvedAt?: boolean
    alertType?: boolean
    severity?: boolean
    message?: boolean
    details?: boolean
    actionsTaken?: boolean
    acknowledged?: boolean
    acknowledgedBy?: boolean
    acknowledgedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["alertHistory"]>

  export type AlertHistorySelectScalar = {
    id?: boolean
    configId?: boolean
    triggeredAt?: boolean
    resolvedAt?: boolean
    alertType?: boolean
    severity?: boolean
    message?: boolean
    details?: boolean
    actionsTaken?: boolean
    acknowledged?: boolean
    acknowledgedBy?: boolean
    acknowledgedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $AlertHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AlertHistory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      configId: string
      triggeredAt: Date
      resolvedAt: Date | null
      alertType: string
      severity: string
      message: string
      details: Prisma.JsonValue | null
      actionsTaken: Prisma.JsonValue | null
      acknowledged: boolean
      acknowledgedBy: string | null
      acknowledgedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["alertHistory"]>
    composites: {}
  }

  type AlertHistoryGetPayload<S extends boolean | null | undefined | AlertHistoryDefaultArgs> = $Result.GetResult<Prisma.$AlertHistoryPayload, S>

  type AlertHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AlertHistoryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AlertHistoryCountAggregateInputType | true
    }

  export interface AlertHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AlertHistory'], meta: { name: 'AlertHistory' } }
    /**
     * Find zero or one AlertHistory that matches the filter.
     * @param {AlertHistoryFindUniqueArgs} args - Arguments to find a AlertHistory
     * @example
     * // Get one AlertHistory
     * const alertHistory = await prisma.alertHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AlertHistoryFindUniqueArgs>(args: SelectSubset<T, AlertHistoryFindUniqueArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one AlertHistory that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AlertHistoryFindUniqueOrThrowArgs} args - Arguments to find a AlertHistory
     * @example
     * // Get one AlertHistory
     * const alertHistory = await prisma.alertHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AlertHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, AlertHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first AlertHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryFindFirstArgs} args - Arguments to find a AlertHistory
     * @example
     * // Get one AlertHistory
     * const alertHistory = await prisma.alertHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AlertHistoryFindFirstArgs>(args?: SelectSubset<T, AlertHistoryFindFirstArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first AlertHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryFindFirstOrThrowArgs} args - Arguments to find a AlertHistory
     * @example
     * // Get one AlertHistory
     * const alertHistory = await prisma.alertHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AlertHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, AlertHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more AlertHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AlertHistories
     * const alertHistories = await prisma.alertHistory.findMany()
     * 
     * // Get first 10 AlertHistories
     * const alertHistories = await prisma.alertHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const alertHistoryWithIdOnly = await prisma.alertHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AlertHistoryFindManyArgs>(args?: SelectSubset<T, AlertHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a AlertHistory.
     * @param {AlertHistoryCreateArgs} args - Arguments to create a AlertHistory.
     * @example
     * // Create one AlertHistory
     * const AlertHistory = await prisma.alertHistory.create({
     *   data: {
     *     // ... data to create a AlertHistory
     *   }
     * })
     * 
     */
    create<T extends AlertHistoryCreateArgs>(args: SelectSubset<T, AlertHistoryCreateArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many AlertHistories.
     * @param {AlertHistoryCreateManyArgs} args - Arguments to create many AlertHistories.
     * @example
     * // Create many AlertHistories
     * const alertHistory = await prisma.alertHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AlertHistoryCreateManyArgs>(args?: SelectSubset<T, AlertHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AlertHistories and returns the data saved in the database.
     * @param {AlertHistoryCreateManyAndReturnArgs} args - Arguments to create many AlertHistories.
     * @example
     * // Create many AlertHistories
     * const alertHistory = await prisma.alertHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AlertHistories and only return the `id`
     * const alertHistoryWithIdOnly = await prisma.alertHistory.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AlertHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, AlertHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a AlertHistory.
     * @param {AlertHistoryDeleteArgs} args - Arguments to delete one AlertHistory.
     * @example
     * // Delete one AlertHistory
     * const AlertHistory = await prisma.alertHistory.delete({
     *   where: {
     *     // ... filter to delete one AlertHistory
     *   }
     * })
     * 
     */
    delete<T extends AlertHistoryDeleteArgs>(args: SelectSubset<T, AlertHistoryDeleteArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one AlertHistory.
     * @param {AlertHistoryUpdateArgs} args - Arguments to update one AlertHistory.
     * @example
     * // Update one AlertHistory
     * const alertHistory = await prisma.alertHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AlertHistoryUpdateArgs>(args: SelectSubset<T, AlertHistoryUpdateArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more AlertHistories.
     * @param {AlertHistoryDeleteManyArgs} args - Arguments to filter AlertHistories to delete.
     * @example
     * // Delete a few AlertHistories
     * const { count } = await prisma.alertHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AlertHistoryDeleteManyArgs>(args?: SelectSubset<T, AlertHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AlertHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AlertHistories
     * const alertHistory = await prisma.alertHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AlertHistoryUpdateManyArgs>(args: SelectSubset<T, AlertHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one AlertHistory.
     * @param {AlertHistoryUpsertArgs} args - Arguments to update or create a AlertHistory.
     * @example
     * // Update or create a AlertHistory
     * const alertHistory = await prisma.alertHistory.upsert({
     *   create: {
     *     // ... data to create a AlertHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AlertHistory we want to update
     *   }
     * })
     */
    upsert<T extends AlertHistoryUpsertArgs>(args: SelectSubset<T, AlertHistoryUpsertArgs<ExtArgs>>): Prisma__AlertHistoryClient<$Result.GetResult<Prisma.$AlertHistoryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of AlertHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryCountArgs} args - Arguments to filter AlertHistories to count.
     * @example
     * // Count the number of AlertHistories
     * const count = await prisma.alertHistory.count({
     *   where: {
     *     // ... the filter for the AlertHistories we want to count
     *   }
     * })
    **/
    count<T extends AlertHistoryCountArgs>(
      args?: Subset<T, AlertHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AlertHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AlertHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AlertHistoryAggregateArgs>(args: Subset<T, AlertHistoryAggregateArgs>): Prisma.PrismaPromise<GetAlertHistoryAggregateType<T>>

    /**
     * Group by AlertHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AlertHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AlertHistoryGroupByArgs['orderBy'] }
        : { orderBy?: AlertHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AlertHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAlertHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AlertHistory model
   */
  readonly fields: AlertHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AlertHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AlertHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AlertHistory model
   */ 
  interface AlertHistoryFieldRefs {
    readonly id: FieldRef<"AlertHistory", 'String'>
    readonly configId: FieldRef<"AlertHistory", 'String'>
    readonly triggeredAt: FieldRef<"AlertHistory", 'DateTime'>
    readonly resolvedAt: FieldRef<"AlertHistory", 'DateTime'>
    readonly alertType: FieldRef<"AlertHistory", 'String'>
    readonly severity: FieldRef<"AlertHistory", 'String'>
    readonly message: FieldRef<"AlertHistory", 'String'>
    readonly details: FieldRef<"AlertHistory", 'Json'>
    readonly actionsTaken: FieldRef<"AlertHistory", 'Json'>
    readonly acknowledged: FieldRef<"AlertHistory", 'Boolean'>
    readonly acknowledgedBy: FieldRef<"AlertHistory", 'String'>
    readonly acknowledgedAt: FieldRef<"AlertHistory", 'DateTime'>
    readonly createdAt: FieldRef<"AlertHistory", 'DateTime'>
    readonly updatedAt: FieldRef<"AlertHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AlertHistory findUnique
   */
  export type AlertHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter, which AlertHistory to fetch.
     */
    where: AlertHistoryWhereUniqueInput
  }

  /**
   * AlertHistory findUniqueOrThrow
   */
  export type AlertHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter, which AlertHistory to fetch.
     */
    where: AlertHistoryWhereUniqueInput
  }

  /**
   * AlertHistory findFirst
   */
  export type AlertHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter, which AlertHistory to fetch.
     */
    where?: AlertHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertHistories to fetch.
     */
    orderBy?: AlertHistoryOrderByWithRelationInput | AlertHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertHistories.
     */
    cursor?: AlertHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertHistories.
     */
    distinct?: AlertHistoryScalarFieldEnum | AlertHistoryScalarFieldEnum[]
  }

  /**
   * AlertHistory findFirstOrThrow
   */
  export type AlertHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter, which AlertHistory to fetch.
     */
    where?: AlertHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertHistories to fetch.
     */
    orderBy?: AlertHistoryOrderByWithRelationInput | AlertHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertHistories.
     */
    cursor?: AlertHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertHistories.
     */
    distinct?: AlertHistoryScalarFieldEnum | AlertHistoryScalarFieldEnum[]
  }

  /**
   * AlertHistory findMany
   */
  export type AlertHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter, which AlertHistories to fetch.
     */
    where?: AlertHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertHistories to fetch.
     */
    orderBy?: AlertHistoryOrderByWithRelationInput | AlertHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AlertHistories.
     */
    cursor?: AlertHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertHistories.
     */
    skip?: number
    distinct?: AlertHistoryScalarFieldEnum | AlertHistoryScalarFieldEnum[]
  }

  /**
   * AlertHistory create
   */
  export type AlertHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * The data needed to create a AlertHistory.
     */
    data: XOR<AlertHistoryCreateInput, AlertHistoryUncheckedCreateInput>
  }

  /**
   * AlertHistory createMany
   */
  export type AlertHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AlertHistories.
     */
    data: AlertHistoryCreateManyInput | AlertHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertHistory createManyAndReturn
   */
  export type AlertHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many AlertHistories.
     */
    data: AlertHistoryCreateManyInput | AlertHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertHistory update
   */
  export type AlertHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * The data needed to update a AlertHistory.
     */
    data: XOR<AlertHistoryUpdateInput, AlertHistoryUncheckedUpdateInput>
    /**
     * Choose, which AlertHistory to update.
     */
    where: AlertHistoryWhereUniqueInput
  }

  /**
   * AlertHistory updateMany
   */
  export type AlertHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AlertHistories.
     */
    data: XOR<AlertHistoryUpdateManyMutationInput, AlertHistoryUncheckedUpdateManyInput>
    /**
     * Filter which AlertHistories to update
     */
    where?: AlertHistoryWhereInput
  }

  /**
   * AlertHistory upsert
   */
  export type AlertHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * The filter to search for the AlertHistory to update in case it exists.
     */
    where: AlertHistoryWhereUniqueInput
    /**
     * In case the AlertHistory found by the `where` argument doesn't exist, create a new AlertHistory with this data.
     */
    create: XOR<AlertHistoryCreateInput, AlertHistoryUncheckedCreateInput>
    /**
     * In case the AlertHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AlertHistoryUpdateInput, AlertHistoryUncheckedUpdateInput>
  }

  /**
   * AlertHistory delete
   */
  export type AlertHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
    /**
     * Filter which AlertHistory to delete.
     */
    where: AlertHistoryWhereUniqueInput
  }

  /**
   * AlertHistory deleteMany
   */
  export type AlertHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertHistories to delete
     */
    where?: AlertHistoryWhereInput
  }

  /**
   * AlertHistory without action
   */
  export type AlertHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertHistory
     */
    select?: AlertHistorySelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ErrorScalarFieldEnum: {
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

  export type ErrorScalarFieldEnum = (typeof ErrorScalarFieldEnum)[keyof typeof ErrorScalarFieldEnum]


  export const ErrorCorrelationScalarFieldEnum: {
    id: 'id',
    errorId: 'errorId',
    relatedErrorId: 'relatedErrorId',
    correlationType: 'correlationType',
    confidence: 'confidence',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ErrorCorrelationScalarFieldEnum = (typeof ErrorCorrelationScalarFieldEnum)[keyof typeof ErrorCorrelationScalarFieldEnum]


  export const RecoveryExecutionScalarFieldEnum: {
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

  export type RecoveryExecutionScalarFieldEnum = (typeof RecoveryExecutionScalarFieldEnum)[keyof typeof RecoveryExecutionScalarFieldEnum]


  export const ErrorPatternScalarFieldEnum: {
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

  export type ErrorPatternScalarFieldEnum = (typeof ErrorPatternScalarFieldEnum)[keyof typeof ErrorPatternScalarFieldEnum]


  export const ErrorAggregationScalarFieldEnum: {
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

  export type ErrorAggregationScalarFieldEnum = (typeof ErrorAggregationScalarFieldEnum)[keyof typeof ErrorAggregationScalarFieldEnum]


  export const AlertConfigurationScalarFieldEnum: {
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

  export type AlertConfigurationScalarFieldEnum = (typeof AlertConfigurationScalarFieldEnum)[keyof typeof AlertConfigurationScalarFieldEnum]


  export const AlertHistoryScalarFieldEnum: {
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

  export type AlertHistoryScalarFieldEnum = (typeof AlertHistoryScalarFieldEnum)[keyof typeof AlertHistoryScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ErrorWhereInput = {
    AND?: ErrorWhereInput | ErrorWhereInput[]
    OR?: ErrorWhereInput[]
    NOT?: ErrorWhereInput | ErrorWhereInput[]
    id?: StringFilter<"Error"> | string
    fingerprint?: StringFilter<"Error"> | string
    message?: StringFilter<"Error"> | string
    category?: StringFilter<"Error"> | string
    severity?: StringFilter<"Error"> | string
    errorType?: StringFilter<"Error"> | string
    stack?: StringNullableFilter<"Error"> | string | null
    context?: JsonNullableFilter<"Error">
    service?: StringFilter<"Error"> | string
    version?: StringFilter<"Error"> | string
    environment?: StringFilter<"Error"> | string
    timestamp?: DateTimeFilter<"Error"> | Date | string
    traceId?: StringNullableFilter<"Error"> | string | null
    spanId?: StringNullableFilter<"Error"> | string | null
    parentSpanId?: StringNullableFilter<"Error"> | string | null
    metadata?: JsonNullableFilter<"Error">
    userId?: StringNullableFilter<"Error"> | string | null
    sessionId?: StringNullableFilter<"Error"> | string | null
    requestId?: StringNullableFilter<"Error"> | string | null
    userAgent?: StringNullableFilter<"Error"> | string | null
    ipAddress?: StringNullableFilter<"Error"> | string | null
    endpoint?: StringNullableFilter<"Error"> | string | null
    method?: StringNullableFilter<"Error"> | string | null
    statusCode?: IntNullableFilter<"Error"> | number | null
    responseTime?: IntNullableFilter<"Error"> | number | null
    memoryUsage?: JsonNullableFilter<"Error">
    customData?: JsonNullableFilter<"Error">
    count?: IntFilter<"Error"> | number
    firstSeen?: DateTimeFilter<"Error"> | Date | string
    lastSeen?: DateTimeFilter<"Error"> | Date | string
    resolved?: BoolFilter<"Error"> | boolean
    resolvedAt?: DateTimeNullableFilter<"Error"> | Date | string | null
    resolvedBy?: StringNullableFilter<"Error"> | string | null
    resolution?: StringNullableFilter<"Error"> | string | null
    tags?: StringNullableListFilter<"Error">
    affectedUsers?: StringNullableListFilter<"Error">
    createdAt?: DateTimeFilter<"Error"> | Date | string
    updatedAt?: DateTimeFilter<"Error"> | Date | string
    correlations?: ErrorCorrelationListRelationFilter
    relatedErrors?: ErrorCorrelationListRelationFilter
    recoveryExecutions?: RecoveryExecutionListRelationFilter
  }

  export type ErrorOrderByWithRelationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    message?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    errorType?: SortOrder
    stack?: SortOrderInput | SortOrder
    context?: SortOrderInput | SortOrder
    service?: SortOrder
    version?: SortOrder
    environment?: SortOrder
    timestamp?: SortOrder
    traceId?: SortOrderInput | SortOrder
    spanId?: SortOrderInput | SortOrder
    parentSpanId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    sessionId?: SortOrderInput | SortOrder
    requestId?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    endpoint?: SortOrderInput | SortOrder
    method?: SortOrderInput | SortOrder
    statusCode?: SortOrderInput | SortOrder
    responseTime?: SortOrderInput | SortOrder
    memoryUsage?: SortOrderInput | SortOrder
    customData?: SortOrderInput | SortOrder
    count?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    resolved?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    resolution?: SortOrderInput | SortOrder
    tags?: SortOrder
    affectedUsers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    correlations?: ErrorCorrelationOrderByRelationAggregateInput
    relatedErrors?: ErrorCorrelationOrderByRelationAggregateInput
    recoveryExecutions?: RecoveryExecutionOrderByRelationAggregateInput
  }

  export type ErrorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ErrorWhereInput | ErrorWhereInput[]
    OR?: ErrorWhereInput[]
    NOT?: ErrorWhereInput | ErrorWhereInput[]
    fingerprint?: StringFilter<"Error"> | string
    message?: StringFilter<"Error"> | string
    category?: StringFilter<"Error"> | string
    severity?: StringFilter<"Error"> | string
    errorType?: StringFilter<"Error"> | string
    stack?: StringNullableFilter<"Error"> | string | null
    context?: JsonNullableFilter<"Error">
    service?: StringFilter<"Error"> | string
    version?: StringFilter<"Error"> | string
    environment?: StringFilter<"Error"> | string
    timestamp?: DateTimeFilter<"Error"> | Date | string
    traceId?: StringNullableFilter<"Error"> | string | null
    spanId?: StringNullableFilter<"Error"> | string | null
    parentSpanId?: StringNullableFilter<"Error"> | string | null
    metadata?: JsonNullableFilter<"Error">
    userId?: StringNullableFilter<"Error"> | string | null
    sessionId?: StringNullableFilter<"Error"> | string | null
    requestId?: StringNullableFilter<"Error"> | string | null
    userAgent?: StringNullableFilter<"Error"> | string | null
    ipAddress?: StringNullableFilter<"Error"> | string | null
    endpoint?: StringNullableFilter<"Error"> | string | null
    method?: StringNullableFilter<"Error"> | string | null
    statusCode?: IntNullableFilter<"Error"> | number | null
    responseTime?: IntNullableFilter<"Error"> | number | null
    memoryUsage?: JsonNullableFilter<"Error">
    customData?: JsonNullableFilter<"Error">
    count?: IntFilter<"Error"> | number
    firstSeen?: DateTimeFilter<"Error"> | Date | string
    lastSeen?: DateTimeFilter<"Error"> | Date | string
    resolved?: BoolFilter<"Error"> | boolean
    resolvedAt?: DateTimeNullableFilter<"Error"> | Date | string | null
    resolvedBy?: StringNullableFilter<"Error"> | string | null
    resolution?: StringNullableFilter<"Error"> | string | null
    tags?: StringNullableListFilter<"Error">
    affectedUsers?: StringNullableListFilter<"Error">
    createdAt?: DateTimeFilter<"Error"> | Date | string
    updatedAt?: DateTimeFilter<"Error"> | Date | string
    correlations?: ErrorCorrelationListRelationFilter
    relatedErrors?: ErrorCorrelationListRelationFilter
    recoveryExecutions?: RecoveryExecutionListRelationFilter
  }, "id">

  export type ErrorOrderByWithAggregationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    message?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    errorType?: SortOrder
    stack?: SortOrderInput | SortOrder
    context?: SortOrderInput | SortOrder
    service?: SortOrder
    version?: SortOrder
    environment?: SortOrder
    timestamp?: SortOrder
    traceId?: SortOrderInput | SortOrder
    spanId?: SortOrderInput | SortOrder
    parentSpanId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    userId?: SortOrderInput | SortOrder
    sessionId?: SortOrderInput | SortOrder
    requestId?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    endpoint?: SortOrderInput | SortOrder
    method?: SortOrderInput | SortOrder
    statusCode?: SortOrderInput | SortOrder
    responseTime?: SortOrderInput | SortOrder
    memoryUsage?: SortOrderInput | SortOrder
    customData?: SortOrderInput | SortOrder
    count?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    resolved?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    resolution?: SortOrderInput | SortOrder
    tags?: SortOrder
    affectedUsers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ErrorCountOrderByAggregateInput
    _avg?: ErrorAvgOrderByAggregateInput
    _max?: ErrorMaxOrderByAggregateInput
    _min?: ErrorMinOrderByAggregateInput
    _sum?: ErrorSumOrderByAggregateInput
  }

  export type ErrorScalarWhereWithAggregatesInput = {
    AND?: ErrorScalarWhereWithAggregatesInput | ErrorScalarWhereWithAggregatesInput[]
    OR?: ErrorScalarWhereWithAggregatesInput[]
    NOT?: ErrorScalarWhereWithAggregatesInput | ErrorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Error"> | string
    fingerprint?: StringWithAggregatesFilter<"Error"> | string
    message?: StringWithAggregatesFilter<"Error"> | string
    category?: StringWithAggregatesFilter<"Error"> | string
    severity?: StringWithAggregatesFilter<"Error"> | string
    errorType?: StringWithAggregatesFilter<"Error"> | string
    stack?: StringNullableWithAggregatesFilter<"Error"> | string | null
    context?: JsonNullableWithAggregatesFilter<"Error">
    service?: StringWithAggregatesFilter<"Error"> | string
    version?: StringWithAggregatesFilter<"Error"> | string
    environment?: StringWithAggregatesFilter<"Error"> | string
    timestamp?: DateTimeWithAggregatesFilter<"Error"> | Date | string
    traceId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    spanId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    parentSpanId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"Error">
    userId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    sessionId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    requestId?: StringNullableWithAggregatesFilter<"Error"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"Error"> | string | null
    ipAddress?: StringNullableWithAggregatesFilter<"Error"> | string | null
    endpoint?: StringNullableWithAggregatesFilter<"Error"> | string | null
    method?: StringNullableWithAggregatesFilter<"Error"> | string | null
    statusCode?: IntNullableWithAggregatesFilter<"Error"> | number | null
    responseTime?: IntNullableWithAggregatesFilter<"Error"> | number | null
    memoryUsage?: JsonNullableWithAggregatesFilter<"Error">
    customData?: JsonNullableWithAggregatesFilter<"Error">
    count?: IntWithAggregatesFilter<"Error"> | number
    firstSeen?: DateTimeWithAggregatesFilter<"Error"> | Date | string
    lastSeen?: DateTimeWithAggregatesFilter<"Error"> | Date | string
    resolved?: BoolWithAggregatesFilter<"Error"> | boolean
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"Error"> | Date | string | null
    resolvedBy?: StringNullableWithAggregatesFilter<"Error"> | string | null
    resolution?: StringNullableWithAggregatesFilter<"Error"> | string | null
    tags?: StringNullableListFilter<"Error">
    affectedUsers?: StringNullableListFilter<"Error">
    createdAt?: DateTimeWithAggregatesFilter<"Error"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Error"> | Date | string
  }

  export type ErrorCorrelationWhereInput = {
    AND?: ErrorCorrelationWhereInput | ErrorCorrelationWhereInput[]
    OR?: ErrorCorrelationWhereInput[]
    NOT?: ErrorCorrelationWhereInput | ErrorCorrelationWhereInput[]
    id?: StringFilter<"ErrorCorrelation"> | string
    errorId?: StringFilter<"ErrorCorrelation"> | string
    relatedErrorId?: StringFilter<"ErrorCorrelation"> | string
    correlationType?: StringFilter<"ErrorCorrelation"> | string
    confidence?: FloatFilter<"ErrorCorrelation"> | number
    metadata?: JsonNullableFilter<"ErrorCorrelation">
    createdAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
    error?: XOR<ErrorRelationFilter, ErrorWhereInput>
    relatedError?: XOR<ErrorRelationFilter, ErrorWhereInput>
  }

  export type ErrorCorrelationOrderByWithRelationInput = {
    id?: SortOrder
    errorId?: SortOrder
    relatedErrorId?: SortOrder
    correlationType?: SortOrder
    confidence?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    error?: ErrorOrderByWithRelationInput
    relatedError?: ErrorOrderByWithRelationInput
  }

  export type ErrorCorrelationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    errorId_relatedErrorId?: ErrorCorrelationErrorIdRelatedErrorIdCompoundUniqueInput
    AND?: ErrorCorrelationWhereInput | ErrorCorrelationWhereInput[]
    OR?: ErrorCorrelationWhereInput[]
    NOT?: ErrorCorrelationWhereInput | ErrorCorrelationWhereInput[]
    errorId?: StringFilter<"ErrorCorrelation"> | string
    relatedErrorId?: StringFilter<"ErrorCorrelation"> | string
    correlationType?: StringFilter<"ErrorCorrelation"> | string
    confidence?: FloatFilter<"ErrorCorrelation"> | number
    metadata?: JsonNullableFilter<"ErrorCorrelation">
    createdAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
    error?: XOR<ErrorRelationFilter, ErrorWhereInput>
    relatedError?: XOR<ErrorRelationFilter, ErrorWhereInput>
  }, "id" | "errorId_relatedErrorId">

  export type ErrorCorrelationOrderByWithAggregationInput = {
    id?: SortOrder
    errorId?: SortOrder
    relatedErrorId?: SortOrder
    correlationType?: SortOrder
    confidence?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ErrorCorrelationCountOrderByAggregateInput
    _avg?: ErrorCorrelationAvgOrderByAggregateInput
    _max?: ErrorCorrelationMaxOrderByAggregateInput
    _min?: ErrorCorrelationMinOrderByAggregateInput
    _sum?: ErrorCorrelationSumOrderByAggregateInput
  }

  export type ErrorCorrelationScalarWhereWithAggregatesInput = {
    AND?: ErrorCorrelationScalarWhereWithAggregatesInput | ErrorCorrelationScalarWhereWithAggregatesInput[]
    OR?: ErrorCorrelationScalarWhereWithAggregatesInput[]
    NOT?: ErrorCorrelationScalarWhereWithAggregatesInput | ErrorCorrelationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ErrorCorrelation"> | string
    errorId?: StringWithAggregatesFilter<"ErrorCorrelation"> | string
    relatedErrorId?: StringWithAggregatesFilter<"ErrorCorrelation"> | string
    correlationType?: StringWithAggregatesFilter<"ErrorCorrelation"> | string
    confidence?: FloatWithAggregatesFilter<"ErrorCorrelation"> | number
    metadata?: JsonNullableWithAggregatesFilter<"ErrorCorrelation">
    createdAt?: DateTimeWithAggregatesFilter<"ErrorCorrelation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ErrorCorrelation"> | Date | string
  }

  export type RecoveryExecutionWhereInput = {
    AND?: RecoveryExecutionWhereInput | RecoveryExecutionWhereInput[]
    OR?: RecoveryExecutionWhereInput[]
    NOT?: RecoveryExecutionWhereInput | RecoveryExecutionWhereInput[]
    id?: StringFilter<"RecoveryExecution"> | string
    errorId?: StringFilter<"RecoveryExecution"> | string
    strategy?: StringFilter<"RecoveryExecution"> | string
    action?: StringFilter<"RecoveryExecution"> | string
    status?: StringFilter<"RecoveryExecution"> | string
    attempts?: IntFilter<"RecoveryExecution"> | number
    maxAttempts?: IntFilter<"RecoveryExecution"> | number
    startedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    completedAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    result?: JsonNullableFilter<"RecoveryExecution">
    errorMessage?: StringNullableFilter<"RecoveryExecution"> | string | null
    createdAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    updatedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    error?: XOR<ErrorRelationFilter, ErrorWhereInput>
  }

  export type RecoveryExecutionOrderByWithRelationInput = {
    id?: SortOrder
    errorId?: SortOrder
    strategy?: SortOrder
    action?: SortOrder
    status?: SortOrder
    attempts?: SortOrder
    maxAttempts?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    nextRetryAt?: SortOrderInput | SortOrder
    result?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    error?: ErrorOrderByWithRelationInput
  }

  export type RecoveryExecutionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RecoveryExecutionWhereInput | RecoveryExecutionWhereInput[]
    OR?: RecoveryExecutionWhereInput[]
    NOT?: RecoveryExecutionWhereInput | RecoveryExecutionWhereInput[]
    errorId?: StringFilter<"RecoveryExecution"> | string
    strategy?: StringFilter<"RecoveryExecution"> | string
    action?: StringFilter<"RecoveryExecution"> | string
    status?: StringFilter<"RecoveryExecution"> | string
    attempts?: IntFilter<"RecoveryExecution"> | number
    maxAttempts?: IntFilter<"RecoveryExecution"> | number
    startedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    completedAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    result?: JsonNullableFilter<"RecoveryExecution">
    errorMessage?: StringNullableFilter<"RecoveryExecution"> | string | null
    createdAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    updatedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    error?: XOR<ErrorRelationFilter, ErrorWhereInput>
  }, "id">

  export type RecoveryExecutionOrderByWithAggregationInput = {
    id?: SortOrder
    errorId?: SortOrder
    strategy?: SortOrder
    action?: SortOrder
    status?: SortOrder
    attempts?: SortOrder
    maxAttempts?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    nextRetryAt?: SortOrderInput | SortOrder
    result?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RecoveryExecutionCountOrderByAggregateInput
    _avg?: RecoveryExecutionAvgOrderByAggregateInput
    _max?: RecoveryExecutionMaxOrderByAggregateInput
    _min?: RecoveryExecutionMinOrderByAggregateInput
    _sum?: RecoveryExecutionSumOrderByAggregateInput
  }

  export type RecoveryExecutionScalarWhereWithAggregatesInput = {
    AND?: RecoveryExecutionScalarWhereWithAggregatesInput | RecoveryExecutionScalarWhereWithAggregatesInput[]
    OR?: RecoveryExecutionScalarWhereWithAggregatesInput[]
    NOT?: RecoveryExecutionScalarWhereWithAggregatesInput | RecoveryExecutionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RecoveryExecution"> | string
    errorId?: StringWithAggregatesFilter<"RecoveryExecution"> | string
    strategy?: StringWithAggregatesFilter<"RecoveryExecution"> | string
    action?: StringWithAggregatesFilter<"RecoveryExecution"> | string
    status?: StringWithAggregatesFilter<"RecoveryExecution"> | string
    attempts?: IntWithAggregatesFilter<"RecoveryExecution"> | number
    maxAttempts?: IntWithAggregatesFilter<"RecoveryExecution"> | number
    startedAt?: DateTimeWithAggregatesFilter<"RecoveryExecution"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"RecoveryExecution"> | Date | string | null
    nextRetryAt?: DateTimeNullableWithAggregatesFilter<"RecoveryExecution"> | Date | string | null
    result?: JsonNullableWithAggregatesFilter<"RecoveryExecution">
    errorMessage?: StringNullableWithAggregatesFilter<"RecoveryExecution"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"RecoveryExecution"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"RecoveryExecution"> | Date | string
  }

  export type ErrorPatternWhereInput = {
    AND?: ErrorPatternWhereInput | ErrorPatternWhereInput[]
    OR?: ErrorPatternWhereInput[]
    NOT?: ErrorPatternWhereInput | ErrorPatternWhereInput[]
    id?: StringFilter<"ErrorPattern"> | string
    name?: StringFilter<"ErrorPattern"> | string
    description?: StringFilter<"ErrorPattern"> | string
    pattern?: StringFilter<"ErrorPattern"> | string
    category?: StringFilter<"ErrorPattern"> | string
    severity?: StringFilter<"ErrorPattern"> | string
    tags?: StringNullableListFilter<"ErrorPattern">
    recoveryActions?: StringNullableListFilter<"ErrorPattern">
    matchCount?: IntFilter<"ErrorPattern"> | number
    lastMatched?: DateTimeNullableFilter<"ErrorPattern"> | Date | string | null
    isActive?: BoolFilter<"ErrorPattern"> | boolean
    createdAt?: DateTimeFilter<"ErrorPattern"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorPattern"> | Date | string
  }

  export type ErrorPatternOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    pattern?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    tags?: SortOrder
    recoveryActions?: SortOrder
    matchCount?: SortOrder
    lastMatched?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorPatternWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: ErrorPatternWhereInput | ErrorPatternWhereInput[]
    OR?: ErrorPatternWhereInput[]
    NOT?: ErrorPatternWhereInput | ErrorPatternWhereInput[]
    description?: StringFilter<"ErrorPattern"> | string
    pattern?: StringFilter<"ErrorPattern"> | string
    category?: StringFilter<"ErrorPattern"> | string
    severity?: StringFilter<"ErrorPattern"> | string
    tags?: StringNullableListFilter<"ErrorPattern">
    recoveryActions?: StringNullableListFilter<"ErrorPattern">
    matchCount?: IntFilter<"ErrorPattern"> | number
    lastMatched?: DateTimeNullableFilter<"ErrorPattern"> | Date | string | null
    isActive?: BoolFilter<"ErrorPattern"> | boolean
    createdAt?: DateTimeFilter<"ErrorPattern"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorPattern"> | Date | string
  }, "id" | "name">

  export type ErrorPatternOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    pattern?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    tags?: SortOrder
    recoveryActions?: SortOrder
    matchCount?: SortOrder
    lastMatched?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ErrorPatternCountOrderByAggregateInput
    _avg?: ErrorPatternAvgOrderByAggregateInput
    _max?: ErrorPatternMaxOrderByAggregateInput
    _min?: ErrorPatternMinOrderByAggregateInput
    _sum?: ErrorPatternSumOrderByAggregateInput
  }

  export type ErrorPatternScalarWhereWithAggregatesInput = {
    AND?: ErrorPatternScalarWhereWithAggregatesInput | ErrorPatternScalarWhereWithAggregatesInput[]
    OR?: ErrorPatternScalarWhereWithAggregatesInput[]
    NOT?: ErrorPatternScalarWhereWithAggregatesInput | ErrorPatternScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ErrorPattern"> | string
    name?: StringWithAggregatesFilter<"ErrorPattern"> | string
    description?: StringWithAggregatesFilter<"ErrorPattern"> | string
    pattern?: StringWithAggregatesFilter<"ErrorPattern"> | string
    category?: StringWithAggregatesFilter<"ErrorPattern"> | string
    severity?: StringWithAggregatesFilter<"ErrorPattern"> | string
    tags?: StringNullableListFilter<"ErrorPattern">
    recoveryActions?: StringNullableListFilter<"ErrorPattern">
    matchCount?: IntWithAggregatesFilter<"ErrorPattern"> | number
    lastMatched?: DateTimeNullableWithAggregatesFilter<"ErrorPattern"> | Date | string | null
    isActive?: BoolWithAggregatesFilter<"ErrorPattern"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"ErrorPattern"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ErrorPattern"> | Date | string
  }

  export type ErrorAggregationWhereInput = {
    AND?: ErrorAggregationWhereInput | ErrorAggregationWhereInput[]
    OR?: ErrorAggregationWhereInput[]
    NOT?: ErrorAggregationWhereInput | ErrorAggregationWhereInput[]
    id?: StringFilter<"ErrorAggregation"> | string
    fingerprint?: StringFilter<"ErrorAggregation"> | string
    timeWindow?: DateTimeNullableFilter<"ErrorAggregation"> | Date | string | null
    count?: IntFilter<"ErrorAggregation"> | number
    errorCount?: IntFilter<"ErrorAggregation"> | number
    affectedUsers?: IntFilter<"ErrorAggregation"> | number
    avgResponseTime?: FloatNullableFilter<"ErrorAggregation"> | number | null
    firstSeen?: DateTimeFilter<"ErrorAggregation"> | Date | string
    lastSeen?: DateTimeFilter<"ErrorAggregation"> | Date | string
    trend?: StringFilter<"ErrorAggregation"> | string
    hourlyDistribution?: IntNullableListFilter<"ErrorAggregation">
    topAffectedEndpoints?: JsonNullableFilter<"ErrorAggregation">
    topAffectedUsers?: JsonNullableFilter<"ErrorAggregation">
    byService?: JsonNullableFilter<"ErrorAggregation">
    bySeverity?: JsonNullableFilter<"ErrorAggregation">
    byEndpoint?: JsonNullableFilter<"ErrorAggregation">
    createdAt?: DateTimeFilter<"ErrorAggregation"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorAggregation"> | Date | string
  }

  export type ErrorAggregationOrderByWithRelationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    timeWindow?: SortOrderInput | SortOrder
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrderInput | SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    trend?: SortOrder
    hourlyDistribution?: SortOrder
    topAffectedEndpoints?: SortOrderInput | SortOrder
    topAffectedUsers?: SortOrderInput | SortOrder
    byService?: SortOrderInput | SortOrder
    bySeverity?: SortOrderInput | SortOrder
    byEndpoint?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorAggregationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    fingerprint?: string
    AND?: ErrorAggregationWhereInput | ErrorAggregationWhereInput[]
    OR?: ErrorAggregationWhereInput[]
    NOT?: ErrorAggregationWhereInput | ErrorAggregationWhereInput[]
    timeWindow?: DateTimeNullableFilter<"ErrorAggregation"> | Date | string | null
    count?: IntFilter<"ErrorAggregation"> | number
    errorCount?: IntFilter<"ErrorAggregation"> | number
    affectedUsers?: IntFilter<"ErrorAggregation"> | number
    avgResponseTime?: FloatNullableFilter<"ErrorAggregation"> | number | null
    firstSeen?: DateTimeFilter<"ErrorAggregation"> | Date | string
    lastSeen?: DateTimeFilter<"ErrorAggregation"> | Date | string
    trend?: StringFilter<"ErrorAggregation"> | string
    hourlyDistribution?: IntNullableListFilter<"ErrorAggregation">
    topAffectedEndpoints?: JsonNullableFilter<"ErrorAggregation">
    topAffectedUsers?: JsonNullableFilter<"ErrorAggregation">
    byService?: JsonNullableFilter<"ErrorAggregation">
    bySeverity?: JsonNullableFilter<"ErrorAggregation">
    byEndpoint?: JsonNullableFilter<"ErrorAggregation">
    createdAt?: DateTimeFilter<"ErrorAggregation"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorAggregation"> | Date | string
  }, "id" | "fingerprint">

  export type ErrorAggregationOrderByWithAggregationInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    timeWindow?: SortOrderInput | SortOrder
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrderInput | SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    trend?: SortOrder
    hourlyDistribution?: SortOrder
    topAffectedEndpoints?: SortOrderInput | SortOrder
    topAffectedUsers?: SortOrderInput | SortOrder
    byService?: SortOrderInput | SortOrder
    bySeverity?: SortOrderInput | SortOrder
    byEndpoint?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ErrorAggregationCountOrderByAggregateInput
    _avg?: ErrorAggregationAvgOrderByAggregateInput
    _max?: ErrorAggregationMaxOrderByAggregateInput
    _min?: ErrorAggregationMinOrderByAggregateInput
    _sum?: ErrorAggregationSumOrderByAggregateInput
  }

  export type ErrorAggregationScalarWhereWithAggregatesInput = {
    AND?: ErrorAggregationScalarWhereWithAggregatesInput | ErrorAggregationScalarWhereWithAggregatesInput[]
    OR?: ErrorAggregationScalarWhereWithAggregatesInput[]
    NOT?: ErrorAggregationScalarWhereWithAggregatesInput | ErrorAggregationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ErrorAggregation"> | string
    fingerprint?: StringWithAggregatesFilter<"ErrorAggregation"> | string
    timeWindow?: DateTimeNullableWithAggregatesFilter<"ErrorAggregation"> | Date | string | null
    count?: IntWithAggregatesFilter<"ErrorAggregation"> | number
    errorCount?: IntWithAggregatesFilter<"ErrorAggregation"> | number
    affectedUsers?: IntWithAggregatesFilter<"ErrorAggregation"> | number
    avgResponseTime?: FloatNullableWithAggregatesFilter<"ErrorAggregation"> | number | null
    firstSeen?: DateTimeWithAggregatesFilter<"ErrorAggregation"> | Date | string
    lastSeen?: DateTimeWithAggregatesFilter<"ErrorAggregation"> | Date | string
    trend?: StringWithAggregatesFilter<"ErrorAggregation"> | string
    hourlyDistribution?: IntNullableListFilter<"ErrorAggregation">
    topAffectedEndpoints?: JsonNullableWithAggregatesFilter<"ErrorAggregation">
    topAffectedUsers?: JsonNullableWithAggregatesFilter<"ErrorAggregation">
    byService?: JsonNullableWithAggregatesFilter<"ErrorAggregation">
    bySeverity?: JsonNullableWithAggregatesFilter<"ErrorAggregation">
    byEndpoint?: JsonNullableWithAggregatesFilter<"ErrorAggregation">
    createdAt?: DateTimeWithAggregatesFilter<"ErrorAggregation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ErrorAggregation"> | Date | string
  }

  export type AlertConfigurationWhereInput = {
    AND?: AlertConfigurationWhereInput | AlertConfigurationWhereInput[]
    OR?: AlertConfigurationWhereInput[]
    NOT?: AlertConfigurationWhereInput | AlertConfigurationWhereInput[]
    id?: StringFilter<"AlertConfiguration"> | string
    name?: StringFilter<"AlertConfiguration"> | string
    description?: StringNullableFilter<"AlertConfiguration"> | string | null
    condition?: StringFilter<"AlertConfiguration"> | string
    threshold?: FloatNullableFilter<"AlertConfiguration"> | number | null
    timeWindow?: IntNullableFilter<"AlertConfiguration"> | number | null
    severity?: StringNullableListFilter<"AlertConfiguration">
    services?: StringNullableListFilter<"AlertConfiguration">
    categories?: StringNullableListFilter<"AlertConfiguration">
    actions?: JsonFilter<"AlertConfiguration">
    isActive?: BoolFilter<"AlertConfiguration"> | boolean
    lastTriggered?: DateTimeNullableFilter<"AlertConfiguration"> | Date | string | null
    triggerCount?: IntFilter<"AlertConfiguration"> | number
    createdAt?: DateTimeFilter<"AlertConfiguration"> | Date | string
    updatedAt?: DateTimeFilter<"AlertConfiguration"> | Date | string
  }

  export type AlertConfigurationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    condition?: SortOrder
    threshold?: SortOrderInput | SortOrder
    timeWindow?: SortOrderInput | SortOrder
    severity?: SortOrder
    services?: SortOrder
    categories?: SortOrder
    actions?: SortOrder
    isActive?: SortOrder
    lastTriggered?: SortOrderInput | SortOrder
    triggerCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertConfigurationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: AlertConfigurationWhereInput | AlertConfigurationWhereInput[]
    OR?: AlertConfigurationWhereInput[]
    NOT?: AlertConfigurationWhereInput | AlertConfigurationWhereInput[]
    description?: StringNullableFilter<"AlertConfiguration"> | string | null
    condition?: StringFilter<"AlertConfiguration"> | string
    threshold?: FloatNullableFilter<"AlertConfiguration"> | number | null
    timeWindow?: IntNullableFilter<"AlertConfiguration"> | number | null
    severity?: StringNullableListFilter<"AlertConfiguration">
    services?: StringNullableListFilter<"AlertConfiguration">
    categories?: StringNullableListFilter<"AlertConfiguration">
    actions?: JsonFilter<"AlertConfiguration">
    isActive?: BoolFilter<"AlertConfiguration"> | boolean
    lastTriggered?: DateTimeNullableFilter<"AlertConfiguration"> | Date | string | null
    triggerCount?: IntFilter<"AlertConfiguration"> | number
    createdAt?: DateTimeFilter<"AlertConfiguration"> | Date | string
    updatedAt?: DateTimeFilter<"AlertConfiguration"> | Date | string
  }, "id" | "name">

  export type AlertConfigurationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    condition?: SortOrder
    threshold?: SortOrderInput | SortOrder
    timeWindow?: SortOrderInput | SortOrder
    severity?: SortOrder
    services?: SortOrder
    categories?: SortOrder
    actions?: SortOrder
    isActive?: SortOrder
    lastTriggered?: SortOrderInput | SortOrder
    triggerCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AlertConfigurationCountOrderByAggregateInput
    _avg?: AlertConfigurationAvgOrderByAggregateInput
    _max?: AlertConfigurationMaxOrderByAggregateInput
    _min?: AlertConfigurationMinOrderByAggregateInput
    _sum?: AlertConfigurationSumOrderByAggregateInput
  }

  export type AlertConfigurationScalarWhereWithAggregatesInput = {
    AND?: AlertConfigurationScalarWhereWithAggregatesInput | AlertConfigurationScalarWhereWithAggregatesInput[]
    OR?: AlertConfigurationScalarWhereWithAggregatesInput[]
    NOT?: AlertConfigurationScalarWhereWithAggregatesInput | AlertConfigurationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AlertConfiguration"> | string
    name?: StringWithAggregatesFilter<"AlertConfiguration"> | string
    description?: StringNullableWithAggregatesFilter<"AlertConfiguration"> | string | null
    condition?: StringWithAggregatesFilter<"AlertConfiguration"> | string
    threshold?: FloatNullableWithAggregatesFilter<"AlertConfiguration"> | number | null
    timeWindow?: IntNullableWithAggregatesFilter<"AlertConfiguration"> | number | null
    severity?: StringNullableListFilter<"AlertConfiguration">
    services?: StringNullableListFilter<"AlertConfiguration">
    categories?: StringNullableListFilter<"AlertConfiguration">
    actions?: JsonWithAggregatesFilter<"AlertConfiguration">
    isActive?: BoolWithAggregatesFilter<"AlertConfiguration"> | boolean
    lastTriggered?: DateTimeNullableWithAggregatesFilter<"AlertConfiguration"> | Date | string | null
    triggerCount?: IntWithAggregatesFilter<"AlertConfiguration"> | number
    createdAt?: DateTimeWithAggregatesFilter<"AlertConfiguration"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AlertConfiguration"> | Date | string
  }

  export type AlertHistoryWhereInput = {
    AND?: AlertHistoryWhereInput | AlertHistoryWhereInput[]
    OR?: AlertHistoryWhereInput[]
    NOT?: AlertHistoryWhereInput | AlertHistoryWhereInput[]
    id?: StringFilter<"AlertHistory"> | string
    configId?: StringFilter<"AlertHistory"> | string
    triggeredAt?: DateTimeFilter<"AlertHistory"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"AlertHistory"> | Date | string | null
    alertType?: StringFilter<"AlertHistory"> | string
    severity?: StringFilter<"AlertHistory"> | string
    message?: StringFilter<"AlertHistory"> | string
    details?: JsonNullableFilter<"AlertHistory">
    actionsTaken?: JsonNullableFilter<"AlertHistory">
    acknowledged?: BoolFilter<"AlertHistory"> | boolean
    acknowledgedBy?: StringNullableFilter<"AlertHistory"> | string | null
    acknowledgedAt?: DateTimeNullableFilter<"AlertHistory"> | Date | string | null
    createdAt?: DateTimeFilter<"AlertHistory"> | Date | string
    updatedAt?: DateTimeFilter<"AlertHistory"> | Date | string
  }

  export type AlertHistoryOrderByWithRelationInput = {
    id?: SortOrder
    configId?: SortOrder
    triggeredAt?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    alertType?: SortOrder
    severity?: SortOrder
    message?: SortOrder
    details?: SortOrderInput | SortOrder
    actionsTaken?: SortOrderInput | SortOrder
    acknowledged?: SortOrder
    acknowledgedBy?: SortOrderInput | SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AlertHistoryWhereInput | AlertHistoryWhereInput[]
    OR?: AlertHistoryWhereInput[]
    NOT?: AlertHistoryWhereInput | AlertHistoryWhereInput[]
    configId?: StringFilter<"AlertHistory"> | string
    triggeredAt?: DateTimeFilter<"AlertHistory"> | Date | string
    resolvedAt?: DateTimeNullableFilter<"AlertHistory"> | Date | string | null
    alertType?: StringFilter<"AlertHistory"> | string
    severity?: StringFilter<"AlertHistory"> | string
    message?: StringFilter<"AlertHistory"> | string
    details?: JsonNullableFilter<"AlertHistory">
    actionsTaken?: JsonNullableFilter<"AlertHistory">
    acknowledged?: BoolFilter<"AlertHistory"> | boolean
    acknowledgedBy?: StringNullableFilter<"AlertHistory"> | string | null
    acknowledgedAt?: DateTimeNullableFilter<"AlertHistory"> | Date | string | null
    createdAt?: DateTimeFilter<"AlertHistory"> | Date | string
    updatedAt?: DateTimeFilter<"AlertHistory"> | Date | string
  }, "id">

  export type AlertHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    configId?: SortOrder
    triggeredAt?: SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    alertType?: SortOrder
    severity?: SortOrder
    message?: SortOrder
    details?: SortOrderInput | SortOrder
    actionsTaken?: SortOrderInput | SortOrder
    acknowledged?: SortOrder
    acknowledgedBy?: SortOrderInput | SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AlertHistoryCountOrderByAggregateInput
    _max?: AlertHistoryMaxOrderByAggregateInput
    _min?: AlertHistoryMinOrderByAggregateInput
  }

  export type AlertHistoryScalarWhereWithAggregatesInput = {
    AND?: AlertHistoryScalarWhereWithAggregatesInput | AlertHistoryScalarWhereWithAggregatesInput[]
    OR?: AlertHistoryScalarWhereWithAggregatesInput[]
    NOT?: AlertHistoryScalarWhereWithAggregatesInput | AlertHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AlertHistory"> | string
    configId?: StringWithAggregatesFilter<"AlertHistory"> | string
    triggeredAt?: DateTimeWithAggregatesFilter<"AlertHistory"> | Date | string
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"AlertHistory"> | Date | string | null
    alertType?: StringWithAggregatesFilter<"AlertHistory"> | string
    severity?: StringWithAggregatesFilter<"AlertHistory"> | string
    message?: StringWithAggregatesFilter<"AlertHistory"> | string
    details?: JsonNullableWithAggregatesFilter<"AlertHistory">
    actionsTaken?: JsonNullableWithAggregatesFilter<"AlertHistory">
    acknowledged?: BoolWithAggregatesFilter<"AlertHistory"> | boolean
    acknowledgedBy?: StringNullableWithAggregatesFilter<"AlertHistory"> | string | null
    acknowledgedAt?: DateTimeNullableWithAggregatesFilter<"AlertHistory"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"AlertHistory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AlertHistory"> | Date | string
  }

  export type ErrorCreateInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationCreateNestedManyWithoutErrorInput
    relatedErrors?: ErrorCorrelationCreateNestedManyWithoutRelatedErrorInput
    recoveryExecutions?: RecoveryExecutionCreateNestedManyWithoutErrorInput
  }

  export type ErrorUncheckedCreateInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationUncheckedCreateNestedManyWithoutErrorInput
    relatedErrors?: ErrorCorrelationUncheckedCreateNestedManyWithoutRelatedErrorInput
    recoveryExecutions?: RecoveryExecutionUncheckedCreateNestedManyWithoutErrorInput
  }

  export type ErrorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUpdateManyWithoutErrorNestedInput
    relatedErrors?: ErrorCorrelationUpdateManyWithoutRelatedErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUpdateManyWithoutErrorNestedInput
  }

  export type ErrorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUncheckedUpdateManyWithoutErrorNestedInput
    relatedErrors?: ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUncheckedUpdateManyWithoutErrorNestedInput
  }

  export type ErrorCreateManyInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationCreateInput = {
    id?: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    error: ErrorCreateNestedOneWithoutCorrelationsInput
    relatedError: ErrorCreateNestedOneWithoutRelatedErrorsInput
  }

  export type ErrorCorrelationUncheckedCreateInput = {
    id?: string
    errorId: string
    relatedErrorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    error?: ErrorUpdateOneRequiredWithoutCorrelationsNestedInput
    relatedError?: ErrorUpdateOneRequiredWithoutRelatedErrorsNestedInput
  }

  export type ErrorCorrelationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    relatedErrorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationCreateManyInput = {
    id?: string
    errorId: string
    relatedErrorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    relatedErrorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionCreateInput = {
    id?: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    error: ErrorCreateNestedOneWithoutRecoveryExecutionsInput
  }

  export type RecoveryExecutionUncheckedCreateInput = {
    id?: string
    errorId: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryExecutionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    error?: ErrorUpdateOneRequiredWithoutRecoveryExecutionsNestedInput
  }

  export type RecoveryExecutionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionCreateManyInput = {
    id?: string
    errorId: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryExecutionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorPatternCreateInput = {
    id?: string
    name: string
    description: string
    pattern: string
    category: string
    severity: string
    tags?: ErrorPatternCreatetagsInput | string[]
    recoveryActions?: ErrorPatternCreaterecoveryActionsInput | string[]
    matchCount?: number
    lastMatched?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorPatternUncheckedCreateInput = {
    id?: string
    name: string
    description: string
    pattern: string
    category: string
    severity: string
    tags?: ErrorPatternCreatetagsInput | string[]
    recoveryActions?: ErrorPatternCreaterecoveryActionsInput | string[]
    matchCount?: number
    lastMatched?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorPatternUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    pattern?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    tags?: ErrorPatternUpdatetagsInput | string[]
    recoveryActions?: ErrorPatternUpdaterecoveryActionsInput | string[]
    matchCount?: IntFieldUpdateOperationsInput | number
    lastMatched?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorPatternUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    pattern?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    tags?: ErrorPatternUpdatetagsInput | string[]
    recoveryActions?: ErrorPatternUpdaterecoveryActionsInput | string[]
    matchCount?: IntFieldUpdateOperationsInput | number
    lastMatched?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorPatternCreateManyInput = {
    id?: string
    name: string
    description: string
    pattern: string
    category: string
    severity: string
    tags?: ErrorPatternCreatetagsInput | string[]
    recoveryActions?: ErrorPatternCreaterecoveryActionsInput | string[]
    matchCount?: number
    lastMatched?: Date | string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorPatternUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    pattern?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    tags?: ErrorPatternUpdatetagsInput | string[]
    recoveryActions?: ErrorPatternUpdaterecoveryActionsInput | string[]
    matchCount?: IntFieldUpdateOperationsInput | number
    lastMatched?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorPatternUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    pattern?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    tags?: ErrorPatternUpdatetagsInput | string[]
    recoveryActions?: ErrorPatternUpdaterecoveryActionsInput | string[]
    matchCount?: IntFieldUpdateOperationsInput | number
    lastMatched?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorAggregationCreateInput = {
    id?: string
    fingerprint: string
    timeWindow?: Date | string | null
    count?: number
    errorCount?: number
    affectedUsers?: number
    avgResponseTime?: number | null
    firstSeen?: Date | string
    lastSeen?: Date | string
    trend?: string
    hourlyDistribution?: ErrorAggregationCreatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorAggregationUncheckedCreateInput = {
    id?: string
    fingerprint: string
    timeWindow?: Date | string | null
    count?: number
    errorCount?: number
    affectedUsers?: number
    avgResponseTime?: number | null
    firstSeen?: Date | string
    lastSeen?: Date | string
    trend?: string
    hourlyDistribution?: ErrorAggregationCreatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorAggregationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    timeWindow?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    count?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    affectedUsers?: IntFieldUpdateOperationsInput | number
    avgResponseTime?: NullableFloatFieldUpdateOperationsInput | number | null
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    trend?: StringFieldUpdateOperationsInput | string
    hourlyDistribution?: ErrorAggregationUpdatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorAggregationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    timeWindow?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    count?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    affectedUsers?: IntFieldUpdateOperationsInput | number
    avgResponseTime?: NullableFloatFieldUpdateOperationsInput | number | null
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    trend?: StringFieldUpdateOperationsInput | string
    hourlyDistribution?: ErrorAggregationUpdatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorAggregationCreateManyInput = {
    id?: string
    fingerprint: string
    timeWindow?: Date | string | null
    count?: number
    errorCount?: number
    affectedUsers?: number
    avgResponseTime?: number | null
    firstSeen?: Date | string
    lastSeen?: Date | string
    trend?: string
    hourlyDistribution?: ErrorAggregationCreatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorAggregationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    timeWindow?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    count?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    affectedUsers?: IntFieldUpdateOperationsInput | number
    avgResponseTime?: NullableFloatFieldUpdateOperationsInput | number | null
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    trend?: StringFieldUpdateOperationsInput | string
    hourlyDistribution?: ErrorAggregationUpdatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorAggregationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    timeWindow?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    count?: IntFieldUpdateOperationsInput | number
    errorCount?: IntFieldUpdateOperationsInput | number
    affectedUsers?: IntFieldUpdateOperationsInput | number
    avgResponseTime?: NullableFloatFieldUpdateOperationsInput | number | null
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    trend?: StringFieldUpdateOperationsInput | string
    hourlyDistribution?: ErrorAggregationUpdatehourlyDistributionInput | number[]
    topAffectedEndpoints?: NullableJsonNullValueInput | InputJsonValue
    topAffectedUsers?: NullableJsonNullValueInput | InputJsonValue
    byService?: NullableJsonNullValueInput | InputJsonValue
    bySeverity?: NullableJsonNullValueInput | InputJsonValue
    byEndpoint?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertConfigurationCreateInput = {
    id?: string
    name: string
    description?: string | null
    condition: string
    threshold?: number | null
    timeWindow?: number | null
    severity?: AlertConfigurationCreateseverityInput | string[]
    services?: AlertConfigurationCreateservicesInput | string[]
    categories?: AlertConfigurationCreatecategoriesInput | string[]
    actions: JsonNullValueInput | InputJsonValue
    isActive?: boolean
    lastTriggered?: Date | string | null
    triggerCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertConfigurationUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    condition: string
    threshold?: number | null
    timeWindow?: number | null
    severity?: AlertConfigurationCreateseverityInput | string[]
    services?: AlertConfigurationCreateservicesInput | string[]
    categories?: AlertConfigurationCreatecategoriesInput | string[]
    actions: JsonNullValueInput | InputJsonValue
    isActive?: boolean
    lastTriggered?: Date | string | null
    triggerCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertConfigurationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    threshold?: NullableFloatFieldUpdateOperationsInput | number | null
    timeWindow?: NullableIntFieldUpdateOperationsInput | number | null
    severity?: AlertConfigurationUpdateseverityInput | string[]
    services?: AlertConfigurationUpdateservicesInput | string[]
    categories?: AlertConfigurationUpdatecategoriesInput | string[]
    actions?: JsonNullValueInput | InputJsonValue
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastTriggered?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    triggerCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertConfigurationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    threshold?: NullableFloatFieldUpdateOperationsInput | number | null
    timeWindow?: NullableIntFieldUpdateOperationsInput | number | null
    severity?: AlertConfigurationUpdateseverityInput | string[]
    services?: AlertConfigurationUpdateservicesInput | string[]
    categories?: AlertConfigurationUpdatecategoriesInput | string[]
    actions?: JsonNullValueInput | InputJsonValue
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastTriggered?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    triggerCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertConfigurationCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    condition: string
    threshold?: number | null
    timeWindow?: number | null
    severity?: AlertConfigurationCreateseverityInput | string[]
    services?: AlertConfigurationCreateservicesInput | string[]
    categories?: AlertConfigurationCreatecategoriesInput | string[]
    actions: JsonNullValueInput | InputJsonValue
    isActive?: boolean
    lastTriggered?: Date | string | null
    triggerCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertConfigurationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    threshold?: NullableFloatFieldUpdateOperationsInput | number | null
    timeWindow?: NullableIntFieldUpdateOperationsInput | number | null
    severity?: AlertConfigurationUpdateseverityInput | string[]
    services?: AlertConfigurationUpdateservicesInput | string[]
    categories?: AlertConfigurationUpdatecategoriesInput | string[]
    actions?: JsonNullValueInput | InputJsonValue
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastTriggered?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    triggerCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertConfigurationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    threshold?: NullableFloatFieldUpdateOperationsInput | number | null
    timeWindow?: NullableIntFieldUpdateOperationsInput | number | null
    severity?: AlertConfigurationUpdateseverityInput | string[]
    services?: AlertConfigurationUpdateservicesInput | string[]
    categories?: AlertConfigurationUpdatecategoriesInput | string[]
    actions?: JsonNullValueInput | InputJsonValue
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastTriggered?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    triggerCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertHistoryCreateInput = {
    id?: string
    configId: string
    triggeredAt?: Date | string
    resolvedAt?: Date | string | null
    alertType: string
    severity: string
    message: string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: boolean
    acknowledgedBy?: string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertHistoryUncheckedCreateInput = {
    id?: string
    configId: string
    triggeredAt?: Date | string
    resolvedAt?: Date | string | null
    alertType: string
    severity: string
    message: string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: boolean
    acknowledgedBy?: string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    configId?: StringFieldUpdateOperationsInput | string
    triggeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    alertType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: BoolFieldUpdateOperationsInput | boolean
    acknowledgedBy?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    configId?: StringFieldUpdateOperationsInput | string
    triggeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    alertType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: BoolFieldUpdateOperationsInput | boolean
    acknowledgedBy?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertHistoryCreateManyInput = {
    id?: string
    configId: string
    triggeredAt?: Date | string
    resolvedAt?: Date | string | null
    alertType: string
    severity: string
    message: string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: boolean
    acknowledgedBy?: string | null
    acknowledgedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AlertHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    configId?: StringFieldUpdateOperationsInput | string
    triggeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    alertType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: BoolFieldUpdateOperationsInput | boolean
    acknowledgedBy?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    configId?: StringFieldUpdateOperationsInput | string
    triggeredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    alertType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    details?: NullableJsonNullValueInput | InputJsonValue
    actionsTaken?: NullableJsonNullValueInput | InputJsonValue
    acknowledged?: BoolFieldUpdateOperationsInput | boolean
    acknowledgedBy?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type ErrorCorrelationListRelationFilter = {
    every?: ErrorCorrelationWhereInput
    some?: ErrorCorrelationWhereInput
    none?: ErrorCorrelationWhereInput
  }

  export type RecoveryExecutionListRelationFilter = {
    every?: RecoveryExecutionWhereInput
    some?: RecoveryExecutionWhereInput
    none?: RecoveryExecutionWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ErrorCorrelationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RecoveryExecutionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ErrorCountOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    message?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    errorType?: SortOrder
    stack?: SortOrder
    context?: SortOrder
    service?: SortOrder
    version?: SortOrder
    environment?: SortOrder
    timestamp?: SortOrder
    traceId?: SortOrder
    spanId?: SortOrder
    parentSpanId?: SortOrder
    metadata?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    requestId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    statusCode?: SortOrder
    responseTime?: SortOrder
    memoryUsage?: SortOrder
    customData?: SortOrder
    count?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    resolved?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    resolution?: SortOrder
    tags?: SortOrder
    affectedUsers?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorAvgOrderByAggregateInput = {
    statusCode?: SortOrder
    responseTime?: SortOrder
    count?: SortOrder
  }

  export type ErrorMaxOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    message?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    errorType?: SortOrder
    stack?: SortOrder
    service?: SortOrder
    version?: SortOrder
    environment?: SortOrder
    timestamp?: SortOrder
    traceId?: SortOrder
    spanId?: SortOrder
    parentSpanId?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    requestId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    statusCode?: SortOrder
    responseTime?: SortOrder
    count?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    resolved?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    resolution?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorMinOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    message?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    errorType?: SortOrder
    stack?: SortOrder
    service?: SortOrder
    version?: SortOrder
    environment?: SortOrder
    timestamp?: SortOrder
    traceId?: SortOrder
    spanId?: SortOrder
    parentSpanId?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    requestId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    statusCode?: SortOrder
    responseTime?: SortOrder
    count?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    resolved?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    resolution?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorSumOrderByAggregateInput = {
    statusCode?: SortOrder
    responseTime?: SortOrder
    count?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type ErrorRelationFilter = {
    is?: ErrorWhereInput
    isNot?: ErrorWhereInput
  }

  export type ErrorCorrelationErrorIdRelatedErrorIdCompoundUniqueInput = {
    errorId: string
    relatedErrorId: string
  }

  export type ErrorCorrelationCountOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    relatedErrorId?: SortOrder
    correlationType?: SortOrder
    confidence?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorCorrelationAvgOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type ErrorCorrelationMaxOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    relatedErrorId?: SortOrder
    correlationType?: SortOrder
    confidence?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorCorrelationMinOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    relatedErrorId?: SortOrder
    correlationType?: SortOrder
    confidence?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorCorrelationSumOrderByAggregateInput = {
    confidence?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type RecoveryExecutionCountOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    strategy?: SortOrder
    action?: SortOrder
    status?: SortOrder
    attempts?: SortOrder
    maxAttempts?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRetryAt?: SortOrder
    result?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecoveryExecutionAvgOrderByAggregateInput = {
    attempts?: SortOrder
    maxAttempts?: SortOrder
  }

  export type RecoveryExecutionMaxOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    strategy?: SortOrder
    action?: SortOrder
    status?: SortOrder
    attempts?: SortOrder
    maxAttempts?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRetryAt?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecoveryExecutionMinOrderByAggregateInput = {
    id?: SortOrder
    errorId?: SortOrder
    strategy?: SortOrder
    action?: SortOrder
    status?: SortOrder
    attempts?: SortOrder
    maxAttempts?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    nextRetryAt?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecoveryExecutionSumOrderByAggregateInput = {
    attempts?: SortOrder
    maxAttempts?: SortOrder
  }

  export type ErrorPatternCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    pattern?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    tags?: SortOrder
    recoveryActions?: SortOrder
    matchCount?: SortOrder
    lastMatched?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorPatternAvgOrderByAggregateInput = {
    matchCount?: SortOrder
  }

  export type ErrorPatternMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    pattern?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    matchCount?: SortOrder
    lastMatched?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorPatternMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    pattern?: SortOrder
    category?: SortOrder
    severity?: SortOrder
    matchCount?: SortOrder
    lastMatched?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorPatternSumOrderByAggregateInput = {
    matchCount?: SortOrder
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type IntNullableListFilter<$PrismaModel = never> = {
    equals?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    has?: number | IntFieldRefInput<$PrismaModel> | null
    hasEvery?: number[] | ListIntFieldRefInput<$PrismaModel>
    hasSome?: number[] | ListIntFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type ErrorAggregationCountOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    timeWindow?: SortOrder
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    trend?: SortOrder
    hourlyDistribution?: SortOrder
    topAffectedEndpoints?: SortOrder
    topAffectedUsers?: SortOrder
    byService?: SortOrder
    bySeverity?: SortOrder
    byEndpoint?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorAggregationAvgOrderByAggregateInput = {
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrder
    hourlyDistribution?: SortOrder
  }

  export type ErrorAggregationMaxOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    timeWindow?: SortOrder
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    trend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorAggregationMinOrderByAggregateInput = {
    id?: SortOrder
    fingerprint?: SortOrder
    timeWindow?: SortOrder
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrder
    firstSeen?: SortOrder
    lastSeen?: SortOrder
    trend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorAggregationSumOrderByAggregateInput = {
    count?: SortOrder
    errorCount?: SortOrder
    affectedUsers?: SortOrder
    avgResponseTime?: SortOrder
    hourlyDistribution?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AlertConfigurationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    condition?: SortOrder
    threshold?: SortOrder
    timeWindow?: SortOrder
    severity?: SortOrder
    services?: SortOrder
    categories?: SortOrder
    actions?: SortOrder
    isActive?: SortOrder
    lastTriggered?: SortOrder
    triggerCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertConfigurationAvgOrderByAggregateInput = {
    threshold?: SortOrder
    timeWindow?: SortOrder
    triggerCount?: SortOrder
  }

  export type AlertConfigurationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    condition?: SortOrder
    threshold?: SortOrder
    timeWindow?: SortOrder
    isActive?: SortOrder
    lastTriggered?: SortOrder
    triggerCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertConfigurationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    condition?: SortOrder
    threshold?: SortOrder
    timeWindow?: SortOrder
    isActive?: SortOrder
    lastTriggered?: SortOrder
    triggerCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertConfigurationSumOrderByAggregateInput = {
    threshold?: SortOrder
    timeWindow?: SortOrder
    triggerCount?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type AlertHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    configId?: SortOrder
    triggeredAt?: SortOrder
    resolvedAt?: SortOrder
    alertType?: SortOrder
    severity?: SortOrder
    message?: SortOrder
    details?: SortOrder
    actionsTaken?: SortOrder
    acknowledged?: SortOrder
    acknowledgedBy?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    configId?: SortOrder
    triggeredAt?: SortOrder
    resolvedAt?: SortOrder
    alertType?: SortOrder
    severity?: SortOrder
    message?: SortOrder
    acknowledged?: SortOrder
    acknowledgedBy?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AlertHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    configId?: SortOrder
    triggeredAt?: SortOrder
    resolvedAt?: SortOrder
    alertType?: SortOrder
    severity?: SortOrder
    message?: SortOrder
    acknowledged?: SortOrder
    acknowledgedBy?: SortOrder
    acknowledgedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ErrorCreatetagsInput = {
    set: string[]
  }

  export type ErrorCreateaffectedUsersInput = {
    set: string[]
  }

  export type ErrorCorrelationCreateNestedManyWithoutErrorInput = {
    create?: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput> | ErrorCorrelationCreateWithoutErrorInput[] | ErrorCorrelationUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutErrorInput | ErrorCorrelationCreateOrConnectWithoutErrorInput[]
    createMany?: ErrorCorrelationCreateManyErrorInputEnvelope
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
  }

  export type ErrorCorrelationCreateNestedManyWithoutRelatedErrorInput = {
    create?: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput> | ErrorCorrelationCreateWithoutRelatedErrorInput[] | ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput | ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput[]
    createMany?: ErrorCorrelationCreateManyRelatedErrorInputEnvelope
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
  }

  export type RecoveryExecutionCreateNestedManyWithoutErrorInput = {
    create?: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput> | RecoveryExecutionCreateWithoutErrorInput[] | RecoveryExecutionUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: RecoveryExecutionCreateOrConnectWithoutErrorInput | RecoveryExecutionCreateOrConnectWithoutErrorInput[]
    createMany?: RecoveryExecutionCreateManyErrorInputEnvelope
    connect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
  }

  export type ErrorCorrelationUncheckedCreateNestedManyWithoutErrorInput = {
    create?: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput> | ErrorCorrelationCreateWithoutErrorInput[] | ErrorCorrelationUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutErrorInput | ErrorCorrelationCreateOrConnectWithoutErrorInput[]
    createMany?: ErrorCorrelationCreateManyErrorInputEnvelope
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
  }

  export type ErrorCorrelationUncheckedCreateNestedManyWithoutRelatedErrorInput = {
    create?: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput> | ErrorCorrelationCreateWithoutRelatedErrorInput[] | ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput | ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput[]
    createMany?: ErrorCorrelationCreateManyRelatedErrorInputEnvelope
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
  }

  export type RecoveryExecutionUncheckedCreateNestedManyWithoutErrorInput = {
    create?: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput> | RecoveryExecutionCreateWithoutErrorInput[] | RecoveryExecutionUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: RecoveryExecutionCreateOrConnectWithoutErrorInput | RecoveryExecutionCreateOrConnectWithoutErrorInput[]
    createMany?: RecoveryExecutionCreateManyErrorInputEnvelope
    connect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ErrorUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ErrorUpdateaffectedUsersInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ErrorCorrelationUpdateManyWithoutErrorNestedInput = {
    create?: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput> | ErrorCorrelationCreateWithoutErrorInput[] | ErrorCorrelationUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutErrorInput | ErrorCorrelationCreateOrConnectWithoutErrorInput[]
    upsert?: ErrorCorrelationUpsertWithWhereUniqueWithoutErrorInput | ErrorCorrelationUpsertWithWhereUniqueWithoutErrorInput[]
    createMany?: ErrorCorrelationCreateManyErrorInputEnvelope
    set?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    disconnect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    delete?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    update?: ErrorCorrelationUpdateWithWhereUniqueWithoutErrorInput | ErrorCorrelationUpdateWithWhereUniqueWithoutErrorInput[]
    updateMany?: ErrorCorrelationUpdateManyWithWhereWithoutErrorInput | ErrorCorrelationUpdateManyWithWhereWithoutErrorInput[]
    deleteMany?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
  }

  export type ErrorCorrelationUpdateManyWithoutRelatedErrorNestedInput = {
    create?: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput> | ErrorCorrelationCreateWithoutRelatedErrorInput[] | ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput | ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput[]
    upsert?: ErrorCorrelationUpsertWithWhereUniqueWithoutRelatedErrorInput | ErrorCorrelationUpsertWithWhereUniqueWithoutRelatedErrorInput[]
    createMany?: ErrorCorrelationCreateManyRelatedErrorInputEnvelope
    set?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    disconnect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    delete?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    update?: ErrorCorrelationUpdateWithWhereUniqueWithoutRelatedErrorInput | ErrorCorrelationUpdateWithWhereUniqueWithoutRelatedErrorInput[]
    updateMany?: ErrorCorrelationUpdateManyWithWhereWithoutRelatedErrorInput | ErrorCorrelationUpdateManyWithWhereWithoutRelatedErrorInput[]
    deleteMany?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
  }

  export type RecoveryExecutionUpdateManyWithoutErrorNestedInput = {
    create?: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput> | RecoveryExecutionCreateWithoutErrorInput[] | RecoveryExecutionUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: RecoveryExecutionCreateOrConnectWithoutErrorInput | RecoveryExecutionCreateOrConnectWithoutErrorInput[]
    upsert?: RecoveryExecutionUpsertWithWhereUniqueWithoutErrorInput | RecoveryExecutionUpsertWithWhereUniqueWithoutErrorInput[]
    createMany?: RecoveryExecutionCreateManyErrorInputEnvelope
    set?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    disconnect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    delete?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    connect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    update?: RecoveryExecutionUpdateWithWhereUniqueWithoutErrorInput | RecoveryExecutionUpdateWithWhereUniqueWithoutErrorInput[]
    updateMany?: RecoveryExecutionUpdateManyWithWhereWithoutErrorInput | RecoveryExecutionUpdateManyWithWhereWithoutErrorInput[]
    deleteMany?: RecoveryExecutionScalarWhereInput | RecoveryExecutionScalarWhereInput[]
  }

  export type ErrorCorrelationUncheckedUpdateManyWithoutErrorNestedInput = {
    create?: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput> | ErrorCorrelationCreateWithoutErrorInput[] | ErrorCorrelationUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutErrorInput | ErrorCorrelationCreateOrConnectWithoutErrorInput[]
    upsert?: ErrorCorrelationUpsertWithWhereUniqueWithoutErrorInput | ErrorCorrelationUpsertWithWhereUniqueWithoutErrorInput[]
    createMany?: ErrorCorrelationCreateManyErrorInputEnvelope
    set?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    disconnect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    delete?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    update?: ErrorCorrelationUpdateWithWhereUniqueWithoutErrorInput | ErrorCorrelationUpdateWithWhereUniqueWithoutErrorInput[]
    updateMany?: ErrorCorrelationUpdateManyWithWhereWithoutErrorInput | ErrorCorrelationUpdateManyWithWhereWithoutErrorInput[]
    deleteMany?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
  }

  export type ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorNestedInput = {
    create?: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput> | ErrorCorrelationCreateWithoutRelatedErrorInput[] | ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput[]
    connectOrCreate?: ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput | ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput[]
    upsert?: ErrorCorrelationUpsertWithWhereUniqueWithoutRelatedErrorInput | ErrorCorrelationUpsertWithWhereUniqueWithoutRelatedErrorInput[]
    createMany?: ErrorCorrelationCreateManyRelatedErrorInputEnvelope
    set?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    disconnect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    delete?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    connect?: ErrorCorrelationWhereUniqueInput | ErrorCorrelationWhereUniqueInput[]
    update?: ErrorCorrelationUpdateWithWhereUniqueWithoutRelatedErrorInput | ErrorCorrelationUpdateWithWhereUniqueWithoutRelatedErrorInput[]
    updateMany?: ErrorCorrelationUpdateManyWithWhereWithoutRelatedErrorInput | ErrorCorrelationUpdateManyWithWhereWithoutRelatedErrorInput[]
    deleteMany?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
  }

  export type RecoveryExecutionUncheckedUpdateManyWithoutErrorNestedInput = {
    create?: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput> | RecoveryExecutionCreateWithoutErrorInput[] | RecoveryExecutionUncheckedCreateWithoutErrorInput[]
    connectOrCreate?: RecoveryExecutionCreateOrConnectWithoutErrorInput | RecoveryExecutionCreateOrConnectWithoutErrorInput[]
    upsert?: RecoveryExecutionUpsertWithWhereUniqueWithoutErrorInput | RecoveryExecutionUpsertWithWhereUniqueWithoutErrorInput[]
    createMany?: RecoveryExecutionCreateManyErrorInputEnvelope
    set?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    disconnect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    delete?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    connect?: RecoveryExecutionWhereUniqueInput | RecoveryExecutionWhereUniqueInput[]
    update?: RecoveryExecutionUpdateWithWhereUniqueWithoutErrorInput | RecoveryExecutionUpdateWithWhereUniqueWithoutErrorInput[]
    updateMany?: RecoveryExecutionUpdateManyWithWhereWithoutErrorInput | RecoveryExecutionUpdateManyWithWhereWithoutErrorInput[]
    deleteMany?: RecoveryExecutionScalarWhereInput | RecoveryExecutionScalarWhereInput[]
  }

  export type ErrorCreateNestedOneWithoutCorrelationsInput = {
    create?: XOR<ErrorCreateWithoutCorrelationsInput, ErrorUncheckedCreateWithoutCorrelationsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutCorrelationsInput
    connect?: ErrorWhereUniqueInput
  }

  export type ErrorCreateNestedOneWithoutRelatedErrorsInput = {
    create?: XOR<ErrorCreateWithoutRelatedErrorsInput, ErrorUncheckedCreateWithoutRelatedErrorsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutRelatedErrorsInput
    connect?: ErrorWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ErrorUpdateOneRequiredWithoutCorrelationsNestedInput = {
    create?: XOR<ErrorCreateWithoutCorrelationsInput, ErrorUncheckedCreateWithoutCorrelationsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutCorrelationsInput
    upsert?: ErrorUpsertWithoutCorrelationsInput
    connect?: ErrorWhereUniqueInput
    update?: XOR<XOR<ErrorUpdateToOneWithWhereWithoutCorrelationsInput, ErrorUpdateWithoutCorrelationsInput>, ErrorUncheckedUpdateWithoutCorrelationsInput>
  }

  export type ErrorUpdateOneRequiredWithoutRelatedErrorsNestedInput = {
    create?: XOR<ErrorCreateWithoutRelatedErrorsInput, ErrorUncheckedCreateWithoutRelatedErrorsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutRelatedErrorsInput
    upsert?: ErrorUpsertWithoutRelatedErrorsInput
    connect?: ErrorWhereUniqueInput
    update?: XOR<XOR<ErrorUpdateToOneWithWhereWithoutRelatedErrorsInput, ErrorUpdateWithoutRelatedErrorsInput>, ErrorUncheckedUpdateWithoutRelatedErrorsInput>
  }

  export type ErrorCreateNestedOneWithoutRecoveryExecutionsInput = {
    create?: XOR<ErrorCreateWithoutRecoveryExecutionsInput, ErrorUncheckedCreateWithoutRecoveryExecutionsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutRecoveryExecutionsInput
    connect?: ErrorWhereUniqueInput
  }

  export type ErrorUpdateOneRequiredWithoutRecoveryExecutionsNestedInput = {
    create?: XOR<ErrorCreateWithoutRecoveryExecutionsInput, ErrorUncheckedCreateWithoutRecoveryExecutionsInput>
    connectOrCreate?: ErrorCreateOrConnectWithoutRecoveryExecutionsInput
    upsert?: ErrorUpsertWithoutRecoveryExecutionsInput
    connect?: ErrorWhereUniqueInput
    update?: XOR<XOR<ErrorUpdateToOneWithWhereWithoutRecoveryExecutionsInput, ErrorUpdateWithoutRecoveryExecutionsInput>, ErrorUncheckedUpdateWithoutRecoveryExecutionsInput>
  }

  export type ErrorPatternCreatetagsInput = {
    set: string[]
  }

  export type ErrorPatternCreaterecoveryActionsInput = {
    set: string[]
  }

  export type ErrorPatternUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ErrorPatternUpdaterecoveryActionsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ErrorAggregationCreatehourlyDistributionInput = {
    set: number[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ErrorAggregationUpdatehourlyDistributionInput = {
    set?: number[]
    push?: number | number[]
  }

  export type AlertConfigurationCreateseverityInput = {
    set: string[]
  }

  export type AlertConfigurationCreateservicesInput = {
    set: string[]
  }

  export type AlertConfigurationCreatecategoriesInput = {
    set: string[]
  }

  export type AlertConfigurationUpdateseverityInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AlertConfigurationUpdateservicesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type AlertConfigurationUpdatecategoriesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ErrorCorrelationCreateWithoutErrorInput = {
    id?: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    relatedError: ErrorCreateNestedOneWithoutRelatedErrorsInput
  }

  export type ErrorCorrelationUncheckedCreateWithoutErrorInput = {
    id?: string
    relatedErrorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationCreateOrConnectWithoutErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    create: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput>
  }

  export type ErrorCorrelationCreateManyErrorInputEnvelope = {
    data: ErrorCorrelationCreateManyErrorInput | ErrorCorrelationCreateManyErrorInput[]
    skipDuplicates?: boolean
  }

  export type ErrorCorrelationCreateWithoutRelatedErrorInput = {
    id?: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    error: ErrorCreateNestedOneWithoutCorrelationsInput
  }

  export type ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput = {
    id?: string
    errorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationCreateOrConnectWithoutRelatedErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    create: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput>
  }

  export type ErrorCorrelationCreateManyRelatedErrorInputEnvelope = {
    data: ErrorCorrelationCreateManyRelatedErrorInput | ErrorCorrelationCreateManyRelatedErrorInput[]
    skipDuplicates?: boolean
  }

  export type RecoveryExecutionCreateWithoutErrorInput = {
    id?: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryExecutionUncheckedCreateWithoutErrorInput = {
    id?: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryExecutionCreateOrConnectWithoutErrorInput = {
    where: RecoveryExecutionWhereUniqueInput
    create: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput>
  }

  export type RecoveryExecutionCreateManyErrorInputEnvelope = {
    data: RecoveryExecutionCreateManyErrorInput | RecoveryExecutionCreateManyErrorInput[]
    skipDuplicates?: boolean
  }

  export type ErrorCorrelationUpsertWithWhereUniqueWithoutErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    update: XOR<ErrorCorrelationUpdateWithoutErrorInput, ErrorCorrelationUncheckedUpdateWithoutErrorInput>
    create: XOR<ErrorCorrelationCreateWithoutErrorInput, ErrorCorrelationUncheckedCreateWithoutErrorInput>
  }

  export type ErrorCorrelationUpdateWithWhereUniqueWithoutErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    data: XOR<ErrorCorrelationUpdateWithoutErrorInput, ErrorCorrelationUncheckedUpdateWithoutErrorInput>
  }

  export type ErrorCorrelationUpdateManyWithWhereWithoutErrorInput = {
    where: ErrorCorrelationScalarWhereInput
    data: XOR<ErrorCorrelationUpdateManyMutationInput, ErrorCorrelationUncheckedUpdateManyWithoutErrorInput>
  }

  export type ErrorCorrelationScalarWhereInput = {
    AND?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
    OR?: ErrorCorrelationScalarWhereInput[]
    NOT?: ErrorCorrelationScalarWhereInput | ErrorCorrelationScalarWhereInput[]
    id?: StringFilter<"ErrorCorrelation"> | string
    errorId?: StringFilter<"ErrorCorrelation"> | string
    relatedErrorId?: StringFilter<"ErrorCorrelation"> | string
    correlationType?: StringFilter<"ErrorCorrelation"> | string
    confidence?: FloatFilter<"ErrorCorrelation"> | number
    metadata?: JsonNullableFilter<"ErrorCorrelation">
    createdAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
    updatedAt?: DateTimeFilter<"ErrorCorrelation"> | Date | string
  }

  export type ErrorCorrelationUpsertWithWhereUniqueWithoutRelatedErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    update: XOR<ErrorCorrelationUpdateWithoutRelatedErrorInput, ErrorCorrelationUncheckedUpdateWithoutRelatedErrorInput>
    create: XOR<ErrorCorrelationCreateWithoutRelatedErrorInput, ErrorCorrelationUncheckedCreateWithoutRelatedErrorInput>
  }

  export type ErrorCorrelationUpdateWithWhereUniqueWithoutRelatedErrorInput = {
    where: ErrorCorrelationWhereUniqueInput
    data: XOR<ErrorCorrelationUpdateWithoutRelatedErrorInput, ErrorCorrelationUncheckedUpdateWithoutRelatedErrorInput>
  }

  export type ErrorCorrelationUpdateManyWithWhereWithoutRelatedErrorInput = {
    where: ErrorCorrelationScalarWhereInput
    data: XOR<ErrorCorrelationUpdateManyMutationInput, ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorInput>
  }

  export type RecoveryExecutionUpsertWithWhereUniqueWithoutErrorInput = {
    where: RecoveryExecutionWhereUniqueInput
    update: XOR<RecoveryExecutionUpdateWithoutErrorInput, RecoveryExecutionUncheckedUpdateWithoutErrorInput>
    create: XOR<RecoveryExecutionCreateWithoutErrorInput, RecoveryExecutionUncheckedCreateWithoutErrorInput>
  }

  export type RecoveryExecutionUpdateWithWhereUniqueWithoutErrorInput = {
    where: RecoveryExecutionWhereUniqueInput
    data: XOR<RecoveryExecutionUpdateWithoutErrorInput, RecoveryExecutionUncheckedUpdateWithoutErrorInput>
  }

  export type RecoveryExecutionUpdateManyWithWhereWithoutErrorInput = {
    where: RecoveryExecutionScalarWhereInput
    data: XOR<RecoveryExecutionUpdateManyMutationInput, RecoveryExecutionUncheckedUpdateManyWithoutErrorInput>
  }

  export type RecoveryExecutionScalarWhereInput = {
    AND?: RecoveryExecutionScalarWhereInput | RecoveryExecutionScalarWhereInput[]
    OR?: RecoveryExecutionScalarWhereInput[]
    NOT?: RecoveryExecutionScalarWhereInput | RecoveryExecutionScalarWhereInput[]
    id?: StringFilter<"RecoveryExecution"> | string
    errorId?: StringFilter<"RecoveryExecution"> | string
    strategy?: StringFilter<"RecoveryExecution"> | string
    action?: StringFilter<"RecoveryExecution"> | string
    status?: StringFilter<"RecoveryExecution"> | string
    attempts?: IntFilter<"RecoveryExecution"> | number
    maxAttempts?: IntFilter<"RecoveryExecution"> | number
    startedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    completedAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    nextRetryAt?: DateTimeNullableFilter<"RecoveryExecution"> | Date | string | null
    result?: JsonNullableFilter<"RecoveryExecution">
    errorMessage?: StringNullableFilter<"RecoveryExecution"> | string | null
    createdAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
    updatedAt?: DateTimeFilter<"RecoveryExecution"> | Date | string
  }

  export type ErrorCreateWithoutCorrelationsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    relatedErrors?: ErrorCorrelationCreateNestedManyWithoutRelatedErrorInput
    recoveryExecutions?: RecoveryExecutionCreateNestedManyWithoutErrorInput
  }

  export type ErrorUncheckedCreateWithoutCorrelationsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    relatedErrors?: ErrorCorrelationUncheckedCreateNestedManyWithoutRelatedErrorInput
    recoveryExecutions?: RecoveryExecutionUncheckedCreateNestedManyWithoutErrorInput
  }

  export type ErrorCreateOrConnectWithoutCorrelationsInput = {
    where: ErrorWhereUniqueInput
    create: XOR<ErrorCreateWithoutCorrelationsInput, ErrorUncheckedCreateWithoutCorrelationsInput>
  }

  export type ErrorCreateWithoutRelatedErrorsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationCreateNestedManyWithoutErrorInput
    recoveryExecutions?: RecoveryExecutionCreateNestedManyWithoutErrorInput
  }

  export type ErrorUncheckedCreateWithoutRelatedErrorsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationUncheckedCreateNestedManyWithoutErrorInput
    recoveryExecutions?: RecoveryExecutionUncheckedCreateNestedManyWithoutErrorInput
  }

  export type ErrorCreateOrConnectWithoutRelatedErrorsInput = {
    where: ErrorWhereUniqueInput
    create: XOR<ErrorCreateWithoutRelatedErrorsInput, ErrorUncheckedCreateWithoutRelatedErrorsInput>
  }

  export type ErrorUpsertWithoutCorrelationsInput = {
    update: XOR<ErrorUpdateWithoutCorrelationsInput, ErrorUncheckedUpdateWithoutCorrelationsInput>
    create: XOR<ErrorCreateWithoutCorrelationsInput, ErrorUncheckedCreateWithoutCorrelationsInput>
    where?: ErrorWhereInput
  }

  export type ErrorUpdateToOneWithWhereWithoutCorrelationsInput = {
    where?: ErrorWhereInput
    data: XOR<ErrorUpdateWithoutCorrelationsInput, ErrorUncheckedUpdateWithoutCorrelationsInput>
  }

  export type ErrorUpdateWithoutCorrelationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedErrors?: ErrorCorrelationUpdateManyWithoutRelatedErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUpdateManyWithoutErrorNestedInput
  }

  export type ErrorUncheckedUpdateWithoutCorrelationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedErrors?: ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUncheckedUpdateManyWithoutErrorNestedInput
  }

  export type ErrorUpsertWithoutRelatedErrorsInput = {
    update: XOR<ErrorUpdateWithoutRelatedErrorsInput, ErrorUncheckedUpdateWithoutRelatedErrorsInput>
    create: XOR<ErrorCreateWithoutRelatedErrorsInput, ErrorUncheckedCreateWithoutRelatedErrorsInput>
    where?: ErrorWhereInput
  }

  export type ErrorUpdateToOneWithWhereWithoutRelatedErrorsInput = {
    where?: ErrorWhereInput
    data: XOR<ErrorUpdateWithoutRelatedErrorsInput, ErrorUncheckedUpdateWithoutRelatedErrorsInput>
  }

  export type ErrorUpdateWithoutRelatedErrorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUpdateManyWithoutErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUpdateManyWithoutErrorNestedInput
  }

  export type ErrorUncheckedUpdateWithoutRelatedErrorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUncheckedUpdateManyWithoutErrorNestedInput
    recoveryExecutions?: RecoveryExecutionUncheckedUpdateManyWithoutErrorNestedInput
  }

  export type ErrorCreateWithoutRecoveryExecutionsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationCreateNestedManyWithoutErrorInput
    relatedErrors?: ErrorCorrelationCreateNestedManyWithoutRelatedErrorInput
  }

  export type ErrorUncheckedCreateWithoutRecoveryExecutionsInput = {
    id?: string
    fingerprint: string
    message: string
    category: string
    severity: string
    errorType: string
    stack?: string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service: string
    version: string
    environment: string
    timestamp?: Date | string
    traceId?: string | null
    spanId?: string | null
    parentSpanId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: string | null
    sessionId?: string | null
    requestId?: string | null
    userAgent?: string | null
    ipAddress?: string | null
    endpoint?: string | null
    method?: string | null
    statusCode?: number | null
    responseTime?: number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: number
    firstSeen?: Date | string
    lastSeen?: Date | string
    resolved?: boolean
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    resolution?: string | null
    tags?: ErrorCreatetagsInput | string[]
    affectedUsers?: ErrorCreateaffectedUsersInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    correlations?: ErrorCorrelationUncheckedCreateNestedManyWithoutErrorInput
    relatedErrors?: ErrorCorrelationUncheckedCreateNestedManyWithoutRelatedErrorInput
  }

  export type ErrorCreateOrConnectWithoutRecoveryExecutionsInput = {
    where: ErrorWhereUniqueInput
    create: XOR<ErrorCreateWithoutRecoveryExecutionsInput, ErrorUncheckedCreateWithoutRecoveryExecutionsInput>
  }

  export type ErrorUpsertWithoutRecoveryExecutionsInput = {
    update: XOR<ErrorUpdateWithoutRecoveryExecutionsInput, ErrorUncheckedUpdateWithoutRecoveryExecutionsInput>
    create: XOR<ErrorCreateWithoutRecoveryExecutionsInput, ErrorUncheckedCreateWithoutRecoveryExecutionsInput>
    where?: ErrorWhereInput
  }

  export type ErrorUpdateToOneWithWhereWithoutRecoveryExecutionsInput = {
    where?: ErrorWhereInput
    data: XOR<ErrorUpdateWithoutRecoveryExecutionsInput, ErrorUncheckedUpdateWithoutRecoveryExecutionsInput>
  }

  export type ErrorUpdateWithoutRecoveryExecutionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUpdateManyWithoutErrorNestedInput
    relatedErrors?: ErrorCorrelationUpdateManyWithoutRelatedErrorNestedInput
  }

  export type ErrorUncheckedUpdateWithoutRecoveryExecutionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    errorType?: StringFieldUpdateOperationsInput | string
    stack?: NullableStringFieldUpdateOperationsInput | string | null
    context?: NullableJsonNullValueInput | InputJsonValue
    service?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    environment?: StringFieldUpdateOperationsInput | string
    timestamp?: DateTimeFieldUpdateOperationsInput | Date | string
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    spanId?: NullableStringFieldUpdateOperationsInput | string | null
    parentSpanId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    requestId?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: NullableStringFieldUpdateOperationsInput | string | null
    method?: NullableStringFieldUpdateOperationsInput | string | null
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    responseTime?: NullableIntFieldUpdateOperationsInput | number | null
    memoryUsage?: NullableJsonNullValueInput | InputJsonValue
    customData?: NullableJsonNullValueInput | InputJsonValue
    count?: IntFieldUpdateOperationsInput | number
    firstSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeen?: DateTimeFieldUpdateOperationsInput | Date | string
    resolved?: BoolFieldUpdateOperationsInput | boolean
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: ErrorUpdatetagsInput | string[]
    affectedUsers?: ErrorUpdateaffectedUsersInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    correlations?: ErrorCorrelationUncheckedUpdateManyWithoutErrorNestedInput
    relatedErrors?: ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorNestedInput
  }

  export type ErrorCorrelationCreateManyErrorInput = {
    id?: string
    relatedErrorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationCreateManyRelatedErrorInput = {
    id?: string
    errorId: string
    correlationType: string
    confidence?: number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecoveryExecutionCreateManyErrorInput = {
    id?: string
    strategy: string
    action: string
    status?: string
    attempts?: number
    maxAttempts?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    nextRetryAt?: Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ErrorCorrelationUpdateWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedError?: ErrorUpdateOneRequiredWithoutRelatedErrorsNestedInput
  }

  export type ErrorCorrelationUncheckedUpdateWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    relatedErrorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationUncheckedUpdateManyWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    relatedErrorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationUpdateWithoutRelatedErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    error?: ErrorUpdateOneRequiredWithoutCorrelationsNestedInput
  }

  export type ErrorCorrelationUncheckedUpdateWithoutRelatedErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ErrorCorrelationUncheckedUpdateManyWithoutRelatedErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    errorId?: StringFieldUpdateOperationsInput | string
    correlationType?: StringFieldUpdateOperationsInput | string
    confidence?: FloatFieldUpdateOperationsInput | number
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionUpdateWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionUncheckedUpdateWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecoveryExecutionUncheckedUpdateManyWithoutErrorInput = {
    id?: StringFieldUpdateOperationsInput | string
    strategy?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    attempts?: IntFieldUpdateOperationsInput | number
    maxAttempts?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextRetryAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    result?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use ErrorCountOutputTypeDefaultArgs instead
     */
    export type ErrorCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ErrorCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ErrorDefaultArgs instead
     */
    export type ErrorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ErrorDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ErrorCorrelationDefaultArgs instead
     */
    export type ErrorCorrelationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ErrorCorrelationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RecoveryExecutionDefaultArgs instead
     */
    export type RecoveryExecutionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RecoveryExecutionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ErrorPatternDefaultArgs instead
     */
    export type ErrorPatternArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ErrorPatternDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ErrorAggregationDefaultArgs instead
     */
    export type ErrorAggregationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ErrorAggregationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AlertConfigurationDefaultArgs instead
     */
    export type AlertConfigurationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AlertConfigurationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AlertHistoryDefaultArgs instead
     */
    export type AlertHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AlertHistoryDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}