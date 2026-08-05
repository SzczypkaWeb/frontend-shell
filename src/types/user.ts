// Shape of the user object returned by the backend's auth endpoints
// (POST /auth/login and GET /auth/me). The backend never returns the JWT
// itself in the response body - tokens live only in httpOnly cookies - so
// this is the only auth-related data the frontend ever holds in memory.
export interface User {
  id: string;
  email: string;
}
