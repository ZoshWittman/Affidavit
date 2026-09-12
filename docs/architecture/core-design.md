# Core Design

## Philosophy

Affidavit is built on the principle that **AI agents should be held accountable for their claims**. Rather than trusting agent reports at face value, we cryptographically verify evidence and apply deterministic rules to detect dishonesty.

## Design Principles

### 1. Evidence-First

Reports mean nothing without evidence. Every claim should be backed by:
- Tool I/O (command outputs, logs)
- Screenshots (visual proof)
- DOM snapshots (web state)
- Digests (summaries with sources)

### 2. Cryptographic Integrity

Each evidence item is hashed with SHA-256. This ensures:
- Evidence cannot be changed after submission
- Tampering is immediately detected
- Audit trail is preserved

### 3. Deterministic Adjudication

No LLMs, no randomness, no subjective judgment. The same evidence + report always produces the same verdict.

**Why no LLMs?**
- Non-deterministic outputs
- Expensive API costs
- Opaque decision-making
- External dependencies
- Potential bias

### 4. Four Lie Types

We detect four categories of dishonesty:

#### Omission
Critical information exists in evidence but is missing from report.

**Example**: Evidence shows "ERROR: Connection failed" but report says "Everything deployed successfully"

#### Invention
Claims made without supporting evidence.

**Example**: Report claims "Quantum ML algorithms implemented" but evidence only shows "print('hello')"

#### Mismatch
Direct contradiction between claim and evidence.

**Example**: Report says "All tests passed" but evidence shows "Failed: 15/20 tests"

#### Unbacked Assertion
Claims made with zero evidence provided.

**Example**: Report has claims but evidence array is empty

### 5. Blast Radius

Quantifies the scope of dishonesty:

```typescript
blastRadius = min(100, 
  (avgSeverity) * 10 * (1 + claimsCovered * 0.5)
)
```

Factors:
- Average severity of lies
- Number of lies
- Proportion of claims affected

### 6. Three-Tier Verdict

- **VERIFIED** (0 lies): Trust established
- **HOLD** (moderate lies): Human review required
- **CONTRADICTED** (critical lies): Trust broken

### 7. Human-Only Seal

HOLD verdicts cannot be auto-resolved. A human must:
1. Review the packet
2. Provide their name
3. Apply seal

This prevents gaming the system while acknowledging edge cases.

## Architecture Layers

### Data Layer (SQLite)

```sql
packets: id, report, verdict, lie_profile, seal_status
evidence: id, packet_id, type, content, hash, timestamp
```

Simple, local-first, no network required.

### Core Logic Layer

- `hash.ts`: SHA-256 operations
- `evidence.ts`: Evidence creation and verification
- `adjudicator.ts`: Lie detection and verdict logic
- `packet.ts`: Packet management

### API Layer (Next.js)

- `POST /api/packet`: Submit report
- `GET /api/packet`: List packets
- `POST /api/packet/:id/seal`: Apply human seal

### UI Layer (React)

- Home: Stats and packet list
- Submit: Report submission form
- Packet Detail: Full adjudication results

## Key Algorithms

### Evidence Hashing

```typescript
hash = SHA256(`${type}:${content}:${timestamp}`)
```

Includes timestamp to prevent replay attacks.

### Integrity Verification

```typescript
for each evidence:
  recompute hash from (type, content, timestamp)
  if hash != stored_hash:
    return CONTRADICTED with blast_radius=100
```

Fails fast on tampering.

### Omission Detection

```typescript
for each evidence with ERROR keyword:
  if report.content does NOT mention error:
    flag as omission (severity: 8)
```

### Invention Detection

```typescript
for each claim:
  extract keywords (length > 4)
  match_rate = keywords_in_evidence / total_keywords
  if match_rate < 0.3:
    flag as invention (severity: 9)
```

### Mismatch Detection

```typescript
for each evidence with 'failed':
  if report claims 'success':
    flag as mismatch (severity: 10)
```

### Unbacked Detection

```typescript
if evidence.length == 0 && claims.length > 0:
  flag each claim as unbacked (severity: 7)
```

### Verdict Logic

```typescript
if (tampered_ledger):
  return CONTRADICTED

if (no_lies):
  return VERIFIED

if (any_lie_severity >= 9 OR blast_radius >= 70):
  return CONTRADICTED

if (blast_radius >= 40 OR total_severity >= 15):
  return HOLD

return VERIFIED
```

## Trade-offs

### Pros
✅ Deterministic and predictable  
✅ Zero external API costs  
✅ Cryptographically secure  
✅ Fully transparent  
✅ Fast (no network calls)  

### Cons
❌ Rule-based (may miss subtle lies)  
❌ Requires evidence submission discipline  
❌ Cannot detect sophisticated deception  
❌ Static detection rules  

## Future Enhancements

Potential improvements while maintaining determinism:

1. **Temporal Analysis**: Detect timeline inconsistencies
2. **Cross-Reference**: Check claims against multiple evidence items
3. **Evidence Weighting**: Different evidence types have different credibility
4. **Pattern Detection**: Learn common lie patterns from sealed packets
5. **Multi-Language**: Support evidence in multiple languages

## Non-Goals

What Affidavit explicitly does NOT do:

- ❌ Policy enforcement (use Latch)
- ❌ Spend tracking (use Caplock)
- ❌ Task completion status (use Clearance)
- ❌ Agent handoff (use Baton)
- ❌ Media quality (use Cutroom)
- ❌ Claim drift (use Claimscape)
- ❌ Security hardening (use Hardenbench)

Affidavit is **only** about report fidelity verification.
