package main

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/handlers"
	"concrete-factory-backend/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDB()

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Public
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)
	r.GET("/categories", handlers.GetCategories)
	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)
	r.POST("/inquiries", handlers.CreateInquiry)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "concrete-factory"})
	})

	// Auth
	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)
		auth.POST("/orders", handlers.CreateOrder)
		auth.GET("/my-orders", handlers.GetMyOrders)
		auth.POST("/payment/checkout", handlers.Checkout)
		auth.POST("/notify", handlers.SendNotification)

		// Admin
		admin := auth.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetAllUsers)

			admin.POST("/categories", handlers.CreateCategory)
			admin.PUT("/categories/:id", handlers.UpdateCategory)
			admin.DELETE("/categories/:id", handlers.DeleteCategory)

			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.DELETE("/products/:id", handlers.DeleteProduct)

			admin.GET("/orders", handlers.GetOrders)
			admin.PUT("/orders/:id/status", handlers.UpdateOrderStatus)

			admin.GET("/inquiries", handlers.GetInquiries)
			admin.PUT("/inquiries/:id/read", handlers.MarkInquiryRead)
		}
	}

	r.Run(":8080")
}
