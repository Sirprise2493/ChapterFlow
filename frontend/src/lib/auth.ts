import { API_BASE_URL } from "./api";
import {
  extractApiErrorMessage,
  parseJsonSafe,
  type ApiErrorData,
} from "./apiErrors";

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

function extractToken(response: Response, data: AuthResponse | null): string | null {
  const tokenFromHeader = response.headers.get("Authorization");
  const tokenFromBody = data?.token ?? null;

  if (tokenFromHeader) return normalizeToken(tokenFromHeader);
  if (tokenFromBody) return normalizeToken(tokenFromBody);

  return null;
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

  const data = await parseJsonSafe<AuthResponse & ApiErrorData>(response);

  if (!response.ok || !data?.user) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Login fehlgeschlagen")
    );
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

  const data = await parseJsonSafe<AuthResponse & ApiErrorData>(response);

  if (!response.ok || !data?.user) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Registrierung fehlgeschlagen")
    );
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
    throw new Error("Bitte melde dich an, um fortzufahren.");
  }

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...buildAuthHeader(token),
    },
  });

  const data = await parseJsonSafe<{ user?: AuthUser } & ApiErrorData>(response);

  if (!response.ok || !data?.user) {
    if (response.status === 401) {
      removeToken();
    }

    throw new Error(
      extractApiErrorMessage(response.status, data, "Benutzer konnte nicht geladen werden")
    );
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
