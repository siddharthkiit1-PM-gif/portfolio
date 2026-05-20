/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as embeddings from "../embeddings.js";
import type * as embeddingsHelpers from "../embeddingsHelpers.js";
import type * as experienceRoles from "../experienceRoles.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as mcp from "../mcp.js";
import type * as mcpHelpers from "../mcpHelpers.js";
import type * as mcpQueries from "../mcpQueries.js";
import type * as media from "../media.js";
import type * as oauthAuthCodes from "../oauthAuthCodes.js";
import type * as oauthCleanup from "../oauthCleanup.js";
import type * as oauthClients from "../oauthClients.js";
import type * as oauthTokens from "../oauthTokens.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as siteContacts from "../siteContacts.js";
import type * as siteContent from "../siteContent.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  embeddings: typeof embeddings;
  embeddingsHelpers: typeof embeddingsHelpers;
  experienceRoles: typeof experienceRoles;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/hash": typeof lib_hash;
  "lib/gemini": typeof lib_gemini;
  mcp: typeof mcp;
  mcpHelpers: typeof mcpHelpers;
  mcpQueries: typeof mcpQueries;
  media: typeof media;
  oauthAuthCodes: typeof oauthAuthCodes;
  oauthCleanup: typeof oauthCleanup;
  oauthClients: typeof oauthClients;
  oauthTokens: typeof oauthTokens;
  projects: typeof projects;
  seed: typeof seed;
  siteContacts: typeof siteContacts;
  siteContent: typeof siteContent;
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
