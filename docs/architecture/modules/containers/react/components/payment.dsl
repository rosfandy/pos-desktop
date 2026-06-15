group "PaymentModal" {
    paymentModal = component "PaymentModal" "components/PaymentModal.tsx" "Bayar tunai, QRIS, debit"
    receiptPreview = component "ReceiptPreview" "components/ReceiptPreview.tsx" "Preview struk sebelum cetak"
    processPayment = component "processPayment" "pos/payment.ts" "Simpan transaksi + update stock"
    calculateChange = component "calculateChange" "pos/payment.ts" "Hitung kembalian"
    selectMethod = component "selectMethod" "components/PaymentMethodSelector.tsx" "Pilih tunai/QRIS/debit"
}
