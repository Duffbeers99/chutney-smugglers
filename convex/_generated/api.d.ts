/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as BrevoPasswordReset from "../BrevoPasswordReset.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as curryEvents from "../curryEvents.js";
import type * as dateVotes from "../dateVotes.js";
import type * as emails_bookingConfirmation from "../emails/bookingConfirmation.js";
import type * as emails_brevoClient from "../emails/brevoClient.js";
import type * as emails_eventReminder from "../emails/eventReminder.js";
import type * as emails_templates from "../emails/templates.js";
import type * as emails_votingReminder from "../emails/votingReminder.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as migrations_setRotationOrder from "../migrations/setRotationOrder.js";
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
  BrevoPasswordReset: typeof BrevoPasswordReset;
  auth: typeof auth;
  crons: typeof crons;
  curryEvents: typeof curryEvents;
  dateVotes: typeof dateVotes;
  "emails/bookingConfirmation": typeof emails_bookingConfirmation;
  "emails/brevoClient": typeof emails_brevoClient;
  "emails/eventReminder": typeof emails_eventReminder;
  "emails/templates": typeof emails_templates;
  "emails/votingReminder": typeof emails_votingReminder;
  groups: typeof groups;
  http: typeof http;
  migrations: typeof migrations;
  "migrations/setRotationOrder": typeof migrations_setRotationOrder;
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
