export type ApiErrorData = {
  message?: string;
  error?: string;
  errors?: string[];
};

export async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function getFriendlyApiError(status: number, fallback: string): string {
  switch (status) {
    case 401:
      return "Bitte melde dich an, um fortzufahren.";
    case 402:
      return "Dieses Kapitel benötigt ein aktives Abo.";
    case 403:
      return "Du hast keine Berechtigung für diese Aktion.";
    case 404:
      return "Der angeforderte Inhalt wurde nicht gefunden.";
    case 422:
      return fallback || "Die eingegebenen Daten sind ungültig.";
    case 500:
      return "Serverfehler. Bitte versuche es gleich erneut.";
    default:
      return fallback;
  }
}

export function extractApiErrorMessage(
  status: number,
  data: ApiErrorData | null,
  fallback: string
): string {
  const rawMessage =
    data?.message ||
    data?.error ||
    data?.errors?.join(", ") ||
    fallback;

  return getFriendlyApiError(status, rawMessage);
}
