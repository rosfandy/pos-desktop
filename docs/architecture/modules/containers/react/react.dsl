 reactApp = container "React App" "React 18, TypeScript" "UI renderer - contextIsolation" {
    tags "Container"

    !include components/login.dsl
    !include components/settings.dsl
    !include components/pos-terminal.dsl
    !include components/payment.dsl
    !include components/products.dsl
    !include components/inventory.dsl
    !include components/customers.dsl
    !include components/reports.dsl
    !include components/shift.dsl
}