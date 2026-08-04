# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restic is an encrypted, deduplicated backup program written in Go. All data is encrypted before leaving the client. It supports multiple storage backends (local, SFTP, S3, Azure, GCS, B2, Swift, rclone, REST).

## Build & Test Commands

```bash
# Build
go run build.go              # production build (or: make)
go build ./cmd/restic        # quick build without version embedding
go build -tags debug ./cmd/restic  # debug build (enables profiling flags)

# Test
go test ./cmd/... ./internal/...   # all tests (or: make test)
go test ./internal/archiver/...    # single package
go test -run TestName ./internal/archiver/...  # single test
go test -race ./cmd/... ./internal/...  # with race detector (used in CI)
go test -v -count 1 ./...   # verbose, no cache

# Lint
golangci-lint run            # run all configured linters
gofmt -w **/*.go             # format code (required before committing)
```

## Architecture

### Package Layout

- **`cmd/restic/`** — CLI entry point using cobra. Each command is in `cmd_<name>.go`.
- **`internal/restic/`** — Core interfaces (`Repository`, blob types, IDs). This is the contract layer.
- **`internal/repository/`** — Repository implementation: encryption, packing, indexing, key management.
- **`internal/backend/`** — Storage backend abstraction and implementations (local, sftp, s3, azure, gs, b2, swift, rclone, rest).
- **`internal/archiver/`** — Backup logic: file traversal, content-based chunking, tree saving.
- **`internal/restorer/`** — Restore logic: extracting files from snapshots.
- **`internal/checker/`** — Repository integrity verification.
- **`internal/crypto/`** — AES-256-CTR encryption + Poly1305-AES128 MAC.
- **`internal/walker/`** — Tree traversal utilities.
- **`internal/ui/`** — Progress display, terminal output, FUSE mount UI.
- **`internal/fs/`** — Filesystem abstractions (cross-platform).

### Key Design Patterns

**Backend wrappers (decorators):** Cross-cutting concerns are layered via wrappers around the `Backend` interface — `cache.Cache`, `retry.RetryBackend`, `logger.LoggingBackend`, `dryrun.DryRunBackend`.

**Content-addressable storage:** Blobs are identified by SHA-256 hash. Data is split into variable-size chunks, deduplicated, packed into pack files, and encrypted before storage.

**Architectural boundary:** `internal/backend/` packages must NOT import `internal/restic` or `internal/repository`. This is enforced by `depguard` in golangci-lint. The `backend/cache` and `backend/test` packages are exempt.

**Test helpers:** The `internal/test` package is imported as `rtest` (enforced by `importas` linter rule). Use `rtest.OK(t, err)`, `rtest.Assert(t, ...)`, `rtest.Equals(t, ...)`.

## Contribution Conventions

- **Changelog entries:** User-facing changes need a file in `changelog/unreleased/` named `issue-XXXX` or `pull-XXXX`. First line must start with `Bugfix:`, `Enhancement:`, or `Change:` (breaking only). See `changelog/TEMPLATE`.
- **Do not edit** `doc/man/` or `doc/manual_rest.rst` — these are auto-generated.
- **Commit style:** Terse summary line, blank line, detailed description.
- **Formatting:** `gofmt` is required. CI checks formatting with the latest stable Go.

## Integration Tests

Cloud backend integration tests are gated by environment variables (e.g., `RESTIC_TEST_S3_KEY`, `RESTIC_TEST_FUSE=true`). These run in CI with secrets but are skipped locally by default.

## Debugging

- `DEBUG_LOG=/path/to/file` — enables debug logging
- Debug builds support `--cpu-profile`, `--mem-profile`, `--block-profile`, `--trace-profile`, `--listen-profile`
