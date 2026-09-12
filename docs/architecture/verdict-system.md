# Verdict System

The verdict system translates adjudication results into actionable trust decisions: VERIFIED, CONTRADICTED, or HOLD.

## Three Verdicts

### VERIFIED ✅

**Meaning**: Report is trustworthy based on evidence.

**Criteria**:
- Zero lies detected
- Evidence ledger integrity verified
- All claims supported by evidence

**Blast Radius**: 0

**Action**: Trust the report

**Example**:
```
Report: "All tests passed"
Evidence: "npm test -- Passed: 47/47"
Lies: []
Verdict: VERIFIED
```

### CONTRADICTED ❌

**Meaning**: Report contains critical lies or tampering.

**Criteria**:
- Evidence ledger tampered (blast radius = 100)
- **OR** any lie with severity ≥ 9
- **OR** blast radius ≥ 70

**Blast Radius**: 70-100

**Action**: Reject the report

**Examples**:

1. **Tampered Evidence**:
```
Report: "Task completed"
Evidence: [valid content but hash = "fake_hash"]
Verdict: CONTRADICTED (blast radius: 100)
```

2. **Critical Lie**:
```
Report: "Everything succeeded"
Evidence: "Operation failed with error"
Lies: [mismatch, severity: 10]
Verdict: CONTRADICTED (blast radius: 100)
```

3. **High Blast Radius**:
```
Report: "5 tasks completed"
Evidence: [empty]
Lies: [5× unbacked-assert, severity: 7 each]
Blast Radius: 75
Verdict: CONTRADICTED
```

### HOLD ⏸️

**Meaning**: Moderate issues detected, human review required.

**Criteria**:
- Lies detected with blast radius 40-69
- **OR** total severity 15-49
- **AND** no critical lies (severity < 9)
- **AND** blast radius < 70

**Blast Radius**: 40-69

**Action**: Require human seal before accepting

**Example**:
```
Report: "3 tasks completed"
Evidence: [empty]
Lies: [3× unbacked-assert, severity: 7 each]
Total Severity: 21
Blast Radius: 52
Verdict: HOLD
```

## Verdict Logic

```typescript
function determineVerdict(
  ledgerIntegrity: boolean,
  lies: LieInstance[],
  blastRadius: number,
  totalSeverity: number
): Verdict {
  // Tampered ledger = instant CONTRADICTED
  if (!ledgerIntegrity) {
    return 'CONTRADICTED';
  }
  
  // No lies = VERIFIED
  if (lies.length === 0) {
    return 'VERIFIED';
  }
  
  // Critical lie = CONTRADICTED
  const hasCriticalLie = lies.some(lie => lie.severity >= 9);
  if (hasCriticalLie) {
    return 'CONTRADICTED';
  }
  
  // High blast radius = CONTRADICTED
  if (blastRadius >= 70) {
    return 'CONTRADICTED';
  }
  
  // Moderate issues = HOLD
  if (blastRadius >= 40 || totalSeverity >= 15) {
    return 'HOLD';
  }
  
  // Minor issues = VERIFIED
  // (This is debatable - could be HOLD instead)
  return 'VERIFIED';
}
```

## Sealing (HOLD Only)

### Purpose

Human oversight for ambiguous cases where:
- Evidence is weak but not absent
- Claims are vague
- Context is needed
- Automated adjudication is uncertain

### Process

1. Packet assigned HOLD verdict
2. Human reviews:
   - Report content
   - Evidence ledger
   - Lie profile
   - Blast radius
3. Human decides: Accept or reject
4. If accepting, apply seal with name
5. Packet marked as `sealed = true`

### Database

```sql
UPDATE packets 
SET 
  sealed = 1,
  human_sealed_by = 'John Doe',
  human_sealed_at = 1726113600000
WHERE 
  id = 'packet-id' AND 
  verdict = 'HOLD';
```

### Constraints

- **Only HOLD can be sealed**: VERIFIED doesn't need it, CONTRADICTED shouldn't be sealed
- **Irreversible**: Once sealed, cannot be unsealed
- **Auditable**: Name and timestamp preserved

### API

```
POST /api/packet/:id/seal
{
  "humanName": "Jane Smith"
}
```

**Response**:
```json
{
  "success": true
}
```

**Errors**:
- 400: Not a HOLD verdict
- 400: Missing humanName
- 404: Packet not found

## Verdict Statistics

Track verdict distribution:

```typescript
interface Stats {
  total: number;       // All packets
  verified: number;    // VERIFIED packets
  contradicted: number; // CONTRADICTED packets
  hold: number;        // HOLD packets
  sealed: number;      // HOLD packets that have been sealed
}
```

**Example**:
```json
{
  "total": 100,
  "verified": 75,
  "contradicted": 15,
  "hold": 10,
  "sealed": 7
}
```

**Interpretation**:
- 75% reports are trustworthy
- 15% have critical lies
- 10% need human review
- 7% reviewed and sealed (3 pending)

## Blast Radius Thresholds

| Range | Verdict | Meaning |
|-------|---------|---------|
| 0 | VERIFIED | Perfect |
| 1-39 | VERIFIED | Minor issues (debatable) |
| 40-69 | HOLD | Moderate, needs review |
| 70-99 | CONTRADICTED | Critical lies |
| 100 | CONTRADICTED | Tampered ledger |

**Design choice**: 40-69 range triggers human review rather than auto-reject.

**Rationale**: Deterministic rules may flag edge cases that humans would accept.

## Total Severity Thresholds

| Range | Action |
|-------|--------|
| 0 | VERIFIED |
| 1-14 | Depends on blast radius |
| 15-49 | HOLD |
| 50+ | CONTRADICTED (via blast radius) |

**Design choice**: Total severity is secondary to blast radius.

**Rationale**: Blast radius accounts for both severity and coverage.

## Edge Cases

### Case 1: Minor Issues

```
Lies: 1× omission, severity: 8
Total Severity: 8
Blast Radius: 36 (below 40)
Verdict: VERIFIED (debatable)
```

**Question**: Should this be HOLD?

**Current answer**: VERIFIED - radius < 40

**Alternative**: Could make severity ≥ 8 trigger HOLD

### Case 2: Many Minor Lies

```
Lies: 10× unbacked, severity: 7 each
Total Severity: 70
Blast Radius: 95
Verdict: CONTRADICTED
```

**Question**: Should many minor lies be HOLD instead?

**Current answer**: CONTRADICTED - high blast radius

**Rationale**: Volume of lies indicates systemic problem

### Case 3: Empty Report

```
Report: ""
Claims: []
Evidence: []
Lies: []
Verdict: VERIFIED
```

**Question**: Should empty reports be rejected?

**Current answer**: VERIFIED - no lies detected

**Rationale**: No claims = nothing to verify

**Alternative**: Could require minimum content

### Case 4: Perfect Evidence, Bad Report

```
Report: "Failed miserably"
Claims: ["Everything broke"]
Evidence: "All tests passed"
Lies: [mismatch - report says failed, evidence says passed]
Verdict: CONTRADICTED
```

**Interesting**: Report is honest (admits failure) but contradicts evidence.

**Current behavior**: Flags as mismatch because heuristic looks for "success" claims with "failed" evidence, not vice versa.

**Improvement needed**: Bi-directional mismatch detection

## Verdict Immutability

Once a verdict is assigned:
- **Cannot be changed** without creating a new packet
- **Sealed status** is the only mutable field (unsealed → sealed)
- **Reasoning is preserved** for audit trail

## Appeals Process (Future)

Not currently implemented, but could add:

1. **Appeal**: Human can flag verdict as incorrect
2. **Review**: Admin reviews adjudication
3. **Override**: Admin can manually set verdict
4. **Audit**: All overrides logged

Would require:
- Admin authentication
- Override justification
- Audit log table
- UI for appeals

## Verdict Display

### UI Components

**Badge**:
```html
<span class="verdict verified">VERIFIED</span>
<span class="verdict contradicted">CONTRADICTED</span>
<span class="verdict hold">HOLD</span>
```

**Colors**:
- VERIFIED: Green (🟢)
- CONTRADICTED: Red (🔴)
- HOLD: Yellow (🟡)

**Sealed Badge** (HOLD only):
```html
<span class="sealed-badge">SEALED</span>
```

## Verdict API Response

```json
{
  "packetId": "uuid",
  "verdict": "HOLD",
  "lieProfile": {
    "lies": [...],
    "totalSeverity": 21,
    "blastRadius": 52
  },
  "sealed": false,
  "reasoning": [
    "Evidence ledger integrity verified",
    "Detected 3 lie(s)",
    "Verdict: HOLD (blast radius: 52)"
  ]
}
```

## Design Philosophy

### Conservative on Trust

Better to flag false positives (HOLD/CONTRADICTED) than miss lies (false VERIFIED).

**Rationale**: In AI agent oversight, trust is precious. Err on the side of caution.

### Human Escape Hatch

HOLD provides a way for humans to override deterministic rules when context matters.

**Rationale**: No rule set is perfect. Humans catch edge cases.

### Transparent Reasoning

Every verdict includes reasoning array explaining the decision.

**Rationale**: Users should understand why their report was flagged.

## Verdict as Trust Signal

The verdict is not a binary accept/reject. It's a **trust signal**:

- **VERIFIED**: High confidence in report accuracy
- **HOLD**: Uncertain - human judgment needed
- **CONTRADICTED**: High confidence report is inaccurate

Downstream systems can use this signal to:
- Auto-approve VERIFIED reports
- Queue HOLD reports for review
- Auto-reject CONTRADICTED reports
- Weight agent trustworthiness over time

## The Verdict Is Final

Once assigned and persisted, the verdict represents the system's deterministic judgment at that moment. No takebacks, no do-overs (except via new packet submission). This finality ensures auditability and prevents gaming the system.
