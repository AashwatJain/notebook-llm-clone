import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '../utils/sseParser';

export default function ChatBox({ document }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fake session ID for now, since we haven't implemented auth or persistent sessions
  const sessionId = useRef(`session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat if document changes
  useEffect(() => {
    setMessages([]);
    sessionId.current = `session-${Date.now()}`;
  }, [document._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = Date.now();
    setMessages(prev => [...prev, { id: botMessageId, role: 'model', content: '', sources: [] }]);

    await streamChat(
      userMessage.content,
      sessionId.current,
      document._id,
      // onChunk
      (textChunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: msg.content + textChunk }
            : msg
        ));
      },
      // onDone
      (sources) => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, sources }
            : msg
        ));
        setIsLoading(false);
      },
      // onError
      (error) => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: msg.content || `Error: ${error.message}` }
            : msg
        ));
        setIsLoading(false);
      }
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <div style={{ 
        padding: 'var(--spacing-lg) var(--spacing-xl)', 
        borderBottom: '1px solid var(--border-color)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 500 }}>{document.originalName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, marginTop: '2px' }}>
            AI Analysis Active
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: 'var(--spacing-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xl)',
        paddingBottom: '120px' // Space for floating input
      }}>
        {messages.length === 0 ? (
          <div className="animate-slide-up" style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '400px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-lg)', border: '1px solid var(--border-color)' }}>
              <Bot size={32} color="var(--accent-color)" />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>How can I help?</h3>
            <p style={{ fontSize: '0.95rem' }}>Ask anything about the contents of this document. I will analyze it and provide citations.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className="animate-slide-up" style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--bg-card)' : 'transparent',
                border: msg.role === 'user' ? '1px solid var(--border-color)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                {msg.role === 'user' ? <User size={16} color="var(--text-secondary)" /> : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>N</span>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: msg.role === 'user' ? 0 : '12px', marginRight: msg.role === 'user' ? '12px' : 0 }}>
                  {msg.role === 'user' ? 'You' : 'NotebookLLM'}
                </span>
                <div style={{
                  background: msg.role === 'user' ? 'var(--accent-gradient)' : 'var(--bg-card)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--radius-xl)',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : 'var(--radius-xl)',
                  borderTopLeftRadius: msg.role === 'user' ? 'var(--radius-xl)' : '4px',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: msg.role === 'user' ? '0 4px 14px rgba(129, 140, 248, 0.2)' : 'none'
                }}>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ 
                      marginTop: 'var(--spacing-md)', 
                      paddingTop: 'var(--spacing-sm)', 
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ opacity: 0.7 }}>Sources:</span>
                      {msg.sources.map((s, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                          Chunk {s.chunkIndex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div style={{ 
        position: 'absolute', 
        bottom: 'var(--spacing-xl)', 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: 'calc(100% - var(--spacing-2xl) * 2)',
        maxWidth: '800px',
        zIndex: 20
      }}>
        <form 
          onSubmit={handleSubmit}
          className="glass-panel"
          style={{ 
            display: 'flex', 
            gap: 'var(--spacing-sm)', 
            padding: 'var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) var(--spacing-lg)',
            alignItems: 'center',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(10, 10, 10, 0.8)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--border-color)'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask NotebookLLM about '${document.originalName}'...`}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              padding: 'var(--spacing-sm) 0'
            }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading || !input.trim()}
            style={{ 
              borderRadius: 'var(--radius-full)', 
              padding: '10px 20px',
              height: '40px'
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-pulse" /> : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Submit <Send size={14} /></span>}
          </button>
        </form>
      </div>
    </div>
  );
}
