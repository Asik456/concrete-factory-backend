package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
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
			&models.ProductVariant{},
			&models.Inquiry{},
		)
		db.Exec("DELETE FROM product_variants")
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
	r.POST("/verify-email", handlers.VerifyEmail)
	r.POST("/resend-verification-code", handlers.ResendVerificationCode)
	r.POST("/forgot-password", handlers.ForgotPassword)
	r.POST("/reset-password", handlers.ResetPassword)
	r.GET("/categories", handlers.GetCategories)
	r.GET("/products", handlers.GetProducts)
	r.GET("/products/:id", handlers.GetProductByID)
	r.POST("/inquiries", handlers.CreateInquiry)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		auth.GET("/me", handlers.GetMe)

		admin := auth.Group("/")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/users", handlers.GetAllUsers)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
			admin.PUT("/users/:id/block", handlers.UpdateUserBlock)
		}
	}
	testRouter = r

	os.Exit(m.Run())
}

// createVerifiedUser registers a user via the real /register flow, then marks it
// verified (and sets role, if given) directly in the DB — mirrors how a real user
// ends up in this state without needing to read a verification code from an inbox.
func createVerifiedUser(t *testing.T, email, role string) uint {
	t.Helper()
	body, _ := json.Marshal(map[string]string{
		"name": "Test User", "phone": "+77005556677",
		"email": email, "password": "secret123",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("setup: register failed: %d %s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	id := uint(resp["id"].(float64))

	updates := map[string]interface{}{"is_verified": true}
	if role != "" {
		updates["role"] = role
	}
	config.DB.Model(&models.User{}).Where("id = ?", id).Updates(updates)
	return id
}

func loginAndGetToken(t *testing.T, email string) string {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"email": email, "password": "secret123"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("setup: login failed: %d %s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	return resp["token"].(string)
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

	// Skip email verification in test (no real inbox to read the code from)
	config.DB.Model(&models.User{}).Where("email = ?", "test_login@example.com").Update("is_verified", true)

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

// Test 11: a non-admin cannot change another user's role
func TestUpdateUserRole_RequiresAdmin(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	createVerifiedUser(t, "role_customer1@example.com", "customer")
	token := loginAndGetToken(t, "role_customer1@example.com")
	targetID := createVerifiedUser(t, "role_target1@example.com", "customer")

	body, _ := json.Marshal(map[string]string{"role": "admin"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/role", targetID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 12: an admin can change another user's role
func TestUpdateUserRole_Success(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	createVerifiedUser(t, "role_admin1@example.com", "admin")
	adminToken := loginAndGetToken(t, "role_admin1@example.com")
	targetID := createVerifiedUser(t, "role_target2@example.com", "customer")

	body, _ := json.Marshal(map[string]string{"role": "admin"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/role", targetID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminToken)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var user models.User
	config.DB.First(&user, targetID)
	if user.Role != "admin" {
		t.Errorf("expected role=admin, got %s", user.Role)
	}
}

// Test 13: an admin cannot change their own role (self-lockout protection)
func TestUpdateUserRole_CannotChangeSelf(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	selfID := createVerifiedUser(t, "role_admin2@example.com", "admin")
	token := loginAndGetToken(t, "role_admin2@example.com")

	body, _ := json.Marshal(map[string]string{"role": "customer"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/role", selfID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 14: an admin can block another user
func TestUpdateUserBlock_Success(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	createVerifiedUser(t, "block_admin1@example.com", "admin")
	adminToken := loginAndGetToken(t, "block_admin1@example.com")
	targetID := createVerifiedUser(t, "block_target1@example.com", "customer")

	body, _ := json.Marshal(map[string]interface{}{"is_blocked": true})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/block", targetID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminToken)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var user models.User
	config.DB.First(&user, targetID)
	if !user.IsBlocked {
		t.Error("expected user to be blocked")
	}
}

// Test 15: an admin cannot block themselves
func TestUpdateUserBlock_CannotBlockSelf(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	selfID := createVerifiedUser(t, "block_admin2@example.com", "admin")
	token := loginAndGetToken(t, "block_admin2@example.com")

	body, _ := json.Marshal(map[string]interface{}{"is_blocked": true})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/block", selfID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 16: blocking a user immediately invalidates their already-issued token,
// instead of waiting for it to expire
func TestBlockedUser_TokenRejectedImmediately(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	createVerifiedUser(t, "block_victim1@example.com", "customer")
	token := loginAndGetToken(t, "block_victim1@example.com")

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected token to work before block, got %d", w.Code)
	}

	config.DB.Model(&models.User{}).Where("email = ?", "block_victim1@example.com").Update("is_blocked", true)

	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest(http.MethodGet, "/me", nil)
	req2.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w2, req2)
	if w2.Code != http.StatusForbidden {
		t.Errorf("expected 403 after block, got %d: %s", w2.Code, w2.Body.String())
	}
}

// Test 17a: forgot-password always responds 200, even for an email that
// isn't registered — the endpoint must not leak which emails have accounts
func TestForgotPassword_UnknownEmail_StillReturns200(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	body, _ := json.Marshal(map[string]string{"email": "no_such_user@example.com"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 17b: full forgot/reset-password flow — request a code, use it to set a
// new password, then confirm the new password actually logs in
func TestResetPassword_Success(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	email := "reset_flow1@example.com"
	createVerifiedUser(t, email, "customer")

	body, _ := json.Marshal(map[string]string{"email": email})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("forgot-password: expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var user models.User
	config.DB.Where("email = ?", email).First(&user)
	if user.ResetCode == "" {
		t.Fatal("expected reset_code to be set on the user")
	}

	resetBody, _ := json.Marshal(map[string]string{
		"email": email, "code": user.ResetCode, "new_password": "newpass456",
	})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/reset-password", bytes.NewBuffer(resetBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("reset-password: expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Old password must no longer work
	oldLoginBody, _ := json.Marshal(map[string]string{"email": email, "password": "secret123"})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(oldLoginBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected old password to be rejected (401), got %d", w.Code)
	}

	// New password must work
	newLoginBody, _ := json.Marshal(map[string]string{"email": email, "password": "newpass456"})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/login", bytes.NewBuffer(newLoginBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected new password to work (200), got %d: %s", w.Code, w.Body.String())
	}
}

// Test 17c: reset-password rejects a wrong code
func TestResetPassword_InvalidCode(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	email := "reset_flow2@example.com"
	createVerifiedUser(t, email, "customer")

	body, _ := json.Marshal(map[string]string{"email": email})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/forgot-password", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)

	resetBody, _ := json.Marshal(map[string]string{
		"email": email, "code": "000000", "new_password": "whatever123",
	})
	w = httptest.NewRecorder()
	req, _ = http.NewRequest(http.MethodPost, "/reset-password", bytes.NewBuffer(resetBody))
	req.Header.Set("Content-Type", "application/json")
	testRouter.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

// Test 17: GET /users requires admin
func TestGetAllUsers_RequiresAdmin(t *testing.T) {
	if config.DB == nil {
		t.Skip("no database connection")
	}
	createVerifiedUser(t, "users_customer1@example.com", "customer")
	token := loginAndGetToken(t, "users_customer1@example.com")

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	testRouter.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d: %s", w.Code, w.Body.String())
	}
}
