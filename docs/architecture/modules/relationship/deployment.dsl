// ── Deployment relationships ──
electronMain -> printer "Cetak struk" "USB RAW"
electronMain -> laci "Buka laci" "USB"
scanner -> reactApp "Input barcode" "HID"
