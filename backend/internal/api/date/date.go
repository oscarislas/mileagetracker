package date

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DateResponse struct {
	Date          string `json:"date"`
	FormattedDate string `json:"formatted_date"`
}

func DateHandler(c *gin.Context) {
	now := time.Now()
	c.JSON(http.StatusOK, DateResponse{
		Date:          now.UTC().Format(time.RFC3339),
		FormattedDate: now.Format("January 2, 2006"),
	})
}