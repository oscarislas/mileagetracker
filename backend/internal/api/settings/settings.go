package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oscar/mileagetracker/internal/api/common"
	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/service"
)

type Handler struct {
	settingsService service.SettingsService
}

func NewHandler(settingsService service.SettingsService) *Handler {
	return &Handler{
		settingsService: settingsService,
	}
}

// GetSettings retrieves current settings
func (h *Handler) GetSettings(c *gin.Context) {
	settings, err := h.settingsService.GetSettings(c.Request.Context())
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSettings updates application settings
func (h *Handler) UpdateSettings(c *gin.Context) {
	var req domain.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondWithBadRequestError(c, "Invalid request data: "+err.Error())
		return
	}

	settings, err := h.settingsService.UpdateSettings(c.Request.Context(), req)
	if err != nil {
		common.RespondWithBadRequestError(c, "Invalid request data: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, settings)
}
