export const streamChat = async (question, sessionId, documentId, onChunk, onDone, onError) => {
  try {
    const res = await fetch('http://localhost:8000/api/chat/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, sessionId, documentId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to connect to chat stream');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      
      // Keep the last incomplete chunk in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              onError(new Error(data.error));
            } else if (data.done) {
              onDone(data.sources);
            } else if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON:', e);
          }
        }
      }
    }
  } catch (error) {
    onError(error);
  }
};
