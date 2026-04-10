package main

import (
	"concrete-factory-backend/config"
	"concrete-factory-backend/handlers"
	"concrete-factory-backend/middleware"
	"concrete-factory-backend/models"

	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDB()

	config.DB.AutoMigrate(
		&models.Category{},
		&models.Product{},
		&models.User{},
		&models.Order{},
		&models.OrderItem{},
	)

	r := gin.Default()

	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)

		admin := auth.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetAllUsers)

			admin.POST("/categories", handlers.CreateCategory)
			admin.DELETE("/categories/:id", handlers.DeleteCategory)

			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.DELETE("/products/:id", handlers.DeleteProduct)

			admin.GET("/orders", handlers.GetOrders)
			admin.PUT("/orders/:id/status", handlers.UpdateOrderStatus)
		}

		auth.POST("/orders", handlers.CreateOrder)
	}

	r.GET("/categories", handlers.GetCategories)
	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)

	r.Run(":8080")
}
