// macuenta - webxdc skeleton (Step 1)
// Implements minimal event log + replay for expense.add & noop

(function () {
  'use strict';

  // ------------------------------
  // Elements
  // ------------------------------
  const el = {
    addExpenseBtn: document.getElementById('add-expense-btn'),
    noopBtn: document.getElementById('noop-btn'),
    content: document.getElementById('content'),
    expenseCount: document.getElementById('expense-count'),
  };

  // ------------------------------
  // App State
  // ------------------------------
  const state = {
    initialized: false,
    events: [], // raw updates (envelopes) as received
    expenses: new Map(), // expenseId -> expense object (last wins)
    expenseCount: 0,
    clientId: randomId(),
  };

  // ------------------------------
  // Types / Helpers
  // ------------------------------
  // Event envelope shape v1 (subset for step 1):
  // { v:1, type:'expense.add'|'noop', ts, actor, clientId, eventId, expense? }

  function randomId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ------------------------------
  // webxdc Integration
  // ------------------------------
  function sendEnvelope(envelope) {
    try {
      if (!window.webxdc || typeof window.webxdc.sendUpdate !== 'function') {
        console.log('webxdc not available, running in browser mode. Simulating receive.');
        // Directly handle like a received update for local dev in browser
        handleIncomingEnvelope({ payload: envelope });
        return Promise.resolve();
      }
      window.webxdc.sendUpdate({
        payload: envelope,
        info: envelope.type === 'expense.add' ? 'Added expense' : 'noop',
        summary: '',
      });
    } catch (error) {
      console.error('Error sending update:', error);
    }
  }

  function handleIncomingEnvelope(update) {
    if (!update || !update.payload) return;
    const env = update.payload;
    if (!env || env.v !== 1) return;
    if (!['expense.add', 'noop'].includes(env.type)) return; // ignore unknown types for step1

    // Deduplicate by eventId
    if (state.events.find(e => e.eventId === env.eventId)) return;

    state.events.push(env);
    applyEnvelope(env);
  }

  function applyEnvelope(env) {
    if (env.type === 'expense.add' && env.expense) {
      const cur = state.expenses.get(env.expense.id);
      if (!cur || env.expense.rev > cur.rev) {
        state.expenses.set(env.expense.id, env.expense);
      }
      recomputeExpenseCount();
    }
    // noop: nothing else
    updateSubtitle();
    render();
  }

  function recomputeExpenseCount() {
    // Count non-deleted expenses
    let count = 0;
    state.expenses.forEach(exp => { if (!exp.deleted) count++; });
    state.expenseCount = count;
  }

  function updateSubtitle() {
    const subtitle = `${state.expenseCount} expense${state.expenseCount === 1 ? '' : 's'}`;
    if (window.webxdc && window.webxdc.setInfo) {
      window.webxdc.setInfo({
        title: 'macuenta',
        subtitle,
        image: 'icon.png'
      });
    }
  }

  function broadcastDummyExpense() {
    const expense = {
      id: randomId(),
      rev: 1,
      description: 'Dummy expense',
      amountMinor: 1234, // 12.34
      currency: 'EUR',
      payer: 'demo',
      splits: [],
      createdAt: Date.now(),
      createdBy: state.clientId,
    };
    const envelope = {
      v: 1,
      type: 'expense.add',
      ts: Date.now(),
      actor: 'demo',
      clientId: state.clientId,
      eventId: randomId(),
      expense,
    };
    sendEnvelope(envelope);
  }

  function sendNoop() {
    const envelope = {
      v: 1,
      type: 'noop',
      ts: Date.now(),
      actor: 'demo',
      clientId: state.clientId,
      eventId: randomId(),
    };
    sendEnvelope(envelope);
  }

  function initWebxdc() {
    try {
      if (window.webxdc && typeof window.webxdc.setUpdateListener === 'function') {
        window.webxdc.setUpdateListener((update) => {
          handleIncomingEnvelope(update);
        });
        console.log('webxdc update listener initialized');
      }
    } catch (error) {
      console.error('Error initializing webxdc:', error);
    }
  }

  // ------------------------------
  // App Functions
  // ------------------------------
  function init() {
    if (state.initialized) return;
    
  console.log('Initializing macuenta skeleton...');
    
    // Initialize webxdc
    initWebxdc();
    
    // Set up event listeners
    setupEventListeners();
    
    state.initialized = true;
    
    render();
    updateSubtitle();
  }

  function setupEventListeners() {
    el.addExpenseBtn && el.addExpenseBtn.addEventListener('click', () => {
      broadcastDummyExpense();
    });
    el.noopBtn && el.noopBtn.addEventListener('click', () => {
      sendNoop();
    });
  }

  function render() {
    if (el.expenseCount) {
      el.expenseCount.textContent = String(state.expenseCount);
    }
  }

  // ------------------------------
  // Initialize App
  // ------------------------------
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();