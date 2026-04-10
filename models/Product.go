package models

type Product struct {
	ID         uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	CategoryID uint    `json:"category_id"`
	Name       string  `json:"name"`
	Price      float64 `json:"price"`
	Image      string  `json:"image"`
	IsActive   bool    `json:"is_active"`
}
