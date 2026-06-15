group "[IPC] shift" {
    shiftOpen = component "shift:open" "electron/ipc/shift/route.ts" "Buka shift"
    shiftClose = component "shift:close" "electron/ipc/shift/route.ts" "Tutup shift + rekap"
    shiftCurrent = component "shift:current" "electron/ipc/shift/route.ts" "Ambil shift aktif"
    shiftService = component "shiftService" "electron/ipc/shift/service.ts" "openShift, closeShift, currentShift"
    shiftRepo = component "shiftRepo" "electron/ipc/shift/repo.ts" "insertShift, updateShift, queryCurrent"
}
