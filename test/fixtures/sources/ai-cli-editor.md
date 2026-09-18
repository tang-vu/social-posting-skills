# ai-cli-editor

AI pair-programming in your terminal. Edit code with natural language,
keep full control of every diff.

## What's new in v1.0

- Inline diff review before every write
- Multi-file context with automatic symbol indexing
- Works with OpenAI, Anthropic, and local models
- Zero-config: point it at a repo and start

## Try it

```
npm i -g ai-cli-editor
ace edit src/ --prompt "extract the retry logic"
```

## How it works

The editor builds a symbol index of the repository, sends only the
relevant slices to the model, and applies returned edits as reviewable
diffs — never blind writes.

[Repository](https://github.com/example/ai-cli-editor)
