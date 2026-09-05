import { Bot, ArrowRight } from 'lucide-react';

export default function FloatingAIButton({ onClick, isAssistantOpen }) {
  if (isAssistantOpen) return null;

  return (
    <button
      onClick={onClick}
      className="floating-ai-btn"
      aria-label="Open Settlement AI Assistant"
    >
      <Bot className="w-4 h-4" />
      <span className="text-[13px] font-semibold">Ask Settlement AI</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}
