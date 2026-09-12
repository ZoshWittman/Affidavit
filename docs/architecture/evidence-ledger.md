# Evidence Ledger

The evidence ledger is the foundation of Affidavit's trust model. Each piece of evidence is cryptographically hashed and stored immutably.

## Evidence Structure

```typescript
interface Evidence {
  id: string;           // UUID
  type: 'tool-io' | 'screenshot' | 'dom-snapshot' | 'digest';
  content: string;      // Actual evidence data
  hash: string;         // SHA-256 hash
  timestamp: number;    // Unix milliseconds
}
```

## Evidence Types

### 1. tool-io

**Purpose**: Capture command outputs, logs, tool responses

**Example**:
```
npm test
Passed: 47/47
Failed: 0
All tests passed
```

**When to use**: Any terminal command, script output, API response

### 2. screenshot

**Purpose**: Visual proof of state

**Example**:
```
base64_encoded_image_data_or_description
```

**When to use**: Deployment dashboards, UI state, visual confirmation

### 3. dom-snapshot

**Purpose**: Webpage state at specific moment

**Example**:
```html
<html>
  <body>
    <div id="status">Deployed</div>
  </body>
</html>
```

**When to use**: Web app verification, DOM-based checks

### 4. digest

**Purpose**: Summarized evidence with sources

**Example**:
```
Email confirmation received from deploy@example.com at 14:23:00 UTC
Subject: Deployment Successful - Job #1234
```

**When to use**: Human-readable summaries, multi-source evidence

## Hash Computation

### Algorithm

```typescript
function hashEvidence(type: string, content: string, timestamp: number): string {
  const combined = `${type}:${content}:${timestamp}`;
  return SHA256(combined);
}
```

### Why Include Timestamp?

1. **Prevents replay attacks**: Same evidence at different times has different hash
2. **Temporal ordering**: Know exact sequence of evidence
3. **Audit trail**: When was evidence created?

### Why Include Type?

Prevents type confusion attacks where evidence is reinterpreted as different type.

## Storage

### Database Schema

```sql
CREATE TABLE evidence (
  id TEXT PRIMARY KEY,
  packet_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  hash TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (packet_id) REFERENCES packets(id)
);

CREATE INDEX idx_evidence_packet_id ON evidence(packet_id);
CREATE INDEX idx_evidence_hash ON evidence(hash);
```

### Immutability

Once stored, evidence is **never modified**. Updates require creating new packets.

## Verification

### Integrity Check

```typescript
function verifyEvidenceLedger(evidenceList: Evidence[]): boolean {
  for (const evidence of evidenceList) {
    const expectedHash = hashEvidence(
      evidence.type,
      evidence.content,
      evidence.timestamp
    );
    if (evidence.hash !== expectedHash) {
      return false; // Tampering detected
    }
  }
  return true;
}
```

### Tamper Detection

```typescript
function detectTamperedEvidence(evidenceList: Evidence[]): Evidence[] {
  return evidenceList.filter((evidence) => {
    const expectedHash = hashEvidence(
      evidence.type,
      evidence.content,
      evidence.timestamp
    );
    return evidence.hash !== expectedHash;
  });
}
```

## Threat Model

### Protected Against

✅ **Content tampering**: Changing evidence.content invalidates hash  
✅ **Timestamp manipulation**: Changing evidence.timestamp invalidates hash  
✅ **Type switching**: Changing evidence.type invalidates hash  
✅ **Deletion**: Database constraints prevent orphaned evidence  

### NOT Protected Against

❌ **Source fabrication**: If agent generates fake evidence before submission  
❌ **Database file editing**: OS-level file security required  
❌ **Hash collision**: Relies on SHA-256 security (practically impossible)  

## Best Practices

### For Evidence Submitters

1. **Capture immediately**: Don't delay evidence collection
2. **Include context**: More evidence is better than less
3. **Use appropriate types**: tool-io for commands, screenshot for visuals
4. **Don't summarize**: Submit raw outputs when possible

### For Evidence Consumers

1. **Verify ledger first**: Always check integrity before analysis
2. **Check timestamps**: Ensure evidence is chronologically sensible
3. **Cross-reference**: Look for corroboration across evidence items
4. **Trust hashes**: If hash matches, content is authentic

## Example Ledger

```json
[
  {
    "id": "ev-001",
    "type": "tool-io",
    "content": "npm test\nPassed: 47/47",
    "hash": "a3c7f...",
    "timestamp": 1726113600000
  },
  {
    "id": "ev-002",
    "type": "screenshot",
    "content": "deployment-dashboard.png - Status: Live",
    "hash": "b8f2e...",
    "timestamp": 1726113605000
  },
  {
    "id": "ev-003",
    "type": "digest",
    "content": "Confirmed via email from deploy service",
    "hash": "c9a1d...",
    "timestamp": 1726113610000
  }
]
```

## Performance Considerations

### Hash Computation

- SHA-256: ~1-2ms per evidence item on modern hardware
- Batch hashing: Can parallelize for large ledgers
- No network calls required

### Storage

- SQLite: Millions of evidence items
- Indexed by packet_id for fast retrieval
- Content stored as TEXT (supports large data)

### Retrieval

- Evidence fetched with packet (single JOIN)
- Ordered by timestamp for chronological view
- Hash verification on-demand

## Edge Cases

### Empty Ledger

**Valid**: If report has no claims, empty ledger is acceptable  
**Invalid**: If report has claims, empty ledger triggers unbacked-assert detection

### Duplicate Content

**Allowed**: Same content at different timestamps has different hash  
**Reason**: Evidence may legitimately repeat (e.g., retry outputs)

### Large Evidence

**Limit**: No hard limit, but consider:
- Database size
- UI rendering
- Hash computation time

**Best practice**: Truncate or summarize extremely large outputs

### Malformed Content

**Handled**: Content is stored as-is, even if malformed  
**Reason**: Preserves authenticity; adjudicators handle interpretation

## Future Extensions

Potential enhancements:

1. **Evidence signatures**: Cryptographic signing by evidence source
2. **Chain of custody**: Track evidence transformations
3. **External storage**: Store large evidence (videos) externally, hash only
4. **Compression**: Gzip evidence content (update hash algorithm)
5. **Deduplication**: Shared evidence across packets (hash-based)

## Ledger Integrity Is Everything

Without a verifiable ledger, adjudication is meaningless. SHA-256 hashing ensures that once evidence is submitted, it cannot be altered, deleted, or reinterpreted. This is the cryptographic foundation that makes deterministic adjudication possible.
