# Pending Items & TODO List

This document tracks all pending features, services, and improvements for the LMS Platform.

**Last Updated**: Based on current codebase analysis

---

## 🚨 Critical Missing Services

### 1. **User Service** ⚠️ HIGH PRIORITY
- **Status**: Directory exists but completely empty
- **Location**: `services/user-service/`
- **Expected Functionality**:
  - User profile management
  - User CRUD operations
  - User search and filtering
  - User preferences management
- **Dependencies**: PostgreSQL, Redis, Kafka
- **Integration**: Should integrate with auth-service for user data

### 2. **Course & Section Service** ⚠️ HIGH PRIORITY
- **Status**: Not implemented (currently handled in auth-service)
- **Expected Functionality**:
  - Course management (CRUD)
  - Section management
  - Course enrollment
  - Course content management
  - Course scheduling
- **Note**: Currently `add-course`, `add-batch`, `add-section` endpoints are in auth-service (marked to be moved)
- **Kafka Events**: Should publish `course.*` and `enrollment.*` events

### 3. **Assignment Service** ⚠️ HIGH PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Assignment creation and management
  - Assignment submission handling
  - Assignment grading
  - Assignment deadlines
- **Kafka Events**: Should publish `assignment.*` events
- **Data Store**: PostgreSQL

### 4. **Submission Service** ⚠️ HIGH PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Submission handling
  - File uploads (integration with S3)
  - Submission status tracking
  - Grade management
- **Kafka Events**: Should publish `submission.*` and `grade.*` events
- **Data Store**: PostgreSQL, S3 for file storage

### 5. **Notes Service** ⚠️ MEDIUM PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - User notes management
  - Notes CRUD operations
  - Notes sharing
- **Kafka Events**: Should publish `note.*` events
- **Data Store**: PostgreSQL or MongoDB

### 6. **Search Service** ⚠️ MEDIUM PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Full-text search across platform
  - Search indexing
  - Search analytics
- **Data Store**: Elasticsearch
- **Integration**: Should index data from all services

### 7. **Chat Service (Socket.IO)** ⚠️ MEDIUM PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Real-time messaging
  - Chat rooms/channels
  - File sharing in chat
  - Message history
- **Kafka Events**: Should publish `chat.*` events
- **Data Store**: Redis for real-time, PostgreSQL for history
- **Technology**: Socket.IO

### 8. **Admin Service** ⚠️ MEDIUM PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Administrative dashboard APIs
  - System configuration
  - User management
  - Analytics and reporting
- **Data Store**: PostgreSQL

### 9. **Backend for Frontend (BFF) Service** ⚠️ MEDIUM PRIORITY
- **Status**: Not implemented
- **Expected Functionality**:
  - Aggregated APIs for frontend
  - Data transformation
  - API composition
- **Data Stores**: Redis (cache), PostgreSQL, MongoDB, S3
- **Purpose**: Reduces frontend complexity by providing tailored APIs

---

## 📊 Observability Stack (Missing)

### 1. **Prometheus** - Metrics Collection
- **Status**: Not implemented
- **Purpose**: Collect metrics from all services
- **Integration**: All services should expose metrics endpoints
- **Port**: 9090

### 2. **Grafana** - Metrics Visualization
- **Status**: Not implemented
- **Purpose**: Visualize metrics from Prometheus
- **Port**: 3000
- **Dashboards**: Need to create dashboards for:
  - Service health
  - Request rates
  - Error rates
  - Database performance
  - Kafka metrics

### 3. **Fluent Bit / Filebeat** - Log Collection
- **Status**: Not implemented
- **Purpose**: Collect logs from all services
- **Output**: Should send to Elasticsearch

### 4. **OpenTelemetry** - Distributed Tracing
- **Status**: Not implemented
- **Purpose**: Instrument services for distributed tracing
- **Integration**: All services need OpenTelemetry SDK

### 5. **Jaeger** - Trace Visualization
- **Status**: Not implemented
- **Purpose**: Visualize distributed traces
- **Port**: 16686

### 6. **Kibana** - Log Analysis
- **Status**: Not implemented (Elasticsearch exists but not configured)
- **Purpose**: Analyze logs from Elasticsearch
- **Port**: 5601
- **Note**: Elasticsearch is mentioned in architecture but not in docker-compose

### 7. **Elasticsearch** - Search & Log Storage
- **Status**: Not in docker-compose (only MongoDB exists)
- **Purpose**: 
  - Store logs from Fluent Bit/Filebeat
  - Power search service
- **Port**: 9200

---

## ☁️ AWS Infrastructure Components (Missing)

### 1. **AWS ALB/NLB** - Load Balancer
- **Status**: Not implemented (using local nginx)
- **Purpose**: Production load balancing
- **Note**: Currently using local nginx for load balancing

### 2. **EKS/ECS** - Container Orchestration
- **Status**: Not implemented (using local Docker Compose)
- **Purpose**: Production container orchestration
- **Note**: Architecture shows EKS/ECS but currently using Docker Compose

### 3. **AWS RDS/Aurora** - Managed PostgreSQL
- **Status**: Not implemented (using local PostgreSQL)
- **Purpose**: Production database
- **Note**: Currently using local PostgreSQL container

### 4. **ElastiCache** - Managed Redis
- **Status**: Not implemented (using local Redis)
- **Purpose**: Production Redis cache
- **Note**: Currently using local Redis container

### 5. **AWS MSK** - Managed Kafka
- **Status**: Not implemented (using local Kafka)
- **Purpose**: Production Kafka cluster
- **Note**: Currently using local Kafka container

### 6. **S3 Buckets** - Object Storage
- **Status**: Not implemented
- **Purpose**: 
  - Store submission files
  - Store course materials
  - Store user uploads
- **Integration**: Needed for Submission Service and BFF

### 7. **AWS Cognito** (Optional)
- **Status**: Not implemented
- **Purpose**: Alternative authentication provider
- **Note**: Architecture mentions "Auth Service / Cognito" suggesting optional Cognito integration

---

## 🔧 Feature Enhancements

### Auth Service Enhancements

1. **Batch Size Limits** (from BULK_STAFF_CREATION_API.md)
   - Add max 100 staff per request limit
   - Add validation for batch sizes

2. **Progress Tracking** (from BULK_STAFF_CREATION_API.md)
   - Implement WebSocket-based progress tracking for bulk operations
   - Real-time updates for long-running operations

3. **CSV Import Support** (from BULK_STAFF_CREATION_API.md)
   - Add CSV import for bulk staff creation
   - Add CSV import for bulk student creation
   - CSV validation and error reporting

4. **Password Complexity Configuration** (from BULK_STAFF_CREATION_API.md)
   - Configurable password rules per college
   - Password policy management

5. **Email Template Customization** (from BULK_STAFF_CREATION_API.md)
   - Per-college email template customization
   - Template management UI/API

6. **Bulk Operations** (from BULK_STAFF_CREATION_API.md)
   - Bulk staff deletion endpoint
   - Bulk staff update endpoint
   - Bulk student update endpoint

7. **Account Management** (from BULK_STAFF_CREATION_API.md)
   - Staff account activation/deactivation
   - Student account activation/deactivation
   - Account status management

8. **Role-Based Permissions** (from BULK_STAFF_CREATION_API.md)
   - Fine-grained role-based permissions for staff
   - Permission management system

9. **Department Service Migration**
   - Move `add-department` endpoint to dedicated department service
   - Note: Currently in auth-service with comment "later this will shift another service"

10. **Course Service Migration**
    - Move `add-course`, `add-batch`, `add-section` to Course Service
    - Currently in auth-service

### Notification Service Enhancements

1. **Multi-Channel Support**
   - SMS notifications
   - Push notifications
   - In-app notifications

2. **Notification Preferences**
   - User notification preferences
   - Per-channel opt-in/opt-out

3. **Notification History**
   - Store notification history
   - Notification status tracking

4. **Template Management**
   - Dynamic template loading
   - Template versioning

### Infrastructure Service Enhancements

1. **Kafka Topic Management**
   - Dynamic topic creation
   - Topic configuration management
   - Topic monitoring

2. **Service Discovery**
   - Service registration
   - Health check aggregation
   - Service mesh integration

---

## 🔐 Security Enhancements

1. **Rate Limiting**
   - Implement rate limiting for all endpoints
   - Per-user rate limits
   - Per-IP rate limits

2. **API Key Management**
   - API key generation and rotation
   - Key usage tracking

3. **Audit Logging**
   - Comprehensive audit logs
   - Security event tracking
   - Compliance reporting

4. **Vault Production Setup**
   - Move from dev mode to production mode
   - Proper unsealing mechanism
   - Token rotation policies

5. **SSL/TLS Certificates**
   - Production SSL certificates
   - Certificate rotation
   - Currently using placeholder SSL config

---

## 📝 Documentation Gaps

1. **API Documentation**
   - Complete OpenAPI specs for all services
   - Missing service documentation:
     - User Service API
     - Course Service API
     - Assignment Service API
     - Submission Service API
     - Chat Service API
     - Admin Service API

2. **Architecture Documentation**
   - Detailed architecture diagrams
   - Service interaction diagrams
   - Data flow diagrams
   - Deployment architecture

3. **Development Guides**
   - Service development guide
   - Testing guide
   - Deployment guide
   - Contributing guide

4. **Runbooks**
   - Incident response runbooks
   - Troubleshooting guides
   - Performance tuning guides

---

## 🧪 Testing

1. **Unit Tests**
   - Missing unit tests for most services
   - Need test coverage for:
     - Auth service controllers
     - Notification handlers
     - Utility functions

2. **Integration Tests**
   - Service-to-service integration tests
   - Database integration tests
   - Kafka integration tests

3. **E2E Tests**
   - End-to-end test suite
   - User journey tests
   - API contract tests

4. **Load Testing**
   - Performance benchmarks
   - Load testing scenarios
   - Stress testing

---

## 🚀 Deployment & DevOps

1. **CI/CD Pipeline**
   - GitHub Actions / GitLab CI
   - Automated testing
   - Automated deployment
   - Docker image building

2. **Kubernetes Manifests**
   - K8s deployment files
   - Service definitions
   - Ingress configurations
   - ConfigMaps and Secrets

3. **Terraform / CloudFormation**
   - Infrastructure as Code
   - AWS resource definitions
   - Environment management

4. **Monitoring & Alerting**
   - Alert rules for Prometheus
   - PagerDuty / Opsgenie integration
   - On-call rotation setup

---

## 📊 Analytics & Reporting

1. **Analytics Service** (Mentioned in Architecture)
   - Status: Not implemented
   - Purpose: Consume Kafka events for analytics
   - Features:
     - User activity analytics
     - Course engagement metrics
     - Assignment submission analytics
     - System usage reports

2. **Reporting Service**
   - Generate reports
   - Export functionality
   - Scheduled reports

---

## 🔄 Data Migration & Backup

1. **Database Migrations**
   - Migration scripts
   - Rollback procedures
   - Data validation

2. **Backup Strategy**
   - Automated backups
   - Backup verification
   - Disaster recovery plan

3. **Data Archival**
   - Old data archival
   - Compliance data retention

---

## 🎯 Priority Summary

### **P0 - Critical (Must Have)**
1. User Service implementation
2. Course & Section Service (migrate from auth-service)
3. Assignment Service
4. Submission Service
5. Basic observability (Prometheus + Grafana)

### **P1 - High Priority (Should Have)**
1. Search Service with Elasticsearch
2. Chat Service
3. Admin Service
4. Complete observability stack
5. S3 integration for file storage

### **P2 - Medium Priority (Nice to Have)**
1. Notes Service
2. BFF Service
3. Analytics & Reporting Service
4. AWS infrastructure migration
5. Advanced features (CSV import, WebSocket progress, etc.)

### **P3 - Low Priority (Future)**
1. Multi-channel notifications
2. Advanced analytics
3. Machine learning features
4. Mobile app APIs

---

## 📌 Notes

- **Current State**: 3 services implemented (auth, notification, infrastructure)
- **Architecture Target**: 10+ microservices
- **Observability**: 0% implemented
- **AWS Migration**: 0% (all local Docker Compose)
- **Testing**: Minimal test coverage

---

**Next Steps**: Prioritize based on business requirements and start with P0 items.

