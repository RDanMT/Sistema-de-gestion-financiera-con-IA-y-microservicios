import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { aiAPI } from '../services/api';
import { Send, Bot, Loader2, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  '¿Cuánto ahorro si pago un 15% extra a mi préstamo este mes?',
  '¿En qué categoría gasto más dinero?',
  '¿Cuál es mi balance de ingresos vs gastos?',
  '¿Cuándo liquido mi préstamo actual?',
  '¿Cuánto pago de intereses este año?',
];

export default function AIChat() {
  const { loans, fetchLoans } = useFinanceStore();
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: '¡Hola! Soy **FinBot**, tu asesor financiero con IA 🤖\n\nPuedo responder preguntas sobre tus préstamos, gastos e ingresos usando **únicamente tus datos reales**. Prueba con una de las sugerencias de abajo o escribe tu propia pregunta.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchLoans(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const pregunta = text || input.trim();
    if (!pregunta) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: pregunta, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const { data } = await aiAPI.chat({
        pregunta,
        loanId: selectedLoanId || undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: data.data?.respuesta || 'No pude generar una respuesta.',
          meta: `Modelo: ${data.data?.modelo || 'N/A'} • Contexto: ${data.data?.contexto_usado?.prestamos || 0} préstamos, ${data.data?.contexto_usado?.transacciones || 0} categorías`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: '❌ Error al conectar con el asistente. Verifica que el servicio de IA esté activo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 Asistente IA Financiero</h1>
          <p className="page-subtitle">Consultas inteligentes basadas en tus datos reales</p>
        </div>
        {loans.length > 0 && (
          <div>
            <label className="form-label" style={{ marginBottom: '4px' }}>Foco en préstamo:</label>
            <select className="form-select" style={{ width: '200px' }} value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}>
              <option value="">Todos los préstamos</option>
              {loans.map((l) => <option key={l._id} value={l._id}>{l.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="page-container">
        <div className="card chat-container" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Encabezado del chat */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--gradient-blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>FinBot — Asesor con IA</div>
              <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }} />
                Responde solo con tus datos financieros reales
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="badge badge-blue"><Sparkles size={11} /> IA Contextualizada</span>
            </div>
          </div>

          {/* Mensajes */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.role === 'bot' && <div className="bot-label">🤖 FinBot</div>}
                <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                {msg.meta && (
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{msg.meta}</div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble bot">
                <div className="bot-label">🤖 FinBot</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Analizando tus datos financieros...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias */}
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                {s.length > 45 ? s.slice(0, 45) + '...' : s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Pregunta sobre tus finanzas... (Enter para enviar)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={isTyping || !input.trim()}>
              {isTyping ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
