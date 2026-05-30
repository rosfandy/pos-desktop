---
name: manual-test
description: Use when creating and executing manual test scenarios for POS Desktop features.
---

# Manual Test

Create and execute manual test scenarios to verify POS Desktop features.

## Process

1. Read acceptance criteria from PRD or spec
2. Create test scenarios with clear steps
3. Execute tests and record results
4. Report bugs with reproduction steps

## Test Scenario Format

```markdown
# Test Plan: [Module Name]

## Test Environment
- OS: Windows 10/11
- App Version: X.X.X
- Database: Fresh / With test data

## Scenarios

### TC-001: [Scenario Name]
**Priority**: High
**Precondition**: User logged in as kasir

**Steps**:
1. Navigate to POS terminal
2. Search for "Nasi Goreng"
3. Click product to add to cart
4. Verify cart shows "Nasi Goreng x1 @Rp 30,000"
5. Click "Bayar Tunai"
6. Enter Rp 50,000
7. Verify change shows Rp 20,000
8. Click "Cetak Struk"

**Expected Result**:
- Transaction saved with status "completed"
- Stock reduced by 1
- Receipt printed with correct details
- Cash drawer opens

**Actual Result**: [To be filled during execution]
**Status**: ⏳ Pending / ✅ Passed / ❌ Failed
```

## Test Categories

### Functional Tests
- Happy path scenarios
- Edge cases (zero stock, max quantity, special chars)
- Error handling (network failure, invalid input)

### Offline Tests
1. Disable network connection
2. Perform transactions
3. Verify all data saved locally
4. Re-enable network
5. Verify sync (if implemented)

### Hardware Tests
- Thermal printer: receipt output quality
- Barcode scanner: input recognition
- Cash drawer: trigger mechanism

### Security Tests
- SQL injection in search fields
- XSS in product names
- Unauthorized access attempts

## Bug Report Format

```markdown
## BUG-XXX: [Short Description]

**Severity**: Critical | High | Medium | Low
**Module**: [Affected module]
**Version**: [App version]

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Expected Behavior
What should happen

### Actual Behavior
What actually happened

### Screenshots
[If applicable]

### Environment
- OS: 
- Browser/Electron version:
- Database state:
```

## Output

Save as `qa/[module-name]-test-report.md`.

## Rules

- Test both happy path and edge cases
- Include preconditions for each test
- Record actual results during execution
- Report bugs immediately when found
- Re-test after bug fixes
