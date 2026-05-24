package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"concrete-factory-backend/config"
	"concrete-factory-backend/handlers"
	"concrete-factory-backend/middleware"
	"concrete-factory-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var testRouter *gin.Engine

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	dsn := os.Getenv("TEST_DB_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=concrete_factory_test port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err == nil {
		db.AutoMigrate(
			&models.User{},
			&models.Category{},
			&models.ProductSpec{},
			&models.Product{},
			&models.Order{},
			&models.OrderItem{},
			&models.Inquiry{},
			&models.Payment{},
		)
		db.Exec("DELETE FROM order_items")
		db.Exec("DELETE FROM orders")
		db.Exec("DELETE FROM payments")
		db.Exec("DELETE FROM inquiries")
		db.Exec("DELETE FROM product_specs")
		db.Exec("DELETE FROM products")
		db.Exec("DELETE FROM categories")
		db.Exec("DELETE FROM users")
		config.DB = db
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)
	r.GET("/categories", handlers.GetCategories)
	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)
	r.POST("/inquiries", handlers.CreateInquiry)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)
		auth.POST("/orders", handlers.CreateOrder)
		auth.GET("/my-orders", handlers.GetMyOrders)
	}
	testRouter = r

	os.Exit(m.Run())
}

// Test 1: Health check
func TestHealthCheck(t *testing.T) {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "ok" {
		t.Errorf("expected status=ok, got %s", resp["status"])
	}
}

// Test 2: Register success
func TestRegister_Success(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	body, _ := json.Marshal(map[string]string{
		"name": "Test User", "phone": "+77001112233",
		"email": "test_reg@example.com", "password": "secret123",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 3: Register with missing required fields
func TestRegister_BadRequest(t *testing.T) {
	body, _ := json.Marshal(map[string]string{"name": "No Email"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	if w.Code == http.StatusCreated {
		t.Error("expected failure but got 201")
	}
}

// Test 4: Login with valid credentials
func TestLogin_Success(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	// Register first
	regBody, _ := json.Marshal(map[string]string{
		"name": "Login Test", "phone": "+77002223344",
		"email": "test_login@example.com", "password": "secret123",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	// Login
	loginBody, _ := json.Marshal(map[string]string{
		"email": "test_login@example.com", "password": "secret123",
	})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(loginBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["token"] == nil {
		t.Error("expected token in response")
	}
}

// Test 5: Login with invalid credentials
func TestLogin_InvalidCredentials(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	body, _ := json.Marshal(map[string]string{
		"email": "nobody@example.com", "password": "wrongpass",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

// Test 6: Get categories returns JSON array
func TestGetCategories(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/categories", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

// Test 7: Get products returns JSON array
func TestGetProducts(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

// Test 8: Filter products by category_id
func TestGetProducts_FilterByCategory(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products?category_id=999", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

// Test 9: Get product by non-existent ID returns 404
func TestGetProductByID_NotFound(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/products/99999", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

// Test 10: /me without token returns 401
func TestGetMe_Unauthorized(t *testing.T) {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/me", nil)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}
