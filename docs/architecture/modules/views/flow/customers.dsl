dynamic reactApp "CustomerCRM" {
    title "[Flow] - Customer & CRM"
    autoLayout

    admin -> customersPage "1. Buka halaman customer"
    admin -> customerForm "2. Tambah customer baru"
    customerForm -> saveCustomer "3. Simpan customer"
    saveCustomer -> customerCreate "4. IPC: customer:create"
    customerCreate -> customerService "5. Insert/update customer"
    customerService -> customerRepo "6. Query insert"
    kasir -> posPage "7. Transaksi POS"
    posPage -> customerSearch "8. Pilih customer"
    customerSearch -> searchCustomer "9. Cari customer"
    searchCustomer -> customerList "10. IPC: customer:search"
    customerList -> customerService "11. Query customers"
    posPage -> paymentModal "12. Proses bayar"
    paymentModal -> processPayment "13. Bayar + poin"
    pemilik -> customersPage "14. Lihat data customer"
    customersPage -> transactionHistory "15. Riwayat transaksi"
}
