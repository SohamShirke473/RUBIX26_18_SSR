/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as conversations from "../conversations.js";
import type * as email from "../email.js";
import type * as getListing from "../getListing.js";
import type * as matches from "../matches.js";
import type * as matching from "../matching.js";
import type * as matchingHelpers from "../matchingHelpers.js";
import type * as moderation from "../moderation.js";
import type * as report from "../report.js";
import type * as verification from "../verification.js";
import type * as verificationActions from "../verificationActions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  conversations: typeof conversations;
  email: typeof email;
  getListing: typeof getListing;
  matches: typeof matches;
  matching: typeof matching;
  matchingHelpers: typeof matchingHelpers;
  moderation: typeof moderation;
  report: typeof report;
  verification: typeof verification;
  verificationActions: typeof verificationActions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
