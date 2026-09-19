# OpenSelf

Self-hosted personal knowledge hub. Your notes, your files, your rules —
no accounts, no cloud lock-in.

## What's new in v1.0

- Local-first sync between devices (CRDT-based)
- End-to-end encrypted remote backup option
- Full-text search across notes and attachments
- Plugin API for custom importers

## Try it

```
docker run -p 8080:8080 openself/openself
```

## How it works

All data lives in plain files on disk. Sync uses conflict-free
replicated data types so offline edits merge without manual resolution.

[Repository](https://github.com/example/openself)
