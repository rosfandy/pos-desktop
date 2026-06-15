// ── Relationships: Context ──────────────────
!include relationship/system_context.dsl

// ── Relationships: Container ────────────────
!include relationship/container.dsl

// ── Relationships: [core-setup] ──
!include relationship/core_setup.dsl

// ── Relationships: [pos-terminal] ──
!include relationship/pos_terminal.dsl

// ── Relationships: [product-management] ──
!include relationship/product_management.dsl

// ── Relationships: [inventory] ──
!include relationship/inventory.dsl

// ── Relationships: [customer-crm] ──
!include relationship/customer_crm.dsl

// ── Relationships: [reports-analytics] ──
!include relationship/reports_analytics.dsl

// ── Relationships: [shift-management] ──
!include relationship/shift_management.dsl

// ── Store → API routes ──
!include relationship/store_api.dsl

// ── API → Function return (IPC response back to renderer) ──
!include relationship/api_return.dsl

// ── Handler → Service (data layer entry) ──
!include relationship/handler_service.dsl

// ── Service → Repo ──
!include relationship/service_repo.dsl

// ── Repo → Handler return paths ──
!include relationship/repo_return.dsl

// ── FE API → FE Component return paths ──
!include relationship/fe_component.dsl

// ── Internal component links (for dynamic views) ──
!include relationship/internal_links.dsl

// ── Main process ke hardware (for dynamic views) ──
!include relationship/hardware.dsl

// ── [electronMain internal] relationships ──
!include relationship/electron_internal.dsl

// ── Repo → Table ──
!include relationship/repo_table.dsl

// ── Handler → ipcHandlers (route registration) ──
!include relationship/handler_route.dsl