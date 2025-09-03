package common

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string                 `json:"error"`
	Code    string                 `json:"code,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// ValidationError represents validation-specific error details
type ValidationError struct {
	Field   string `json:"field"`
	Value   string `json:"value"`
	Message string `json:"message"`
}

// RespondWithError sends a standardized error response
func RespondWithError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, ErrorResponse{
		Error: message,
	})
}

// RespondWithValidationError sends a validation error response
func RespondWithValidationError(c *gin.Context, field, value, message string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Error: "Validation failed",
		Code:  "VALIDATION_ERROR",
		Details: map[string]interface{}{
			"validation_errors": []ValidationError{
				{
					Field:   field,
					Value:   value,
					Message: message,
				},
			},
		},
	})
}

// RespondWithInternalError sends a generic internal server error
func RespondWithInternalError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, ErrorResponse{
		Error: "Internal server error",
		Code:  "INTERNAL_ERROR",
	})
	// Log the actual error for debugging (don't expose to client)
	// TODO: Add proper logging here
}

// RespondWithNotFoundError sends a not found error
func RespondWithNotFoundError(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, ErrorResponse{
		Error: resource + " not found",
		Code:  "NOT_FOUND",
	})
}

// RespondWithBadRequestError sends a bad request error
func RespondWithBadRequestError(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Error: message,
		Code:  "BAD_REQUEST",
	})
}
