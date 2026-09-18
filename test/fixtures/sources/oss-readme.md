# ReasoningReceipt

Verify AI reasoning with cryptographic receipts. Open source (MIT).

## What's new in v1.0

- Merkle-tree proof chains for every model call
- CLI verifier: `rr verify transcript.jsonl`
- 40% faster proof generation since v0.9
- Works with OpenAI, Anthropic and local models

## Try it

```
npm i -g reasoning-receipt
rr verify examples/demo.jsonl
```

## How it works

Each model call produces a signed receipt. Receipts chain into a Merkle
tree whose root is anchored to the transcript hash, so any tampering is
detectable offline.

## What's next

Streaming proofs and a hosted verification API.

[Repository](https://github.com/example/reasoning-receipt)
[Release v1.0](https://github.com/example/reasoning-receipt/releases/tag/v1.0.0)
