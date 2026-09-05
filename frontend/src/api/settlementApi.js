const API_BASE = '';

/**
 * Settlement API client.
 * All methods call the backend REST API and return JSON responses.
 */
const settlementApi = {
  /**
   * Health check
   */
  async health() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  /**
   * Investigate a transaction by ID
   */
  async investigate(transactionId) {
    const res = await fetch(`${API_BASE}/api/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId }),
    });
    if (res.status === 404) {
      const err = await res.json();
      throw new Error(err.detail || 'Transaction not found');
    }
    if (res.status === 422) {
      const err = await res.json();
      throw new Error('Invalid transaction ID format');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Investigation failed');
    }
    return res.json();
  },

  /**
   * Get list of transactions with optional filters
   */
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.date) params.set('date', filters.date);
    if (filters.merchant_id) params.set('merchant_id', filters.merchant_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/transactions${query}`);
    if (!res.ok) throw new Error('Failed to load transactions');
    return res.json();
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  /**
   * Get curated demo transactions
   */
  async getDemoTransactions() {
    const res = await fetch(`${API_BASE}/api/demo-transactions`);
    if (!res.ok) throw new Error('Failed to load demo transactions');
    return res.json();
  },
};

export default settlementApi;
