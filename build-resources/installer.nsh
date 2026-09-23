; NSIS Installer Script — POS Kasir
; Paksa shortcut desktop & start menu pakai icon custom explicit,
; bukan ngandelin cache EXE icon Windows.

!macro customInstall
  ; Desktop shortcut
  Delete "$DESKTOP\POS Kasir.lnk"
  CreateShortCut "$DESKTOP\POS Kasir.lnk" "$INSTDIR\POS Kasir.exe" "" "$INSTDIR\resources\icon.ico" 0

  ; Start Menu shortcut
  CreateDirectory "$SMPROGRAMS\POS Kasir"
  Delete "$SMPROGRAMS\POS Kasir\POS Kasir.lnk"
  CreateShortCut "$SMPROGRAMS\POS Kasir\POS Kasir.lnk" "$INSTDIR\POS Kasir.exe" "" "$INSTDIR\resources\icon.ico" 0
!macroend

; Auto-close POS Kasir saat installer/update berjalan.
; Menggantikan logika default electron-builder yang memunculkan prompt
; "cannot be closed, please close manually and click retry".
!macro customCheckAppRunning
  DetailPrint "Menutup POS Kasir yang sedang berjalan..."
  ; Tutup graceful dulu (WM_CLOSE) supaya app sempat simpan data
  nsExec::Exec `taskkill /im "${APP_EXECUTABLE_FILENAME}"`
  Sleep 1000
  ; Force kill sisa proses yang masih hidup
  nsExec::Exec `taskkill /f /im "${APP_EXECUTABLE_FILENAME}"`
  Sleep 300
!macroend
