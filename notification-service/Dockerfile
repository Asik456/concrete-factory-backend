FROM golang:1.25

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY notification-service/ ./notification-service/

RUN go build -o notification ./notification-service/main.go

CMD ["./notification"]