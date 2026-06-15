group "[Page] Customers" {
    customersPage = component "CustomersPage" "pages/CustomersPage.tsx" "List, search, filter pelanggan"
    customerForm = component "CustomerForm" "components/CustomerForm.tsx" "Create/edit pelanggan"
    customerSearch = component "CustomerSearch" "components/CustomerSearch.tsx" "Cari customer by phone/name di POS"
    loyaltyCard = component "LoyaltyCard" "components/LoyaltyCard.tsx" "Display points & tier"
    transactionHistory = component "TransactionHistory" "components/TransactionHistory.tsx" "Riwayat transaksi per customer"
    searchCustomer = component "searchCustomer" "hooks/useCustomerSearch.ts" "Cari via telepon/nama"
    saveCustomer = component "saveCustomer" "api/customers.ts" "Create/update customer"
    calculatePoints = component "calculatePoints" "crm/loyalty.ts" "Hitung points & tier"
}
