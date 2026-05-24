package handlers

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetOrders(c *gin.Context) {
	var orders []models.Order
	config.DB.Preload("Items").Find(&orders)
	c.JSON(http.StatusOK, orders)
}

func GetMyOrders(c *gin.Context) {
	userID, _ := c.Get("userID")
	var orders []models.Order
	config.DB.Preload("Items").Where("user_id = ?", userID).Find(&orders)
	c.JSON(http.StatusOK, orders)
}

func CreateOrder(c *gin.Context) {
	userID, _ := c.Get("userID")

	var body struct {
		DeliveryType    string  `json:"delivery_type"`
		DeliveryAddress string  `json:"delivery_address"`
		DeliveryCost    float64 `json:"delivery_cost"`
		Items           []struct {
			ProductID uint `json:"product_id"`
			Quantity  int  `json:"quantity"`
		} `json:"items"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var total float64
	var orderItems []models.OrderItem
	for _, item := range body.Items {
		var product models.Product
		if err := config.DB.First(&product, item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Product not found"})
			return
		}
		price := product.Price
		if product.DiscountPrice != nil && *product.DiscountPrice > 0 {
			price = *product.DiscountPrice
		}
		total += price * float64(item.Quantity)
		orderItems = append(orderItems, models.OrderItem{
			ProductID:    item.ProductID,
			Quantity:     item.Quantity,
			PriceAtOrder: price,
		})
	}
	total += body.DeliveryCost

	uid, _ := userID.(float64)
	order := models.Order{
		UserID:          uint(uid),
		Status:          "pending",
		PaymentStatus:   "unpaid",
		DeliveryType:    body.DeliveryType,
		DeliveryAddress: body.DeliveryAddress,
		DeliveryCost:    body.DeliveryCost,
		Total:           total,
	}
	if err := config.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range orderItems {
		orderItems[i].OrderID = order.ID
	}
	if len(orderItems) > 0 {
		config.DB.Create(&orderItems)
	}
	order.Items = orderItems

	var currentUser models.User
	config.DB.First(&currentUser, uint(uid))
	emailNewOrder(order.ID, currentUser.Name, order.DeliveryType, order.DeliveryAddress, order.Total)

	c.JSON(http.StatusCreated, order)
}

func UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var order models.Order
	if err := config.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	var body struct {
		Status string `json:"status"`
	}
	c.ShouldBindJSON(&body)
	config.DB.Model(&order).Update("status", body.Status)
	c.JSON(http.StatusOK, order)
}
