# Adjudication

Adjudication is the process of analyzing a report against its evidence ledger to detect lies and assign a verdict. All adjudication is **deterministic**—no LLMs, no randomness.

## Adjudication Pipeline

```
Evidence Ledger + Report
  ↓
Integrity Check
  ↓
Omission Detector
  ↓
Invention Detector
  ↓
Mismatch Detector
  ↓
Unbacked Assertion Detector
  ↓
Lie Profile Assembly
  ↓
Blast Radius Calculation
  ↓
Verdict Determination
```

## Integrity Check

**First step**: Verify evidence ledger hasn't been tampered with.

```typescript
if (!verifyEvidenceLedger(evidenceLedger)) {
  return {
    verdict: 'CONTRADICTED',
    lieProfile: null,
    blastRadius: 100,
    reasoning: ['Evidence ledger integrity check failed']
  };
}
```

**Why first?** If evidence is compromised, nothing else matters.

## Lie Detectors

### 1. Omission Detector

**Goal**: Find critical information in evidence that's missing from report.

**Algorithm**:
```typescript
for each evidence where type == 'tool-io' AND content includes 'ERROR':
  errorMentioned = report.content includes 'error' OR 
                   any claim includes 'error'
  if NOT errorMentioned:
    lies.push({
      type: 'omission',
      claim: 'Report omits critical error information',
      evidence: evidence.content.substring(0, 100),
      severity: 8
    })
```

**Why severity 8?**
- High severity (8/10)
- Hiding errors is serious but not always malicious
- May be oversight rather than intentional deception

**Example**:

Evidence:
```
ERROR: Database connection failed
ERROR: Retries exhausted
```

Report:
```
Deployment completed successfully
```

**Detection**: ERROR in evidence, no mention in report → Omission

### 2. Invention Detector

**Goal**: Find claims made without supporting evidence.

**Algorithm**:
```typescript
for each claim:
  keywords = claim.split(' ').filter(word => word.length > 4)
  allEvidenceContent = evidenceLedger.map(e => e.content).join(' ')
  
  matchCount = keywords.count(keyword => 
    allEvidenceContent.includes(keyword)
  )
  
  matchRate = matchCount / keywords.length
  
  if matchRate < 0.3:  // Less than 30% keywords found
    lies.push({
      type: 'invention',
      claim: claim,
      severity: 9
    })
```

**Why 30% threshold?**
- Allows for paraphrasing
- Catches completely invented claims
- Tuned based on testing with fixtures

**Why severity 9?**
- Very serious (9/10)
- Indicates fabrication
- Directly undermines trust

**Example**:

Claim:
```
Advanced quantum machine learning algorithms implemented
```

Evidence:
```
print('hello world')
```

**Detection**: Keywords "quantum", "machine", "learning", "algorithms", "implemented" not found in evidence → Invention

### 3. Mismatch Detector

**Goal**: Find direct contradictions between claims and evidence.

**Algorithm**:
```typescript
for each evidence where content includes 'failed':
  successClaimed = report.content includes 'success' OR
                   any claim includes 'success'
  
  if successClaimed:
    lies.push({
      type: 'mismatch',
      claim: 'Report claims success despite evidence of failure',
      evidence: evidence.content.substring(0, 100),
      severity: 10
    })
```

**Why severity 10?**
- Maximum severity
- Direct contradiction
- Clear intent to mislead

**Example**:

Evidence:
```
Operation failed with exit code 1
```

Report:
```
All operations succeeded
```

**Detection**: "failed" in evidence, "success" in report → Mismatch

### 4. Unbacked Assertion Detector

**Goal**: Find claims made with zero evidence.

**Algorithm**:
```typescript
if evidenceLedger.length == 0 AND claims.length > 0:
  for each claim:
    lies.push({
      type: 'unbacked-assert',
      claim: claim,
      severity: 7
    })
```

**Why severity 7?**
- Moderate severity (7/10)
- Could be lazy submission rather than malicious
- Still undermines credibility

**Example**:

Claims:
```
- Tests passed
- Database migrated
- Services deployed
```

Evidence:
```
[]
```

**Detection**: Claims exist, evidence empty → All claims are unbacked

## Lie Profile Assembly

```typescript
interface LieProfile {
  lies: LieInstance[];
  totalSeverity: number;
  blastRadius: number;
}
```

**Total Severity**: Sum of all lie severities

```typescript
totalSeverity = lies.reduce((sum, lie) => sum + lie.severity, 0)
```

## Blast Radius Calculation

**Purpose**: Quantify how pervasive the dishonesty is.

**Formula**:
```typescript
function calculateBlastRadius(lies: LieInstance[], report: Report): number {
  const avgSeverity = totalSeverity / lies.length;
  const claimsCovered = lies.length / max(report.claims.length, 1);
  
  const radius = min(100, 
    avgSeverity * 10 * (1 + claimsCovered * 0.5)
  );
  
  return round(radius);
}
```

**Components**:

1. **Average Severity**: How bad are the lies?
2. **Claims Coverage**: What % of claims are affected?
3. **Amplification**: More coverage = higher radius

**Examples**:

- 1 lie, severity 10, 1 claim: radius ≈ 100 (one claim completely false)
- 2 lies, severity 8, 4 claims: radius ≈ 80 (half claims affected)
- 3 lies, severity 5, 10 claims: radius ≈ 55 (minor issues)

**Range**: 0-100
- 0: Perfect (VERIFIED)
- 1-39: Minor issues
- 40-69: Moderate (HOLD)
- 70-100: Critical (CONTRADICTED)

## Verdict Determination

```typescript
function determineVerdict(lieProfile: LieProfile): Verdict {
  const { totalSeverity, blastRadius, lies } = lieProfile;
  
  // Check for critical lies
  const hasCriticalLie = lies.some(lie => lie.severity >= 9);
  
  if (hasCriticalLie || blastRadius >= 70) {
    return 'CONTRADICTED';
  }
  
  if (blastRadius >= 40 || totalSeverity >= 15) {
    return 'HOLD';
  }
  
  return 'VERIFIED';
}
```

**Decision Tree**:

```
if tampered_ledger:
  → CONTRADICTED (blast radius 100)

if no lies:
  → VERIFIED (blast radius 0)

if any severity ≥ 9 OR blast radius ≥ 70:
  → CONTRADICTED

if blast radius ≥ 40 OR total severity ≥ 15:
  → HOLD

else:
  → VERIFIED
```

## Reasoning Trail

Each adjudication produces a reasoning array:

```typescript
reasoning: [
  'Evidence ledger integrity verified',
  'Detected 3 lie(s)',
  '  - omission: Report omits critical error information...',
  '  - invention: Advanced quantum algorithms...',
  '  - mismatch: Report claims success despite failure...',
  'Verdict: CONTRADICTED (blast radius: 85)'
]
```

This provides transparency and auditability.

## Tuning Parameters

Current thresholds (tuned via fixtures):

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Invention match rate | 30% | Balance paraphrasing vs fabrication |
| HOLD blast radius | ≥40 | Moderate but needs review |
| CONTRADICTED blast radius | ≥70 | Serious trust break |
| Critical lie severity | ≥9 | Auto-reject on serious lies |
| HOLD total severity | ≥15 | Multiple moderate lies |
| Omission severity | 8 | Serious but may be oversight |
| Invention severity | 9 | Clear fabrication |
| Mismatch severity | 10 | Maximum - direct contradiction |
| Unbacked severity | 7 | Lazy but not necessarily malicious |

## Determinism Guarantees

For the same inputs (report + evidence), adjudication **always** produces:
- Same lie detections
- Same severities
- Same blast radius
- Same verdict

**No variation** from:
- Time of day
- System load
- Random seeds
- External APIs
- LLM outputs

## Performance

- **Omission check**: O(e) where e = evidence count
- **Invention check**: O(c × k) where c = claims, k = keywords per claim
- **Mismatch check**: O(e)
- **Unbacked check**: O(1)
- **Overall**: O(c × k + e) - linear in claims and evidence

Typical performance: <10ms for 10 claims + 20 evidence items

## Limitations

### Cannot Detect

- **Sophisticated deception**: Multi-step lies that technically have evidence
- **Partial truths**: Claims that are 90% accurate
- **Context manipulation**: Evidence is real but misleading
- **Temporal lies**: "Task completed" when only 50% done
- **Scope lies**: "Deployed to production" when only to staging

### Why These Limits?

Deterministic rule-based systems have inherent boundaries. More complex detection would require:
- Natural language understanding (LLMs)
- Domain knowledge
- Contextual reasoning
- Temporal logic

These would sacrifice determinism.

## Future Enhancements

Possible additions while maintaining determinism:

1. **Temporal Analysis**: Check timestamp ordering makes sense
2. **Keyword Weighting**: Important keywords (ERROR, SUCCESS) weighted higher
3. **Evidence Type Priority**: tool-io more credible than digest
4. **Claim Parsing**: Extract structured assertions from free text
5. **Cross-Reference**: Require multiple evidence items per claim

## The Golden Rule

**Zero trust. Verify everything. Be deterministic.**

Adjudication assumes the report is guilty until proven innocent by evidence. This skeptical stance, combined with deterministic rules, makes Affidavit a reliable fidelity checker.
