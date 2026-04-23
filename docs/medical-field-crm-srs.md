# Medical Field CRM & Automation App
## Software Requirements Specification (SRS)

Version: 1.0  
Date: 2026-04-23  
Audience: Product Owner, Engineering Team, QA, UI/UX, DevOps

---

## 1. Purpose
Build a responsive medical field-sales CRM and automation platform for desktop and mobile browsers. The system should help sales teams manage hospitals/contacts, record visits, track follow-ups, send quotations and campaigns, and generate recommendations from order/engagement history.

## 2. Scope
### In Scope
- Hospital and contact master management
- Excel/CSV import with mapping and duplicate checks
- Visit notes and activity timeline
- Follow-up/task tracking and reminders
- Faculty-wise segmentation and communication logic
- Quotation creation, PDF generation, and sharing
- Product master and order management
- Campaign automation (email/WhatsApp-ready architecture)
- Dashboard, reports, and audit logs
- Mobile-responsive UX

### Out of Scope (MVP)
- Full geofence background tracking
- Advanced ML-based AI engine (rule engine first)
- Hardcoded scraping integrations

## 3. Stakeholders & User Roles
### 3.1 Admin
- Full access
- Master data management
- Templates, settings, campaigns, user permissions
- Reports and analytics

### 3.2 Sales / Field User
- Hospital list and details
- Visit note creation
- Follow-up updates
- Quotation requests/creation
- Nearby hospitals view

### 3.3 Manager (Optional)
- Team activity and pipeline monitoring
- Pending follow-ups and conversion oversight
- Recommendation review

## 4. Functional Requirements by Module

### Module A: Authentication & User Management
- Login, logout, forgot password
- Role-based access (Admin, Sales, Manager)
- User status (active/inactive)
- Password hashing and secure session/JWT handling

### Module B: Hospital Master / CRM
- CRUD/Archive hospitals
- Multiple contacts per hospital
- Search: hospital/doctor name, city, area, phone, email
- Filters: faculty, status, city, source, assigned user
- Hospital detail page with linked activities (notes, quotations, campaigns, orders)

#### Hospital Fields (minimum)
- Hospital ID, name, type, address metadata
- Geo fields: latitude, longitude, map link
- Contact fields: phone, alt phone, email, website
- Source type: excel/manual/google/external_connector
- Status: hot/warm/cold/active/inactive
- Faculties (multi-select), assigned sales user, remarks, timestamps

#### Contact Fields (minimum)
- Contact ID, hospital ID, name, designation, department
- Mobile, WhatsApp, email, preferred contact mode
- Faculty relevance, notes

### Module C: Excel Import / Data Sync
- File upload: .xlsx, .csv
- Auto column detection + mapping UI
- Preview before import
- Duplicate checks by hospital name+city, phone, email
- Choice: update existing vs create new
- Import logs + failed row reports
- Validation: ignore blank rows, flag invalid email/phone

### Module D: Visit Notes / Field Activity
- Create/edit visit notes
- Hospital-wise and faculty-wise timeline
- Salesperson activity reports
- Optional follow-up creation from visit
- Attachments and optional voice note

### Module E: Follow-up & Task Management
- Follow-up linked to hospital/contact/visit
- Modes: call, WhatsApp, email, visit
- Statuses: pending/done/missed/rescheduled
- Today/tomorrow/overdue dashboards
- Reminders and rescheduling

### Module F: Faculty Management
- Admin-defined faculties
- Multi-faculty support at hospital and contact levels
- Faculty-specific catalogues, templates, and suggested products

### Module G: Quotation Module
- Create quotations with line items
- Auto calculations (qty/rate/discount/GST/total)
- PDF generation with branding, terms, notes
- Send via email/WhatsApp-ready integration points
- Status tracking: draft/sent/approved/rejected/converted
- Duplicate quotation and convert to order

### Module H: Product Master
- Product CRUD
- Faculty tagging
- Related products mapping
- Searchable list

### Module I: Campaign & Communication Automation
- Single/bulk/scheduled communications
- Channels: email + WhatsApp integration-ready
- Faculty-wise template enforcement
- Delivery logs: scheduled/sent/failed/delivered/opened (if channel supports)
- Retry/resend for failed messages

### Module J: Template Management
- Manage WhatsApp, email, quotation templates
- Placeholder support:
  - `{{hospital_name}}`
  - `{{doctor_name}}`
  - `{{faculty}}`
  - `{{sales_person}}`
  - `{{quotation_number}}`
- Preview before send

### Module K: Maps & Nearby Hospitals
- Current location detection (foreground)
- Map pins and nearby hospital list
- Configurable radius (500m/1km/2km/5km)
- Distance and route links
- Quick visit-note action from nearby list
- Architecture future-ready for geofencing alerts

### Module L: External Data Enrichment Architecture
- Source-tagged records for future connectors
- Modular connector architecture
- No scraping-specific hardcoded coupling

### Module M: Orders Module
- Manual order entry
- Convert from quotation
- Status flow: new/confirmed/dispatched/delivered/cancelled
- History by hospital and by faculty
- Repeat-order analysis support

### Module N: Recommendation Engine (Phase 1 Rule Engine)
- Trigger sources: order, visit note, faculty activity, campaign history
- Output: suggested products, confidence score, reason, status
- Example rules:
  - Synthetic Casting Tape → suggest Cast Padding
  - Silicone Gel Sheet → suggest Scar Tape
  - Active ortho faculty → suggest ortho follow-up bundle

### Module O: Dashboard & Analytics
- KPI widgets: total hospitals, pending follow-ups, recent visits, quotations, orders, top faculties, hot leads, recommendation cards
- Reports: salesperson activity, faculty engagement, quotation conversion, campaign performance, hospital status summary

### Module P: Notifications
- In-app reminders for follow-ups, campaigns, quotation sent confirmation, overdue tasks
- Email optional in MVP
- Push architecture future-ready

## 5. Screen Inventory
- Login
- Dashboard
- Hospital list
- Hospital detail
- Add/Edit hospital
- Contact list (within hospital)
- Visit notes list + add/edit
- Follow-up list
- Quotation list + create + preview
- Product master
- Campaign management
- Template management
- Nearby hospitals map/list
- Orders
- Reports
- User management
- Settings

## 6. Key End-to-End Flows
1. **Excel to CRM**: Upload → map → validate/duplicate check → import → searchable records
2. **Hospital Visit**: Open hospital → add visit note → optional follow-up → timeline update
3. **Quotation**: Open hospital → select faculty → add products → generate PDF → send/log
4. **Campaign**: Choose faculty + audience + template + schedule → execute → log result
5. **Nearby Visit**: Detect location → list nearby hospitals → open hospital → add visit
6. **Order to Recommendation**: Save order → rule trigger → recommendation cards update

## 7. Data Model (Minimum Tables)
- users
- roles
- hospitals
- hospital_contacts
- faculties
- hospital_faculties
- products
- visit_notes
- follow_ups
- quotations
- quotation_items
- orders
- order_items
- communication_templates
- campaigns
- campaign_logs
- uploaded_files
- import_jobs
- import_job_rows
- recommendations
- audit_logs
- settings

## 8. Business Rules
- **Hospital status**: hot/warm/cold based on recency and engagement depth
- **Import duplicates**: hospital name+city, phone, email
- **Faculty communication guardrail**: enforce matching faculty template + catalogue
- **Visit save hook**: optionally create follow-up and quotation draft
- **Order save hook**: trigger recommendation generation

## 9. Non-Functional Requirements
- Responsive on desktop/mobile browser
- Fast, simple UI for non-technical field users
- Secure auth and API protection
- Robust input/file validation
- Audit trail for critical actions
- Modular architecture for future integrations

## 10. Security & Compliance Requirements
- Password hashing (e.g., bcrypt/argon2)
- Role-based authorization checks per API/screen
- File type/size validation for uploads
- Rate limiting and request validation
- Audit events for:
  - hospital create/update
  - quotation create/send
  - campaign schedule/send
  - user login
  - order create
  - template update

## 11. API Groups (Minimum)
- Auth APIs
- Hospital APIs
- Contact APIs
- Visit APIs
- Follow-up APIs
- Quotation APIs
- Order APIs
- Template APIs
- Campaign APIs
- Map/Nearby APIs
- Recommendation APIs
- Dashboard APIs
- Import APIs

## 12. Recommended Technical Architecture
- **Frontend**: React or Next.js (responsive-first UI)
- **Backend**: Node.js + NestJS/Express
- **Database**: PostgreSQL (preferred) or MySQL
- **Storage**: S3-compatible object storage
- **Auth**: JWT with refresh tokens or secure session strategy
- **Notifications**: in-app first, push-ready architecture
- **Maps**: Google Maps API integration
- **Email**: SMTP / SendGrid / SES abstraction
- **WhatsApp**: official integration-ready adapter pattern
- **PDF**: server-side quotation renderer

## 13. Delivery Roadmap
### Phase 1 (MVP)
- Auth, dashboard, hospital/contact master
- Excel import, visit notes, follow-ups
- Faculty tagging, quotations + PDF
- Basic templates/campaign foundation
- Basic orders
- Responsive mobile support

### Phase 2
- Maps + nearby hospital module
- Communication history + scheduled campaigns
- Delivery status logs
- Enhanced analytics/reports

### Phase 3
- Background nearby alerts/geofence
- Advanced recommendation intelligence
- External connector framework
- Manager-level deep analytics

## 14. Acceptance Criteria (MVP)
- User can import hospitals from Excel/CSV with duplicate handling
- Sales user can add visit notes and set follow-ups from hospital detail
- Admin can configure faculties and templates
- User can generate and download quotation PDF with correct totals
- Order entry is possible and generates rule-based suggestions
- Dashboard displays core KPI widgets
- App is usable on modern desktop and mobile browsers

## 15. Open Decisions / Clarifications Needed
1. Preferred deployment cloud and region
2. Final WhatsApp provider and compliance workflow
3. Quotation numbering format and tax jurisdiction rules
4. SLA for reminders/campaign dispatch
5. Data retention and backup policy
