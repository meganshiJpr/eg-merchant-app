/**
 * Resiliently decodes or parses server response data payloads.
 */
export function decodeApiResponse(data) {
  if (data === null || data === undefined) return null;

  if (typeof data === "object") {
    if (data.data !== undefined && typeof data.data === "string") {
      try {
        return JSON.parse(data.data);
      } catch {
        return data.data;
      }
    }
    return data;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  return data;
}

export default decodeApiResponse;