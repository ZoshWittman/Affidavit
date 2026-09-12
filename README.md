# Affidavit

**Report-fidelity seal desk for AI agent written reports**

Affidavit is a public-benefit tool that verifies the truthfulness of AI agent reports through deterministic adjudication. No LLM judges—only cryptographic evidence and rule-based lie detection.

## What It Does

Affidavit creates **Affidavit Packets** from agent reports:

```
claimed report 
  → SHA-256 evidence ledger (tool I/O, screenshots, DOM, digests)
  → deterministic adjudicators (zero LLM)
  → VERIFIED / CONTRADICTED / HOLD
  → lie profile (omission/invention/mismatch/unbacked-assert)
  → blast radius calculation
  → human-only seal for HOLD
```

### Verdict Types

- **VERIFIED**: All claims backed by evidence, no lies detected
- **CONTRADICTED**: Critical lies detected (severity ≥9, blast radius ≥70)
- **HOLD**: Moderate issues requiring human review (can be sealed by humans)

### Lie Detection

Affidavit detects four types of lies using deterministic rules:

1. **Omission**: Critical information (e.g., errors) present in evidence but missing from report
2. **Invention**: Claims made without corresponding evidence
3. **Mismatch**: Direct contradiction between claims and evidence (e.g., claiming success when evidence shows failure)
4. **Unbacked Assertion**: Claims made with zero supporting evidence

### Blast Radius

Calculated based on:
- Total severity of lies
- Number of lies
- Proportion of claims affected

Range: 0-100. Higher radius = more pervasive dishonesty.

## What It Is NOT

- ❌ **Latch** (tool policy enforcement)
- ❌ **Caplock** (spend tracking)
- ❌ **Clearance** (done/completion status)
- ❌ **Baton** (task handoff)
- ❌ **Cutroom** (media quality control)
- ❌ **Claimscape** (claim drift detection)
- ❌ **Hardenbench** (security hardening)

## Tech Stack

- **TypeScript** - Type-safe implementation
- **Next.js App Router** - Modern React framework
- **SQLite** - Local-first data persistence
- **SHA-256** - Cryptographic evidence integrity
- **Port 43131** - Default development port
- **MIT License** - Open source

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:43131

### Testing

```bash
npm test
```

We maintain **≥40 tests** with **80%+ coverage**.

### Production Build

```bash
npm run build
npm start
```

## Usage

### 1. Submit a Report

Navigate to `/submit` and provide:

- **Report Title**: Descriptive name
- **Report Content**: Full description of what was done
- **Claims**: Specific assertions (one per line)
- **Evidence**: Tool outputs, screenshots, digests (format: `type:content`)

### 2. Automatic Adjudication

The system will:
1. Hash all evidence with SHA-256
2. Run deterministic adjudicators
3. Detect lies (omission/invention/mismatch/unbacked)
4. Calculate blast radius
5. Assign verdict

### 3. Review Results

View the packet to see:
- Final verdict
- Lie profile (if any)
- Evidence ledger with hashes
- Blast radius

### 4. Human Seal (HOLD only)

For HOLD verdicts, a human can apply a seal confirming manual review.

## Architecture

See [docs/architecture/](./docs/architecture/) for detailed design documentation:

- **Core Design**: System architecture and principles
- **Evidence Ledger**: How evidence is stored and verified
- **Adjudication**: Deterministic lie detection algorithms
- **Verdict System**: How verdicts are determined

## Fixtures

Test fixtures are in `/fixtures`:

- `clear-verified.json` → VERIFIED
- `omission-contradicted.json` → CONTRADICTED (omission)
- `invention-contradicted.json` → CONTRADICTED (invention)
- `unbacked-hold.json` → HOLD (unbacked assertions)
- `tampered-ledger.json` → CONTRADICTED (tampered hash)

## API

### POST /api/packet

Submit a new report for adjudication.

**Request:**
```json
{
  "report": {
    "title": "Task Report",
    "content": "Description...",
    "claims": ["Claim 1", "Claim 2"]
  },
  "evidence": [
    {
      "type": "tool-io",
      "content": "command output..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "packetId": "uuid",
  "verdict": "VERIFIED"
}
```

### GET /api/packet

List all packets with stats.

### POST /api/packet/:id/seal

Apply human seal to HOLD packet.

**Request:**
```json
{
  "humanName": "Reviewer Name"
}
```

## Database Schema

### packets
- id, report_id, report_title, report_content, report_claims
- verdict, lie_profile, sealed, human_sealed_by, human_sealed_at
- created_at, adjudicated_at

### evidence
- id, packet_id, type, content, hash, timestamp

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure `npm test` passes
5. Submit a pull request

## Zero Paid APIs

Affidavit uses **no paid external APIs**. Everything runs locally:
- SQLite for storage
- SHA-256 from Node crypto
- Deterministic adjudication (no LLM)

## License

MIT License - see [LICENSE](./LICENSE)

## Public Benefit Statement

Affidavit is designed as a public-benefit tool to:

1. **Increase AI agent accountability** - Verify what agents claim they did
2. **Build trust** - Cryptographic evidence ledgers prevent tampering
3. **Enable oversight** - Human seal requirement for ambiguous cases
4. **Promote transparency** - Open source implementation and deterministic rules
5. **Prevent deception** - Detect omissions, inventions, mismatches, and unbacked assertions

We believe AI agents should be held to the same standards of truthfulness as human workers. Affidavit makes this possible without requiring expensive LLM-based judging or centralized verification services.

## Development

- Never commit `node_modules/`, `.next/`, or `*.db` files
- Run tests before committing: `npm test`
- Follow TypeScript strict mode
- Maintain 80%+ code coverage

## Questions?

See [docs/architecture/](./docs/architecture/) for detailed technical documentation.

---

**Affidavit**: Because truth matters, even for AI agents.
