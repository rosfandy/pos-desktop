group "Settings" {
    settingsPage = component "SettingsPage" "pages/SettingsPage.tsx" "Pengaturan printer, receipt template"
    settingsStore = component "settingsStore" "stores/settingsStore.ts" "State pengaturan aplikasi"
}

group "Auth Store" {
    authStore = component "authStore" "stores/authStore.ts" "State user, role, session"
}
