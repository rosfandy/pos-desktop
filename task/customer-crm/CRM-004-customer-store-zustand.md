# [CRM-004] Customer Store (Zustand)

**Module**: Customer CRM
**Priority**: P0
**Complexity**: S
**Spec Reference**: customer-crm-spec.md Section 6

## Description
Zustand store untuk state pelanggan: customers, selectedCustomer, searchQuery, loading. Actions: fetchCustomers, searchCustomers, createCustomer, updateCustomer, selectCustomer, calculateDiscount.

## Acceptance Criteria
- [ ] `fetchCustomers` memuat data dari IPC
- [ ] `searchCustomers` melakukan search by name/phone
- [ ] CRUD actions memanggil IPC dan refresh state
- [ ] `calculateDiscount` mengkonversi poin ke rupiah
- [ ] Loading state untuk async actions

## Dependencies
- [CRM-002]
