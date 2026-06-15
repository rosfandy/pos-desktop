group "[Page] Login" {
    loginPage = component "LoginPage" "pages/LoginPage.tsx" "Login form + PinPad PIN 6 digit"
    validatePin = component "validatePin" "auth/pin.ts" "Validasi PIN 6 digit hash"
    checkSession = component "checkSession" "auth/session.ts" "Cek session token expiry"
}
