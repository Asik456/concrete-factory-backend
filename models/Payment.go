package models

import "time"

type Payment struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID   uint      `json:"order_id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status" gorm:"default:pending"`
	Method    string    `json:"method"`
	CreatedAt time.Time `json:"created_at"`
}
