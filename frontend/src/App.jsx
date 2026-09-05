import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, HelpCircle,
  CreditCard, Ban, XOctagon, TrendingUp, Activity,
  BarChart3, WifiOff, AlertOctagon, RefreshCw, SearchX
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import Header                from './components/Header';
import Sidebar               from './components/Sidebar';
import SearchPanel           from './components/SearchPanel';
import TransactionSummary    from './components/TransactionSummary';
import SystemStatusCard      from './components/SystemStatusCard';
import TransactionTimeline   from './components/TransactionTimeline';
import ExplanationCard       from './components/ExplanationCard';
import ExceptionList         from './components/ExceptionList';
import RawRecords            from './components/RawRecords';
import InvestigationProgress from './components/InvestigationProgress';
import InvestigationHistory  from './components/InvestigationHistory';
import LoadingState          from './components/LoadingState';
import EvidenceChain         from './components/EvidenceChain';
import SystemComparison      from './components/SystemComparison';
import RootCauseRecommendation from './components/RootCauseRecommendation';
import AIAssistant           from './components/AIAssistant';
import FloatingAIButton      from './components/FloatingAIButton';
import settlementApi         from './api/settlementApi';

// New Views
import DashboardView from './components/DashboardView';
import InvestigateView from './components/InvestigateView';
import TransactionsView from './components/TransactionsView';
import AnalyticsView from './components/AnalyticsView';
import SystemHealthView from './components/SystemHealthView';
import SettingsView from './components/SettingsView';
import SplashScreen from './components/SplashScreen';



/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [lastTxnId, setLastTxnId]               = useState(null);
  const [result, setResult]                     = useState(null);
  const [stats, setStats]                       = useState(null);
  const [demoTransactions, setDemoTransactions] = useState([]);
  const [health, setHealth]                     = useState(null);
  const [statsLoading, setStatsLoading]         = useState(true);
  // Session-level investigation history (max 8 items)
  const [history, setHistory]                   = useState([]);
  // New UI states
  const [activeSection, setActiveSection]       = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [showAI, setShowAI]                     = useState(false);

  /* ─── Load initial data ───────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, demoData, healthData] = await Promise.all([
          settlementApi.getStats().catch(() => null),
          settlementApi.getDemoTransactions().catch(() => ({ demo_transactions: [] })),
          settlementApi.health().catch(() => null),
        ]);
        setStats(statsData);
        setDemoTransactions(demoData.demo_transactions || []);
        setHealth(healthData);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []);

  /* ─── Investigation handler ───────────────────────────────────────────── */
  const handleInvestigate = async (transactionId, date, status) => {
    if (!transactionId && !date) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLastTxnId(transactionId);
    setActiveSection('investigate');

    try {
      if (transactionId) {
        const data = await settlementApi.investigate(transactionId);
        setResult(data);

        // Add to session history (deduplicated, newest first, max 8)
        setHistory(prev => {
          const filtered = prev.filter(h => h.transaction_id !== transactionId);
          const entry = {
            transaction_id: transactionId,
            final_status:   data.investigation.final_status,
            amount:         data.investigation.amount,
            currency:       data.investigation.currency,
            root_cause:     data.investigation.root_cause,
            investigatedAt: new Date().toISOString(),
          };
          return [entry, ...filtered].slice(0, 8);
        });
      }
    } catch (e) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => lastTxnId && handleInvestigate(lastTxnId);

  const handleHeaderSearch = (txnId) => {
    handleInvestigate(txnId);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView stats={stats} statsLoading={statsLoading} />;
      case 'investigate':
        return (
          <InvestigateView
            loading={loading}
            error={error}
            result={result}
            demoTransactions={demoTransactions}
            history={history}
            handleInvestigate={handleInvestigate}
            handleRetry={handleRetry}
          />
        );
      case 'transactions':
        return <TransactionsView onInvestigate={handleInvestigate} />;
      case 'analytics':
        return <AnalyticsView stats={stats} statsLoading={statsLoading} />;
      case 'health':
        return <SystemHealthView health={health} />;
      case 'settings':
        return <SettingsView health={health} />;
      default:
        return <DashboardView stats={stats} statsLoading={statsLoading} />;
    }
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
      <SplashScreen />
      <Header
        health={health}
        onSearch={handleHeaderSearch}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="app-layout">
        <Sidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          collapsed={!sidebarOpen}
          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className={`app-main ${showAI ? 'app-main-with-ai' : ''}`}>
          {/* ── Main Layout ── */}
          <div className="w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* AI Assistant Panel */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        investigation={result?.investigation}
        explanation={result?.explanation}
      />

      {/* Floating AI Button */}
      <FloatingAIButton
        onClick={() => setShowAI(true)}
        isAssistantOpen={showAI}
      />

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/40 mt-12 py-5" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-slate-500">
            Settlement Support Agent · AI-Powered Transaction Investigation
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500">
              Deterministic rules engine · Anti-hallucination architecture
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
