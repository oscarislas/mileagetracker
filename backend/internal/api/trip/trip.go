package trip

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/oscar/mileagetracker/internal/api/common"
	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/oscar/mileagetracker/internal/service"
)

type Handler struct {
	tripService service.TripService
}

func NewHandler(tripService service.TripService) *Handler {
	return &Handler{
		tripService: tripService,
	}
}

// CreateTrip creates a new trip
func (h *Handler) CreateTrip(c *gin.Context) {
	var req domain.CreateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondWithBadRequestError(c, "Invalid request data: "+err.Error())
		return
	}

	trip, err := h.tripService.CreateTrip(c.Request.Context(), req)
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.JSON(http.StatusCreated, trip)
}

// GetTrips retrieves trips with pagination
func (h *Handler) GetTrips(c *gin.Context) {
	page := 1
	limit := 10

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	trips, total, err := h.tripService.GetTrips(c.Request.Context(), page, limit)
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	response := gin.H{
		"trips":       trips,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTrip updates an existing trip
func (h *Handler) UpdateTrip(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.RespondWithBadRequestError(c, "Invalid trip ID")
		return
	}

	var req domain.UpdateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.RespondWithBadRequestError(c, "Invalid request data: "+err.Error())
		return
	}

	trip, err := h.tripService.UpdateTrip(c.Request.Context(), uint(id), req)
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, trip)
}

// DeleteTrip deletes a trip
func (h *Handler) DeleteTrip(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.RespondWithBadRequestError(c, "Invalid trip ID")
		return
	}

	err = h.tripService.DeleteTrip(c.Request.Context(), uint(id))
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

// GetSummary retrieves the 6-month summary
func (h *Handler) GetSummary(c *gin.Context) {
	summary, err := h.tripService.GetSummary(c.Request.Context())
	if err != nil {
		common.RespondWithInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetTripByID retrieves a specific trip by ID
func (h *Handler) GetTripByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.RespondWithBadRequestError(c, "Invalid trip ID")
		return
	}

	trip, err := h.tripService.GetTripByID(c.Request.Context(), uint(id))
	if err != nil {
		common.RespondWithNotFoundError(c, "Trip")
		return
	}

	c.JSON(http.StatusOK, trip)
}
