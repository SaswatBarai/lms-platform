# =============================================================================
# LMS Platform - Docker Makefile
# =============================================================================
# Usage: make <target>
# Run 'make help' to see all available commands
# =============================================================================

.PHONY: help up down build rebuild start stop restart logs ps clean prune \
        up-infra up-services down-infra down-services \
        logs-auth logs-notification logs-infrastructure logs-bulk-import \
        logs-kong logs-nginx logs-kafka logs-postgres logs-redis logs-vault logs-minio \
        restart-auth restart-notification restart-infrastructure restart-bulk-import \
        build-auth build-notification build-infrastructure build-bulk-import build-kong \
        shell-auth shell-postgres shell-redis shell-kafka shell-kong \
        db-migrate db-push db-studio db-reset \
        health status kafka-topics vault-status \
        dev prod clean-volumes clean-images clean-all

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Docker Compose command
DC := docker compose

# =============================================================================
# HELP
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║          LMS Platform - Docker Management Commands               ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)Usage:$(RESET) make $(YELLOW)<target>$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  $(CYAN)%-25s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# =============================================================================
# MAIN COMMANDS
# =============================================================================

up: ## Start all services in detached mode
	@echo "$(GREEN)Starting all services...$(RESET)"
	$(DC) up -d
	@echo "$(GREEN)✓ All services started$(RESET)"

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping all services...$(RESET)"
	$(DC) down
	@echo "$(GREEN)✓ All services stopped$(RESET)"

build: ## Build all service images
	@echo "$(GREEN)Building all images...$(RESET)"
	$(DC) build
	@echo "$(GREEN)✓ Build complete$(RESET)"

rebuild: ## Rebuild and restart all services (no cache)
	@echo "$(YELLOW)Rebuilding all services (no cache)...$(RESET)"
	$(DC) build --no-cache
	$(DC) up -d --force-recreate
	@echo "$(GREEN)✓ Rebuild complete$(RESET)"

start: ## Start existing containers
	@echo "$(GREEN)Starting containers...$(RESET)"
	$(DC) start

stop: ## Stop running containers without removing
	@echo "$(YELLOW)Stopping containers...$(RESET)"
	$(DC) stop

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(RESET)"
	$(DC) restart
	@echo "$(GREEN)✓ All services restarted$(RESET)"

logs: ## View logs from all services (follow mode)
	$(DC) logs -f

ps: ## Show running containers status
	@echo "$(CYAN)Container Status:$(RESET)"
	$(DC) ps

status: ## Show detailed status of all services
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║                    Service Status Overview                       ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════════╝$(RESET)"
	@$(DC) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# =============================================================================
# INFRASTRUCTURE SERVICES
# =============================================================================

up-infra: ## Start only infrastructure services (db, cache, messaging)
	@echo "$(GREEN)Starting infrastructure services...$(RESET)"
	$(DC) up -d postgres redis redis-ui vault mongo minio minio-init zookeeper kafka kafka-ui
	@echo "$(GREEN)✓ Infrastructure services started$(RESET)"

down-infra: ## Stop infrastructure services
	@echo "$(YELLOW)Stopping infrastructure services...$(RESET)"
	$(DC) stop postgres redis redis-ui vault mongo minio zookeeper kafka kafka-ui

up-gateway: ## Start gateway services (Kong + Nginx)
	@echo "$(GREEN)Starting gateway services...$(RESET)"
	$(DC) up -d kong nginx
	@echo "$(GREEN)✓ Gateway services started$(RESET)"

down-gateway: ## Stop gateway services
	@echo "$(YELLOW)Stopping gateway services...$(RESET)"
	$(DC) stop kong nginx

# =============================================================================
# LMS APPLICATION SERVICES
# =============================================================================

up-services: ## Start only LMS application services
	@echo "$(GREEN)Starting LMS application services...$(RESET)"
	$(DC) up -d auth-service notification-service infrastructure-service bulk-import-service
	@echo "$(GREEN)✓ LMS services started$(RESET)"

down-services: ## Stop LMS application services
	@echo "$(YELLOW)Stopping LMS application services...$(RESET)"
	$(DC) stop auth-service notification-service infrastructure-service bulk-import-service

# =============================================================================
# INDIVIDUAL SERVICE LOGS
# =============================================================================

logs-auth: ## View auth-service logs
	$(DC) logs -f auth-service

logs-notification: ## View notification-service logs
	$(DC) logs -f notification-service

logs-infrastructure: ## View infrastructure-service logs
	$(DC) logs -f infrastructure-service

logs-bulk-import: ## View bulk-import-service logs
	$(DC) logs -f bulk-import-service

logs-kong: ## View Kong gateway logs
	$(DC) logs -f kong

logs-nginx: ## View Nginx logs
	$(DC) logs -f nginx

logs-kafka: ## View Kafka logs
	$(DC) logs -f kafka

logs-postgres: ## View PostgreSQL logs
	$(DC) logs -f postgres

logs-redis: ## View Redis logs
	$(DC) logs -f redis

logs-vault: ## View Vault logs
	$(DC) logs -f vault

logs-minio: ## View MinIO logs
	$(DC) logs -f minio

# =============================================================================
# INDIVIDUAL SERVICE RESTARTS
# =============================================================================

restart-auth: ## Restart auth-service
	@echo "$(YELLOW)Restarting auth-service...$(RESET)"
	$(DC) restart auth-service
	@echo "$(GREEN)✓ auth-service restarted$(RESET)"

restart-notification: ## Restart notification-service
	@echo "$(YELLOW)Restarting notification-service...$(RESET)"
	$(DC) restart notification-service
	@echo "$(GREEN)✓ notification-service restarted$(RESET)"

restart-infrastructure: ## Restart infrastructure-service
	@echo "$(YELLOW)Restarting infrastructure-service...$(RESET)"
	$(DC) restart infrastructure-service
	@echo "$(GREEN)✓ infrastructure-service restarted$(RESET)"

restart-bulk-import: ## Restart bulk-import-service
	@echo "$(YELLOW)Restarting bulk-import-service...$(RESET)"
	$(DC) restart bulk-import-service
	@echo "$(GREEN)✓ bulk-import-service restarted$(RESET)"

restart-kong: ## Restart Kong gateway
	@echo "$(YELLOW)Restarting Kong gateway...$(RESET)"
	$(DC) restart kong
	@echo "$(GREEN)✓ Kong gateway restarted$(RESET)"

# =============================================================================
# INDIVIDUAL SERVICE BUILDS
# =============================================================================

build-auth: ## Build auth-service image
	@echo "$(GREEN)Building auth-service...$(RESET)"
	$(DC) build auth-service

build-notification: ## Build notification-service image
	@echo "$(GREEN)Building notification-service...$(RESET)"
	$(DC) build notification-service

build-infrastructure: ## Build infrastructure-service image
	@echo "$(GREEN)Building infrastructure-service...$(RESET)"
	$(DC) build infrastructure-service

build-bulk-import: ## Build bulk-import-service image
	@echo "$(GREEN)Building bulk-import-service...$(RESET)"
	$(DC) build bulk-import-service

build-kong: ## Build Kong gateway image
	@echo "$(GREEN)Building Kong gateway...$(RESET)"
	$(DC) build kong

# =============================================================================
# SHELL ACCESS
# =============================================================================

shell-auth: ## Open shell in auth-service container
	docker exec -it auth_service /bin/sh

shell-postgres: ## Open psql shell in PostgreSQL container
	docker exec -it postgres_cont psql -U lms_user -d lms_db

shell-redis: ## Open redis-cli in Redis container
	docker exec -it redis_cont redis-cli -a redis_pass

shell-kafka: ## Open shell in Kafka container
	docker exec -it kafka_cont /bin/bash

shell-kong: ## Open shell in Kong container
	docker exec -it lms-kong-gateway /bin/sh

shell-minio: ## Open shell in MinIO container
	docker exec -it minio_cont /bin/sh

# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

db-migrate: ## Run Prisma migrations
	@echo "$(GREEN)Running database migrations...$(RESET)"
	docker exec -it auth_service npx prisma migrate deploy
	@echo "$(GREEN)✓ Migrations complete$(RESET)"

db-push: ## Push Prisma schema to database
	@echo "$(GREEN)Pushing schema to database...$(RESET)"
	docker exec -it auth_service npx prisma db push
	@echo "$(GREEN)✓ Schema pushed$(RESET)"

db-studio: ## Open Prisma Studio
	@echo "$(GREEN)Starting Prisma Studio on port 5555...$(RESET)"
	docker exec -it auth_service npx prisma studio

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(RED)WARNING: This will destroy all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker exec -it auth_service npx prisma migrate reset --force
	@echo "$(GREEN)✓ Database reset complete$(RESET)"

db-seed: ## Seed the database
	@echo "$(GREEN)Seeding database...$(RESET)"
	docker exec -it auth_service npx prisma db seed
	@echo "$(GREEN)✓ Database seeded$(RESET)"

# =============================================================================
# HEALTH CHECKS
# =============================================================================

health: ## Check health of all services
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║                    Service Health Checks                         ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)Auth Service:$(RESET)"
	@curl -sf http://localhost:4001/auth/api/health 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)Notification Service:$(RESET)"
	@curl -sf http://localhost:4002/health 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)Infrastructure Service:$(RESET)"
	@curl -sf http://localhost:4003/health 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)Bulk Import Service:$(RESET)"
	@curl -sf http://localhost:4004/health 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)Kong Gateway:$(RESET)"
	@curl -sf http://localhost:8001/status 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)Vault:$(RESET)"
	@curl -sf http://localhost:8200/v1/sys/health 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo "$(YELLOW)MinIO:$(RESET)"
	@curl -sf http://localhost:9000/minio/health/live 2>/dev/null && echo "$(GREEN)  ✓ Healthy$(RESET)" || echo "$(RED)  ✗ Unhealthy$(RESET)"
	@echo ""

health-auth: ## Check auth-service health
	@curl -sf http://localhost:4001/auth/api/health && echo "" || echo "$(RED)Auth service unhealthy$(RESET)"

# =============================================================================
# KAFKA OPERATIONS
# =============================================================================

kafka-topics: ## List Kafka topics
	@echo "$(CYAN)Kafka Topics:$(RESET)"
	docker exec -it kafka_cont kafka-topics --list --bootstrap-server localhost:9092

kafka-create-topic: ## Create a Kafka topic (usage: make kafka-create-topic TOPIC=mytopic)
	@if [ -z "$(TOPIC)" ]; then echo "$(RED)Error: TOPIC is required. Usage: make kafka-create-topic TOPIC=mytopic$(RESET)"; exit 1; fi
	docker exec -it kafka_cont kafka-topics --create --topic $(TOPIC) --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# =============================================================================
# VAULT OPERATIONS
# =============================================================================

vault-status: ## Check Vault status
	@echo "$(CYAN)Vault Status:$(RESET)"
	docker exec -it lms-vault vault status

vault-keys: ## List Vault keys (requires auth)
	docker exec -it lms-vault vault kv list -mount=secret lms/

# =============================================================================
# CLEANUP COMMANDS
# =============================================================================

clean: ## Stop and remove containers, networks
	@echo "$(YELLOW)Cleaning up containers and networks...$(RESET)"
	$(DC) down --remove-orphans
	@echo "$(GREEN)✓ Cleanup complete$(RESET)"

clean-volumes: ## Remove all volumes (WARNING: destroys data)
	@echo "$(RED)WARNING: This will destroy all persistent data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DC) down -v --remove-orphans
	@echo "$(GREEN)✓ Volumes removed$(RESET)"

clean-images: ## Remove all project images
	@echo "$(YELLOW)Removing project images...$(RESET)"
	$(DC) down --rmi local
	@echo "$(GREEN)✓ Images removed$(RESET)"

clean-all: ## Full cleanup: containers, volumes, images, networks
	@echo "$(RED)WARNING: This will remove everything including all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	$(DC) down -v --rmi all --remove-orphans
	@echo "$(GREEN)✓ Full cleanup complete$(RESET)"

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✓ Prune complete$(RESET)"

prune-all: ## Remove ALL unused Docker resources (including volumes)
	@echo "$(RED)WARNING: This will remove all unused Docker resources!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker system prune -af --volumes
	@echo "$(GREEN)✓ Full prune complete$(RESET)"

cleanup-storage: ## Comprehensive storage cleanup (Docker + caches)
	@echo "$(GREEN)Running comprehensive storage cleanup...$(RESET)"
	@./cleanup-storage.sh

# =============================================================================
# DEVELOPMENT SHORTCUTS
# =============================================================================

dev: up-infra ## Start development environment (infra only)
	@echo "$(GREEN)Development infrastructure ready!$(RESET)"
	@echo "$(CYAN)Run 'make up-services' when ready to start application services$(RESET)"

dev-full: up ## Start full development environment
	@echo "$(GREEN)Full development environment ready!$(RESET)"

watch-auth: ## Rebuild and restart auth-service on changes
	@echo "$(GREEN)Watching auth-service...$(RESET)"
	$(DC) up -d --build auth-service
	$(DC) logs -f auth-service

# =============================================================================
# PRODUCTION SHORTCUTS
# =============================================================================

prod: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(RESET)"
	$(DC) -f docker-compose.yml up -d --build
	@echo "$(GREEN)✓ Production environment started$(RESET)"

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

ports: ## Show all exposed ports
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║                      Exposed Ports                               ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "  $(YELLOW)Infrastructure:$(RESET)"
	@echo "    PostgreSQL:     5432"
	@echo "    Redis Insight:  5540"
	@echo "    Vault:          8200"
	@echo "    MinIO API:      9000"
	@echo "    MinIO Console:  9001"
	@echo "    Zookeeper:      2182"
	@echo "    Kafka:          9094"
	@echo "    Kafka UI:       8081"
	@echo ""
	@echo "  $(YELLOW)Gateway:$(RESET)"
	@echo "    Kong Proxy:     8000 (HTTP), 8443 (HTTPS)"
	@echo "    Kong Admin:     8001 (HTTP), 8444 (HTTPS)"
	@echo "    Nginx:          8080 (HTTP), 8445 (HTTPS)"
	@echo ""
	@echo "  $(YELLOW)Services:$(RESET)"
	@echo "    Auth Service:   4001 (internal), 5555 (Prisma Studio)"
	@echo ""

network: ## Show Docker networks
	@echo "$(CYAN)Docker Networks:$(RESET)"
	docker network ls | grep -E "lms|internal|public"

volumes: ## Show Docker volumes
	@echo "$(CYAN)Docker Volumes:$(RESET)"
	docker volume ls | grep -E "lms|pgdata|redis|mongo|vault|kong|minio"

images: ## Show project Docker images
	@echo "$(CYAN)Project Images:$(RESET)"
	docker images | grep -E "lms-platform|auth|notification|infrastructure|bulk"

