package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status string `json:"status"`
	Uptime string `json:"uptime,omitempty"`
}

type ReadinessResponse struct {
	Status   string            `json:"status"`
	Services map[string]string `json:"services"`
}

func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status: "healthy",
	})
}

func ReadinessHandler(c *gin.Context) {
	services := map[string]string{
		"database": "healthy",
	}

	c.JSON(http.StatusOK, ReadinessResponse{
		Status:   "ready",
		Services: services,
	})
}