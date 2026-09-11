import { onRequestPost as __api_account_js_onRequestPost } from "/Users/lihaiyang12/WorkBuddy/2026-09-07-10-28-40/functions/api/account.js"
import { onRequestGet as __api_sync_js_onRequestGet } from "/Users/lihaiyang12/WorkBuddy/2026-09-07-10-28-40/functions/api/sync.js"
import { onRequestPost as __api_sync_js_onRequestPost } from "/Users/lihaiyang12/WorkBuddy/2026-09-07-10-28-40/functions/api/sync.js"

export const routes = [
    {
      routePath: "/api/account",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_account_js_onRequestPost],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_sync_js_onRequestGet],
    },
  {
      routePath: "/api/sync",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_js_onRequestPost],
    },
  ]