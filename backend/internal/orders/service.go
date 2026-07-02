package orders

import (
	"context"
	"encoding/json"
	"github.com/Codecx-Org/FinAI/backend/internal/inventory"
	"github.com/Codecx-Org/FinAI/backend/internal/sales"
	shareddb "github.com/Codecx-Org/FinAI/backend/internal/shared/db"
	apperrors "github.com/Codecx-Org/FinAI/backend/internal/shared/errors"
	"github.com/Codecx-Org/FinAI/backend/internal/shared/middleware"
	"github.com/Codecx-Org/FinAI/backend/internal/shared/outbox"
	"github.com/Codecx-Org/FinAI/backend/internal/shared/pagination"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"time"
)

type InventoryWriter interface {
	DecrementForOrder(ctx context.Context, businessID, orderID uuid.UUID, lines []inventory.DecrementLine) error
}
type SaleCreator interface {
	CreateFromOrder(ctx context.Context, businessID, staffID, orderID uuid.UUID, customerID *uuid.UUID, paymentMethod string, lines []sales.OrderLineInput) (*sales.Sale, error)
}
type Service struct {
	repo      *Repository
	inventory InventoryWriter
	sales     SaleCreator
	outbox    outbox.Repository
}

func NewService(repo *Repository, inventory InventoryWriter, sales SaleCreator, outboxRepo outbox.Repository) *Service {
	return &Service{repo: repo, inventory: inventory, sales: sales, outbox: outboxRepo}
}

type OrderLineRequest struct {
	ProductID uuid.UUID       `json:"productId"`
	Quantity  decimal.Decimal `json:"quantity"`
	UnitPrice decimal.Decimal `json:"unitPrice"`
}
type CreateOrderRequest struct {
	CustomerID    *uuid.UUID         `json:"customerId"`
	PaymentMethod string             `json:"paymentMethod"`
	Lines         []OrderLineRequest `json:"lines"`
}

func (s *Service) Create(ctx context.Context, businessID uuid.UUID, req CreateOrderRequest) (*Order, error) {
	key, _ := middleware.IdempotencyKeyFromCtx(ctx)
	if key != "" {
		if existing, err := s.repo.FindByIdempotency(ctx, businessID, key); err == nil {
			return existing, nil
		}
	}
	if len(req.Lines) == 0 {
		return nil, apperrors.ErrUnprocessable.WithMessage("order requires at least one line")
	}
	subtotal := decimal.Zero
	lines := make([]OrderLine, 0, len(req.Lines))
	for _, line := range req.Lines {
		total := line.Quantity.Mul(line.UnitPrice).Round(2)
		subtotal = subtotal.Add(total)
		lines = append(lines, OrderLine{BaseModel: shareddb.BaseModel{TenantID: businessID}, BusinessID: businessID, ProductID: line.ProductID, Quantity: line.Quantity, UnitPrice: line.UnitPrice, LineTotal: total})
	}
	tax := subtotal.Mul(decimal.NewFromFloat(0.16)).Round(2)
	pay := req.PaymentMethod
	if pay == "" {
		pay = "cash"
	}
	order := &Order{BaseModel: shareddb.BaseModel{TenantID: businessID}, BusinessID: businessID, CustomerID: req.CustomerID, Status: StatusDraft, Subtotal: subtotal, TaxAmount: tax, Total: subtotal.Add(tax), PaymentMethod: pay, IdempotencyKey: key}
	if err := s.repo.Create(ctx, order, lines); err != nil {
		return nil, err
	}
	return s.repo.Find(ctx, businessID, order.ID)
}
func (s *Service) List(ctx context.Context, businessID uuid.UUID, page pagination.Page) ([]Order, error) {
	return s.repo.List(ctx, businessID, page)
}
func (s *Service) Get(ctx context.Context, businessID, orderID uuid.UUID) (*Order, error) {
	return s.repo.Find(ctx, businessID, orderID)
}
func (s *Service) Confirm(ctx context.Context, businessID, orderID uuid.UUID) (*Order, error) {
	order, err := s.repo.Find(ctx, businessID, orderID)
	if err != nil {
		return nil, err
	}
	if order.Status == StatusConfirmed || order.Status == StatusFulfilled {
		return order, nil
	}
	if order.Status != StatusDraft {
		return nil, apperrors.ErrConflict.WithMessage("order cannot be confirmed from current status")
	}
	lines := make([]inventory.DecrementLine, 0, len(order.Lines))
	for _, line := range order.Lines {
		lines = append(lines, inventory.DecrementLine{ProductID: line.ProductID, Quantity: line.Quantity})
	}
	if s.inventory != nil {
		if err := s.inventory.DecrementForOrder(ctx, businessID, order.ID, lines); err != nil {
			return nil, err
		}
	}
	now := time.Now().UTC()
	order.Status = StatusConfirmed
	order.ConfirmedAt = &now
	if err := s.repo.Update(ctx, order); err != nil {
		return nil, err
	}
	s.emit(ctx, businessID, order.ID, "order.confirmed")
	return s.repo.Find(ctx, businessID, order.ID)
}
func (s *Service) Fulfill(ctx context.Context, businessID, staffID, orderID uuid.UUID) (*Order, error) {
	order, err := s.Confirm(ctx, businessID, orderID)
	if err != nil {
		return nil, err
	}
	if order.Status == StatusFulfilled {
		return order, nil
	}
	saleLines := make([]sales.OrderLineInput, 0, len(order.Lines))
	for _, line := range order.Lines {
		saleLines = append(saleLines, sales.OrderLineInput{ProductID: line.ProductID, Quantity: line.Quantity, UnitPrice: line.UnitPrice})
	}
	if s.sales != nil {
		if _, err := s.sales.CreateFromOrder(ctx, businessID, staffID, order.ID, order.CustomerID, order.PaymentMethod, saleLines); err != nil {
			return nil, err
		}
	}
	now := time.Now().UTC()
	order.Status = StatusFulfilled
	order.FulfilledAt = &now
	if err := s.repo.Update(ctx, order); err != nil {
		return nil, err
	}
	s.emit(ctx, businessID, order.ID, "order.fulfilled")
	return s.repo.Find(ctx, businessID, order.ID)
}
func (s *Service) Cancel(ctx context.Context, businessID, orderID uuid.UUID) error {
	return s.repo.SetStatus(ctx, businessID, orderID, StatusCancelled)
}
func (s *Service) Refund(ctx context.Context, businessID, orderID uuid.UUID) error {
	return s.repo.SetStatus(ctx, businessID, orderID, StatusRefunded)
}
func (s *Service) emit(ctx context.Context, businessID, orderID uuid.UUID, eventType string) {
	if s.outbox == nil {
		return
	}
	payload, _ := json.Marshal(map[string]any{"orderId": orderID, "businessId": businessID})
	_ = s.outbox.Insert(ctx, &outbox.Event{TenantID: businessID, AggregateID: orderID.String(), AggregateType: "order", EventType: eventType, Stream: "orders", Payload: payload})
}
