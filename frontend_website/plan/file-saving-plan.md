# File Saving Plan

How user-uploaded documents (PDFs, including NDA'd content like car dealership manuals) will be stored when the product ships.

## Decision

**Store documents in AWS S3**, served to the PDF viewer via short-lived CloudFront signed URLs. Embeddings and metadata stay in our Postgres/pgvector database. AWS credits make this the path of least resistance.

## Why not the other options

### User's local machine only
- Pros: max privacy, no server-side liability.
- Cons: no cross-device access, no sharing within a dealership, painful to sync embeddings, backend can't help with retrieval quality. Kills the product.

### Our own server's disk
- Pros: full control.
- Cons: we become the security perimeter — disk encryption, encrypted backups, access logging, key rotation, signable DPA. Heavy compliance surface for a small team.

### Cloud object storage (chosen)
- Pros: managed durability, encryption at rest, per-tenant isolation, signed URLs, audit logs out of the box. Industry standard (Notion, Dropbox, every B2B SaaS).
- Cons: requires correct IAM and bucket configuration; mistakes (public buckets, long-lived keys) are how data leaks happen.

## What matters legally / to NDA'd clients

The question isn't *where the bytes sit* — AWS's physical security beats anything we'd DIY. What clients (and their lawyers) actually care about:

- Encryption at rest (SSE-S3 or SSE-KMS) and TLS in transit
- Per-tenant isolation: bucket prefix per org, IAM scoped so org A cannot read org B
- Signed URLs for PDF access (short TTL, no public buckets)
- Audit logs (who accessed which doc when)
- A signed DPA / NDA we can provide
- Region pinning if they care (e.g., keep data in `us-east-*` only)

## AWS architecture

We have AWS credits, so:

| Concern | Service |
|---|---|
| Document blob storage | **S3** — `PutObject` with `ServerSideEncryption: AES256`. Block all public access. |
| Serving PDFs to viewer | **CloudFront + signed URLs**, 5–15 min TTL. Cheaper and faster than proxying bytes through the Next.js API. |
| Encryption keys | **KMS** (default AWS-managed key now; per-tenant CMKs as an enterprise upsell later). |
| Audit trail | **CloudTrail + S3 access logs** — required for "who touched which manual when." |
| Backend auth to AWS | **IAM role** scoped to the right bucket prefix. If on Vercel, use OIDC federation; never commit long-lived access keys. |
| Embeddings + metadata | **RDS Postgres with pgvector** (credits cover this; OpenSearch Serverless is a heavier alternative). |

### Bucket layout

```
s3://<bucket>/orgs/{orgId}/users/{userId}/{docId}.pdf
```

IAM policies scope reads/writes to `orgs/{orgId}/*` per tenant.

### Region

Pick deliberately and document it. Default to `us-east-2` or `us-west-2` (slightly cheaper than `us-east-1`, equally fine). Lock to one region so we can answer data-residency questions cleanly when they come up.

## Escape hatch for paranoid clients

If a client (e.g., the dealership) pushes hard on "I don't want my manuals on your infra at all," offer **single-tenant deployment** as a paid tier:

- Their AWS account, their bucket, their KMS key
- Optionally their VPC
- Same application code

Don't build this now. Just keep the architecture clean enough that swapping the bucket/key/region is a config change, not a rewrite.

## Things to avoid

- Storing PDFs as `bytea` in Postgres — slow, expensive, painful backups.
- Local-only as the default — users will want phone/multi-device access immediately.
- Rolling our own encrypted-blob server — easy to get the threat model wrong.
- Long-lived AWS access keys in env files — use IAM roles or OIDC federation.
- Public S3 buckets for "easier" PDF serving — always signed URLs.

## Open questions to resolve before shipping

- Final region choice (residency requirements from the dealership client).
- Whether we need per-tenant KMS CMKs at launch or later.
- Retention policy: when a user deletes a document, do we hard-delete from S3 immediately or soft-delete with a grace window?
- Backup strategy: S3 versioning on, with lifecycle rules to expire old versions after N days.
