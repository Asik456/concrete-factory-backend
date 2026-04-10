package models

type Order struct {
	ID              uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          uint        `json:"user_id"`
	Status          string      `json:"status"`
	DeliveryType    string      `json:"delivery_type"`
	DeliveryAddress string      `json:"delivery_address"`
	DeliveryCost    float64     `json:"delivery_cost"`
	Total           float64     `json:"total"`
	Items           []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
}
