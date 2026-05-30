# [CRM-002] Customer Repo + IPC: CRUD

**Module**: Customer CRM
**Priority**: P0
**Complexity**: M
**Spec Reference**: customer-crm-spec.md Section 4

## Description
Repo layer untuk CRUD pelanggan. IPC handlers: `customer:list`, `customer:get`, `customer:create`, `customer:update`, `customer:delete`, `customer:transactions`.

## Acceptance Criteria
- [ ] `customer:list` dengan filter by name/phone search
- [ ] `customer:create` dengan validasi phone unique
- [ ] `customer:update` mengubah data pelanggan
- [ ] `customer:delete` soft delete (set isActive false)
- [ ] Error CUST_001 jika phone duplikat
- [ ] Error CUST_003 jika customer not found

## Dependencies
- [CRM-001]
