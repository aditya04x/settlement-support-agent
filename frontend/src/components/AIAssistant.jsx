import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, RefreshCw, X, MessageSquare,
  FlaskConical, Info
} from 'lucide-react';

/* ─── Demo response generator ────────────────────────────────────────────── */
function generateDemoResponse(question, investigation, explanation) {
  const q = question.toLowerCase();
  const txnId = investigation?.transaction_id || 'this transaction';
  const status = investigation?.final_status || 'UNKNOWN';
  const rootCause = investigation?.root_cause || 'Unknown';
  const confidence = investigation?.confidence || 'MEDIUM';
  const amount = investigation?.amount;
  const currency = investigation?.currency || 'INR';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  const amtStr = amount != null ? `${sym}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : 'N/A';

  const gwStatus = investigation?.gateway?.status || 'N/A';
  const bkStatus = investigation?.bank?.found ? investigation.bank.status : 'not found';
  const ldStatus = investigation?.ledger?.found ? investigation.ledger.status : 'not found';

  // Build context-aware responses
  if (q.includes('why') && q.includes('delay')) {
    return {
      text: `${txnId} is delayed because the payment gateway successfully processed the ${amtStr} payment, but the bank settlement is still pending. The internal ledger has already recorded the transaction.`,
      rootCause: rootCause,
      confidence: confidence,
      action: 'Monitor the settlement and escalate if it exceeds the expected SLA.',
    };
  }

  if (q.includes('fail')) {
    if (status === 'PAYMENT_FAILED' || status === 'SETTLEMENT_FAILED') {
      return {
        text: `${txnId} failed at the ${gwStatus === 'FAILED' ? 'payment gateway' : 'bank settlement'} stage. Amount: ${amtStr}. Root cause: ${rootCause}.`,
        rootCause: rootCause,
        confidence: confidence,
        action: explanation?.recommended_action || 'Review the failure reason and consider retrying.',
      };
    }
    return {
      text: `${txnId} has a status of "${status}" which is not a direct failure. Root cause: ${rootCause}.`,
      rootCause: rootCause,
      confidence: confidence,
      action: explanation?.recommended_action || 'Monitor and review as needed.',
    };
  }

  if (q.includes('explain') || q.includes('simple') || q.includes('what')) {
    return {
      text: explanation?.summary ||
        `${txnId} is a ${amtStr} transaction. Gateway: ${gwStatus}, Bank: ${bkStatus}, Ledger: ${ldStatus}. Current status: ${status}. Root cause: ${rootCause}.`,
      rootCause: rootCause,
      confidence: confidence,
      action: explanation?.recommended_action || 'Review the transaction details above.',
    };
  }

  if (q.includes('attention') || q.includes('need')) {
    return {
      text: `Based on the current investigation, ${txnId} requires attention because its status is "${status}". Root cause: ${rootCause}. Gateway: ${gwStatus}, Bank: ${bkStatus}, Ledger: ${ldStatus}.`,
      rootCause: rootCause,
      confidence: confidence,
      action: explanation?.recommended_action || 'Follow up based on the root cause analysis.',
    };
  }

  // Default response
  return {
    text: explanation?.summary ||
      `${txnId} has been investigated. Status: ${status}. Amount: ${amtStr}. Gateway: ${gwStatus}, Bank: ${bkStatus}, Ledger: ${ldStatus}. Root cause: ${rootCause}.`,
    rootCause: rootCause,
    confidence: confidence,
    action: explanation?.recommended_action || 'Review the investigation results for more details.',
  };
}

/* ─── Chat Message Component ─────────────────────────────────────────────── */
function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        {/* Time */}
        <div className={`text-[10px] text-slate-400 mb-1 ${isUser ? 'text-right' : ''}`}>
          {message.time}
        </div>

        {/* Bubble */}
        <div className={`rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-700 rounded-bl-sm border border-slate-200'
        }`}>
          {message.text}
        </div>

        {/* AI metadata */}
        {!isUser && message.rootCause && (
          <div className="mt-2 space-y-1 text-[11px]">
            <div className="text-slate-600">
              <span className="font-semibold">Root cause:</span> {message.rootCause}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">Confidence:</span> {message.confidence}
            </div>
            {message.action && (
              <div className="text-slate-600">
                <span className="font-semibold">Recommended action:</span> {message.action}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main AI Assistant Component ────────────────────────────────────────── */
export default function AIAssistant({ isOpen, onClose, investigation, explanation }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const txnId = investigation?.transaction_id || 'TXN100001';

  const suggestedQuestions = [
    `Why is ${txnId} delayed?`,
    'Show me all failed transactions',
    'What transactions need attention?',
    'Explain this transaction in simple terms',
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSend = (text) => {
    const question = text || inputValue.trim();
    if (!question) return;

    // Add user message
    const userMsg = {
      role: 'user',
      text: question,
      time: getTimeString(),
    };

    // Generate demo response
    const demoResp = generateDemoResponse(question, investigation, explanation);
    const aiMsg = {
      role: 'assistant',
      text: demoResp.text,
      rootCause: demoResp.rootCause,
      confidence: demoResp.confidence,
      action: demoResp.action,
      time: getTimeString(),
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInputValue('');
  };

  const handleRefresh = () => {
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-panel">
      {/* Header */}
      <div className="ai-assistant-header">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-800">Settlement AI Assistant</h3>
            <p className="text-[10px] text-slate-500">
              Ask me about transactions, settlement issues, or investigation results.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          aria-label="Close assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="ai-assistant-messages">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">
              Ask a question about the current transaction
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-slate-500 font-medium mb-2">Suggested questions:</p>
          <div className="space-y-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="w-full text-left text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="px-3 pb-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-medium">Suggested questions:</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.slice(0, 2).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors border border-blue-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="ai-assistant-input">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about settlements..."
          className="flex-1 bg-transparent text-[12px] text-slate-700 placeholder-slate-400 outline-none"
          spellCheck={false}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim()}
          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Demo mode disclaimer */}
      <div className="px-3 py-2 border-t border-slate-100">
        <div className="flex items-start gap-1.5">
          <FlaskConical className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-400 leading-relaxed">
            Answers are based on verified transaction data and may not include real-time bank information.
            <span className="text-amber-500 font-medium"> AI: Demo Mode</span>
          </p>
        </div>
      </div>
    </div>
  );
}
