/**
 * Where the oneth app (../frontend) is served, for the "Sign in" links.
 *
 * Set NEXT_PUBLIC_APP_URL when deploying (hosting is not decided yet, see docs/DECISIONS.md).
 * In development it falls back to the app's Vite dev server. In a production build without
 * the variable, `signInUrl` is null and the links are hidden rather than pointing nowhere.
 */
const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
const appUrl = configured || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : "");

export const signInUrl: string | null = appUrl ? `${appUrl.replace(/\/+$/, "")}/login` : null;
