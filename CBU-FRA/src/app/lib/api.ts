export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://fra-backend-vh1s.onrender.com/api";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  isFormData?: boolean;
};
console.log("base url is ==",API_BASE_URL);
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Simple session storage functions
const SESSION_KEY = 'fra_session';

function getStoredSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function storeSession(session: any) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    // console.error('Failed to store session:', error);
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

// Token refresh function
export async function refreshToken(refreshToken: string): Promise<{ access_token: string; token_type: string; expires_at: string; refresh_token?: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }

  return response.json();
}

// Get stored refresh token
function getStoredRefreshToken(): string | null {
  try {
    const session = localStorage.getItem('fra_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.refresh_token || null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiRequest<T>(
  path: string,
  { body, headers, token, isFormData = false, ...init }: ApiRequestOptions = {},
): Promise<T> {
  let bodyContent: string | URLSearchParams | undefined;
  let contentType = "application/json";

  if (body !== undefined) {
    if (isFormData && typeof body === "object" && body !== null) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      }
      bodyContent = params;
      contentType = "application/x-www-form-urlencoded";
    } else {
      bodyContent = JSON.stringify(body);
    }
  }

  // Debug logging to compare requests
  // console.log(`=== API Request Debug ===`);
  // console.log(`URL: ${API_BASE_URL}${path}`);
  // console.log(`Method: ${init.method || 'GET'}`);
  // console.log(`Token present: ${!!token}`);
  // console.log(`Token length: ${token?.length || 0}`);
  // console.log(`Token preview: ${token ? token.substring(0, 30) + '...' : 'No token'}`);
  
  const makeRequest = async (authToken: string | null) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": contentType,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: bodyContent,
    });

    // console.log(`Response status: ${response.status}`);
    // console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    // console.log(`========================`);

    return response;
  };

  let response = await makeRequest(token);

  // Handle 401 errors with token refresh
  if (response.status === 401 && token) {
    console.log('=== 401 Error - Attempting Token Refresh ===');
    
    const storedRefreshToken = getStoredRefreshToken();
    if (storedRefreshToken) {
      try {
        console.log('Refreshing token...');
        const refreshResponse = await refreshToken(storedRefreshToken);
        const newToken = refreshResponse.access_token;
        
        // Update stored session with new token
        const currentSession = getStoredSession();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            token: newToken,
            refresh_token: refreshResponse.refresh_token || storedRefreshToken
          };
          storeSession(updatedSession);
        }
        
        console.log('Token refreshed successfully, retrying request...');
        // Retry the request with the new token
        response = await makeRequest(newToken);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear session and redirect to login
        clearStoredSession();
        window.location.href = '/login';
        throw new ApiError('Session expired. Please login again.', 401, null);
      }
    } else {
      console.log('No refresh token available, clearing session');
      clearStoredSession();
      window.location.href = '/login';
      throw new ApiError('Session expired. Please login again.', 401, null);
    }
  }

  const responseContentType = response.headers.get("content-type");
  const data = responseContentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    
    // Handle different error types with better messages
    if (typeof data === "object" && data) {
      if ("detail" in data) {
        message = typeof (data as { detail: unknown }).detail === "string"
          ? String((data as { detail: unknown }).detail)
          : JSON.stringify((data as { detail: unknown }).detail);
      } else if ("message" in data) {
        message = String((data as { message: unknown }).message);
      } else if (response.status === 401) {
        message = "Authentication failed - Invalid or expired token";
      } else if (response.status === 403) {
        message = "Access denied - Insufficient permissions";
      } else if (response.status === 404) {
        message = "Resource not found";
      } else if (response.status >= 500) {
        message = "Server error - Please try again later";
      }
    }

    throw new ApiError(message, response.status, data);
  }
  
  return data as T;
}
