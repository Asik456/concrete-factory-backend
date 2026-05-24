package models

type ProductSpec struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ProductID uint   `json:"product_id"`
	Key       string `json:"key"`
	Value     string `json:"value"`
}
