# Research & Design Decisions — WillDesign HR Platform

## Summary
- **Feature**: hr-platform
- **Discovery Scope**: New Feature (greenfield)
- **Key Findings**:
  - DynamoDB single-table design with 2 GSIs covers all 22+ access patterns within perpetual free tier (25GB)
  - Hexagonal Architecture (Ports & Adapters) with Handler → Service → Repository decouples all business logic from AWS vendor specifics
  - Slack Bolt.js AwsLambdaReceiver + SQS async pattern handles 3-second timeout; stay on Node.js 20 runtime (Node.js 24 has known compatibility issues)
  - Cognito Lite tier provides 10K MAU free perpetually — sufficient for 100+ users
  - AWS SES pricing changed mid-2025: new accounts get $200 credits instead of 62K/month free; still effectively free for this scale

## Research Log

### DynamoDB Single-Table Design for HR Data
- **Context**: Need to store 14+ entity types (employees, attendance events, leave requests, daily reports, flags, hours bank, salary history, audit logs, etc.) with complex cross-entity queries
- **Sources Consulted**: AWS official docs, Alex DeBrie's single-table design guide, AWS re:Invent DAT403 patterns, AWS blog on single-table vs multi-table (2025)
- **Findings**:
  - Single-table design reduces network round trips by co-locating related entities in the same partition
  - As of Nov 2025, DynamoDB supports multi-attribute composite keys in GSIs (up to 4 attributes each) — eliminates synthetic key concatenation
  - AWS employee portal example achieves 23 access patterns with just 3 GSIs
  - For 25 users with append-only audit logs, 25GB free tier is ample (estimated ~500MB/year at full usage)
  - DynamoDB Streams can trigger audit log processing for future LLM analysis
- **Implications**: Design uses PK/SK base table + GSI1 (reverse lookups: Slack ID, manager, status) + GSI2 (org-wide admin queries). All access patterns mapped — see design.md Data Models section.

### Slack Events API + Lambda + SQS Async Pattern
- **Context**: Slack requires HTTP 200 within 3 seconds; message-based attendance needs keyword parsing and state machine validation
- **Sources Consulted**: Slack official docs (events-api-using-aws-lambda tutorial), slack-bolt GitHub issues, community patterns
- **Findings**:
  - AwsLambdaReceiver is built into @slack/bolt — handles Slack signature verification and event routing
  - **Critical**: AwsLambdaReceiver is incompatible with Node.js 24 Lambda runtime (callback handlers deprecated) — must use Node.js 20 or 22
  - Recommended pattern: Lambda A (ack + SQS enqueue) → SQS → Lambda B (process + respond via Slack API)
  - `message_changed` event available for detecting edited messages (daily report versioning)
  - Ephemeral messages via `chat.postEphemeral` for help/guidebook (visible only to requesting user)
- **Implications**: Use Node.js 20 runtime. Slack package receives event, validates, enqueues to SQS. Separate processor Lambda handles business logic. This also decouples — processor can be tested without Slack.

### AWS Cognito Authentication
- **Context**: Need user authentication for web app with JWT tokens for API Gateway authorization
- **Sources Consulted**: AWS Cognito pricing page (2026), CDK CognitoUserPoolsAuthorizer docs, aws-samples GitHub repos
- **Findings**:
  - Cognito Lite tier: 10K MAU free **perpetually** (not 12-month limited)
  - CognitoUserPoolsAuthorizer CDK construct integrates directly with API Gateway REST API
  - Hosted UI available on Lite tier for login/signup flows
  - User pool can store custom attributes (employee_id, role, preferred_language)
  - JWT tokens include custom claims — usable for RBAC in Lambda handlers
- **Implications**: Use Cognito Lite with custom attributes. Map Cognito user to employee record via employee_id custom attribute. JWT claims carry role for fast RBAC checks without DB lookup.

### AWS SES Email for Salary Statements
- **Context**: Need to send salary statement emails to employees (REQ-PAY-012, REQ-PAY-013)
- **Sources Consulted**: AWS SES pricing 2026, SES free tier changes (July 2025)
- **Findings**:
  - Accounts created after July 15, 2025: $200 AWS credits (applied across services) instead of dedicated SES free tier
  - Accounts created before July 15, 2025: 3,000 messages/month free for first 12 months
  - After free tier: $0.10 per 1,000 emails — effectively $0 for 25 employees
  - SES requires domain verification and sandbox exit for production sending
  - Lambda free tier (1M requests/month) covers the trigger function
- **Implications**: SES is cost-effective at any scale for this project. Schedule salary emails via EventBridge → Lambda → SES. Template emails with HTML for salary breakdown.

### Hexagonal Architecture for Vendor Independence
- **Context**: User requirement to avoid vendor lock-in, use handler/service/repository pattern, ensure every component is easily changeable
- **Sources Consulted**: Hexagonal Architecture (Alistair Cockburn), Clean Architecture patterns, AWS Lambda best practices
- **Findings**:
  - Ports & Adapters pattern: core defines interfaces (ports), infrastructure provides implementations (adapters)
  - `packages/core` contains service classes + repository interfaces — zero AWS imports
  - `packages/api` contains DynamoDB repository implementations + Lambda handlers
  - Services depend only on repository interfaces — unit testable with in-memory mocks
  - Swapping DynamoDB to Postgres/MongoDB = implement new repository adapters, no service changes
  - Policy engine already designed as pure function — naturally fits this pattern
- **Implications**: Repository interfaces in `core/repositories/`. DynamoDB adapters in `api/repositories/`. Services injected with repository instances at handler level (composition root). This also enables TDD — test services with mock repositories before DynamoDB exists.

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Hexagonal (Ports & Adapters) | Core defines interfaces, infra provides implementations | Zero vendor lock-in in core, fully testable, swappable adapters | Slightly more boilerplate (interfaces + implementations) | **Selected** — aligns with user requirement for decoupling |
| Layered (traditional MVC) | Controllers → Services → DAOs with direct imports | Simple, familiar | Tight coupling to data layer, harder to swap DB | Rejected — vendor lock-in concern |
| Clean Architecture | Entities → Use Cases → Interface Adapters → Frameworks | Maximum separation, dependency rule enforced | Over-engineered for 25-user single-tenant app | Too complex for scope |
| Event-Driven (CQRS) | Separate read/write models with event sourcing | Great for audit trails, temporal queries | Significant complexity, eventual consistency | Append-only audit log captures the benefit without full CQRS |

## Design Decisions

### Decision: DynamoDB Single-Table Over RDS Postgres
- **Context**: Need persistent storage for 14+ entity types with complex access patterns
- **Alternatives Considered**:
  1. RDS Postgres free tier — relational, flexible queries, SQL familiarity
  2. DynamoDB single-table — NoSQL, access-pattern-driven, perpetual free tier
  3. MongoDB Atlas M0 — document store, flexible schema, 512MB free
- **Selected Approach**: DynamoDB single-table with 2 GSIs
- **Rationale**: 25GB perpetual free tier (RDS free tier expires after 12 months), zero connection management with Lambda (HTTP-based), native CDK integration, DynamoDB Streams for audit processing. Behind repository interfaces, so migration to Postgres is possible.
- **Trade-offs**: Requires upfront access pattern design; less flexible ad-hoc queries; no JOIN operations. Mitigated by comprehensive access pattern mapping (22+ patterns) and denormalization strategy.
- **Follow-up**: Validate all access patterns work with designed key schema during implementation.

### Decision: Slack Bolt.js with Dual-Lambda Pattern
- **Context**: Slack 3-second timeout requires async processing; need message-based (not slash command) attendance
- **Alternatives Considered**:
  1. Raw Slack Events API with manual signature verification
  2. Slack Bolt.js AwsLambdaReceiver (single Lambda)
  3. Bolt.js for ack + SQS + separate processor Lambda
- **Selected Approach**: Option 3 — Bolt.js ack Lambda + SQS + processor Lambda
- **Rationale**: Bolt.js handles signature verification and event parsing. SQS decouples ack from processing. Processor Lambda contains all business logic and can be tested independently. Stays within 200ms ack requirement.
- **Trade-offs**: Two Lambdas instead of one; SQS adds ~$0 cost at this scale. Benefit: reliability and testability.
- **Follow-up**: Test ack latency under cold start conditions. Consider provisioned concurrency if >200ms.

### Decision: Static Policy Files with Repository Abstraction
- **Context**: Policy engine needs 3-level cascade (company → group → employee) with future migration to DB
- **Alternatives Considered**:
  1. Store policies directly in DynamoDB from day one
  2. Static JSON files with direct file system reads
  3. Static JSON files behind PolicyRepository interface
- **Selected Approach**: Option 3 — JSON files behind repository interface
- **Rationale**: Requirements explicitly state "static JSON files initially, swappable to DB later" (REQ-POL-002, REQ-POL-004). Repository interface in core, file-system adapter for v1, DynamoDB adapter for v2. Policy resolver remains a pure function regardless of data source.
- **Trade-offs**: JSON files require deployment to update policies (no runtime editing in v1). Web policy builder UI (REQ-WEB-006) writes to JSON files via API in v1, or directly to DB in v2.
- **Follow-up**: Design JSON file structure for policy builder writes. Consider S3 for policy storage if Lambda filesystem is too restrictive.

### Decision: RBAC + ABAC Permission Engine in Core
- **Context**: Need role-based access (Employee, Manager, HR Manager, Admin, Super Admin) plus attribute-based rules (reporting chain, ownership, sensitivity)
- **Selected Approach**: Permission engine as pure functions in `packages/core/permissions/`. RBAC checks role hierarchy. ABAC evaluates attributes (manager_id chain, resource ownership). Combined in `authorize(actor, action, resource): boolean`.
- **Rationale**: Permissions are business logic — belong in core with zero AWS deps. API middleware calls permission engine. Roles stored in DynamoDB via repository. Custom roles (REQ-PERM-007) stored as configurable permission sets.
- **Trade-offs**: Attribute resolution may require DB lookups (e.g., fetching reporting chain). Services pre-fetch needed context before calling authorize.

## Risks & Mitigations
- **DynamoDB query flexibility** — Complex reports may need table scans for ad-hoc queries → Mitigate with well-designed GSIs and denormalized monthly summaries
- **Slack Bolt Node.js 24 incompatibility** — AwsLambdaReceiver broken on Node 24 → Pin to Node.js 20 runtime; monitor bolt-js GitHub for fix
- **SES sandbox limits** — New SES accounts start in sandbox (only verified emails) → Request production access during initial deployment
- **Cold start latency** — Lambda cold starts may exceed 200ms Slack ack → Monitor; use provisioned concurrency on ack Lambda if needed
- **Policy file writes from web UI** — Lambda /tmp is ephemeral, cannot write persistent policy files → Store policy JSONs in S3 bucket, PolicyRepository reads from S3

## References
- [DynamoDB Single-Table Design (Alex DeBrie)](https://www.alexdebrie.com/posts/dynamodb-single-table/) — Canonical guide for single-table patterns
- [AWS: Creating Single-Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/) — Official AWS patterns
- [Slack Events API + Lambda Tutorial](https://docs.slack.dev/tools/bolt-js/deployments/aws-lambda/) — Official Bolt.js Lambda deployment
- [Slack Bolt.js Node 24 Issue #2761](https://github.com/slackapi/bolt-js/issues/2761) — AwsLambdaReceiver callback deprecation
- [AWS Cognito Pricing](https://aws.amazon.com/cognito/pricing/) — Lite tier 10K MAU free perpetually
- [AWS SES Pricing 2026](https://aws.amazon.com/ses/pricing/) — $0.10/1000 emails after free tier
- [AWS CDK Cognito + API Gateway Example](https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/cognito-api-lambda/index.ts) — Reference implementation
