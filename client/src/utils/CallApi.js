/**
 * callApi: helper to wrap fetch calls with JSON parsing, credentials, and error handling.
 * @param {string} path - API endpoint to call (e.g., "/games").
 * @param {object} [options={}] - fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - resolved JSON response or throws on HTTP error.
 */
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const API_PREFIX = "/api";

export async function callApi(path, options = {}) {
  // Build full URL, prefixing with API_PREFIX if needed
  let apiUrl = path;
  if (!path.startsWith('http') && !path.startsWith(API_PREFIX)) {
    const pathSegment = path.startsWith('/') ? path : `/${path}`;
    apiUrl = `${API_PREFIX}${pathSegment}`;
  }
  const fullUrl = `${BASE_URL}${apiUrl}`;

  // Destructure custom headers and other fetch options
  const { headers: customHeaders = {}, ...otherOptions } = options;
  const fetchOptions = {
    ...otherOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  };

  const response = await fetch(fullUrl, fetchOptions);

  // Handle 204 No Content
  if (response.status === 204) {
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      // Non-OK without JSON body
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
    }
    console.error('Failed to parse JSON response:', e);
    throw new Error('Failed to parse server response.');
  }

  if (!response.ok) {
    // Use server-provided error message if available
    const errorMessage = data.error || data.message || `API request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default callApi;