group "[Page] Shift" {
    shiftPage = component "ShiftPage" "pages/ShiftPage.tsx" "Manajemen shift kasir"
    openShiftModal = component "OpenShiftModal" "components/OpenShiftModal.tsx" "Buka shift + input modal awal"
    closeShiftModal = component "CloseShiftModal" "components/CloseShiftModal.tsx" "Tutup shift + rekap"
    shiftSummary = component "ShiftSummary" "components/ShiftSummary.tsx" "Status shift saat ini di header"
    openShift = component "openShift" "api/shift.ts" "Buka shift + modal awal"
    closeShift = component "closeShift" "api/shift.ts" "Tutup shift + rekap"
    calcDiscrepancy = component "calcDiscrepancy" "shift/calculator.ts" "Hitung selisih kas"
    loadCurrentShift = component "loadCurrentShift" "api/shift.ts" "Query status shift saat ini"
}
