group "[IPC] settings" {
    settingsRead = component "settings:read" "electron/ipc/settings/route.ts" "Baca setting"
    settingsWrite = component "settings:write" "electron/ipc/settings/route.ts" "Tulis setting"
}
