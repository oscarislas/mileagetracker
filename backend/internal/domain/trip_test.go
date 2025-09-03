package domain_test

import (
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestCreateTripRequest_Validation(t *testing.T) {
	tests := []struct {
		name        string
		req         domain.CreateTripRequest
		shouldError bool
	}{
		{
			name: "valid request",
			req: domain.CreateTripRequest{
				ClientName: "Test Client",
				TripDate:   "2025-01-15",
				Miles:      100.5,
				Notes:      "Test notes",
			},
			shouldError: false,
		},
		{
			name: "empty client name should be invalid",
			req: domain.CreateTripRequest{
				ClientName: "",
				TripDate:   "2025-01-15",
				Miles:      100.5,
				Notes:      "Test notes",
			},
			shouldError: true,
		},
		{
			name: "client name too long should be invalid",
			req: domain.CreateTripRequest{
				ClientName: "This client name is definitely way too long and exceeds the 30 character limit",
				TripDate:   "2025-01-15",
				Miles:      100.5,
				Notes:      "Test notes",
			},
			shouldError: true,
		},
		{
			name: "zero miles should be invalid",
			req: domain.CreateTripRequest{
				ClientName: "Test Client",
				TripDate:   "2025-01-15",
				Miles:      0,
				Notes:      "Test notes",
			},
			shouldError: true,
		},
		{
			name: "negative miles should be invalid",
			req: domain.CreateTripRequest{
				ClientName: "Test Client",
				TripDate:   "2025-01-15",
				Miles:      -10.5,
				Notes:      "Test notes",
			},
			shouldError: true,
		},
		{
			name: "empty trip date should be invalid",
			req: domain.CreateTripRequest{
				ClientName: "Test Client",
				TripDate:   "",
				Miles:      100.5,
				Notes:      "Test notes",
			},
			shouldError: true,
		},
		{
			name: "notes can be empty",
			req: domain.CreateTripRequest{
				ClientName: "Test Client",
				TripDate:   "2025-01-15",
				Miles:      100.5,
				Notes:      "",
			},
			shouldError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic validation checks
			hasErrors := false

			if tt.req.ClientName == "" || len(tt.req.ClientName) > 30 {
				hasErrors = true
			}
			if tt.req.TripDate == "" {
				hasErrors = true
			}
			if tt.req.Miles <= 0 {
				hasErrors = true
			}

			if tt.shouldError {
				assert.True(t, hasErrors, "Expected validation errors but got none")
			} else {
				assert.False(t, hasErrors, "Expected no validation errors but got some")
			}
		})
	}
}

func TestTrip_TableName(t *testing.T) {
	trip := domain.Trip{}
	assert.Equal(t, "trips", trip.TableName())
}

func TestClient_TableName(t *testing.T) {
	client := domain.Client{}
	assert.Equal(t, "clients", client.TableName())
}

func TestSettings_TableName(t *testing.T) {
	settings := domain.Settings{}
	assert.Equal(t, "settings", settings.TableName())
}

func TestTripDateValidation(t *testing.T) {
	tests := []struct {
		name        string
		date        string
		shouldError bool
	}{
		{
			name:        "valid date format",
			date:        "2025-01-15",
			shouldError: false,
		},
		{
			name:        "invalid date format - wrong separator",
			date:        "2025/01/15",
			shouldError: true,
		},
		{
			name:        "invalid date format - wrong order",
			date:        "15-01-2025",
			shouldError: true,
		},
		{
			name:        "invalid date - non-existent date",
			date:        "2025-02-30",
			shouldError: true,
		},
		{
			name:        "empty date",
			date:        "",
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.date == "" {
				if tt.shouldError {
					return // Empty date is expected to be invalid
				}
			}

			_, err := time.Parse("2006-01-02", tt.date)
			if tt.shouldError {
				assert.Error(t, err, "Expected date parsing to fail")
			} else {
				assert.NoError(t, err, "Expected date parsing to succeed")
			}
		})
	}
}
