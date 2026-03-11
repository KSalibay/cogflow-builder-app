## Plan: CogFlow Self-Hosted Platform Migration

Migrate Builder + Interpreter from JATOS/Token-Store dependence to a Kubernetes-first Django+PostgreSQL platform with strict compliance controls, while keeping JATOS as an operational fallback during transition. Build a separate monorepo (`cogflow-platform`) that contains backend services, integrated Builder/Interpreter frontends, asset storage pipeline, and a basic researcher portal in MVP. The Builder publish flow will be automated so new compiled studies are auto-registered and immediately visible on the researcher dashboard without token copy/paste.

**Steps**
1. Phase 0 - Architecture baseline and contracts
1.1 Define target system boundaries and API contracts for `Config API`, `Asset API`, `Result Ingest API`, `Auth API`, and `Study/Run API`.
1.2 Freeze a compatibility contract for existing Builder export JSON and Interpreter runtime inputs to prevent regressions.
1.3 Define deployment profiles for Kubernetes environments (`dev`, `staging`, `prod`) including secrets, TLS, backups, and observability.
1.4 Produce ADRs for storage model (PostgreSQL + object storage), token strategy (JWT + refresh), and JATOS fallback behavior.

2. Phase 1 - Create separate platform codebase (blocks Phases 2-5)
2.1 Create new repository `cogflow-platform` with top-level apps: `backend/`, `frontend/builder/`, `frontend/interpreter/`, `frontend/portal/`, `infra/`, `docs/`.
2.2 Import Builder and Interpreter as baseline modules into `frontend/builder` and `frontend/interpreter` with no behavior changes initially.
2.3 Add shared frontend SDK package (or folder) for API client + runtime backend abstraction used by both apps.
2.4 Establish CI pipelines for lint/test/build, container image build, and Kubernetes deploy to staging.

3. Phase 2 - Backend foundation (parallelizable by domain)
3.1 Implement Django project with domain apps: `users`, `organizations`, `studies`, `configs`, `assets`, `results`, `audit`, `retention`.
3.2 Implement PostgreSQL schema + migrations for users/roles, studies, config versions, result sessions/trials, asset metadata, audit events, retention policies.
3.3 Implement auth subsystem with Django auth + JWT issuance and refresh; keep SSO as extension point (decision gate).
3.4 Implement RBAC authorization middleware and tenant-scoped access rules (single-tenant now, multi-tenant-ready schema).
3.5 Implement compliance controls now: audit logging for sensitive actions, retention policy engine, encryption configuration (at-rest + in-transit), and deletion workflows.
3.6 Implement privacy-by-design data model: salted hashes for identifiers/search keys, field-level encryption for sensitive behavioral payloads, key management, and researcher-scoped decrypt access.
3.7 Implement object storage integration (S3-compatible strongly recommended for Kubernetes) with signed URLs and checksum validation.

4. Phase 3 - Decouple Builder from JATOS/Token Store (depends on 2)
4.1 Replace direct Token Store calls with `ConfigStoreAdapter` and `AssetStoreAdapter` interfaces in Builder.
4.2 Implement Django adapters for config create/update/retrieve and asset upload/rewrite.
4.3 Keep current JATOS component-properties bundle generation as a fallback output mode for transition.
4.4 Add new "Platform Publish" flow in Builder: publish config + assets to Django backend, auto-create/update study records, and return launch metadata (study/run links, IDs).
4.5 Add asynchronous publication orchestration: after successful compile/publish, emit a backend event/job that materializes the study card on the researcher dashboard immediately.
4.6 Keep SharePoint export path optional/legacy; do not expand feature scope during MVP.

5. Phase 4 - Decouple Interpreter runtime with dual backend mode (depends on 2)
5.1 Introduce `RuntimeBackend` abstraction in Interpreter for parameter resolution, result submission, and completion behavior.
5.2 Implement `JatosRuntimeBackend` (existing behavior) and `DjangoRuntimeBackend` (new default for platform runs).
5.3 Move JATOS-specific calls behind backend interface: parameter reads, file upload fallback, submitResultData, next-component/end-study.
5.4 Implement Django run lifecycle endpoints: start run, heartbeat, submit results, mark completion/failure.
5.5 Preserve local standalone mode for developer testing.

6. Phase 5 - Researcher portal MVP (depends on 2; parallel with late 3/4 UI work)
6.1 Build minimal portal auth and role-aware navigation.
6.2 Implement study management views: create study, assign configs, generate launch links/tokens, monitor run status.
6.3 Implement result browser and export actions (CSV/JSON) with filters.
6.4 Implement admin/compliance views for audit events, retention schedules, and data deletion requests.

7. Phase 6 - JATOS fallback and migration orchestration (depends on 3/4/5)
7.1 Add feature flags for runtime backend selection per study (`jatos`, `django`, `hybrid`).
7.2 Provide migration utility to import existing Builder outputs and map Token Store/JATOS metadata into platform records.
7.3 Support hybrid launches where needed: Django portal coordinates studies while Interpreter can still run under JATOS.
7.4 Define and run staged cutover playbook: pilot labs -> broader rollout -> optional JATOS deprecation milestone.

8. Phase 7 - Verification, hardening, and release readiness (continuous; final gate after 6)
8.1 Contract tests: Builder publish payloads and Interpreter result payload compatibility.
8.2 End-to-end tests: Builder publish -> Interpreter run -> results persisted -> portal visualization/export.
8.3 Security tests: authz matrix, token expiry/rotation, audit completeness, retention enforcement, delete workflow validation.
8.4 Performance tests: concurrent participant runs and result ingestion throughput for Kubernetes sizing.
8.5 Disaster recovery validation: PostgreSQL backups/restore drills and object storage recovery checks.

**Relevant files**
- `cogflow-builder-app/src/JsonBuilder.js` - primary export logic; extract storage adapters and publish flow.
- `cogflow-builder-app/src/modules/TimelineBuilder.js` - references export/config lookup paths that must remain compatible.
- `cogflow-builder-app/index.html` - standalone entry and deployment-level configuration knobs.
- `cogflow-builder-app/index_jatos.html` - transition fallback support and JATOS deployment parity.
- `cogflow-interpreter-app/src/main.js` - core JATOS coupling points (`getJatosApi`, parameter lookup, result upload/submit, completion).
- `cogflow-interpreter-app/src/configLoader.js` - config loading behavior to align with Django config endpoints.
- `cogflow-interpreter-app/index.html` - standalone/local runtime mode to preserve.
- `cogflow-interpreter-app/index_jatos.html` - retained for fallback runtime path.
- `cogflow-builder-app/token-store-worker/src/index.js` - reference behavior for replacement API parity and migration tooling.

**Verification**
1. Backend API contract validation against OpenAPI for configs/assets/results/auth/studies.
2. Integration test: publish from Builder to Django, retrieve in Interpreter, execute full trial, persist results.
3. Dual-mode regression test: same config executes in `JatosRuntimeBackend` and `DjangoRuntimeBackend` with equivalent result schema.
4. Portal test: researcher creates study, launches participant session, views results, exports dataset.
5. Compliance test pack: audit log generation for create/update/delete and result access; retention and deletion jobs execute as configured; researcher-only decrypt access is enforced and verified.
6. Kubernetes operational checks: health probes, autoscaling behavior, rolling deploy safety, backup/restore success.

**Decisions**
- Included scope:
  - Separate platform monorepo.
  - Kubernetes-first deployment.
  - Basic portal in MVP.
  - Automated Builder publish flow that auto-creates/updates study records and dashboard visibility (no token copy/paste for researchers).
  - Strict compliance controls in MVP (audit + retention + encryption strategy).
  - Privacy model using salted hashes for identifiers and encryption for sensitive result payloads with researcher-scoped decrypt access.
  - JATOS fallback retained during migration.
- Excluded scope (for later phases unless explicitly reprioritized):
  - Full multi-tenant commercialization model.
  - Real-time adaptive closed-loop runtime over WebSockets.
  - Deep third-party survey integrations (Qualtrics/REDCap) beyond ID/link placeholders.
  - Full SSO rollout unless selected at decision gate.
- Open decision gate:
  - Auth MVP choice is unresolved. Recommendation: start with Django auth + JWT in MVP, add OIDC/SSO in Phase 5.5 if required by pilot institutions.

**Further Considerations**
1. Migration window strategy recommendation:
Option A: 8-12 week hybrid period with mandatory dual-write checks.
Option B: Fast 4-6 week cutover with rollback runbooks.
2. Storage recommendation:
Option A: S3-compatible object storage (MinIO/S3) for Kubernetes portability.
Option B: PostgreSQL large objects (simpler infra, poorer scale).
3. Versioning recommendation:
Option A: Builder/Interpreter semantic version pairing with compatibility matrix in backend.
Option B: Strict lockstep release to reduce support burden early on.

## Week 1 Execution Checklist (Implementation Kickoff)

Goal: deliver one end-to-end vertical slice where a researcher can publish from Builder, see the study on dashboard, run Interpreter, and receive stored results.

### Day 1 - Repository + Runtime Bootstrap

Deliverables
- Create new `cogflow-platform` repo with folders: `backend/`, `frontend/builder/`, `frontend/interpreter/`, `frontend/portal/`, `infra/`, `docs/`.
- Add Docker Compose for local stack: Django API, PostgreSQL, MinIO, optional Redis.
- Add environment templates and secret placeholders.
- Add CI skeleton (lint + tests + container build).

Acceptance Criteria
- Local command starts all services successfully.
- Health endpoint returns success from Django.
- PostgreSQL and MinIO are reachable from Django container.

### Day 2 - Minimal Django Project + Data Model Skeleton

Deliverables
- Initialize Django project and apps: `studies`, `configs`, `runs`, `results`, `audit`, `users`.
- Add initial models:
  - `Study`
  - `ConfigVersion`
  - `RunSession`
  - `ResultEnvelope`
  - `AuditEvent`
- Create and apply first migrations.

Acceptance Criteria
- Admin can create a Study and ConfigVersion locally.
- Migration up/down works cleanly.
- AuditEvent writes are triggered for create/update actions.

### Day 3 - Contract-First APIs (MVP Set)

Deliverables
- Implement `POST /api/configs/publish` (Builder publish endpoint).
- Implement `POST /api/runs/start` (Interpreter start endpoint).
- Implement `POST /api/results/submit` (Interpreter completion endpoint).
- Add OpenAPI spec for these endpoints in `docs/API.md` or generated schema.

Acceptance Criteria
- Each endpoint has request/response validation.
- Happy-path integration test passes for all three endpoints.
- Publish endpoint auto-creates or updates study linkage record.

### Day 4 - Builder and Interpreter Integration Stubs

Deliverables
- In Builder, add `Platform Publish` transport stub calling `/api/configs/publish`.
- In Interpreter, add `DjangoRuntimeBackend` stub calling `/api/runs/start` and `/api/results/submit`.
- Keep existing JATOS path untouched behind feature flags.

Acceptance Criteria
- Builder can publish a config to local platform.
- Interpreter can start and submit one mock result payload.
- Existing JATOS flow still runs with no regression.

### Day 5 - Dashboard Visibility + Vertical Slice Demo

Deliverables
- In Portal, add minimal Studies list page showing newly published studies.
- Add run counter and last result timestamp per study.
- Wire backend read endpoint for studies list.

Acceptance Criteria
- A newly published Builder config appears on dashboard without manual token handling.
- Completing one Interpreter run updates dashboard metrics.
- Demo script can be executed start-to-finish by another team member.

### Day 6 - Privacy Baseline (Interim)

Deliverables
- Hash participant external identifier fields with salted hash.
- Encrypt sensitive result payload blob before persistence (interim implementation; final field-level schema deferred).
- Record all decrypt/read attempts in `AuditEvent`.

Acceptance Criteria
- Raw participant identifier is never stored in plaintext.
- Unauthorized role cannot decrypt payload.
- Authorized researcher decrypt action is logged with actor and timestamp.

### Day 7 - Stabilization + Go/No-Go Review

Deliverables
- Add smoke tests for publish -> run start -> result submit -> dashboard visibility.
- Add rollback checklist and incident notes template.
- Document known gaps for Week 2 (encryption schema hardening, RBAC expansion, SSO decision).

Acceptance Criteria
- Team runs one reproducible local demo with pass/fail checklist.
- Top 5 risks are documented with owner and mitigation.
- Week 2 backlog is prioritized and approved.

## Week 1 Definition of Done

1. End-to-end local vertical slice works without JATOS token copy/paste.
2. Dashboard auto-populates with newly published studies.
3. Interpreter results persist and are visible in portal summary.
4. Interim privacy controls are active (hashed IDs + encrypted payload + audited decrypt).
5. JATOS fallback path remains available via feature flag.

## Weeks 2-6 Delivery Plan (Deployable in 4-6 Weeks)

Target: produce a deployable Kubernetes release candidate between end of Week 4 (aggressive) and end of Week 6 (standard hardening).

### Week 2 - Contract Lock + Backend Reliability

Objectives
- Freeze API contracts for publish/start/submit and studies dashboard read APIs.
- Strengthen backend data model and add idempotency protections.
- Move from stubs to production-capable service boundaries.

Deliverables
- Versioned API schema (`v1`) with request/response examples.
- Idempotency keys on publish and submit endpoints.
- Retry-safe async job for dashboard study materialization.
- Base RBAC roles: `platform_admin`, `researcher`, `analyst`.
- Structured logging and correlation IDs across API calls.

Acceptance Criteria
- Repeated identical publish or submit calls do not create duplicates.
- API contract tests run in CI and pass.
- Role checks block unauthorized reads/writes.

### Week 3 - Security and Privacy Hardening (MVP Grade)

Objectives
- Implement practical encryption architecture in code (without overfitting final schema).
- Add compliance-critical audit and retention mechanics.

Deliverables
- Key hierarchy implemented (master key via secret manager + data encryption keys).
- Field-level encryption utility for sensitive result fields.
- Salted hash utility for participant linkage/search keys.
- Audit events for read/decrypt/download actions.
- Retention job skeleton with policy-driven expiration/deletion.

Acceptance Criteria
- Sensitive fields are unreadable in raw DB inspection.
- Authorized researcher can decrypt only permitted records.
- Unauthorized access/decrypt attempts are denied and audited.

### Week 4 - Kubernetes Staging Deploy (Aggressive Deployable Option)

Objectives
- Stand up a working staging deployment and validate end-to-end workflows.
- Reach first deployable milestone for pilot use.

Deliverables
- Helm chart or Kustomize manifests for API, worker, PostgreSQL, object storage integration.
- Ingress + TLS + secret injection configured.
- Staging environment with migration pipeline.
- Smoke and E2E test suite running against staging.
- Release candidate `v0.1.0-rc1`.

Acceptance Criteria (4-week deployable gate)
- Researcher can publish from Builder and see study on dashboard in staging.
- Interpreter can run and persist results in staging.
- Baseline privacy controls enabled in staging.
- Rollback procedure tested once.

If all gates pass, you have a deployable pilot option at end of Week 4.

### Week 5 - Operational Hardening (Standard Path)

Objectives
- Improve reliability, observability, and failure handling for real pilot load.

Deliverables
- Background worker queue reliability tuning (timeouts, retries, dead-letter handling).
- Metrics dashboards (API latency, job failures, DB health, storage errors).
- Alerting rules for critical incidents.
- Backup + restore runbook rehearsal for PostgreSQL and object storage metadata.
- Rate limiting and abuse protection on public endpoints.

Acceptance Criteria
- Failure injection tests demonstrate graceful degradation.
- Alerting triggers correctly for simulated outage/error thresholds.
- Restore drill completes within agreed RTO.

### Week 6 - Pilot Release Candidate (Hardened Deployable Option)

Objectives
- Finalize production-readiness checklist and execute controlled pilot rollout.

Deliverables
- Security review checklist completion (authz, key handling, audit coverage).
- Load test report with scaling recommendations.
- Pilot onboarding docs for researcher admins.
- Feature-flag strategy document (`django`, `jatos`, `hybrid`).
- Release candidate `v0.2.0-rc` with signed deployment artifacts.

Acceptance Criteria (6-week deployable gate)
- All critical/high defects closed or risk-accepted with mitigations.
- End-to-end pilot workflow validated by at least one non-dev stakeholder.
- Incident response and rollback playbooks approved.

If Week 6 gate passes, you have a hardened deployable option for broader pilot usage.

## 4-Week vs 6-Week Scope Split

### 4-Week Aggressive Scope (minimum deployable)
- End-to-end publish/run/submit/dashboard flow.
- Baseline encryption + hashing + audit events.
- Kubernetes staging deployment and rollback tested.
- Basic portal features only (study list, status, run counts).

### 6-Week Standard Scope (recommended)
- Everything in 4-week scope, plus:
- Operational observability and alerting maturity.
- Backup/restore drill validation.
- Stronger retention workflow execution.
- Pilot onboarding docs and release governance.

## Critical Path Dependencies

1. API contract freeze by end of Week 2.
2. Encryption utility integration complete by mid-Week 3.
3. Staging infra readiness by early Week 4.
4. E2E staging pass before any pilot launch.

## Weekly Exit Review Template

For each week, explicitly record:
1. What shipped (features and infra).
2. What passed (tests and acceptance gates).
3. What slipped (with owner and recovery plan).
4. Go/No-Go decision for next milestone.