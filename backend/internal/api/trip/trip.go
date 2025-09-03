package trip

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

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

// parseFilters extracts and validates filter parameters from query string
func (h *Handler) parseFilters(c *gin.Context) (domain.TripFilters, error) {
	filters := domain.TripFilters{}

	// Search filter - trim whitespace
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		filters.Search = search
	}

	// Client filter - trim whitespace
	if client := strings.TrimSpace(c.Query("client")); client != "" {
		filters.Client = client
	}

	// Date from filter - validate format
	if dateFrom := c.Query("date_from"); dateFrom != "" {
		if _, err := time.Parse("2006-01-02", dateFrom); err != nil {
			return filters, errors.New("date_from must be in YYYY-MM-DD format")
		}
		filters.DateFrom = dateFrom
	}

	// Date to filter - validate format
	if dateTo := c.Query("date_to"); dateTo != "" {
		if _, err := time.Parse("2006-01-02", dateTo); err != nil {
			return filters, errors.New("date_to must be in YYYY-MM-DD format")
		}
		filters.DateTo = dateTo
	}

	// Min miles filter - validate positive number
	if minMilesStr := c.Query("min_miles"); minMilesStr != "" {
		minMiles, err := strconv.ParseFloat(minMilesStr, 64)
		if err != nil || minMiles < 0 {
			return filters, errors.New("min_miles must be a non-negative number")
		}
		filters.MinMiles = &minMiles
	}

	// Max miles filter - validate positive number
	if maxMilesStr := c.Query("max_miles"); maxMilesStr != "" {
		maxMiles, err := strconv.ParseFloat(maxMilesStr, 64)
		if err != nil || maxMiles < 0 {
			return filters, errors.New("max_miles must be a non-negative number")
		}
		filters.MaxMiles = &maxMiles
	}

	// Validate that min_miles is not greater than max_miles
	if filters.MinMiles != nil && filters.MaxMiles != nil && *filters.MinMiles > *filters.MaxMiles {
		return filters, errors.New("min_miles cannot be greater than max_miles")
	}

	// Validate that date_from is not after date_to
	if filters.DateFrom != "" && filters.DateTo != "" {
		dateFrom, _ := time.Parse("2006-01-02", filters.DateFrom)
		dateTo, _ := time.Parse("2006-01-02", filters.DateTo)
		if dateFrom.After(dateTo) {
			return filters, errors.New("date_from cannot be after date_to")
		}
	}

	return filters, nil
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

// GetTrips retrieves trips with pagination and filtering
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

	// Parse filter parameters
	filters, err := h.parseFilters(c)
	if err != nil {
		common.RespondWithBadRequestError(c, err.Error())
		return
	}

	trips, total, err := h.tripService.GetTrips(c.Request.Context(), page, limit, filters)
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
