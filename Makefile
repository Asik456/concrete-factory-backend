DB_URL=postgres://postgres:postgres@localhost:5432/concrete_factory?sslmode=disable

migrate-up:
	migrate -path db/migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DB_URL)" down 1

migrate-version:
	migrate -path db/migrations -database "$(DB_URL)" version

migrate-force:
	migrate -path db/migrations -database "$(DB_URL)" force $(version)