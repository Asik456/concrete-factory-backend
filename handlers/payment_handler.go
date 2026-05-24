package handlers

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Checkout(c *gin.Context) {
	userID, _ := c.Get("userID")

	var body struct {
		OrderID uint   `json:"order_id" binding:"required"`
		Method  string `json:"method" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid, _ := userID.(float64)
	var order models.Order
	if err := config.DB.Where("id = ? AND user_id = ?", body.OrderID, uint(uid)).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if order.PaymentStatus == "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order already paid"})
		return
	}

	payment := models.Payment{
		OrderID: order.ID,
		Amount:  order.Total,
		Status:  "completed",
		Method:  body.Method,
	}
	config.DB.Create(&payment)
	config.DB.Model(&order).Updates(map[string]interface{}{
		"payment_status": "paid",
		"status":         "confirmed",
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment successful",
		"payment": payment,
		"order":   order,
	})
}
