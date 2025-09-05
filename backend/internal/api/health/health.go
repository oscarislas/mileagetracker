package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Uptime  string `json:"uptime,omitempty"`
}

type ReadinessResponse struct {
	Status   string            `json:"status"`
	Version  string            `json:"version"`
	Services map[string]string `json:"services"`
}

type Handler struct {
	version string
}

func NewHandler(version string) *Handler {
	return &Handler{
		version: version,
	}
}

func (h *Handler) HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "healthy",
		Version: h.version,
	})
}

func (h *Handler) ReadinessHandler(c *gin.Context) {
	services := map[string]string{
		"database": "healthy",
	}

	c.JSON(http.StatusOK, ReadinessResponse{
		Status:   "ready",
		Version:  h.version,
		Services: services,
	})
}

// Legacy functions for backwards compatibility
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "healthy",
		Version: "unknown",
	})
}

func ReadinessHandler(c *gin.Context) {
	services := map[string]string{
		"database": "healthy",
	}

	c.JSON(http.StatusOK, ReadinessResponse{
		Status:   "ready",
		Version:  "unknown",
		Services: services,
	})
}
