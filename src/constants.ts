export const GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.email';
export const GOOGLE_SCOPES_ARRAY = GOOGLE_SCOPES.split(' ');
export const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v1/userinfo';
export const NOTION_AUTH_URI = 'https://api.notion.com/v1/oauth/authorize';
// export const GOOGLE_TASKS_LISTS_URL =
//   "https://tasks.googleapis.com/tasks/v1/users/@me/lists";
// // TODO: make the max tasks limit smaller before going to production
export const GOOGLE_MAX_TASKS = 100; // Google Tasks API returns max 100 tasks per request. Default is 20
// export const COMPLETION_MAP_TIMEOUT_DAYS = 7; // Days since a task was completed in Google after which it the mapping should be removed (to keep only active tasks there)
export const NOTION_RATE_LIMIT = 3; // 3 requests per second
export const DELETE_GTOKEN_COOKIE = 'gtoken=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
