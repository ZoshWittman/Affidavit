# Affidavit Architecture

This directory contains detailed architectural documentation for the Affidavit system.

## Documents

1. [**Core Design**](./core-design.md) - System architecture and design principles
2. [**Evidence Ledger**](./evidence-ledger.md) - How evidence is captured, hashed, and verified
3. [**Adjudication**](./adjudication.md) - Deterministic lie detection algorithms
4. [**Verdict System**](./verdict-system.md) - How verdicts are determined and sealed

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Affidavit System                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Report +   │
│   Evidence   │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│                     Evidence Ledger                          │
│  • SHA-256 hash each evidence item                          │
│  • Store: type, content, hash, timestamp                    │
│  • Immutable once created                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Integrity Check                           │
│  • Verify all hashes match content                          │
│  • If tampered → CONTRADICTED (blast radius 100)            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                  Deterministic Adjudicators                  │
│  • Omission Detector                                        │
│  • Invention Detector                                       │
│  • Mismatch Detector                                        │
│  • Unbacked Assertion Detector                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                      Lie Profile                             │
│  • List of detected lies                                    │
│  • Type + severity for each                                 │
│  • Total severity                                           │
│  • Blast radius calculation                                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Verdict Determination                     │
│  • VERIFIED: No lies                                        │
│  • CONTRADICTED: Critical lies (severity≥9 or radius≥70)   │
│  • HOLD: Moderate lies (needs human review)                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                   Affidavit Packet                          │
│  • Report                                                    │
│  • Evidence Ledger                                          │
│  • Verdict                                                  │
│  • Lie Profile (if applicable)                              │
│  • Seal Status (HOLD only)                                  │
└──────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Deterministic

No randomness, no LLMs, no external APIs. Same inputs → same outputs, always.

### 2. Cryptographic Integrity

SHA-256 hashes ensure evidence cannot be tampered with after submission.

### 3. Transparent

All rules are visible and auditable. No black-box decisions.

### 4. Human Oversight

HOLD verdicts require human seal, acknowledging cases where automated adjudication is uncertain.

### 5. Zero Trust

Trust nothing claimed by the report—verify everything against evidence.

## Data Flow

1. **Submission**: User submits report + evidence
2. **Hashing**: Each evidence item gets SHA-256 hash
3. **Storage**: Packet + evidence stored in SQLite
4. **Integrity**: Verify all hashes match
5. **Analysis**: Run all four lie detectors
6. **Scoring**: Calculate severity and blast radius
7. **Verdict**: Assign VERIFIED/CONTRADICTED/HOLD
8. **Seal** (HOLD only): Human can apply seal

## No External Dependencies

- No LLM APIs (OpenAI, Anthropic, etc.)
- No cloud verification services
- No blockchain/distributed ledger
- Just: TypeScript, Next.js, SQLite, Node.js crypto

## Security Model

### Threat Model

**Protected Against:**
- Evidence tampering (SHA-256 hashing)
- Report dishonesty (lie detection)
- Retroactive claim changes (immutable packets)

**Not Protected Against:**
- Malicious evidence generation at source
- Social engineering of human sealers
- Database file tampering (SQLite file security is OS-level)

### Assumptions

1. Evidence submitted reflects actual agent outputs
2. Human sealers act in good faith
3. SQLite database file has appropriate OS-level permissions
4. SHA-256 remains cryptographically secure

## Performance

- **Adjudication**: O(n×m) where n=claims, m=evidence items
- **Storage**: SQLite, scales to millions of packets
- **Hash computation**: O(k) where k=evidence size
- **No network calls**: 100% local processing

## Extensibility

Future extensions could include:

- Additional lie detectors (e.g., temporal inconsistency)
- Evidence type plugins (video, audio, etc.)
- Webhook notifications for verdicts
- Batch adjudication API
- Integration with agent frameworks

See individual architecture documents for detailed implementation.
