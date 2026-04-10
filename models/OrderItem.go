package models

type OrderItem struct {
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID      uint    `json:"order_id"`
	ProductID    uint    `json:"product_id"`
	Quantity     int     `json:"quantity"`
	PriceAtOrder float64 `json:"price_at_order"`
}
