# 📓 NotebookLLM Clone — RAG-Powered Document Q&A System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

A production-ready RESTful backend API for a Retrieval-Augmented Generation (RAG) powered Document Q&A System. Upload PDFs, and instantly chat with them. The system extracts text, chunks it, generates embeddings using Google Gemini API, and performs semantic vector search using MongoDB Atlas to provide grounded, hallucination-free answers streamed in real-time.

---

## 🌟 Key Features

- **📄 Smart PDF Ingestion:** Upload PDFs up to 200 pages/20MB. Automatically parsed and cleaned in the background.
- **✂️ Recursive Chunking:** Intelligently splits text on paragraph, sentence, or word boundaries with configurable overlap to preserve context.
- **🧮 Vector Embeddings:** Uses Google Gemini's `text-embedding-004` to generate 768-dimensional semantic embeddings.
- **🔍 Semantic Vector Search:** Powered by MongoDB Atlas `$vectorSearch` with cosine similarity and metadata filtering.
- **💬 Streaming Responses:** ChatGPT-style word-by-word streaming using Server-Sent Events (SSE) and `gemini-3.0-flash`.
- **🧠 Conversation Memory:** Remembers context across multi-turn Q&A sessions using Redis Lists.
- **🚦 Rate Limiting:** Fixed-window counter protecting the Gemini API from abuse (20 requests/min per IP).
- **⚙️ Background Workers:** Non-blocking PDF processing via Redis `LPUSH`/`BRPOP` job queues.
- **📌 Hallucination Prevention:** Strict system prompting and similarity thresholding to ensure answers come *only* from the document.
- **🎨 Frontend:** Vibecoded frontend using Antigravity AI.

---

## 🔄 System Architecture

### Document Ingestion Flow
```text
[PDF Upload] → Multer → [MongoDB status: processing] → [Redis Queue]
                                                               │
┌──────────────────────────────────────────────────────────────┘
│
└─► Worker (BRPOP) → Parse Text → Clean → Recursive Chunking 
       │
       └─► Gemini Embedding API → Bulk Insert to MongoDB (Chunks) → [Status: ready]
```

### Query & RAG Flow
```text
[User Question] → Rate Limit Check
                       │
                       └─► Load Chat History (Redis)
                         │
                         └─► Embed Question (Gemini) → MongoDB $vectorSearch (Top 5 Chunks)
                               │
                               └─► Build Prompt (Context + History + Question)
                                      │
                                      └─► Gemini Chat API → Stream SSE to Client 
                                      │
                                      └─► Save to History
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js | Fast, async-first backend execution |
| **Framework** | Express.js | Robust routing and middleware handling |
| **Database** | MongoDB Atlas | Document storage & Vector Search engine |
| **Cache & Queue** | Redis (ioredis) | Job queues, conversational memory, caching, rate limits |
| **AI SDK** | `@google/genai` | Unified SDK for Google Gemini models |
| **Embeddings** | `text-embedding-004` | Generating 768-dimensional vectors representing text meaning |
| **Chat LLM** | `gemini-3.0-flash` | Fast, cost-effective model for answering grounded questions |
| **Parsing** | `pdf-parse` & `multer` | Handling multipart uploads and extracting raw text from PDFs |

---

## 🛣️ API Endpoints

### 📄 Document Routes (`/api/documents`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload a PDF (multipart/form-data). Returns Job ID. |
| `GET` | `/` | List all uploaded documents (paginated). |
| `GET` | `/:id` | Get specific document details and processing status. |
| `DELETE` | `/:id` | Delete document, all associated chunks, and invalidate caches. |

### 💬 Chat Routes (`/api/chat`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ask` | Ask a question. Returns a Server-Sent Events (SSE) stream. |
| `GET` | `/history/:sessionId` | Retrieve conversation history for a specific session. |
| `DELETE` | `/history/:sessionId` | Clear history for a fresh conversation. |

### ⚙️ Job Routes (`/api/jobs`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:jobId` | Poll background worker status (`parsing`, `chunking`, `completed`, etc.) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20.6+)
- MongoDB Atlas account (with a Vector Search index created on the `chunks` collection)
- Redis server running locally or via cloud
- Google Gemini API Key

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/notebook-llm-clone.git
cd notebook-llm-clone

# Install dependencies
npm install

# Create uploads directory
mkdir -p uploads && touch uploads/.gitkeep
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ntbLlmClone
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Setup MongoDB Vector Index
In your MongoDB Atlas Dashboard, create a Search Index named `vector_index` on the `chunks` collection using the JSON editor:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    }
  ]
}
```

### 5. Run the Application

```bash
# Start the server (with auto-reload and auto .env loading)
npm run dev
```

The server will start on `http://localhost:8000` and the background ingestion worker will automatically begin polling Redis for new PDF jobs.

---

## 🧠 Key Engineering Decisions

- **Why Redis for Job Queues?** `BRPOP` provides a lightweight, blocking, zero-polling background task mechanism perfectly suited for single-node Node.js apps without adding the overhead of RabbitMQ or Kafka.
- **Why Cosine Similarity?** Cosine similarity measures the angle between vectors, making it highly effective for semantic text matching regardless of the text length (magnitude).
- **Why SSE for Chat?** Generating complex LLM responses can take several seconds. Server-Sent Events allow the backend to stream tokens to the client as they are generated, vastly improving perceived performance and UX.
