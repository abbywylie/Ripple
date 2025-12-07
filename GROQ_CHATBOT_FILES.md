# Groq Chatbot - Files That Control Output & Behavior

## 📋 Overview

The Groq chatbot (RAG Assistant) behavior is controlled by several key files. Here's a complete breakdown:

---

## 🎯 Core Files (Backend)

### 1. **`backend/services/rag_service.py`** ⭐ **PRIMARY FILE**
**Purpose:** Main logic for the chatbot - handles everything from knowledge base loading to Groq API calls.

**Key Functions:**
- `answer_rag_question()` - Main entry point, orchestrates the entire flow
- `load_knowledge_base_from_folder()` - Loads .md/.txt files from knowledge_base/
- `get_relevant_context()` - Retrieves relevant chunks from knowledge base
- `_build_messages()` - Builds the prompt sent to Groq/OpenAI
- `_format_conversational()` - Formats the response into conversational style
- `_detect_intent()` - Detects user intent (email_intro, email_thanks, etc.)
- `_filter_context()` - Filters out directory listings from context
- `retrieve_context()` - Semantic search to find relevant knowledge base chunks

**What Controls:**
- ✅ Which LLM to use (Groq vs OpenAI)
- ✅ How knowledge base files are loaded
- ✅ How context is retrieved and filtered
- ✅ Response formatting and structure
- ✅ System prompts and instructions to LLM
- ✅ Temperature, max_tokens, and other LLM parameters

**Key Settings:**
```python
model="llama-3.1-8b-instant"  # Groq model
temperature=0.4                # Creativity level
max_tokens=220                 # Response length limit
```

---

### 2. **`backend/api/main.py`** (RAG Endpoint)
**Location:** Lines ~761-780

**Purpose:** API endpoint that connects frontend to RAG service

**Key Code:**
```python
@app.post("/api/rag/query", response_model=dict)
def rag_query_endpoint(payload: RAGQuery):
    if answer_rag_question is None:
        raise HTTPException(status_code=503, detail="RAG service not available")
    result = answer_rag_question(payload.query)
    return result
```

**What Controls:**
- ✅ API endpoint URL (`/api/rag/query`)
- ✅ Request/response format
- ✅ Error handling

---

## 🎨 Frontend Files

### 3. **`frontend/src/components/RAGAssistant.tsx`**
**Purpose:** UI component and frontend logic

**Key Functions:**
- `handleSend()` - Sends user query to backend API
- `cleanResponse()` - Cleans markdown formatting from responses
- Message state management
- UI rendering and display

**What Controls:**
- ✅ How questions are sent to backend
- ✅ How responses are displayed
- ✅ UI/UX of the chat interface
- ✅ Example questions shown to users

**Key Code:**
```typescript
const response = await api.post("/api/rag/query", {
  query: textToSend,
});
```

---

## 📚 Knowledge Base Files

### 4. **`backend/knowledge_base/**/*.md`** and **`*.txt`**
**Purpose:** Content that the chatbot uses to answer questions

**Location:** All `.md` and `.txt` files in `backend/knowledge_base/` and subdirectories

**What Controls:**
- ✅ What information the chatbot knows
- ✅ What answers it can provide
- ✅ Templates and examples it can reference

**Key Files:**
- `guides/user-success/networking-timeline.md`
- `guides/user-success/getting-started-with-networking.md`
- `templates/intros/informational_interview_request.md`
- `templates/follow-ups/thank_you_email_informational.md`
- `playbooks/interviews/informational_interview_guide.md`
- etc.

**Note:** `README.md` files are automatically skipped

---

## ⚙️ Configuration Files

### 5. **Environment Variables** (Render Dashboard)
**Location:** Render → Your Service → Environment

**Variables:**
- `GROQ_API_KEY` - Groq API key (required for Groq)
- `OPENAI_API_KEY` - OpenAI API key (optional fallback)

**What Controls:**
- ✅ Which LLM service is used
- ✅ API authentication

---

## 🔧 Response Formatting Functions

### In `rag_service.py`:

1. **`_format_conversational()`** - Wraps response with:
   - Opening acknowledgement
   - Bullet points
   - Email template (if relevant)
   - Follow-up question

2. **`_acknowledge()`** - Generates opening line based on query
   - "Sounds like you just met someone..."
   - "You're crafting outreach..."

3. **`_normalize_bullets()`** - Formats bullet points (3-5 max)

4. **`_maybe_email_template()`** - Adds email template if query is about emails/intros

5. **`_follow_up()`** - Adds follow-up question at end

---

## 🎛️ How to Customize Behavior

### Change Response Style:
**File:** `backend/services/rag_service.py`
- **Function:** `_build_messages()` - Edit system prompt
- **Function:** `_format_conversational()` - Change response structure

### Change LLM Model:
**File:** `backend/services/rag_service.py`
- **Line ~167:** Change `model="llama-3.1-8b-instant"` to another Groq model
- **Line ~203:** Change `model="gpt-3.5-turbo"` for OpenAI

### Change Response Length:
**File:** `backend/services/rag_service.py`
- **Line ~170:** Change `max_tokens=220` (higher = longer responses)

### Change Creativity:
**File:** `backend/services/rag_service.py`
- **Line ~169:** Change `temperature=0.4` (0.0-1.0, higher = more creative)

### Add/Update Knowledge:
**Location:** `backend/knowledge_base/`
- Add new `.md` or `.txt` files
- Files are automatically loaded on next request
- Place in appropriate subdirectory for better organization

### Change UI/Display:
**File:** `frontend/src/components/RAGAssistant.tsx`
- Modify message rendering
- Change example questions
- Update styling

---

## 📊 Data Flow

```
User Types Question
    ↓
RAGAssistant.tsx (frontend)
    ↓
POST /api/rag/query
    ↓
main.py → answer_rag_question()
    ↓
rag_service.py:
    1. get_relevant_context() → Loads from knowledge_base/
    2. retrieve_context() → Semantic search
    3. _filter_context() → Removes directory listings
    4. _build_messages() → Creates prompt
    5. Groq API Call → Gets response
    6. _format_conversational() → Formats response
    ↓
Returns to frontend
    ↓
Displayed in chat UI
```

---

## 🎯 Quick Reference

| What You Want to Change | File to Edit |
|------------------------|--------------|
| Response style/tone | `rag_service.py` → `_build_messages()` (system prompt) |
| Response format | `rag_service.py` → `_format_conversational()` |
| LLM model | `rag_service.py` → `answer_rag_question()` (model name) |
| Response length | `rag_service.py` → `max_tokens` parameter |
| Knowledge/content | `backend/knowledge_base/**/*.md` files |
| UI/Display | `frontend/src/components/RAGAssistant.tsx` |
| API endpoint | `backend/api/main.py` → `/api/rag/query` |
| API keys | Render Dashboard → Environment Variables |

---

## 🔍 Debugging Tips

1. **Check if knowledge base is loading:**
   - Look for: `"RAG: Loaded X KB files, built Y chunks"` in logs
   - If 0 files, check `backend/knowledge_base/` folder

2. **Check if Groq is working:**
   - Verify `GROQ_API_KEY` is set in Render
   - Check logs for Groq errors

3. **Check context retrieval:**
   - The `context` field in response shows what was retrieved
   - If empty, knowledge base might not have relevant content

4. **Test locally:**
   ```python
   from services.rag_service import answer_rag_question
   result = answer_rag_question("How do I follow up?")
   print(result)
   ```

---

## 📝 Summary

**Most Important Files:**
1. ⭐ **`backend/services/rag_service.py`** - Core logic (90% of behavior)
2. **`backend/knowledge_base/**/*.md`** - Content/knowledge
3. **`frontend/src/components/RAGAssistant.tsx`** - UI/display
4. **`backend/api/main.py`** - API endpoint

**To change chatbot behavior, edit `rag_service.py`**
**To change what it knows, edit/add files in `knowledge_base/`**

