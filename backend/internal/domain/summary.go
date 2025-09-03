package domain

// MonthlySummary represents the summary for a specific month
type MonthlySummary struct {
	Month      string  `json:"month"`       // "January 2025"
	Year       int     `json:"year"`        // 2025
	MonthNum   int     `json:"month_num"`   // 1-12
	TotalMiles float64 `json:"total_miles"` // 145.50
	Amount     float64 `json:"amount"`      // 97.49
}

// SummaryResponse represents the 6-month summary response
type SummaryResponse struct {
	Months []MonthlySummary `json:"months"`
}
