workspace "POS Desktop" "Aplikasi kasir offline-first untuk UMKM/retail - Electron + React + TypeScript + SQLite" {

    description """
        POS Desktop adalah aplikasi kasir desktop untuk UMKM/retail dengan arsitektur offline-first.
        Teknologi: Electron 28, React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand, better-sqlite3.
        Mendukung thermal printer ESC/POS, barcode scanner USB/HID, dan cash drawer.
        Modul: Core, POS Terminal, Product Management, Inventory, Customer CRM,
        Reports & Analytics, Shift Management.
    """

    model {
        !include modules/actors.dsl
        
        posApp = softwareSystem "POS Desktop" "" {
            !include modules/container.dsl
        }

        !include modules/relationship.dsl

        // ── Deployment ──────────────────────────────
        deploymentEnvironment "Production" {

            pc = deploymentNode "PC Kasir" "Windows 10/11" {

                windows = deploymentNode "Windows OS" "x64" {
                    posDesktop = deploymentNode "POS Desktop" "electron-builder" {
                        containerInstance electronMain
                        containerInstance reactApp
                    }
                }
            }

            !include modules/relationship/deployment.dsl
        }
    }

    views {
        !include modules/views.dsl
    }
}
