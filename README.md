# ThinkHere

**Privacy-first AI chat that runs entirely in your browser.** [thinkhere.ai](https://thinkhere.ai)

No servers. No API keys. No data leaves your device. Powered by [WebLLM](https://github.com/mlc-ai/web-llm), [Transformers.js](https://huggingface.co/docs/transformers.js), and WebGPU.

## How it works

ThinkHere downloads and runs open-source language models directly in your browser using WebGPU for GPU-accelerated inference. Models are cached after the first download, so subsequent loads take only seconds.

Two runtime architectures are supported:

- **WebLLM + MLC** — Models are ahead-of-time compiled via Apache TVM into optimized WebGPU compute shaders. Fast inference, smaller download sizes.
- **Transformers.js + ONNX Runtime Web** — Standard ONNX-format models interpreted at load time. Supports a wider range of architectures and falls back to WASM on devices without WebGPU.

### Available models

| Model | Size | Runtime | Description |
|-------|------|---------|-------------|
| Gemma 4 E2B | ~1.2 GB | Transformers.js | Google's next-gen multimodal model — text, image & audio, built-in thinking mode |
| Gemma 4 E4B | ~2.1 GB | Transformers.js | Google's larger multimodal model — enhanced reasoning with thinking mode |
| Qwen3.5 0.8B | ~600 MB | Transformers.js | Alibaba's tiny multimodal model — text + vision |
| Qwen3.5 2B | ~1.5 GB | Transformers.js | Alibaba's small multimodal model — great balance of size and quality |
| Qwen3.5 4B | ~2.9 GB | Transformers.js | Alibaba's mid-range multimodal model — strong multilingual & vision |
| SmolLM2 1.7B | ~1 GB | WebLLM | Great balance of size and capability |
| Mistral 7B | ~3.8 GB | WebLLM | Mistral AI's flagship small model — strong reasoning & coding |
| Llama 3.2 1B | ~700 MB | WebLLM | Meta's compact model |

## Features

### Multimodal input (Gemma 4)
Gemma 4 models support image and audio input alongside text. Attach images via the image button, paste from clipboard, or drag and drop onto the chat. Attached images are displayed in the chat and sent directly to the model for on-device processing. Available when a multimodal model (Gemma 4 E2B or E4B) is loaded.

### Knowledge base (RAG)
Upload documents (.txt, .md, .json, .csv, and more) to build a local knowledge base. Documents are chunked, embedded using a dedicated embedding model ([Qwen3-Embedding-0.6B](https://huggingface.co/onnx-community/Qwen3-Embedding-0.6B-ONNX)), and stored in IndexedDB — everything stays in your browser. When RAG is enabled, each query triggers a hybrid search (70% semantic similarity + 30% keyword overlap) and the most relevant chunks are injected into the prompt. Toggle RAG on/off from the Knowledge Base section in settings. Documents persist across page reloads; the embedding model is cached after the first download. Chunks are cached in memory after the first retrieval for fast subsequent queries.

### System prompts
Choose from built-in presets (Coding Assistant, Writing Editor, Translator, Concise Mode) or write a custom system prompt. Collapsed by default in the settings panel above the chat. Typing a custom prompt switches the dropdown to "Custom" automatically. System prompts are available on models with strong instruction adherence (Qwen3.5 4B, Gemma 4 E2B/E4B) — the section is disabled for smaller models that don't reliably follow them.

### Generation controls
Adjust temperature, top-p, and max tokens via sliders in the settings panel. Defaults are sensible but tunable per conversation.

### Markdown rendering
Assistant responses are rendered as formatted markdown — headings, lists, code blocks with syntax highlighting, tables, and inline formatting all display properly.

### Conversation export
Export the current conversation as a `.md` file with a single click. Messages are formatted with role headers and timestamps.

### Conversation persistence
Conversations are automatically saved to IndexedDB. Reopen the browser and pick up where you left off. Manage saved conversations from the history panel.

### Document context
Drag and drop a file onto the chat (or use the attach button) to inject its contents as context. Supports text, markdown, code, CSV, and JSON files (up to 50 KB). When a multimodal model is active, dropped images are routed to the image attachment system instead.

### Token count
A live estimate of the current context window usage is displayed below the chat input, with a visual progress bar and warning thresholds.

### Stop generation
Interrupt a response mid-stream with the stop button. Works with both backends (WebLLM and Transformers.js).

## Browser requirements

WebGPU is required for GPU-accelerated inference. Supported browsers:

- **Chrome** 113+
- **Edge** 113+

Other Chromium-based browsers with WebGPU support may also work. Safari and Firefox do not yet fully support WebGPU.

Transformers.js models can fall back to WASM on browsers without WebGPU, but performance will be significantly slower. WebLLM models require WebGPU and have no fallback.

## Running locally

No build step is needed. Open `index.html` directly, or serve it with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in a WebGPU-capable browser.

## Deployment

This site is designed for static hosting. To deploy on GitHub Pages:

1. Push the repo to GitHub
2. Go to **Settings > Pages**
3. Set the source to the branch you want to deploy (e.g. `main`)
4. The site will be live at `https://thinkhere.ai`

The `.nojekyll` file is included to ensure GitHub Pages serves files as-is without Jekyll processing.

## Project structure

```
thinkhere/
├── index.html      # The entire application (HTML + CSS + JS)
├── favicon.svg     # Browser tab icon
├── 404.html        # Custom 404 page for GitHub Pages
├── .nojekyll       # Bypasses Jekyll on GitHub Pages
├── .gitignore
├── LICENSE          # MIT
└── README.md
```

## License

[MIT](LICENSE)
