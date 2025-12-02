/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendPasswordReset from "../ResendPasswordReset.js";
import type * as auth from "../auth.js";
import type * as curryEvents from "../curryEvents.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as ratings from "../ratings.js";
import type * as restaurants from "../restaurants.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendPasswordReset: typeof ResendPasswordReset;
  auth: typeof auth;
  curryEvents: typeof curryEvents;
  groups: typeof groups;
  http: typeof http;
  migrations: typeof migrations;
  ratings: typeof ratings;
  restaurants: typeof restaurants;
  storage: typeof storage;
  users: typeof users;
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
