/**
 * turns
 *
 * ```
 * [ {thing: "A"}, {thing:"B"} ]
 * ```
 *
 * into
 *
 * ```
 * {thing:"A"} | {thing:"B"}
 * ```
 */
export declare type UnionFromArray<A extends readonly any[]> = A[number];
/**
 * given KeyProp "thing", turns
 *
 * ```
 * {thing:"A"} | {thing:"B"}`
 * ```
 *
 * into
 *
 * ```
 * {
 *   A: {thing:"A"}
 * } | {
 *   B: {thing:"B"}
 * }
 * ```
 */
export declare type KeyObjectUnionBy<C, KeyProp extends string> = C extends {
    [kp in KeyProp]: infer K;
} ? K extends string ? {
    [k in K]: C;
} : never : never;
/**
 * this works for reasons it's best we don't think about.
 * see ts gh repo issues 27907, 29594, etc
 * turns
 * ```
 * {
 *   A: {thing:"A"}
 * } | {
 *   B: {thing:"B"}
 * }
 * ```
 * into
 * ```
 * {
 *   A: {thing:"A"}
 * } & {
 *   B: {thing:"B"}
 * }
 * ```
 */
export declare type IntersectionFromUnion<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
/**
 * turns
 * ```
 * {
 *   A: {thing:"A"}
 * } & {
 *   B: {thing:"B"}
 * }
 * ```
 * into
 * ```
 * {
 *   A: {thing:"A"}
 *   B: {thing:"B"}
 * }
 * ```
 */
export declare type CleanUpObjectIntersection<T> = T extends unknown ? {
    [K in keyof T]: T[K];
} : T;
/**
 * recursively turns
 * ```
 * {
 *   A: {thing:"A"}
 * } & {
 *   B: {thing:"B"}
 * }
 * ```
 * into
 * ```
 * {
 *   A: {thing:"A"}
 *   B: {thing:"B"}
 * }
 * ```
 * this can be unhelpful and visually disassemble known, named types back into their definitions
 */
export declare type CleanUpObjectIntersectionRecursive<T> = T extends unknown ? {
    [K in keyof T]: T[K] extends {} ? CleanUpObjectIntersectionRecursive<T[K]> : T[K];
} : T;
