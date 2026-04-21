const API_BASE_URL = "http://127.0.0.1:3000/api/v1";
const TOKEN_STORAGE_KEY = "authToken";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
};

export type AuthResponse = {
  message: string;
  token?: string;
  user: AuthUser;
};

export type ErrorResponse = {
  message?: string;
  errors?: string[];
};

function buildAuthHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: token } : {};
}

function normalizeToken(token: string): string {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, normalizeToken(token));
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthHeader(): Record<string, string> {
  return buildAuthHeader(getToken());
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractToken(response: Response, data: AuthResponse | null): string | null {
  const tokenFromHeader = response.headers.get("Authorization");
  const tokenFromBody = data?.token ?? null;

  if (tokenFromHeader) return normalizeToken(tokenFromHeader);
  if (tokenFromBody) return normalizeToken(tokenFromBody);

  return null;
}

function extractErrorMessage(data: ErrorResponse | null, fallback: string): string {
  if (data?.errors?.length) return data.errors.join(", ");
  if (data?.message) return data.message;
  return fallback;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user: {
        email,
        password,
      },
    }),
  });

  const data = await parseJsonSafe<AuthResponse & ErrorResponse>(response);

  if (!response.ok || !data?.user) {
    throw new Error(extractErrorMessage(data, "Login failed"));
  }

  const token = extractToken(response, data);
  if (token) setToken(token);

  return {
    message: data.message,
    token: token ?? undefined,
    user: data.user,
  };
}

export async function signup(
  email: string,
  username: string,
  password: string,
  passwordConfirmation: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user: {
        email,
        username,
        password,
        password_confirmation: passwordConfirmation,
      },
    }),
  });

  const data = await parseJsonSafe<AuthResponse & ErrorResponse>(response);

  if (!response.ok || !data?.user) {
    throw new Error(extractErrorMessage(data, "Signup failed"));
  }

  const token = extractToken(response, data);
  if (token) setToken(token);

  return {
    message: data.message,
    token: token ?? undefined,
    user: data.user,
  };
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken();

  if (!token) {
    throw new Error("No auth token found");
  }

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...buildAuthHeader(token),
    },
  });

  const data = await parseJsonSafe<{ user?: AuthUser } & ErrorResponse>(response);

  if (!response.ok || !data?.user) {
    if (response.status === 401) {
      removeToken();
    }
    throw new Error(extractErrorMessage(data, "Could not fetch current user"));
  }

  return data.user;
}

export async function logout(): Promise<void> {
  const token = getToken();

  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...buildAuthHeader(token),
      },
    });
  } finally {
    removeToken();
  }
}
