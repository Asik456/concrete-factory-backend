package config

import (
	"concrete-factory-backend/models"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = "concrete_factory"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port)

	var db *gorm.DB
	var err error
	for i := 1; i <= 15; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("DB connection attempt %d/15 failed, retrying in 2s...", i)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatal("Could not connect to database:", err)
	}
	log.Println("Connected to database!")

	runMigrations(host, user, password, dbname, port)

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
	log.Println("Database migrated!")

	seedAdmin(db)
	seedProducts(db)
	DB = db
}

func runMigrations(host, user, password, dbname, port string) {
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		migrationsPath = "file://db/migrations"
	}
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname)
	m, err := migrate.New(migrationsPath, dbURL)
	if err != nil {
		log.Printf("Migration init error: %v", err)
		return
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Printf("Migration error: %v", err)
		return
	}
	log.Println("Migrations applied successfully")
}

func ptr(v float64) *float64 { return &v }

func seedProducts(db *gorm.DB) {
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		return
	}

	cats := []models.Category{
		{NameRu: "Товарный бетон", NameKz: "Тауарлы бетон", NameEn: "Ready-Mix Concrete", Slug: "ready-mix-concrete"},
		{NameRu: "Растворы и смеси", NameKz: "Ерітінділер мен қоспалар", NameEn: "Mortars & Mixes", Slug: "mortars-mixes"},
		{NameRu: "Штучные изделия", NameKz: "Дайын бұйымдар", NameEn: "Precast Products", Slug: "precast-products"},
	}
	for i := range cats {
		db.Create(&cats[i])
	}
	log.Println("Categories seeded")

	type productSeed struct {
		p     models.Product
		specs []models.ProductSpec
	}

	seeds := []productSeed{
		// --- Товарный бетон ---
		{
			p: models.Product{
				CategoryID:    cats[0].ID,
				NameRu:        "Бетон М100 (B7.5)",
				NameKz:        "Бетон М100 (B7.5)",
				NameEn:        "Concrete M100 (B7.5)",
				DescriptionRu: "Бетон марки М100 применяется для подготовительных работ, устройства подстилающих слоёв и стяжек.",
				DescriptionKz: "М100 маркалы бетон дайындық жұмыстары мен тегіс қабаттарға қолданылады.",
				DescriptionEn: "M100 concrete is used for preparatory work, leveling layers and screeds.",
				Price:         25000,
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Класс прочности", Value: "B7.5"},
				{Key: "Подвижность", Value: "П3"},
				{Key: "Морозостойкость", Value: "F50"},
				{Key: "Водонепроницаемость", Value: "W2"},
				{Key: "Единица", Value: "м³"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[0].ID,
				NameRu:        "Бетон М200 (B15)",
				NameKz:        "Бетон М200 (B15)",
				NameEn:        "Concrete M200 (B15)",
				DescriptionRu: "Бетон М200 — универсальная марка для фундаментов, полов, дорожек и отмосток.",
				DescriptionKz: "М200 бетоны іргетас, еден және жолдар үшін қолданылады.",
				DescriptionEn: "M200 concrete — a versatile grade for foundations, floors, paths and aprons.",
				Price:         35000,
				DiscountPrice: ptr(32000),
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Класс прочности", Value: "B15"},
				{Key: "Подвижность", Value: "П3"},
				{Key: "Морозостойкость", Value: "F100"},
				{Key: "Водонепроницаемость", Value: "W4"},
				{Key: "Единица", Value: "м³"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[0].ID,
				NameRu:        "Бетон М300 (B22.5)",
				NameKz:        "Бетон М300 (B22.5)",
				NameEn:        "Concrete M300 (B22.5)",
				DescriptionRu: "Бетон М300 используется для монолитных перекрытий, колонн, несущих конструкций.",
				DescriptionKz: "М300 бетоны монолитті перекрытиелер мен тіреу конструкцияларына арналған.",
				DescriptionEn: "M300 concrete is used for monolithic slabs, columns and load-bearing structures.",
				Price:         42000,
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Класс прочности", Value: "B22.5"},
				{Key: "Подвижность", Value: "П4"},
				{Key: "Морозостойкость", Value: "F150"},
				{Key: "Водонепроницаемость", Value: "W6"},
				{Key: "Единица", Value: "м³"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[0].ID,
				NameRu:        "Бетон М400 (B30)",
				NameKz:        "Бетон М400 (B30)",
				NameEn:        "Concrete M400 (B30)",
				DescriptionRu: "Высокопрочный бетон М400 для мостов, гидротехнических сооружений и ответственных конструкций.",
				DescriptionKz: "М400 жоғары беріктікті бетон — көпірлер мен су техникалық ғимараттарға арналған.",
				DescriptionEn: "High-strength M400 concrete for bridges, hydraulic structures and critical construction.",
				Price:         52000,
				DiscountPrice: ptr(49000),
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Класс прочности", Value: "B30"},
				{Key: "Подвижность", Value: "П4"},
				{Key: "Морозостойкость", Value: "F200"},
				{Key: "Водонепроницаемость", Value: "W8"},
				{Key: "Единица", Value: "м³"},
			},
		},
		// --- Растворы и смеси ---
		{
			p: models.Product{
				CategoryID:    cats[1].ID,
				NameRu:        "Кладочный раствор М75",
				NameKz:        "Қалау ерітіндісі М75",
				NameEn:        "Masonry Mortar M75",
				DescriptionRu: "Цементно-песчаный раствор для кладки кирпича, газоблока и камня.",
				DescriptionKz: "Кірпіш, газоблок және тас қалауға арналған цемент-құм ерітіндісі.",
				DescriptionEn: "Cement-sand mortar for laying bricks, aerated blocks and stone.",
				Price:         22000,
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Марка", Value: "М75"},
				{Key: "Подвижность", Value: "7–8 см"},
				{Key: "Размер фракции", Value: "до 2.5 мм"},
				{Key: "Единица", Value: "м³"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[1].ID,
				NameRu:        "Пескобетон М150",
				NameKz:        "Құм-бетон М150",
				NameEn:        "Sand Concrete M150",
				DescriptionRu: "Пескобетон для стяжки пола, выравнивания поверхностей и устройства дорожек.",
				DescriptionKz: "Еден стяжкасы мен жол жабынына арналған құм-бетон.",
				DescriptionEn: "Sand concrete for floor screeds, surface leveling and pathways.",
				Price:         28000,
				DiscountPrice: ptr(25500),
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Марка", Value: "М150"},
				{Key: "Размер фракции", Value: "до 5 мм"},
				{Key: "Расход воды", Value: "170–190 л/м³"},
				{Key: "Единица", Value: "м³"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[1].ID,
				NameRu:        "Штукатурный раствор М50",
				NameKz:        "Сылақ ерітіндісі М50",
				NameEn:        "Plaster Mortar M50",
				DescriptionRu: "Известково-цементный штукатурный раствор для внутренних и наружных работ.",
				DescriptionKz: "Ішкі және сыртқы жұмыстарға арналған әк-цемент сылақ ерітіндісі.",
				DescriptionEn: "Lime-cement plaster mortar for interior and exterior finishing works.",
				Price:         18000,
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Марка", Value: "М50"},
				{Key: "Толщина слоя", Value: "10–30 мм"},
				{Key: "Единица", Value: "м³"},
			},
		},
		// --- Штучные изделия ---
		{
			p: models.Product{
				CategoryID:    cats[2].ID,
				NameRu:        "Тротуарная плитка 200×100×60",
				NameKz:        "Тротуарлық тақтайша 200×100×60",
				NameEn:        "Paving Slab 200×100×60",
				DescriptionRu: "Вибропрессованная тротуарная плитка серого цвета для пешеходных зон и дворовых территорий.",
				DescriptionKz: "Жаяу жүргіншілер аймақтарына арналған сұр түсті вибробасылған тақтайша.",
				DescriptionEn: "Vibro-pressed grey paving slab for pedestrian zones and courtyards.",
				Price:         1500,
				DiscountPrice: ptr(1350),
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Размер", Value: "200×100×60 мм"},
				{Key: "Вес", Value: "2.8 кг/шт"},
				{Key: "Класс прочности", Value: "B22.5"},
				{Key: "Морозостойкость", Value: "F200"},
				{Key: "Цвет", Value: "Серый"},
				{Key: "Единица", Value: "м²"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[2].ID,
				NameRu:        "Бордюрный камень БР 100.30.15",
				NameKz:        "Бордюр тасы БР 100.30.15",
				NameEn:        "Curb Stone BR 100.30.15",
				DescriptionRu: "Дорожный бетонный бордюр для разграничения проезжей части и тротуара.",
				DescriptionKz: "Жол және жаяу жол бөлігін бөлуге арналған бетон бордюр.",
				DescriptionEn: "Concrete road curb for separating carriageway and pavement.",
				Price:         2800,
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Размер", Value: "1000×300×150 мм"},
				{Key: "Вес", Value: "110 кг"},
				{Key: "Класс прочности", Value: "B22.5"},
				{Key: "Морозостойкость", Value: "F150"},
				{Key: "Единица", Value: "шт"},
			},
		},
		{
			p: models.Product{
				CategoryID:    cats[2].ID,
				NameRu:        "Кольцо колодезное КС-10",
				NameKz:        "Құдық сақинасы КС-10",
				NameEn:        "Well Ring KS-10",
				DescriptionRu: "Железобетонное кольцо для строительства колодцев, септиков и смотровых камер.",
				DescriptionKz: "Тексеру шахталары мен ағын сулар жүйесіне арналған темірбетон сақина.",
				DescriptionEn: "Reinforced concrete ring for wells, septic tanks and inspection chambers.",
				Price:         8500,
				DiscountPrice: ptr(7800),
				IsActive:      true,
			},
			specs: []models.ProductSpec{
				{Key: "Внутренний диаметр", Value: "1000 мм"},
				{Key: "Высота", Value: "900 мм"},
				{Key: "Вес", Value: "600 кг"},
				{Key: "Класс прочности", Value: "B15"},
				{Key: "Единица", Value: "шт"},
			},
		},
	}

	for i := range seeds {
		db.Create(&seeds[i].p)
		for j := range seeds[i].specs {
			seeds[i].specs[j].ProductID = seeds[i].p.ID
			db.Create(&seeds[i].specs[j])
		}
	}
	log.Println("Products seeded:", len(seeds))
}

func seedAdmin(db *gorm.DB) {
	adminEmail := os.Getenv("ADMIN_EMAIL_DEFAULT")
	adminPassword := os.Getenv("ADMIN_PASSWORD_DEFAULT")
	if adminEmail == "" || adminPassword == "" {
		return
	}
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(adminPassword), 10)
	if err != nil {
		return
	}
	db.Create(&models.User{
		Name:     "Administrator",
		Email:    adminEmail,
		Password: string(hashed),
		Role:     "admin",
	})
	log.Println("Default admin created:", adminEmail)
}
