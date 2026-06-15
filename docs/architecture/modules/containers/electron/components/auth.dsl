group "[IPC] auth" {
    authLogin = component "auth:login" "electron/ipc/auth/route.ts" "Validasi PIN login"
    authLogout = component "auth:logout" "electron/ipc/auth/route.ts" "Hapus session"
    authCheckSession = component "auth:checkSession" "electron/ipc/auth/route.ts" "Cek masa berlaku session"
    authService = component "authService" "electron/ipc/auth/service.ts" "verifyPin, createSession, checkSession"
    authRepo = component "authRepo" "electron/ipc/auth/repo.ts" "queryUserByPin, manageSession"
}
