const DEFAULT_OPTIONS = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
};

const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return `${window.location.origin}/api`;
  }
  return "/api";
};

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload ?? null;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, mergedOptions);
  return handleResponse(response);
}

export async function fetchData(path) {
  return apiRequest(path, { method: "GET" }).catch((error) => {
    console.error("API fetch failed", error.message);
    return [];
  });
}

export async function postData(path, data) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export const api = {
  request: apiRequest,
  get: fetchData,
  post: postData,
};

export default fetchData;
