// ── C1-C2: System & Container ──
!include views/system.dsl

// ── C3: React Pages ──
!include views/react/login.dsl
!include views/react/settings.dsl
!include views/react/pos-terminal.dsl
!include views/react/payment.dsl
!include views/react/products.dsl
!include views/react/inventory.dsl
!include views/react/customers.dsl
!include views/react/reports.dsl
!include views/react/shift.dsl

// ── C3: Electron IPC ──
!include views/electron/auth.dsl
!include views/electron/pos.dsl
!include views/electron/product.dsl
!include views/electron/inventory.dsl
!include views/electron/customer.dsl
!include views/electron/report.dsl
!include views/electron/shift.dsl
!include views/electron/settings.dsl
!include views/electron/printer.dsl

// ── Dynamic Flows ──
!include views/flow/pos-terminal.dsl
!include views/flow/products.dsl
!include views/flow/inventory.dsl
!include views/flow/customers.dsl
!include views/flow/shift.dsl
!include views/flow/reports.dsl
!include views/flow/auth.dsl

// ── Deployment & Styles ──
!include views/deployment.dsl
!include views/styles.dsl
