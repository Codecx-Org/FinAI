package main

import (
	"net/http"
	"time"

	"github.com/Codecx-Org/FinAI/backend/internal/shared/config"
	sharedhttp "github.com/Codecx-Org/FinAI/backend/internal/shared/http"
	"github.com/Codecx-Org/FinAI/backend/internal/shared/middleware"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Dependencies struct {
	Config config.Config
	Ready  func(*http.Request) error
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(60 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   deps.Config.CORS.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Idempotency-Key", "X-Request-ID", "X-Business-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.TenantResolution)
	r.Use(middleware.Idempotency)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		sharedhttp.JSON(w, http.StatusOK, sharedhttp.Envelope{"status": "ok"})
	})

	r.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
		if deps.Ready != nil {
			if err := deps.Ready(r); err != nil {
				sharedhttp.JSON(w, http.StatusServiceUnavailable, sharedhttp.Envelope{"status": "not_ready"})
				return
			}
		}
		sharedhttp.JSON(w, http.StatusOK, sharedhttp.Envelope{"status": "ready"})
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/status", func(w http.ResponseWriter, r *http.Request) {
			sharedhttp.JSON(w, http.StatusOK, sharedhttp.Envelope{
				"service": "bizsawa-api",
				"phase":   "foundation",
			})
		})
	})

	return r
}
