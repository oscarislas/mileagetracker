package client

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oscar/mileagetracker/internal/api/common"
	"github.com/oscar/mileagetracker/internal/service"
)

type Handler struct {
	clientService service.ClientService
}

func NewHandler(clientService service.ClientService) *Handler {
	return &Handler{
		clientService: clientService,
	}
}

// GetSuggestions retrieves client suggestions for autocomplete
func (h *Handler) GetSuggestions(c *gin.Context) {
	query := c.Query("q")

	clients, err := h.clientService.GetSuggestions(c.Request.Context(), query)
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"clients": clients})
}
