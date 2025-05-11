/**
 * callApi: helper to wrap fetch calls with JSON parsing, credentials, and error handling.
 * @param {string} path - API endpoint to call (e.g., "/games").
 * @param {object} [options={}] - fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - resolved JSON response or throws on HTTP error.
 */

export async function callApi(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    // If the server returned an error object, propagate that message
    throw new Error(data.error || "Unknown API error");
  }
  return data;
}

export default callApi;