import { AxiosError } from "axios";

// Type guard for API response data structure
interface ApiErrorResponse {
  error?: string;
  message?: string;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof (data as ApiErrorResponse).error === "string" ||
      typeof (data as ApiErrorResponse).message === "string")
  );
}

export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Try to get API error message first
    const data = error.response?.data;
    if (isApiErrorResponse(data)) {
      const apiMessage = data.error || data.message;
      if (apiMessage && typeof apiMessage === "string") {
        return apiMessage;
      }
    }
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else if (error === null) {
    return "null";
  } else if (error === undefined) {
    return "undefined";
  } else if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  } else if (typeof error === "object") {
    return JSON.stringify(error);
  }
  return "Unknown error occurred";
}

// Type guard for validation error response structure
interface ValidationError {
  message: string;
}

interface ValidationErrorResponse {
  details?: {
    validation_errors?: ValidationError[];
  };
  error?: string;
  message?: string;
}

function isValidationErrorResponse(
  data: unknown,
): data is ValidationErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    (typeof (data as ValidationErrorResponse).error === "string" ||
      typeof (data as ValidationErrorResponse).message === "string" ||
      Array.isArray(
        (data as ValidationErrorResponse).details?.validation_errors,
      ))
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      return "Request timeout - please try again";
    }

    // Handle network errors
    if (error.code === "ECONNREFUSED" || error.code === "NETWORK_ERROR") {
      return "Cannot connect to server";
    }

    // Handle specific HTTP status codes
    if (error.response?.status === 400) {
      // Check for validation errors
      const responseData = error.response.data;
      if (isValidationErrorResponse(responseData)) {
        const validationErrors = responseData.details?.validation_errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          const messages = validationErrors.map((err) => err.message);
          return messages.join(", ");
        }

        // Check if there's an error message in response data
        const apiMessage = responseData.error || responseData.message;
        if (apiMessage && typeof apiMessage === "string") {
          // If it's a generic "Invalid data" message, enhance it to include "Invalid request"
          if (apiMessage === "Invalid data") {
            return `${apiMessage} - Invalid request`;
          }
          return apiMessage;
        }
      }

      return "Invalid request";
    } else if (error.response?.status === 401) {
      return "Authentication required";
    } else if (error.response?.status === 403) {
      return "Access denied";
    } else if (error.response?.status === 404) {
      return "Resource not found";
    } else if (error.response?.status === 500) {
      // Check if there's a specific message in response data first
      const serverErrorData = error.response.data;
      if (isApiErrorResponse(serverErrorData)) {
        const apiMessage = serverErrorData.message || serverErrorData.error;
        if (apiMessage && typeof apiMessage === "string") {
          return apiMessage;
        }
      }
      return "Server error occurred";
    }

    return getErrorMessage(error);
  }
  return getErrorMessage(error);
}

export function isConnectionError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === "ECONNREFUSED" || error.code === "NETWORK_ERROR";
  }
  return false;
}

export function getHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}
