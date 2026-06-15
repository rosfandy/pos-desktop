dynamic reactApp "AutentikasiPengaturan" {
    title "[Flow] - Autentikasi & Pengaturan"
    autoLayout

    kasir -> loginPage "1. Buka aplikasi"
    loginPage -> validatePin "2. Input PIN 6 digit"
    validatePin -> authStore "3. Validasi PIN"
    validatePin -> authLogin "4. IPC: auth:login"
    authLogin -> authService "5. verifyPin"
    authService -> authRepo "6. Query user by PIN"
    authRepo -> authLogin "7. Return user"
    authStore -> posPage "8. Redirect ke POS"
    admin -> settingsPage "9. Konfigurasi aplikasi"
    settingsPage -> settingsStore "10. Baca/tulis setting"
    settingsStore -> settingsWrite "11. IPC: settings:*"
}
