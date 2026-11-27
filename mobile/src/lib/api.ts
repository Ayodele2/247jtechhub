const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "http://172.20.10.7:3001/api/v1"
).replace(/\/+$/, "");

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  statusCode: number;
  details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to 247 Jtech Hub. Check your internet connection and try again.",
      0,
    );
  }

  const responseText = await response.text();
  let data: unknown = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText) as unknown;
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const serverMessage = isRecord(data) ? data.message : undefined;

    const message = Array.isArray(serverMessage)
      ? serverMessage.join("\n")
      : typeof serverMessage === "string"
        ? serverMessage
        : "Something went wrong. Please try again.";

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}