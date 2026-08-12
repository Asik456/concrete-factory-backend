package models

type ProductVariant struct {
	ID        uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID uint    `json:"product_id"`
	ColorKey  string  `json:"color_key"`
	Price     float64 `json:"price"`
	Image     string  `json:"image,omitempty"`
}
