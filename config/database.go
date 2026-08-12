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
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host, user, password, dbname, port, sslmode)

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

	// Serverless Postgres (e.g. Neon) suspends its compute after a few minutes idle and
	// can drop connections server-side without the client noticing. Without pool limits,
	// database/sql happily keeps handing out those dead connections, and a query on one
	// hangs until the OS TCP timeout instead of failing fast — that's what turns a normal
	// request into a 10-80s stall. Capping idle time forces the pool to reconnect instead.
	if sqlDB, err := db.DB(); err == nil {
		sqlDB.SetMaxOpenConns(10)
		sqlDB.SetMaxIdleConns(2)
		sqlDB.SetConnMaxIdleTime(2 * time.Minute)
		sqlDB.SetConnMaxLifetime(30 * time.Minute)
	}

	runMigrations(host, user, password, dbname, port, sslmode)

	// AutoMigrate is a safety net for local dev — it introspects every table's schema
	// with dozens of individual queries, which is slow over a cross-region DB connection.
	// SQL migrations already own the schema in production, so it can be skipped there.
	if os.Getenv("SKIP_AUTOMIGRATE") != "true" {
		db.AutoMigrate(
			&models.User{},
			&models.Category{},
			&models.ProductSpec{},
			&models.Product{},
			&models.ProductVariant{},
			&models.Inquiry{},
		)
		log.Println("Database migrated!")
	}

	seedAdmin(db)
	seedProducts(db)
	DB = db
}

func runMigrations(host, user, password, dbname, port, sslmode string) {
	migrationsPath := os.Getenv("MIGRATIONS_PATH")
	if migrationsPath == "" {
		migrationsPath = "file://db/migrations"
	}
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbname, sslmode)
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

// seedProducts loads the real JSI Beton Almaty price list (docs/pricelist.docx).
// Prices confirmed with the site owner: rings/plates show both "Частникам/без НДС" (Price)
// and "Фирма/с НДС" (PriceWholesale); blocks/columns show only the cash ("нал") price per
// color variant, unit is per piece (шт).
func seedProducts(db *gorm.DB) {
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		return
	}

	cats := []models.Category{
		{NameRu: "Кольца колодезные", NameKz: "Құдық сақиналары", NameEn: "Well Rings", Slug: "well-rings"},
		{NameRu: "Плиты перекрытия колодцев", NameKz: "Құдық жабын тақталары", NameEn: "Well Cover Plates", Slug: "well-cover-plates"},
		{NameRu: "Плиты днища колодцев", NameKz: "Құдық түп тақталары", NameEn: "Well Bottom Plates", Slug: "well-bottom-plates"},
		{NameRu: "Блоки и колонны", NameKz: "Блоктар мен бағаналар", NameEn: "Blocks & Columns", Slug: "blocks-columns"},
		{NameRu: "Бетон", NameKz: "Бетон", NameEn: "Ready-Mix Concrete", Slug: "concrete"},
	}
	for i := range cats {
		db.Create(&cats[i])
	}
	log.Println("Categories seeded")

	type productSeed struct {
		p        models.Product
		specs    []models.ProductSpec
		variants []models.ProductVariant
	}

	ringDesc := func(code string) (string, string, string) {
		return fmt.Sprintf("Железобетонное кольцо колодезное %s. Применяется для устройства смотровых, канализационных и водопроводных колодцев, септиков.", code),
			fmt.Sprintf("%s темірбетон құдық сақинасы. Тексеру құдықтарын, кәріз және су құбыры құдықтарын, септиктерді салуға арналған.", code),
			fmt.Sprintf("Reinforced concrete well ring %s. Used for inspection wells, sewage and water supply wells, septic tanks.", code)
	}
	plateDesc := func(code, purposeRu, purposeKz, purposeEn string) (string, string, string) {
		return fmt.Sprintf("Железобетонная %s %s.", purposeRu, code),
			fmt.Sprintf("%s темірбетон %s.", code, purposeKz),
			fmt.Sprintf("Reinforced concrete %s %s.", purposeEn, code)
	}
	blockDesc := func(nameRu, nameKz, nameEn string) (string, string, string) {
		return fmt.Sprintf("%s из вибропрессованного бетона.", nameRu),
			fmt.Sprintf("%s, вибробасылған бетоннан жасалған.", nameKz),
			fmt.Sprintf("%s made of vibro-pressed concrete.", nameEn)
	}

	seeds := []productSeed{}

	// --- Кольца колодезные ---
	type ringSeed struct {
		code               string
		size               string
		volume             string
		weight             string
		price, priceWholes float64
		image              string
	}
	rings := []ringSeed{
		{"КС10.6", "1000×590 мм", "0.16 м³", "400 кг", 12000, 13500, "/images/products/kc-10.6.webp"},
		{"КС10.9", "1000×890 мм", "0.24 м³", "600 кг", 14000, 17000, "/images/products/kc-10.9.webp"},
		{"КС15.6", "1500×590 мм", "0.27 м³", "660 кг", 16000, 18000, "/images/products/kc-15.6.jpg"},
		{"КС15.9", "1500×890 мм", "0.4 м³", "1000 кг", 18000, 24000, "/images/products/kc-15.9.webp"},
		{"КС20.6", "2000×590 мм", "0.39 м³", "980 кг", 29000, 32000, "/images/products/kc-20.6.webp"},
		{"КС20.9", "2000×890 мм", "0.59 м³", "1480 кг", 33500, 38000, "/images/products/kc-20.9.webp"},
	}
	for _, r := range rings {
		descRu, descKz, descEn := ringDesc(r.code)
		seeds = append(seeds, productSeed{
			p: models.Product{
				CategoryID: cats[0].ID, NameRu: r.code, NameKz: r.code, NameEn: r.code,
				DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
				Price: r.price, PriceWholesale: ptr(r.priceWholes), Image: r.image, IsActive: true,
			},
			specs: []models.ProductSpec{
				{Key: "Размер", Value: r.size},
				{Key: "Объём", Value: r.volume},
				{Key: "Вес", Value: r.weight},
				{Key: "Единица", Value: "шт"},
			},
		})
	}

	// --- Плиты перекрытия колодцев ---
	type plateSeed struct {
		code               string
		size               string
		volume             string
		weight             string
		price, priceWholes float64
	}
	coverPlates := []plateSeed{
		{"ПП10-1", "1160×150(700) мм", "0.1 м³", "250 кг", 13500, 18000},
		{"1ПП15-1", "1680×150(700) мм", "0.27 м³", "680 кг", 19000, 30000},
		{"1ПП15-2 (усиленная)", "1680×150(700) мм", "0.27 м³", "680 кг", 35000, 40000},
		{"1ПП20-1", "2200×160(700) мм", "0.51 м³", "1275 кг", 35000, 48000},
		{"1ПП20-2 (усиленная)", "2200×160(700) мм", "0.51 м³", "1275 кг", 45000, 70000},
	}
	for _, p := range coverPlates {
		descRu, descKz, descEn := plateDesc(p.code, "плита перекрытия колодца (крышка)", "құдық жабын тақтасы (қақпақ)", "well cover plate (lid)")
		seeds = append(seeds, productSeed{
			p: models.Product{
				CategoryID: cats[1].ID, NameRu: p.code, NameKz: p.code, NameEn: p.code,
				DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
				Price: p.price, PriceWholesale: ptr(p.priceWholes), Image: "/images/products/cover-plate.webp", IsActive: true,
			},
			specs: []models.ProductSpec{
				{Key: "Размер", Value: p.size},
				{Key: "Объём", Value: p.volume},
				{Key: "Вес", Value: p.weight},
				{Key: "Единица", Value: "шт"},
			},
		})
	}

	// --- Плиты днища колодцев ---
	bottomPlates := []plateSeed{
		{"ПН10", "1160×100 мм", "0.11 м³", "275 кг", 13500, 18000},
		{"ПН15", "1680×120 мм", "0.27 м³", "675 кг", 19000, 30000},
		{"ПН20", "2200×120 мм", "0.46 м³", "1150 кг", 35000, 48000},
	}
	for _, p := range bottomPlates {
		descRu, descKz, descEn := plateDesc(p.code, "плита днища колодца", "құдық түп тақтасы", "well bottom plate")
		seeds = append(seeds, productSeed{
			p: models.Product{
				CategoryID: cats[2].ID, NameRu: p.code, NameKz: p.code, NameEn: p.code,
				DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
				Price: p.price, PriceWholesale: ptr(p.priceWholes), Image: "/images/products/bottom-plate.jpg", IsActive: true,
			},
			specs: []models.ProductSpec{
				{Key: "Размер", Value: p.size},
				{Key: "Объём", Value: p.volume},
				{Key: "Вес", Value: p.weight},
				{Key: "Единица", Value: "шт"},
			},
		})
	}

	// --- Блоки и колонны (цена "нал" по цвету, безнал на сайте не показываем) ---
	descRu, descKz, descEn := blockDesc("Сплитерный блок 20×20×40", "Сплитерлі блок 20×20×40", "Splitter block 20×20×40")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Сплитерный блок 20×20×40", NameKz: "Сплитерлі блок 20×20×40", NameEn: "Splitter block 20×20×40",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 190, Image: "/images/products/block-grey-smooth.jpeg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "20×20×40 см"}, {Key: "Единица", Value: "шт"}},
		variants: []models.ProductVariant{
			{ColorKey: "grey", Price: 190, Image: "/images/products/block-grey-smooth.jpeg"},
			{ColorKey: "red", Price: 310, Image: "/images/products/block-red-smooth.jpeg"},
			{ColorKey: "black", Price: 350, Image: "/images/products/block-black-smooth.jpeg"},
		},
	})

	descRu, descKz, descEn = blockDesc("Сплитерный блок рванный 20×20×40", "Сплитерлі жарылған блок 20×20×40", "Split-face splitter block 20×20×40")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Сплитерный блок – рванный 20×20×40", NameKz: "Сплитерлі блок – жарылған 20×20×40", NameEn: "Splitter block – split-face 20×20×40",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 290, Image: "/images/products/block-grey-splitface.jpeg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "20×20×40 см"}, {Key: "Единица", Value: "шт"}},
		variants: []models.ProductVariant{
			{ColorKey: "grey", Price: 290, Image: "/images/products/block-grey-splitface.jpeg"},
			{ColorKey: "red", Price: 350, Image: "/images/products/block-red-splitface.jpeg"},
			{ColorKey: "black", Price: 380, Image: "/images/products/block-black-splitface.jpeg"},
		},
	})

	descRu, descKz, descEn = blockDesc("Колонна/тумба 33×33×20", "Баған/тумба 33×33×20", "Column/pillar 33×33×20")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Колонна/тумба 33×33×20", NameKz: "Баған/тумба 33×33×20", NameEn: "Column/pillar 33×33×20",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 320, Image: "/images/products/column-grey-smooth.jpeg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "33×33×20 см"}, {Key: "Единица", Value: "шт"}},
		variants: []models.ProductVariant{
			{ColorKey: "grey", Price: 320, Image: "/images/products/column-grey-smooth.jpeg"},
			{ColorKey: "red", Price: 420, Image: "/images/products/column-red-smooth.jpeg"},
			{ColorKey: "black", Price: 450, Image: "/images/products/column-black-smooth.jpeg"},
		},
	})

	descRu, descKz, descEn = blockDesc("Рванная колонна/тумба 33×33×20", "Жарылған баған/тумба 33×33×20", "Split-face column/pillar 33×33×20")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Рванная колонна/тумба 33×33×20", NameKz: "Жарылған баған/тумба 33×33×20", NameEn: "Split-face column/pillar 33×33×20",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 400, Image: "/images/products/column-grey-splitface.jpeg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "33×33×20 см"}, {Key: "Единица", Value: "шт"}},
		variants: []models.ProductVariant{
			{ColorKey: "grey", Price: 400, Image: "/images/products/column-grey-splitface.jpeg"},
			{ColorKey: "red", Price: 450, Image: "/images/products/column-red-splitface.jpeg"},
			{ColorKey: "black", Price: 500, Image: "/images/products/column-black-splitface.jpg"},
		},
	})

	descRu, descKz, descEn = blockDesc("Межкомнатный блок 12×20×40", "Бөлме аралық блок 12×20×40", "Interior partition block 12×20×40")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Межкомнатный блок 12×20×40", NameKz: "Бөлме аралық блок 12×20×40", NameEn: "Interior partition block 12×20×40",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 155, Image: "/images/products/partition-block.jpeg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "12×20×40 см"}, {Key: "Единица", Value: "шт"}},
	})

	descRu, descKz, descEn = blockDesc("Колонна/тумба 40×20×40", "Баған/тумба 40×20×40", "Column/pillar 40×20×40")
	seeds = append(seeds, productSeed{
		p: models.Product{
			CategoryID: cats[3].ID, NameRu: "Колонна/тумба 40×20×40", NameKz: "Баған/тумба 40×20×40", NameEn: "Column/pillar 40×20×40",
			DescriptionRu: descRu, DescriptionKz: descKz, DescriptionEn: descEn,
			Price: 500, Image: "/images/products/column-grey-40x40.jpg", IsActive: true,
		},
		specs: []models.ProductSpec{{Key: "Размер", Value: "40×20×40 см"}, {Key: "Единица", Value: "шт"}},
		variants: []models.ProductVariant{
			{ColorKey: "grey", Price: 500, Image: "/images/products/column-grey-40x40.jpg"},
			{ColorKey: "red", Price: 620, Image: "/images/products/column-red-40x40.jpg"},
			{ColorKey: "black", Price: 650, Image: "/images/products/column-black-40x40.jpg"},
		},
	})

	// --- Бетон (цена за 1 м³, с НДС и доставкой — по прайсу "КП ЖСИ.docx") ---
	type concreteSeed struct {
		grade string
		price float64
	}
	concreteGrades := []concreteSeed{
		{"B7.5 (М-100)", 23000},
		{"B12.5 (М-150)", 23500},
		{"B15 (М-200)", 24500},
		{"B20 (М-250)", 25500},
		{"B22.5 (М-300)", 26800},
		{"B25 (М-350)", 27800},
	}
	for _, g := range concreteGrades {
		name := "Бетон " + g.grade
		seeds = append(seeds, productSeed{
			p: models.Product{
				CategoryID: cats[4].ID, NameRu: name, NameKz: name, NameEn: "Concrete " + g.grade,
				DescriptionRu: fmt.Sprintf("Товарный бетон марки %s. Цена за 1 м³, включая НДС и доставку.", g.grade),
				DescriptionKz: fmt.Sprintf("%s маркалы тауарлы бетон. 1 м³ бағасы, ҚҚС және жеткізу қосылған.", g.grade),
				DescriptionEn: fmt.Sprintf("Ready-mix concrete grade %s. Price per 1 m³, VAT and delivery included.", g.grade),
				Price:         g.price, Image: "/images/products/concrete.webp", IsActive: true,
			},
			specs: []models.ProductSpec{
				{Key: "Марка", Value: g.grade},
				{Key: "Единица", Value: "м³"},
				{Key: "Доставка", Value: "включена"},
			},
		})
	}

	for i := range seeds {
		db.Create(&seeds[i].p)
		for j := range seeds[i].specs {
			seeds[i].specs[j].ProductID = seeds[i].p.ID
			db.Create(&seeds[i].specs[j])
		}
		for j := range seeds[i].variants {
			seeds[i].variants[j].ProductID = seeds[i].p.ID
			db.Create(&seeds[i].variants[j])
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
		Name:       "Administrator",
		Email:      adminEmail,
		Password:   string(hashed),
		Role:       "admin",
		IsVerified: true,
	})
	log.Println("Default admin created:", adminEmail)
}
