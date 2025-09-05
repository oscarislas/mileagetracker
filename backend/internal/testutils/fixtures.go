package testutils

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/oscar/mileagetracker/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// Common test fixture data
var (
	// DefaultMileageRate is the default mileage rate used in tests
	DefaultMileageRate = 0.67

	// TestClients provides common test client data
	TestClients = struct {
		AcmeCorp domain.Client
		BetaInc  domain.Client
		GammaLLC domain.Client
		DeltaCo  domain.Client
		EchoLtd  domain.Client
		ZetaTech domain.Client
	}{
		AcmeCorp: domain.Client{ID: 1, Name: "Acme Corp"},
		BetaInc:  domain.Client{ID: 2, Name: "Beta Inc"},
		GammaLLC: domain.Client{ID: 3, Name: "Gamma LLC"},
		DeltaCo:  domain.Client{ID: 4, Name: "Delta Co"},
		EchoLtd:  domain.Client{ID: 5, Name: "Echo Ltd"},
		ZetaTech: domain.Client{ID: 6, Name: "Zeta Tech"},
	}

	// TestTrips provides common test trip data
	TestTrips = struct {
		Recent        domain.Trip
		LastWeek      domain.Trip
		LastMonth     domain.Trip
		LongDistance  domain.Trip
		ShortDistance domain.Trip
		ZeroMiles     domain.Trip
	}{
		Recent: domain.Trip{
			ID:         1,
			ClientID:   &TestClients.AcmeCorp.ID,
			ClientName: TestClients.AcmeCorp.Name,
			TripDate:   "2025-01-15",
			Miles:      125.5,
			Notes:      "Client meeting for quarterly review",
		},
		LastWeek: domain.Trip{
			ID:         2,
			ClientID:   &TestClients.BetaInc.ID,
			ClientName: TestClients.BetaInc.Name,
			TripDate:   "2025-01-08",
			Miles:      75.0,
			Notes:      "Project consultation and planning session",
		},
		LastMonth: domain.Trip{
			ID:         3,
			ClientID:   &TestClients.GammaLLC.ID,
			ClientName: TestClients.GammaLLC.Name,
			TripDate:   "2024-12-20",
			Miles:      200.0,
			Notes:      "Year-end review meeting",
		},
		LongDistance: domain.Trip{
			ID:         4,
			ClientID:   &TestClients.DeltaCo.ID,
			ClientName: TestClients.DeltaCo.Name,
			TripDate:   "2025-01-10",
			Miles:      500.0,
			Notes:      "Conference presentation in distant city",
		},
		ShortDistance: domain.Trip{
			ID:         5,
			ClientID:   &TestClients.EchoLtd.ID,
			ClientName: TestClients.EchoLtd.Name,
			TripDate:   "2025-01-12",
			Miles:      15.5,
			Notes:      "Quick local consultation",
		},
		ZeroMiles: domain.Trip{
			ID:         6,
			ClientID:   &TestClients.ZetaTech.ID,
			ClientName: TestClients.ZetaTech.Name,
			TripDate:   "2025-01-14",
			Miles:      0.0,
			Notes:      "Virtual meeting follow-up",
		},
	}

	// TestSettings provides common test settings data
	TestSettings = struct {
		MileageRate     domain.Settings
		DefaultCurrency domain.Settings
		ReportingPeriod domain.Settings
	}{
		MileageRate: domain.Settings{
			ID:    1,
			Key:   "mileage_rate",
			Value: "0.67",
		},
		DefaultCurrency: domain.Settings{
			ID:    2,
			Key:   "default_currency",
			Value: "USD",
		},
		ReportingPeriod: domain.Settings{
			ID:    3,
			Key:   "reporting_period",
			Value: "monthly",
		},
	}
)

// CreateTestClient creates a client in the database and returns it with ID populated.
func CreateTestClient(t *testing.T, db *gorm.DB, name string) *domain.Client {
	t.Helper()

	client := &domain.Client{Name: name}
	err := db.Create(client).Error
	assert.NoError(t, err, "failed to create test client: %s", name)

	return client
}

// CreateTestTrip creates a trip in the database and returns it with ID populated.
func CreateTestTrip(t *testing.T, db *gorm.DB, clientName string, tripDate string, miles float64, notes string) *domain.Trip {
	t.Helper()

	// Create or find client first
	client := CreateTestClient(t, db, clientName)

	trip := &domain.Trip{
		ClientID:   &client.ID,
		ClientName: clientName,
		TripDate:   tripDate,
		Miles:      miles,
		Notes:      notes,
	}

	err := db.Create(trip).Error
	assert.NoError(t, err, "failed to create test trip")

	return trip
}

// CreateTestSetting creates a settings entry in the database.
func CreateTestSetting(t *testing.T, db *gorm.DB, key, value string) *domain.Settings {
	t.Helper()

	setting := &domain.Settings{
		Key:   key,
		Value: value,
	}

	err := db.Create(setting).Error
	assert.NoError(t, err, "failed to create test setting: %s=%s", key, value)

	return setting
}

// SeedDatabase populates the database with common test fixtures.
// This creates a full set of test data including clients, trips, and settings.
func SeedDatabase(t *testing.T, db *gorm.DB) {
	t.Helper()

	// Create test clients
	for _, client := range []domain.Client{
		TestClients.AcmeCorp,
		TestClients.BetaInc,
		TestClients.GammaLLC,
		TestClients.DeltaCo,
		TestClients.EchoLtd,
		TestClients.ZetaTech,
	} {
		clientCopy := client
		clientCopy.ID = 0 // Let DB assign ID
		err := db.Create(&clientCopy).Error
		assert.NoError(t, err, "failed to seed client: %s", client.Name)
	}

	// Create test trips
	for _, trip := range []domain.Trip{
		TestTrips.Recent,
		TestTrips.LastWeek,
		TestTrips.LastMonth,
		TestTrips.LongDistance,
		TestTrips.ShortDistance,
		TestTrips.ZeroMiles,
	} {
		tripCopy := trip
		tripCopy.ID = 0 // Let DB assign ID
		err := db.Create(&tripCopy).Error
		assert.NoError(t, err, "failed to seed trip")
	}

	// Create test settings
	for _, setting := range []domain.Settings{
		TestSettings.MileageRate,
		TestSettings.DefaultCurrency,
		TestSettings.ReportingPeriod,
	} {
		settingCopy := setting
		settingCopy.ID = 0 // Let DB assign ID
		err := db.Create(&settingCopy).Error
		assert.NoError(t, err, "failed to seed setting: %s", setting.Key)
	}
}

// SeedMinimalDatabase creates a minimal set of test data for basic tests.
func SeedMinimalDatabase(t *testing.T, db *gorm.DB) {
	t.Helper()

	// Create one client and trip for basic tests
	client := TestClients.AcmeCorp
	client.ID = 0
	err := db.Create(&client).Error
	assert.NoError(t, err, "failed to create minimal test client")

	trip := TestTrips.Recent
	trip.ID = 0
	trip.ClientID = &client.ID
	err = db.Create(&trip).Error
	assert.NoError(t, err, "failed to create minimal test trip")

	// Create default settings
	setting := TestSettings.MileageRate
	setting.ID = 0
	err = db.Create(&setting).Error
	assert.NoError(t, err, "failed to create minimal test setting")
}

// TripBuilder provides a fluent interface for creating test trips.
type TripBuilder struct {
	trip   domain.Trip
	client *domain.Client
}

// NewTripBuilder creates a new trip builder with default values.
func NewTripBuilder() *TripBuilder {
	return &TripBuilder{
		trip: domain.Trip{
			ClientName: "Default Client",
			TripDate:   "2025-01-15",
			Miles:      100.0,
			Notes:      "Test trip",
		},
	}
}

// WithClient sets the client for the trip.
func (b *TripBuilder) WithClient(client domain.Client) *TripBuilder {
	b.client = &client
	b.trip.ClientID = &client.ID
	b.trip.ClientName = client.Name
	return b
}

// WithClientName sets the client name for the trip.
func (b *TripBuilder) WithClientName(name string) *TripBuilder {
	b.trip.ClientName = name
	return b
}

// WithDate sets the trip date.
func (b *TripBuilder) WithDate(date string) *TripBuilder {
	b.trip.TripDate = date
	return b
}

// WithMiles sets the miles for the trip.
func (b *TripBuilder) WithMiles(miles float64) *TripBuilder {
	b.trip.Miles = miles
	return b
}

// WithNotes sets the notes for the trip.
func (b *TripBuilder) WithNotes(notes string) *TripBuilder {
	b.trip.Notes = notes
	return b
}

// Build returns the constructed trip (without saving to database).
func (b *TripBuilder) Build() domain.Trip {
	return b.trip
}

// Create saves the trip to the database and returns it with ID populated.
func (b *TripBuilder) Create(t *testing.T, db *gorm.DB) *domain.Trip {
	t.Helper()

	// Ensure client exists if specified
	if b.client != nil {
		var existingClient domain.Client
		err := db.Where("name = ?", b.client.Name).First(&existingClient).Error
		if err == gorm.ErrRecordNotFound {
			clientCopy := *b.client
			clientCopy.ID = 0
			err = db.Create(&clientCopy).Error
			assert.NoError(t, err, "failed to create client for trip")
			b.trip.ClientID = &clientCopy.ID
		} else {
			assert.NoError(t, err, "failed to check for existing client")
			b.trip.ClientID = &existingClient.ID
		}
	}

	tripCopy := b.trip
	tripCopy.ID = 0 // Let DB assign ID
	err := db.Create(&tripCopy).Error
	assert.NoError(t, err, "failed to create trip")

	return &tripCopy
}

// ClientBuilder provides a fluent interface for creating test clients.
type ClientBuilder struct {
	client domain.Client
}

// NewClientBuilder creates a new client builder with default values.
func NewClientBuilder() *ClientBuilder {
	return &ClientBuilder{
		client: domain.Client{
			Name: "Test Client",
		},
	}
}

// WithName sets the client name.
func (b *ClientBuilder) WithName(name string) *ClientBuilder {
	b.client.Name = name
	return b
}

// Build returns the constructed client (without saving to database).
func (b *ClientBuilder) Build() domain.Client {
	return b.client
}

// Create saves the client to the database and returns it with ID populated.
func (b *ClientBuilder) Create(t *testing.T, db *gorm.DB) *domain.Client {
	t.Helper()

	clientCopy := b.client
	clientCopy.ID = 0 // Let DB assign ID
	err := db.Create(&clientCopy).Error
	assert.NoError(t, err, "failed to create client")

	return &clientCopy
}

// CreateTripsInDateRange creates multiple trips within a date range for testing pagination and filtering.
func CreateTripsInDateRange(t *testing.T, db *gorm.DB, startDate, endDate string, count int) []domain.Trip {
	t.Helper()

	var trips []domain.Trip
	client := CreateTestClient(t, db, "Range Test Client")

	// Parse start and end dates
	start, err := time.Parse("2006-01-02", startDate)
	assert.NoError(t, err, "invalid start date format")

	end, err := time.Parse("2006-01-02", endDate)
	assert.NoError(t, err, "invalid end date format")

	// Calculate day increment
	daysDiff := int(end.Sub(start).Hours() / 24)
	dayIncrement := 1
	if daysDiff > 0 && count > 1 {
		dayIncrement = daysDiff / (count - 1)
		if dayIncrement == 0 {
			dayIncrement = 1
		}
	}

	// Create trips distributed across the date range
	for i := 0; i < count; i++ {
		currentDate := start.AddDate(0, 0, i*dayIncrement)
		if currentDate.After(end) {
			currentDate = end
		}

		trip := &domain.Trip{
			ClientID:   &client.ID,
			ClientName: client.Name,
			TripDate:   currentDate.Format("2006-01-02"),
			Miles:      float64(50 + i*25), // Varying miles
			Notes:      fmt.Sprintf("Test trip %d", i+1),
		}

		err := db.Create(trip).Error
		assert.NoError(t, err, "failed to create test trip %d", i+1)

		trips = append(trips, *trip)
	}

	return trips
}

// AssertTripsEqual compares two trips for equality, ignoring timestamps.
// Handles date format differences between input and database storage.
func AssertTripsEqual(t *testing.T, expected, actual domain.Trip) {
	t.Helper()

	assert.Equal(t, expected.ID, actual.ID, "trip IDs should match")
	assert.Equal(t, expected.ClientName, actual.ClientName, "client names should match")

	// Handle date format differences (SQLite may return dates with time component)
	expectedDate := strings.Split(expected.TripDate, "T")[0]
	actualDate := strings.Split(actual.TripDate, "T")[0]
	assert.Equal(t, expectedDate, actualDate, "trip dates should match")

	assert.Equal(t, expected.Miles, actual.Miles, "miles should match")
	assert.Equal(t, expected.Notes, actual.Notes, "notes should match")

	if expected.ClientID != nil && actual.ClientID != nil {
		assert.Equal(t, *expected.ClientID, *actual.ClientID, "client IDs should match")
	} else {
		assert.Equal(t, expected.ClientID, actual.ClientID, "client ID pointers should both be nil or both be non-nil")
	}
}

// AssertClientsEqual compares two clients for equality, ignoring timestamps.
func AssertClientsEqual(t *testing.T, expected, actual domain.Client) {
	t.Helper()

	assert.Equal(t, expected.ID, actual.ID, "client IDs should match")
	assert.Equal(t, expected.Name, actual.Name, "client names should match")
}

// GetTestContext returns a context with a reasonable timeout for tests.
func GetTestContext() context.Context {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	// Note: In real usage, caller should handle cancel() properly
	// This is a utility function for tests where the context lifetime
	// is typically managed by the test framework
	_ = cancel
	return ctx
}

// MockExpectations provides common mock expectations to reduce boilerplate
type MockExpectations struct {
	mock *mock.Mock
}

// NewMockExpectations creates a new mock expectations helper.
func NewMockExpectations(m *mock.Mock) *MockExpectations {
	return &MockExpectations{mock: m}
}

// ExpectCreateTrip sets up expectations for a successful trip creation.
func (m *MockExpectations) ExpectCreateTrip(trip *domain.Trip) *mock.Call {
	return m.mock.On("Create", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil).Run(func(args mock.Arguments) {
		createdTrip := args.Get(1).(*domain.Trip)
		if trip.ID != 0 {
			createdTrip.ID = trip.ID
		}
	})
}

// ExpectFindTripByID sets up expectations for finding a trip by ID.
func (m *MockExpectations) ExpectFindTripByID(id uint, trip *domain.Trip, err error) *mock.Call {
	return m.mock.On("FindByID", mock.Anything, id).Return(trip, err)
}

// ExpectUpdateTrip sets up expectations for a successful trip update.
func (m *MockExpectations) ExpectUpdateTrip() *mock.Call {
	return m.mock.On("Update", mock.Anything, mock.AnythingOfType("*domain.Trip")).Return(nil)
}

// ExpectDeleteTrip sets up expectations for a successful trip deletion.
func (m *MockExpectations) ExpectDeleteTrip(id uint, err error) *mock.Call {
	return m.mock.On("Delete", mock.Anything, id).Return(err)
}

// ExpectGetTrips sets up expectations for paginated trip retrieval.
func (m *MockExpectations) ExpectGetTrips(trips []domain.Trip, total int64, err error) *mock.Call {
	return m.mock.On("GetPaginated", mock.Anything, mock.AnythingOfType("int"), mock.AnythingOfType("int"), mock.AnythingOfType("domain.TripFilters")).Return(trips, total, err)
}

// Common test request builders
func NewCreateTripRequest(clientName, date string, miles float64, notes string) domain.CreateTripRequest {
	return domain.CreateTripRequest{
		ClientName: clientName,
		TripDate:   date,
		Miles:      miles,
		Notes:      notes,
	}
}

func NewUpdateTripRequest(clientName, date string, miles float64, notes string) domain.UpdateTripRequest {
	return domain.UpdateTripRequest{
		ClientName: clientName,
		TripDate:   date,
		Miles:      miles,
		Notes:      notes,
	}
}
