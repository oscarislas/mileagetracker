package common

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRespondWithError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should respond with error message", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			RespondWithError(c, http.StatusBadRequest, "Test error message")
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Test error message", response.Error)
		assert.Empty(t, response.Code)
		assert.Nil(t, response.Details)
	})

	t.Run("should handle different status codes", func(t *testing.T) {
		testCases := []struct {
			statusCode int
			message    string
		}{
			{http.StatusBadRequest, "Bad request"},
			{http.StatusUnauthorized, "Unauthorized"},
			{http.StatusForbidden, "Forbidden"},
			{http.StatusNotFound, "Not found"},
			{http.StatusInternalServerError, "Internal error"},
		}

		for _, tc := range testCases {
			router := gin.New()
			router.GET("/test", func(c *gin.Context) {
				RespondWithError(c, tc.statusCode, tc.message)
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.statusCode, w.Code)

			var response ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tc.message, response.Error)
		}
	})
}

func TestRespondWithValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should respond with validation error", func(t *testing.T) {
		router := gin.New()
		router.POST("/test", func(c *gin.Context) {
			RespondWithValidationError(c, "email", "invalid-email", "Email must be a valid email address")
		})

		req, _ := http.NewRequest("POST", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Validation failed", response.Error)
		assert.Equal(t, "VALIDATION_ERROR", response.Code)
		assert.NotNil(t, response.Details)

		// Check validation errors structure
		validationErrors, ok := response.Details["validation_errors"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, validationErrors, 1)

		// Convert to map for easier assertion
		errorMap := validationErrors[0].(map[string]interface{})
		assert.Equal(t, "email", errorMap["field"])
		assert.Equal(t, "invalid-email", errorMap["value"])
		assert.Equal(t, "Email must be a valid email address", errorMap["message"])
	})

	t.Run("should handle different validation scenarios", func(t *testing.T) {
		testCases := []struct {
			field   string
			value   string
			message string
		}{
			{"username", "", "Username is required"},
			{"password", "123", "Password must be at least 8 characters"},
			{"age", "-1", "Age must be a positive number"},
		}

		for _, tc := range testCases {
			router := gin.New()
			router.POST("/test", func(c *gin.Context) {
				RespondWithValidationError(c, tc.field, tc.value, tc.message)
			})

			req, _ := http.NewRequest("POST", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var response ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			validationErrors := response.Details["validation_errors"].([]interface{})
			errorMap := validationErrors[0].(map[string]interface{})
			assert.Equal(t, tc.field, errorMap["field"])
			assert.Equal(t, tc.value, errorMap["value"])
			assert.Equal(t, tc.message, errorMap["message"])
		}
	})
}

func TestRespondWithInternalError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should respond with internal server error", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			RespondWithInternalError(c, errors.New("database connection failed"))
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Internal server error", response.Error)
		assert.Equal(t, "INTERNAL_ERROR", response.Code)
		assert.Nil(t, response.Details)

		// Should not expose the actual error details to the client
		assert.NotContains(t, response.Error, "database connection failed")
	})

	t.Run("should handle nil error", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			RespondWithInternalError(c, nil)
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Internal server error", response.Error)
	})
}

func TestRespondWithNotFoundError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should respond with not found error", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			RespondWithNotFoundError(c, "User")
		})

		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "User not found", response.Error)
		assert.Equal(t, "NOT_FOUND", response.Code)
	})

	t.Run("should handle different resource types", func(t *testing.T) {
		resources := []string{"Trip", "Client", "Settings", "Report"}

		for _, resource := range resources {
			router := gin.New()
			router.GET("/test", func(c *gin.Context) {
				RespondWithNotFoundError(c, resource)
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusNotFound, w.Code)

			var response ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, resource+" not found", response.Error)
		}
	})
}

func TestRespondWithBadRequestError(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("should respond with bad request error", func(t *testing.T) {
		router := gin.New()
		router.POST("/test", func(c *gin.Context) {
			RespondWithBadRequestError(c, "Invalid request format")
		})

		req, _ := http.NewRequest("POST", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Equal(t, "Invalid request format", response.Error)
		assert.Equal(t, "BAD_REQUEST", response.Code)
	})

	t.Run("should handle different bad request messages", func(t *testing.T) {
		messages := []string{
			"Missing required fields",
			"Invalid JSON format",
			"Request body too large",
			"Unsupported content type",
		}

		for _, message := range messages {
			router := gin.New()
			router.POST("/test", func(c *gin.Context) {
				RespondWithBadRequestError(c, message)
			})

			req, _ := http.NewRequest("POST", "/test", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var response ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, message, response.Error)
		}
	})
}

func TestErrorResponseStructures(t *testing.T) {
	t.Run("should validate ErrorResponse structure", func(t *testing.T) {
		errorResp := ErrorResponse{
			Error:   "Test error",
			Code:    "TEST_ERROR",
			Details: map[string]interface{}{"key": "value"},
		}

		assert.Equal(t, "Test error", errorResp.Error)
		assert.Equal(t, "TEST_ERROR", errorResp.Code)
		assert.Equal(t, "value", errorResp.Details["key"])
	})

	t.Run("should validate ValidationError structure", func(t *testing.T) {
		validationErr := ValidationError{
			Field:   "email",
			Value:   "invalid",
			Message: "Email is invalid",
		}

		assert.Equal(t, "email", validationErr.Field)
		assert.Equal(t, "invalid", validationErr.Value)
		assert.Equal(t, "Email is invalid", validationErr.Message)
	})
}
