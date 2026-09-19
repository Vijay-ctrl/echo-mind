const TOKEN_KEY = "gemini_access_token";
const USER_KEY = "gemini_user";

/**
 * Save authentication data
 */
export function saveAuth(accessToken, user) {
   localStorage.setItem(TOKEN_KEY, accessToken);
   localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get saved JWT token
 */
export function getToken() {
   return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get saved user
 */
export function getUser() {
   const user = localStorage.getItem(USER_KEY);

   if (!user) {
      return null;
   }

   try {
      return JSON.parse(user);
   } catch (error) {
      console.error("Failed to parse saved user:", error);
      return null;
   }
}

/**
 * Check whether user is logged in
 */
export function isAuthenticated() {
   return Boolean(getToken());
}

/**
 * Clear authentication data
 */
export function logout() {
   localStorage.removeItem(TOKEN_KEY);
   localStorage.removeItem(USER_KEY);
}