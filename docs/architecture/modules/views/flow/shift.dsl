dynamic reactApp "ManajemenShift" {
    title "[Flow] - Manajemen Shift"
    autoLayout

    kasir -> shiftPage "1. Buka halaman shift"
    kasir -> openShiftModal "2. Buka shift baru"
    openShiftModal -> openShift "3. Input modal awal"
    openShift -> shiftOpen "4. IPC: shift:open"
    shiftOpen -> shiftService "5. Insert shift"
    shiftService -> shiftRepo "6. Query insert"
    kasir -> shiftPage "7. Cek status shift"
    shiftPage -> shiftSummary "8. Status shift aktif"
    shiftSummary -> loadCurrentShift "9. Cek shift aktif"
    loadCurrentShift -> shiftCurrent "10. IPC: shift:current"
    kasir -> closeShiftModal "11. Tutup shift"
    closeShiftModal -> closeShift "12. Hitung & tutup"
    closeShift -> shiftClose "13. IPC: shift:close"
    shiftClose -> shiftService "14. Update shift"
    shiftService -> shiftRepo "15. Query update"
}
