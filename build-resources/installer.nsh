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
