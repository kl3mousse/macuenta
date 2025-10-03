// macuenta

(function () {
  'use strict';

  // ------------------------------
  // Elements
  // ------------------------------
  const el = {
    appMain: document.querySelector('.app-main'),
    content: document.getElementById('content'),
    views: Array.from(document.querySelectorAll('.app-view')),
    tabBar: document.getElementById('tab-bar'),
    fabAdd: document.getElementById('fab-add'),
  headerSubtitle: document.getElementById('header-subtitle'),
  // Dynamic group name now resides in hero card (id=group-name)
  headerTitle: document.getElementById('group-name'),
  participantsSummary: document.getElementById('participants-summary'),
  participantsSummaryText: document.getElementById('participants-summary-text'),
  headerTotal: document.getElementById('header-total'),
  participantsSheetBackdrop: document.getElementById('participants-sheet-backdrop'),
  participantsSheet: document.getElementById('participants-sheet'),
  participantsSheetClose: document.getElementById('participants-sheet-close'),
  participantsAddBtn: document.getElementById('participants-add-btn'),
  participantsList: document.getElementById('participants-list'),
  participantsSheetEmpty: document.getElementById('participants-sheet-empty'),
  participantNameInput: document.getElementById('participant-name-input'),
  tripNameInput: document.getElementById('trip-name-input'),
  tripNameSaveBtn: document.getElementById('trip-name-save-btn'),
    expenseCount: document.getElementById('expense-count'),
    expenseForm: document.getElementById('expense-form'),
    expenseTitle: document.getElementById('exp-title'),
    expenseAmount: document.getElementById('exp-amount'),
    expenseDate: document.getElementById('exp-date'), // Ensure date input is present
    expensesList: document.getElementById('expenses-list'),
    noExpensesHint: document.getElementById('no-expenses-hint'),
    expensesEmpty: document.getElementById('expenses-empty'), // new empty state container
    toastStack: document.getElementById('toast-stack'), // toast stack container
    payerDisplay: document.getElementById('exp-payer'),
  payerSelect: document.getElementById('exp-payer'),
    balancesList: document.getElementById('balances-list'),
    noBalancesHint: document.getElementById('no-balances-hint'),
    balanceChart: document.getElementById('balance-chart'),
    settlementsList: document.getElementById('settlements-list'),
    noSettlementsHint: document.getElementById('no-settlements-hint'),
    splitModeSelect: document.getElementById('split-mode'),
    splitConfig: document.getElementById('split-config'),
    completedSettlementsList: document.getElementById('completed-settlements-list'),
    noCompletedSettlementsHint: document.getElementById('no-completed-settlements-hint'),
  settlementSheetBackdrop: document.getElementById('settlement-sheet-backdrop'),
  settlementSheet: document.getElementById('settlement-sheet'),
  settlementSheetClose: document.getElementById('settlement-sheet-close'),
  settlementForm: document.getElementById('settlement-form'),
  settleFrom: document.getElementById('settle-from'),
  settleTo: document.getElementById('settle-to'),
  settleSwap: document.getElementById('settle-swap'),
  settleAmount: document.getElementById('settle-amount'),
  settleDate: document.getElementById('settle-date'),
  settleCurrency: document.getElementById('settle-currency'),
  settleCancel: document.getElementById('settle-cancel'),
    onboardingScreen: document.getElementById('onboarding-screen'),
    onboardingTitleInput: document.getElementById('onboarding-title'),
    onboardingCurrencySelect: document.getElementById('onboarding-currency'),
    onboardingParticipantChips: document.getElementById('onboarding-participant-chips'),
    onboardingParticipantInput: document.getElementById('onboarding-participant-input'),
    onboardingAddParticipantBtn: document.getElementById('onboarding-add-participant'),
    onboardingStartBtn: document.getElementById('onboarding-start'),
    // Ledger elements
    ledgerBtn: document.getElementById('ledger-btn'),
    ledgerSheet: document.getElementById('ledger-sheet'),
    ledgerSheetBackdrop: document.getElementById('ledger-sheet-backdrop'),
    ledgerSheetClose: document.getElementById('ledger-sheet-close'),
    ledgerList: document.getElementById('ledger-list'),
    ledgerEmpty: document.getElementById('ledger-empty'),
    // Payment preferences elements
    paymentPreferencesSheet: document.getElementById('payment-preferences-sheet'),
    paymentPreferencesSheetBackdrop: document.getElementById('payment-preferences-sheet-backdrop'),
    paymentPreferencesSheetClose: document.getElementById('payment-preferences-sheet-close'),
    paymentPreferencesForm: document.getElementById('payment-preferences-form'),
    paymentPreferencesAvatar: document.getElementById('payment-preferences-avatar'),
    paymentPreferencesParticipantName: document.getElementById('payment-preferences-participant-name'),
    primaryPaymentMethod: document.getElementById('primary-payment-method'),
    primaryPaymentDetails: document.getElementById('primary-payment-details'),
    primaryPaymentDetailsField: document.getElementById('primary-payment-details-field'),
    primaryPaymentDetailsLabel: document.getElementById('primary-payment-details-label'),
    primaryPaymentDetailsError: document.getElementById('primary-payment-details-error'),
    secondaryPaymentMethod: document.getElementById('secondary-payment-method'),
    secondaryPaymentDetails: document.getElementById('secondary-payment-details'),
    secondaryPaymentDetailsField: document.getElementById('secondary-payment-details-field'),
    secondaryPaymentDetailsLabel: document.getElementById('secondary-payment-details-label'),
    secondaryPaymentDetailsError: document.getElementById('secondary-payment-details-error'),
    paymentPreferencesCancel: document.getElementById('payment-preferences-cancel'),
    // Category carousel elements
    categoryCarousel: document.getElementById('category-carousel'),
    categoryCarouselTrack: document.getElementById('category-carousel-track'),
  };

  // ------------------------------
  // App State
  // ------------------------------
  const DEFAULT_CURRENCY = 'EUR';
  const currencySymbols = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF',
  };

  const PAYMENT_METHODS = {
    PAYPAL: 'paypal',
    REVOLUT: 'revolut',
    IBAN: 'iban',
    CASH: 'cash',
    OTHER: 'other'
  };

  const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.PAYPAL]: 'PayPal',
    [PAYMENT_METHODS.REVOLUT]: 'Revolut',
    [PAYMENT_METHODS.IBAN]: 'IBAN',
    [PAYMENT_METHODS.CASH]: 'Cash',
    [PAYMENT_METHODS.OTHER]: 'Other'
  };

  const state = {
    initialized: false,
    events: [], // raw updates (envelopes) as received
    expenses: new Map(), // expenseId -> expense object (last wins)
    expenseCount: 0,
    clientId: randomId(),
    actorName: deriveActorName(),
    balances: new Map(), // participant -> net balance (minor units)
    settlements: [], // suggested transfers { from, to, amountMinor }
    recordedSettlements: [], // actual settlement.add events
    editingExpenseId: null,
    participants: new Map(), // id-> {id, displayName, ...}
    meta: {
      title: '',
      currency: 'EUR',
    },
    onboardingDraft: {
      title: '',
      currency: DEFAULT_CURRENCY,
      participants: [],
    },
    localParticipantId: null,
    debugMode: !(typeof window !== 'undefined' && window.webxdc),
    onboardingCompleted: false,
    lastSelectedPayerId: null,
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

  function deriveActorName() {
    // Try to guess a human-friendly name from webxdc if available
    try {
      if (window.webxdc && window.webxdc.selfAddr) {
        return window.webxdc.selfName || window.webxdc.selfAddr || 'me';
      }
    } catch (_) { /* ignore */ }
    // Fallback to a short random tag
    return 'user-' + Math.random().toString(36).slice(2, 6);
  }

  // ------------------------------
  // Icon Component and Category Carousel
  // ------------------------------
  const AVAILABLE_ICONS = [
    'receipt', // Default icon first
    'airplane-in-flight', 'bank', 'books', 'brandy', 'bus', 'car', 'carrot', 
    'castle-turret', 'charging-station', 'cookie',  
    'disco-ball', 'fork-knife', 
    'park',  'pizza', 'popcorn', 
    'shopping-bag', 'shopping-cart', 'suitcase-rolling', 'taxi', 'tent', 
    'ticket'
  ];

  // Cache for loaded SVG content
  const svgCache = new Map();

  /**
   * Loads an SVG icon and returns HTML string with currentColor support
   * @param {string} iconName - Name of the icon file (without .svg extension)
   * @param {Object} options - Icon options
   * @param {number} options.size - Size in pixels (default: 32)
   * @param {boolean} options.selected - Whether icon is selected (default: false)
   * @param {string} options.className - Additional CSS classes
   * @returns {Promise<string>} HTML string for the icon
   */
  async function createIcon(iconName, options = {}) {
    const { size = 32, selected = false, className = '' } = options;
    
    if (!iconName || !AVAILABLE_ICONS.includes(iconName)) {
      iconName = 'receipt'; // fallback
    }

    // Check cache first
    let svgContent = svgCache.get(iconName);
    if (!svgContent) {
      try {
        const response = await fetch(`./icons/${iconName}.svg`);
        if (!response.ok) throw new Error(`Failed to load ${iconName}.svg`);
        svgContent = await response.text();
        
        // Process SVG to support currentColor
        svgContent = svgContent
          .replace(/fill="#[^"]*"/g, 'fill="currentColor"')
          .replace(/stroke="#[^"]*"/g, 'stroke="currentColor"')
          .replace(/width="[^"]*"/g, `width="${size}"`)
          .replace(/height="[^"]*"/g, `height="${size}"`);
        
        svgCache.set(iconName, svgContent);
      } catch (error) {
        console.warn(`Failed to load icon ${iconName}:`, error);
        // Return a simple fallback
        svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="currentColor"><circle cx="16" cy="16" r="12"/></svg>`;
      }
    }

    const classes = `icon ${selected ? 'icon-selected' : ''} ${className}`.trim();
    return `<span class="${classes}" data-icon="${iconName}" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;">${svgContent}</span>`;
  }

  /**
   * Synchronous version that returns a placeholder until SVG loads
   */
  function createIconSync(iconName, options = {}) {
    const { size = 32, selected = false, className = '' } = options;
    const classes = `icon ${selected ? 'icon-selected' : ''} ${className}`.trim();
    
    createIcon(iconName, options).then(html => {
      // Find and replace placeholder icons
      document.querySelectorAll(`[data-icon-placeholder="${iconName}"]`).forEach(placeholder => {
        placeholder.outerHTML = html;
      });
    });

    return `<span class="${classes}" data-icon-placeholder="${iconName}" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;">⏳</span>`;
  }

  // Category carousel state
  let selectedCategory = 'receipt'; // Default to receipt

  // Initialize category icon button (integrated in title field)
  function initializeCategoryIconButton() {
    const iconBtn = document.getElementById('title-category-icon-btn');
    
    if (iconBtn) {
      iconBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openCategoryPopover();
      });
    }
    
    // Initialize with default category icon
    updateTitleCategoryIcon();
  }

  function selectCategory(iconName) {
    selectedCategory = iconName;
    console.log('Selected category:', iconName); // Debug log
    
    // Update visual selection in carousel
    const carousel = document.getElementById('category-carousel-track');
    if (carousel) {
      carousel.querySelectorAll('.category-carousel-btn').forEach(btn => {
        const isSelected = btn.getAttribute('data-icon') === iconName;
        btn.classList.toggle('selected', isSelected);
        
        // Update icon selected state
        const icon = btn.querySelector('.icon');
        if (icon) {
          icon.classList.toggle('icon-selected', isSelected);
        }
      });
    }
    
    // Update category icon in title field
    updateTitleCategoryIcon();
    
    // Auto-suggest title if current title is empty or matches a previous suggestion
    const titleInput = document.getElementById('exp-title');
    const suggestion = suggestTitleForCategory(iconName);
    if (titleInput && suggestion) {
      const currentTitle = titleInput.value.trim();
      const isPreviousSuggestion = Object.values(categoryTitleSuggestions).includes(currentTitle);
      
      if (!currentTitle || isPreviousSuggestion) {
        titleInput.value = suggestion;
        // Don't auto-focus/select to avoid interrupting user typing
      }
    }
  }

  // Category auto-suggestions mapping
  const categoryTitleSuggestions = {
    'pizza': 'Pizza',
    'fork-knife': 'Dinner',
    'car': 'Transportation',
    'taxi': 'Taxi ride',
    'airplane-in-flight': 'Flight',
    'bus': 'Bus ticket',
    'suitcase-rolling': 'Travel',
    'tent': 'Camping',
    'castle-turret': 'Sightseeing',
    'park': 'Park entrance',
    'ticket': 'Event ticket',
    'disco-ball': 'Entertainment',
    'popcorn': 'Cinema',
    'cookie': 'Snacks',
    'brandy': 'Drinks',
    'shopping-bag': 'Shopping',
    'shopping-cart': 'Groceries',
    'bank': 'ATM fee',
    'charging-station': 'Charging',
    'coins': 'Miscellaneous',
    'hand-coins': 'Payment',
    'money-wavy': 'Cash',
    'receipt': 'Expense',
    'wallet': 'Payment',
    'gear-six': 'Service',
    'books': 'Education',
    'carrot': 'Food',
    'scales': 'Service fee'
  };

  // Reverse mapping for title-to-category detection
  const titleCategoryMapping = {};
  Object.entries(categoryTitleSuggestions).forEach(([category, title]) => {
    titleCategoryMapping[title.toLowerCase()] = category;
  });

  function suggestTitleForCategory(iconName) {
    return categoryTitleSuggestions[iconName] || '';
  }

  function detectCategoryFromTitle(title) {
    const lowercaseTitle = title.toLowerCase().trim();
    return titleCategoryMapping[lowercaseTitle] || null;
  }

  async function updateTitleCategoryIcon() {
    const iconContainer = document.getElementById('title-category-icon');
    if (!iconContainer) return;
    
    try {
      const iconHtml = await createIcon(selectedCategory, { size: 20, className: 'title-category-icon' });
      iconContainer.innerHTML = iconHtml;
    } catch (error) {
      console.warn('Failed to update title category icon:', error);
    }
  }

  // ------------------------------
  // Payment Method Validation
  // ------------------------------
  function validatePaymentDetails(method, details) {
    if (!method || !details) return { valid: true };
    
    const trimmed = details.trim();
    if (!trimmed) return { valid: true };

    switch (method) {
      case PAYMENT_METHODS.PAYPAL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(trimmed),
          message: emailRegex.test(trimmed) ? '' : 'Please enter a valid email address'
        };
      
      case PAYMENT_METHODS.REVOLUT:
        const revolutRegex = /^@[a-zA-Z0-9_]+$/;
        const hasAt = trimmed.startsWith('@');
        return {
          valid: hasAt && trimmed.length > 1 && /^@[a-zA-Z0-9_]+$/.test(trimmed),
          message: hasAt && trimmed.length > 1 && /^@[a-zA-Z0-9_]+$/.test(trimmed) ? '' : 'Please enter a valid @username'
        };
      
      case PAYMENT_METHODS.IBAN:
        // Basic IBAN validation (simplified)
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
        const upperTrimmed = trimmed.replace(/\s/g, '').toUpperCase();
        return {
          valid: ibanRegex.test(upperTrimmed),
          message: ibanRegex.test(upperTrimmed) ? '' : 'Please enter a valid IBAN'
        };
      
      case PAYMENT_METHODS.CASH:
        return { valid: true }; // Cash doesn't need details
      
      case PAYMENT_METHODS.OTHER:
        return {
          valid: trimmed.length > 0,
          message: trimmed.length > 0 ? '' : 'Please enter payment details'
        };
      
      default:
        return { valid: true };
    }
  }

  function getPaymentMethodPlaceholder(method) {
    switch (method) {
      case PAYMENT_METHODS.PAYPAL:
        return 'email@example.com';
      case PAYMENT_METHODS.REVOLUT:
        return '@username';
      case PAYMENT_METHODS.IBAN:
        return 'GB82 WEST 1234 5698 7654 32';
      case PAYMENT_METHODS.CASH:
        return 'No details needed';
      case PAYMENT_METHODS.OTHER:
        return 'Enter payment details...';
      default:
        return '';
    }
  }

  function activeCurrency() {
    return state.meta?.currency || DEFAULT_CURRENCY;
  }

  function shouldShowOnboarding() {
    if (state.onboardingCompleted) return false;
    return !state.meta?.title && state.expenseCount === 0;
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
      const infoMap = {
        'expense.add': 'Added expense',
        'expense.edit': 'Updated expense',
        'expense.delete': 'Removed expense',
        'meta.patch': 'Updated trip details',
        'participant.add': 'Added participant',
        'participant.edit': 'Updated participant',
        'participant.archive': 'Archived participant',
        'settlement.add': 'Recorded settlement',
      };
      window.webxdc.sendUpdate({
        payload: envelope,
        info: infoMap[envelope.type] || 'macuenta update',
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
  if (!['expense.add', 'expense.edit', 'expense.delete', 'participant.add', 'participant.edit', 'participant.archive', 'settlement.add', 'meta.patch', 'noop'].includes(env.type)) return; // ignore unknown types

    // Deduplicate by eventId
    if (state.events.find(e => e.eventId === env.eventId)) return;

    state.events.push(env);
    applyEnvelope(env);
  }

  function applyEnvelope(env) {
    if (env.expense && (env.type === 'expense.add' || env.type === 'expense.edit')) {
      const cur = state.expenses.get(env.expense.id);
      if (!cur || env.expense.rev > cur.rev) {
        state.expenses.set(env.expense.id, env.expense);
      }
    } else if (env.type === 'expense.delete' && env.expense) {
      const cur = state.expenses.get(env.expense.id);
      if (!cur || env.expense.rev > cur.rev) {
        state.expenses.set(env.expense.id, env.expense); // tombstone has deleted:true
      }
    } else if (env.type === 'participant.add' && env.participant) {
      upsertParticipantFromEvent(env.participant);
    } else if (env.type === 'participant.edit' && env.participant) {
      editParticipantFromEvent(env.participant);
    } else if (env.type === 'participant.archive' && env.participant) {
      archiveParticipantFromEvent(env.participant);
    } else if (env.type === 'meta.patch' && env.meta) {
      applyMetaPatch(env.meta);
    } else if (env.type === 'settlement.add' && env.settlement) {
      const already = state.recordedSettlements.find(s => s.id === env.settlement.id);
      if (!already) {
        console.debug('[settlement] applying settlement.add', env.settlement);
        state.recordedSettlements.push(env.settlement);
      } else {
        console.debug('[settlement] duplicate settlement ignored', env.settlement.id);
      }
    }
    if (['expense.add','expense.edit','expense.delete','settlement.add'].includes(env.type)) {
      recomputeExpenseCount();
      recomputeBalances();
      recomputeSettlements();
    }
    // If ledger sheet open, refresh its contents after each relevant event
    if (el.ledgerSheet && el.ledgerSheet.classList && el.ledgerSheet.classList.contains('is-open')) {
      renderLedger();
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

  function recomputeBalances() {
    const balances = new Map();
    const expenses = Array.from(state.expenses.values()).filter(e => !e.deleted);
    if (!expenses.length) { state.balances = balances; return; }

    function computeOwed(exp) {
      const out = new Map();
      const splits = Array.isArray(exp.splits) ? exp.splits : [];
      const total = exp.amountMinor;
      if (!splits.length) {
        // Fallback legacy: even across current participants map
  const all = activeParticipants().map(p => p.id).sort();
        if (!all.length) return out;
        const base = Math.floor(total / all.length);
        let rem = total - base * all.length;
        all.forEach(p => out.set(p, base));
        for (let i=0; i<all.length && rem>0; i++, rem--) out.set(all[i], out.get(all[i]) + 1);
        return out;
      }
      const manual = splits.filter(s => s.mode === 'manual' && typeof s.amountMinor === 'number' && s.amountMinor > 0);
      const weight = splits.filter(s => s.mode === 'weight' && typeof s.weight === 'number' && s.weight > 0);
      const even = splits.filter(s => s.mode === 'even');
      const sumManual = manual.reduce((a,s)=>a+s.amountMinor,0);
      if (sumManual > total) return out; // invalid
      manual.forEach(s => out.set(s.participantId, s.amountMinor));
      let remaining = total - sumManual;
      if (remaining === 0) return out;
      if (weight.length) {
        const totalWeight = weight.reduce((a,s)=>a+s.weight,0);
        if (totalWeight <=0) return out;
        const ordered = [...weight].sort((a,b)=> a.participantId.localeCompare(b.participantId));
        let allocated = 0;
        ordered.forEach((s,idx) => {
          let share;
          if (idx === ordered.length - 1) {
            share = remaining - allocated;
          } else {
            share = Math.round(remaining * s.weight / totalWeight);
            allocated += share;
          }
          out.set(s.participantId, (out.get(s.participantId) || 0) + share);
        });
      } else if (even.length) {
        const ordered = [...even].sort((a,b)=> a.participantId.localeCompare(b.participantId));
        const base = Math.floor(remaining / ordered.length);
        let rem = remaining - base * ordered.length;
        ordered.forEach(s => out.set(s.participantId, (out.get(s.participantId)||0) + base));
        for (let i=0; i<ordered.length && rem>0; i++, rem--) {
          const pid = ordered[i].participantId;
          out.set(pid, out.get(pid) + 1);
        }
      } else {
        return new Map(); // invalid remainder
      }
      // Reconcile ±1 diff
      const sum = Array.from(out.values()).reduce((a,b)=>a+b,0);
      let diff = total - sum;
      if (diff !== 0) {
        const arr = Array.from(out.entries()).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]));
        if (arr.length) {
          out.set(arr[0][0], arr[0][1] + diff);
        }
      }
      return out;
    }

    expenses.forEach(exp => {
      const payer = exp.payer;
      const owed = computeOwed(exp);
      if (!owed.size) return; // skip invalid
      addBalance(balances, payer, exp.amountMinor);
      owed.forEach((amt, pid) => addBalance(balances, pid, -amt));
    });
    state.balances = balances;
    // Apply recorded settlements: when 'from' pays 'to', 
    // 'from' reduces their debt (balance increases) and 'to' reduces what they're owed (balance decreases)
    state.recordedSettlements.forEach(s => {
      addBalance(state.balances, s.from, s.amountMinor);   // from pays, reducing their debt (balance goes up)
      addBalance(state.balances, s.to, -s.amountMinor);    // to receives, reducing what they're owed (balance goes down)
    });
  }

  function recomputeSettlements() {
    // Build creditors (positive) and debtors (negative) from balances map
    const creditors = [];
    const debtors = [];
    state.balances.forEach((v, k) => {
      if (v > 0) creditors.push({ name: k, amount: v });
      else if (v < 0) debtors.push({ name: k, amount: -v }); // store absolute owed
    });
    creditors.sort((a,b) => b.amount - a.amount || a.name.localeCompare(b.name));
    debtors.sort((a,b) => b.amount - a.amount || a.name.localeCompare(b.name));

    const settlements = [];
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const c = creditors[ci];
      const d = debtors[di];
      const transfer = Math.min(c.amount, d.amount);
      if (transfer > 0) {
        settlements.push({ from: d.name, to: c.name, amountMinor: transfer });
        c.amount -= transfer;
        d.amount -= transfer;
      }
      if (c.amount === 0) ci++;
      if (d.amount === 0) di++;
    }
    state.settlements = settlements;
  }

  // Record a settlement that user confirms has been paid externally
  function recordSettlement(from, to, amountMinor, createdAtOverride) {
    // Basic validation: positive amount and participants must differ
    if (!from || !to || from === to) return;
    if (!(amountMinor > 0)) return;
  // Only prevent duplicate identical id; allow multiple partial / repeated settlements
  // (uniqueness guaranteed by generated UUID id)
    const settlement = {
      id: crypto.randomUUID(),
      from, to, amountMinor,
      createdAt: createdAtOverride || Date.now(),
      createdBy: state.localParticipantId || 'local'
    };
    console.debug('[settlement] broadcasting settlement.add', settlement);
    const envelope = {
      v: 1,
      type: 'settlement.add',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      settlement,
    };
    sendEnvelope(envelope);
  }

  function addBalance(map, participant, delta) {
    map.set(participant, (map.get(participant) || 0) + delta);
  }

  function updateSubtitle() {
    const transferCount = state.settlements.length;
    let suffix;
    if (transferCount === 0) {
      suffix = 'All settled';
    } else if (transferCount === 1) {
      suffix = '1 transfer to settle';
    } else {
      suffix = `${transferCount} transfers to settle`;
    }
    const subtitle = `${state.expenseCount} expense${state.expenseCount === 1 ? '' : 's'} • ${suffix}`;
    if (window.webxdc && window.webxdc.setInfo) {
      window.webxdc.setInfo({
        title: 'macuenta',
        subtitle,
        image: 'icon.png'
      });
    }
  }

  function createExpense({ title, amountMinor, splits, category }) {
    return {
      id: randomId(),
      rev: 1,
      description: title,
      amountMinor,
      currency: activeCurrency(),
      payer: state.actorName,
      splits: Array.isArray(splits) ? splits : [],
      category: category || 'receipt',
      createdAt: Date.now(),
      createdBy: state.clientId,
    };
  }

  function cloneForEdit(expense, newFields) {
    return {
      ...expense,
      ...newFields,
      rev: (expense.rev || 1) + 1,
      editedAt: Date.now(),
      editedBy: state.clientId,
    };
  }

  function broadcastExpense(expense) {
    const envelope = {
      v: 1,
      type: 'expense.add',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      expense,
    };
    sendEnvelope(envelope);
  }

  function broadcastExpenseEdit(expense) {
    const envelope = {
      v: 1,
      type: 'expense.edit',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      expense,
    };
    sendEnvelope(envelope);
  }

  function broadcastExpenseDelete(expense) {
    const tombstone = {
      ...expense,
      rev: (expense.rev || 1) + 1,
      deleted: true,
      editedAt: Date.now(),
      editedBy: state.clientId,
    };
    const envelope = {
      v: 1,
      type: 'expense.delete',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      expense: tombstone,
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

  function broadcastParticipantAdd(participant) {
    const envelope = {
      v: 1,
      type: 'participant.add',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      participant: participant,
    };
    sendEnvelope(envelope);
  }

  function broadcastParticipantEdit(participant) {
    const envelope = {
      v: 1,
      type: 'participant.edit',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      participant,
    };
    sendEnvelope(envelope);
  }

  function broadcastParticipantArchive(participant) {
    const envelope = {
      v: 1,
      type: 'participant.archive',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      participant,
    };
    sendEnvelope(envelope);
  }

  function broadcastMetaPatch(meta) {
    const envelope = {
      v: 1,
      type: 'meta.patch',
      ts: Date.now(),
      actor: state.actorName,
      clientId: state.clientId,
      eventId: randomId(),
      meta,
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
  // Enhanced Form UI Handlers
  // ------------------------------
  
  function ensureBackdropsAreClean() {
    // Only clean backdrops that are explicitly NOT open
    const allBackdrops = document.querySelectorAll('[id*="backdrop"], .sheet-backdrop, .popover-backdrop');
    
    allBackdrops.forEach(backdrop => {
      // Only clean if backdrop is not currently open
      if (backdrop && !backdrop.classList.contains('is-open')) {
        backdrop.hidden = true;
        backdrop.style.pointerEvents = 'none';
      }
    });
  }
  
  // Removed excessive click debugging
  
  function ensureSheetContentInteractive() {
    // Ensure participants sheet and its inputs are interactive when sheet is open
    const participantsSheet = document.getElementById('participants-sheet');
    if (participantsSheet && participantsSheet.classList.contains('is-open')) {
      participantsSheet.style.pointerEvents = 'auto';
      
      const tripNameInput = document.getElementById('trip-name-input');
      const participantNameInput = document.getElementById('participant-name-input');
      
      if (tripNameInput) {
        tripNameInput.style.pointerEvents = 'auto';
      }
      
      if (participantNameInput) {
        participantNameInput.style.pointerEvents = 'auto';
      }
    }
  }
  
  function initializeEnhancedFormComponents() {
    // Ensure all backdrop elements are properly initialized
    ensureBackdropsAreClean();
    
    // Initialize currency selector
    setupCurrencySelector();
    
    // Initialize date picker button
    setupDatePicker();
    
    // Initialize payer selector
    setupPayerSelector();
    
    // Initialize split mode toggles
    setupSplitModeToggles();
    
    // Initialize title category icon
    updateTitleCategoryIcon();
    
    // Initialize category popover - delay this to ensure no conflicts
    setTimeout(() => {
      setupCategoryPopover();
    }, 100);
    
    // Initialize smart title-category linking
    setupSmartTitleCategoryLink();
  }
  
  function setupCurrencySelector() {
    const currencySelect = document.getElementById('exp-currency');
    const currencySymbol = document.getElementById('amount-currency-symbol');
    
    if (!currencySelect || !currencySymbol) return;
    
    // Set initial currency
    const activeCurr = activeCurrency();
    currencySelect.value = activeCurr;
    currencySymbol.textContent = currencySymbols[activeCurr] || '€';
    
    currencySelect.addEventListener('change', (e) => {
      const selectedCurrency = e.target.value;
      currencySymbol.textContent = currencySymbols[selectedCurrency] || selectedCurrency;
    });
  }
  
  function setupDatePicker() {
    const dateInput = document.getElementById('exp-date');
    const dateIconBtn = document.getElementById('date-icon-btn');
    const dateDisplayText = document.getElementById('date-display-text');
    const calendarIconSvg = document.getElementById('calendar-icon-svg');
    
    if (!dateInput || !dateIconBtn || !dateDisplayText) {
      console.warn('Date input elements not found');
      return;
    }
    
    // Load calendar SVG icon
    loadCalendarSvgIcon();
    
    // Set initial date to today
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    dateInput.value = todayISO;
    dateInput.max = todayISO; // prevent future dates
    updateDateDisplay();
    
    // Click on icon to open date picker
    dateIconBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Temporarily enable the input for picker to work
      dateInput.style.position = 'absolute';
      dateInput.style.opacity = '0.01';
      dateInput.style.pointerEvents = 'auto';
      dateInput.style.left = '0';
      dateInput.style.top = '0';
      dateInput.style.width = '100%';
      dateInput.style.height = '100%';
      
      setTimeout(() => {
        try {
          if (dateInput.showPicker) {
            dateInput.showPicker();
          } else {
            dateInput.focus();
            dateInput.click();
          }
        } catch (err) {
          console.log('showPicker error:', err);
          dateInput.focus();
          dateInput.click();
        }
        
        // Restore hidden state after picker opens
        setTimeout(() => {
          dateInput.style.opacity = '0';
          dateInput.style.pointerEvents = 'none';
          dateInput.style.width = '1px';
          dateInput.style.height = '1px';
        }, 100);
      }, 10);
    });
    
    // Update display when date changes
    dateInput.addEventListener('change', updateDateDisplay);
    dateInput.addEventListener('input', updateDateDisplay);
    
    async function loadCalendarSvgIcon() {
      if (!calendarIconSvg) return;
      
      try {
        const response = await fetch('./icons/calendar-dots.svg');
        if (response.ok) {
          const svgContent = await response.text();
          const processedSvg = svgContent
            .replace(/fill="#[^"]*"/g, 'fill="currentColor"')
            .replace(/stroke="#[^"]*"/g, 'stroke="currentColor"')
            .replace(/width="[^"]*"/g, 'width="22"')
            .replace(/height="[^"]*"/g, 'height="22"');
          calendarIconSvg.innerHTML = processedSvg;
        } else {
          calendarIconSvg.textContent = '📅';
        }
      } catch (error) {
        console.warn('Calendar icon not found, using emoji fallback');
        calendarIconSvg.textContent = '📅';
      }
    }
    
    function updateDateDisplay() {
      const value = dateInput.value;
      if (!value) {
        dateDisplayText.textContent = 'Select date';
        return;
      }
      
      const selectedDate = new Date(value + 'T12:00:00');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (selectedDate.toDateString() === today.toDateString()) {
        dateDisplayText.textContent = 'Today';
      } else if (selectedDate.toDateString() === yesterday.toDateString()) {
        dateDisplayText.textContent = 'Yesterday';
      } else {
        dateDisplayText.textContent = selectedDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  }
  
  function setupPayerSelector() {
    const payerSelector = document.getElementById('payer-selector');
    const hiddenSelect = document.getElementById('exp-payer');
    
    if (!payerSelector || !hiddenSelect) return;
    
    function renderPayerPills() {
      const participants = activeParticipants();
      const currentSelection = hiddenSelect.value;
      
      if (!participants.length) {
        payerSelector.innerHTML = '<div style="color: var(--c-muted); font-size: var(--fs-sm); padding: var(--sp-2);">Add participants first</div>';
        return;
      }
      
      const pillsHtml = participants.map(p => {
        const isActive = p.id === currentSelection;
        return `<button type="button" class="payer-pill ${isActive ? 'active' : ''}" data-participant-id="${escapeHtml(p.id)}">${escapeHtml(p.displayName)}</button>`;
      }).join('');
      
      payerSelector.innerHTML = pillsHtml;
      
      // Add click handlers
      payerSelector.querySelectorAll('.payer-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          const participantId = pill.getAttribute('data-participant-id');
          selectPayer(participantId);
        });
      });
    }
    
    function selectPayer(participantId) {
      hiddenSelect.value = participantId;
      state.lastSelectedPayerId = participantId;
      
      // Update visual state
      payerSelector.querySelectorAll('.payer-pill').forEach(pill => {
        const isActive = pill.getAttribute('data-participant-id') === participantId;
        pill.classList.toggle('active', isActive);
      });
    }
    
    // Initial render
    renderPayerPills();
    
    // Re-render when participants change
    const originalPopulate = populatePayerSelect;
    populatePayerSelect = function() {
      originalPopulate();
      setTimeout(() => renderPayerPills(), 10); // Small delay to ensure select is populated
    };
  }
  
  function setupSplitModeToggles() {
    const toggleContainer = document.getElementById('split-mode-toggles');
    const hiddenSelect = document.getElementById('split-mode');
    
    if (!toggleContainer || !hiddenSelect) return;
    
    toggleContainer.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.split-toggle-btn');
      if (!toggleBtn) return;
      
      e.preventDefault();
      const mode = toggleBtn.getAttribute('data-mode');
      selectSplitMode(mode);
    });
    
    function selectSplitMode(mode) {
      hiddenSelect.value = mode;
      
      // Update visual state
      toggleContainer.querySelectorAll('.split-toggle-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('active', isActive);
      });
      
      // Trigger the existing split config refresh
      refreshSplitConfigUI();
    }
  }

  function setupCategoryPopover() {
    const backdrop = document.getElementById('category-popover-backdrop');
    const popover = document.getElementById('category-popover');
    const closeBtn = document.getElementById('category-popover-close');
    const grid = document.getElementById('category-grid');
    
    if (!backdrop || !popover || !grid) {
      return;
    }
    
    // CRITICAL: Ensure backdrop starts completely invisible and non-interactive
    backdrop.hidden = true;
    backdrop.style.display = 'none';
    backdrop.classList.remove('is-open');
    popover.classList.remove('is-open');
    popover.setAttribute('aria-hidden', 'true');
    
    // Populate grid with all category icons
    function renderCategoryGrid() {
      let html = '';
      AVAILABLE_ICONS.forEach(iconName => {
        const isSelected = iconName === selectedCategory;
        html += `<button type="button" class="category-grid-btn ${isSelected ? 'selected' : ''}" data-icon="${iconName}" aria-label="Select ${iconName} category">📁</button>`;
      });
      
      grid.innerHTML = html;
      
      // Add event listeners
      setTimeout(() => {
        const buttons = grid.querySelectorAll('.category-grid-btn');
        buttons.forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const iconName = this.getAttribute('data-icon');
            selectCategory(iconName);
            closeCategoryPopover();
          });
        });
        
        // Load icons asynchronously
        loadGridIcons();
      }, 100);
    }
    
    async function loadGridIcons() {
      const buttons = grid.querySelectorAll('.category-grid-btn');
      for (const btn of buttons) {
        const iconName = btn.getAttribute('data-icon');
        try {
          const iconHtml = await createIcon(iconName, { size: 32, className: 'category-grid-icon' });
          btn.innerHTML = iconHtml;
        } catch (e) {
          console.warn('Failed to load grid icon:', iconName);
          btn.innerHTML = '📁';
        }
      }
    }
    
    function openCategoryPopover() {
      renderCategoryGrid();
      backdrop.style.display = 'block';
      backdrop.hidden = false;
      requestAnimationFrame(() => {
        backdrop.classList.add('is-open');
        popover.classList.add('is-open');
        popover.removeAttribute('aria-hidden');
      });
    }
    
    function closeCategoryPopover() {
      backdrop.classList.remove('is-open');
      popover.classList.remove('is-open');
      popover.setAttribute('aria-hidden', 'true');
      setTimeout(() => {
        backdrop.hidden = true;
        backdrop.style.display = 'none';
      }, 300);
    }
    
    // Event listeners
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCategoryPopover);
    }
    
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCategoryPopover();
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popover.classList.contains('is-open')) {
        closeCategoryPopover();
      }
    });
    
    // Make openCategoryPopover available globally for the category icon button
    window.openCategoryPopover = openCategoryPopover;
  }
  
  function setupSmartTitleCategoryLink() {
    const titleInput = document.getElementById('exp-title');
    if (!titleInput) return;
    
    // Listen for title changes to auto-detect category
    titleInput.addEventListener('input', (e) => {
      const title = e.target.value.trim();
      if (title) {
        const detectedCategory = detectCategoryFromTitle(title);
        if (detectedCategory && detectedCategory !== selectedCategory) {
          selectCategory(detectedCategory);
        }
      }
    });
  }

  // ------------------------------
  // App Functions
  // ------------------------------
  function init() {
    if (state.initialized) return;
    
  console.log('Initializing macuenta skeleton...');
  console.debug('[init] onboarding screen element:', !!el.onboardingScreen, 'start btn:', !!el.onboardingStartBtn);
    
    // Initialize webxdc
    initWebxdc();
    
    // Set up event listeners
    setupEventListeners();
    
    state.initialized = true;
    
  syncOnboardingDraftFromState();
  updateOnboardingStartState();
    // If host replays updates immediately, balances may already be formed.
    recomputeBalances();
    recomputeSettlements();
    render();
    updateSubtitle();
    // Activate initial tab from hash or default
    const initial = (location.hash || '').replace('#','') || 'expenses';
    setActiveTab(initial);
  }

  function setupEventListeners() {
    el.expenseForm && el.expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitExpenseForm();
    });
    el.splitModeSelect && el.splitModeSelect.addEventListener('change', () => {
      refreshSplitConfigUI();
    });
    if (el.onboardingAddParticipantBtn) {
      el.onboardingAddParticipantBtn.addEventListener('click', () => {
        handleOnboardingAddParticipant();
      });
    }
    if (el.onboardingParticipantInput) {
      el.onboardingParticipantInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleOnboardingAddParticipant();
        }
      });
    }
    if (el.onboardingParticipantChips) {
      el.onboardingParticipantChips.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-participant]');
        if (btn) {
          handleOnboardingRemoveParticipant(btn.getAttribute('data-remove-participant'));
        }
      });
    }
    if (el.onboardingTitleInput) {
      el.onboardingTitleInput.addEventListener('input', () => {
        state.onboardingDraft.title = el.onboardingTitleInput.value;
        updateOnboardingStartState();
      });
    }
    if (el.onboardingCurrencySelect) {
      el.onboardingCurrencySelect.addEventListener('change', () => {
        state.onboardingDraft.currency = el.onboardingCurrencySelect.value;
        updateOnboardingStartState();
      });
    }
    if (el.onboardingStartBtn) {
      el.onboardingStartBtn.addEventListener('click', () => {
        console.debug('[onboarding] start button click listener fired');
        handleOnboardingStart();
      });
    }
    // Tab interactions
    if (el.tabBar) {
      el.tabBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab-target]');
        if (!btn) return;
        const tab = btn.getAttribute('data-tab-target');
        setActiveTab(tab, { scrollTop: false });
        if (window.location.hash !== '#' + tab) {
          history.replaceState(null, '', '#' + tab);
        }
      });
    }
    // FAB
    if (el.fabAdd) {
      el.fabAdd.addEventListener('click', () => {
        setActiveTab('expenses');
        openExpenseSheet('add');
      });
    }
    if (el.participantsSummary) {
      el.participantsSummary.addEventListener('click', () => {
        openTripSettingsSheet();
      });
    }
    if (el.participantsAddBtn) {
      el.participantsAddBtn.addEventListener('click', () => {
        handleAddParticipant();
      });
    }
    if (el.participantNameInput) {
      el.participantNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddParticipant();
        }
      });
    }
    if (el.tripNameSaveBtn) {
      el.tripNameSaveBtn.addEventListener('click', () => {
        handleTripNameSave();
      });
    }
    if (el.tripNameInput) {
      el.tripNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleTripNameSave();
        }
      });
    }
    // Ledger open / close
    hydrateLedgerElements();
    if (el.participantsList) {
      el.participantsList.addEventListener('click', handleParticipantListAction);
      el.participantsList.addEventListener('keydown', handleParticipantListAction);
    }
    // Hash based routing (optional fallback)
    window.addEventListener('hashchange', () => {
      const hash = (location.hash || '').replace('#','');
      if (hash) setActiveTab(hash, { scrollTop: false });
    });
  }

  function currentTab() {
    return (document.querySelector('.tab-btn.is-active')?.getAttribute('data-tab-target')) || 'expenses';
  }

  function setActiveTab(tab, opts = {}) {
    const valid = ['expenses','balance','reimburse'];
    if (!valid.includes(tab)) tab = 'expenses';
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const t = btn.getAttribute('data-tab-target');
      if (t === tab) btn.classList.add('is-active'); else btn.classList.remove('is-active');
    });
    // Views
    el.views.forEach(v => {
      const t = v.getAttribute('data-tab');
      if (t === tab) { v.hidden = false; v.classList.add('is-active'); }
      else { v.hidden = true; v.classList.remove('is-active'); }
    });
    // FAB only on expenses
    if (el.fabAdd) {
      el.fabAdd.hidden = tab !== 'expenses' || shouldShowOnboarding();
    }
    if (opts.scrollTop) {
      try { document.scrollingElement.scrollTo({ top:0, behavior:'instant' }); } catch(_){}
    }
  }

  function render() {
    const onboardingActive = shouldShowOnboarding();
    if (onboardingActive) {
      document.body.classList.add('is-onboarding');
    } else {
      document.body.classList.remove('is-onboarding');
    }
    if (el.onboardingScreen) {
      // Force hide if we have completed onboarding (defensive in case of stale state during replay)
      el.onboardingScreen.hidden = !onboardingActive || state.onboardingCompleted === true;
    }
    if (el.appMain) {
      el.appMain.hidden = onboardingActive && !state.onboardingCompleted;
    }
    if (el.fabAdd) {
      el.fabAdd.hidden = onboardingActive || currentTab() !== 'expenses';
    }
    renderOnboarding(onboardingActive);

    if (el.expenseCount) {
      el.expenseCount.textContent = String(state.expenseCount);
    }
    populatePayerSelect();
    if (el.expensesList) {
      const items = Array.from(state.expenses.values()).filter(e => !e.deleted).sort((a,b)=>b.createdAt - a.createdAt);
      const grouped = groupExpensesForDisplay(items);
      let html = '';
      grouped.forEach(section => {
        html += `<li class="expense-group" role="presentation">${escapeHtml(section.label)}</li>` + section.items.map(expenseCardHTML).join('');
      });
      el.expensesList.innerHTML = html;
      if (el.expensesEmpty) {
        el.expensesEmpty.style.display = items.length ? 'none' : 'flex';
      }
      el.expensesList.style.display = items.length ? 'flex' : 'none';
    }
    if (el.headerSubtitle) {
      const totalMinor = Array.from(state.expenses.values()).filter(e => !e.deleted).reduce((a,e)=>a+e.amountMinor,0);
      el.headerSubtitle.textContent = formatAmountDisplay(totalMinor);
    }
    if (el.headerTitle) {
      const title = state.meta.title?.trim() || 'macuenta';
      el.headerTitle.textContent = title;
      el.headerTitle.setAttribute('title', title);
    }
    if (el.participantsSummaryText) {
      const count = activeParticipants().length;
      let label;
      if (count === 0) label = 'Add participants';
      else if (count === 1) label = '1 participant';
      else label = `${count} participants`;
      el.participantsSummaryText.textContent = label;
      if (el.participantsSummary) {
        if (count === 0) el.participantsSummary.classList.add('is-empty'); else el.participantsSummary.classList.remove('is-empty');
        el.participantsSummary.disabled = shouldShowOnboarding();
      }
    }
    renderParticipantsSheet();
    if (el.balancesList) {
      // Show all active participants, including those with zero balance
      const activeParticipantIds = activeParticipants().map(p => p.id);
      const allEntries = activeParticipantIds.map(id => [id, state.balances.get(id) || 0]);
      
      if (allEntries.length) {
        // sort: positives (creditors) descending, zeros in middle, negatives (debtors) ascending absolute
        const positives = allEntries.filter(e=>e[1]>0).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]));
        const zeros = allEntries.filter(e=>e[1]===0).sort((a,b)=> a[0].localeCompare(b[0]));
        const negatives = allEntries.filter(e=>e[1]<0).sort((a,b)=> a[1]-b[1] || a[0].localeCompare(b[0]));
        const ordered = positives.concat(zeros).concat(negatives);
        const maxAbs = Math.max(1, Math.max(...allEntries.map(([,v]) => Math.abs(v))));
        el.balancesList.innerHTML = ordered.map(([pid, minor]) => balanceRowHTML(pid, minor, maxAbs)).join('');
        el.balancesList.style.display = 'flex';
      } else {
        el.balancesList.innerHTML = '';
        el.balancesList.style.display = 'none';
      }
      if (el.balanceChart) { // hide old chart permanently
        el.balanceChart.innerHTML = '';
        el.balanceChart.hidden = true;
      }
      if (el.noBalancesHint) {
        el.noBalancesHint.style.display = allEntries.length ? 'none' : 'block';
      }
    }
    if (el.settlementsList) {
      const settlements = state.settlements;
      el.settlementsList.innerHTML = settlements.map(s => settlementListItemHTML(s)).join('');
      el.settlementsList.style.display = settlements.length ? 'flex' : 'none';
      if (el.noSettlementsHint) {
        el.noSettlementsHint.style.display = settlements.length ? 'none' : 'block';
      }
    }
    if (el.completedSettlementsList) {
      const items = state.recordedSettlements.slice().sort((a,b)=> a.createdAt - b.createdAt);
      el.completedSettlementsList.innerHTML = items.map(s => completedSettlementListItemHTML(s)).join('');
      if (el.noCompletedSettlementsHint) {
        el.noCompletedSettlementsHint.style.display = items.length ? 'none' : 'block';
      }
    }
    // Live ledger update if open
    if (el.ledgerSheet && el.ledgerSheet.classList.contains('is-open')) {
      renderLedger();
    }
  }

  // Toast helper (injected near end of file original scope)
  function showToast(message, variant='default', ttl=2600) {
    if (!el.toastStack) return;
    const div = document.createElement('div');
    div.className = 'toast' + (variant && variant !== 'default' ? ' ' + variant : '');
    div.innerHTML = `<span style="flex:1;">${escapeHtml(message)}</span><button aria-label="Close" onclick="this.parentElement.dispatchEvent(new Event('toast-close'))">×</button>`;
    const remove = () => {
      div.style.animation = 'toastOut .25s forwards';
      setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 230);
    };
    div.addEventListener('toast-close', remove, { once:true });
    el.toastStack.appendChild(div);
    setTimeout(remove, ttl);
  }

  // Monkey patch CRUD broadcasts if not already patched (idempotent safety)
  if (typeof broadcastExpense === 'function' && !broadcastExpense.__withToast) {
    const _origAdd = broadcastExpense;
    broadcastExpense = function(expense) { _origAdd(expense); showToast('Expense added','success'); };
    broadcastExpense.__withToast = true;
  }
  if (typeof broadcastExpenseEdit === 'function' && !broadcastExpenseEdit.__withToast) {
    const _origEdit = broadcastExpenseEdit;
    broadcastExpenseEdit = function(expense) { _origEdit(expense); showToast('Expense updated','success'); };
    broadcastExpenseEdit.__withToast = true;
  }
  if (typeof broadcastExpenseDelete === 'function' && !broadcastExpenseDelete.__withToast) {
    const _origDel = broadcastExpenseDelete;
    broadcastExpenseDelete = function(expense) { _origDel(expense); showToast('Expense deleted','warn'); };
    broadcastExpenseDelete.__withToast = true;
  }

  // ------------------------------
  // Sheet Logic
  // ------------------------------
  const sheet = {
    backdrop: document.getElementById('expense-sheet-backdrop'),
    panel: document.getElementById('expense-sheet'),
    closeBtn: document.getElementById('sheet-close'),
    cancelBtn: document.getElementById('sheet-cancel'),
    form: document.getElementById('expense-form'),
    title: document.getElementById('sheet-title')
  };

  const participantsSheet = {
    backdrop: document.getElementById('participants-sheet-backdrop'),
    panel: document.getElementById('participants-sheet'),
    closeBtn: document.getElementById('participants-sheet-close'),
  };

  function openExpenseSheet(mode='add') {
    if (sheet.backdrop) sheet.backdrop.hidden = false;
    requestAnimationFrame(()=>{
      sheet.backdrop?.classList.add('is-open');
      sheet.panel?.classList.add('is-open');
    });
    sheet.panel?.setAttribute('aria-hidden','false');
    // Initialize default date (today) for add mode if empty
    if (mode === 'add' && el.expenseDate) {
      const today = new Date();
      const iso = today.toISOString().slice(0,10);
      el.expenseDate.max = iso; // prevent future dates for now
      if (!el.expenseDate.value) el.expenseDate.value = iso;
    }
    
    // Initialize category icon button (integrated in title field)
    initializeCategoryIconButton();
    
    // Initialize enhanced form components
    initializeEnhancedFormComponents();
    
    // Make sure payer selector reflects current selection
    setTimeout(() => {
      const payerSelector = document.getElementById('payer-selector');
      const hiddenSelect = document.getElementById('exp-payer');
      if (payerSelector && hiddenSelect && hiddenSelect.value) {
        payerSelector.querySelectorAll('.payer-pill').forEach(pill => {
          const isActive = pill.getAttribute('data-participant-id') === hiddenSelect.value;
          pill.classList.toggle('active', isActive);
        });
      }
    }, 100);
    
    // Preselect payer: lastSelectedPayerId if still active, else blank
    if (el.payerSelect) {
      const optsIds = Array.from(el.payerSelect.options).map(o=>o.value);
      if (state.lastSelectedPayerId && optsIds.includes(state.lastSelectedPayerId)) {
        el.payerSelect.value = state.lastSelectedPayerId;
      } else {
        el.payerSelect.value = '';
      }
    }
    // focus title field
    setTimeout(()=>{ el.expenseTitle && el.expenseTitle.focus(); }, 60);
  }
  function closeExpenseSheet() {
    console.log('closeExpenseSheet called, resetting category from', selectedCategory, 'to receipt'); // Debug log
    sheet.backdrop?.classList.remove('is-open');
    sheet.panel?.classList.remove('is-open');
    sheet.panel?.setAttribute('aria-hidden','true');
    // Reset category selection to default
    selectedCategory = 'receipt';
    setTimeout(()=>{ if (sheet.backdrop) sheet.backdrop.hidden = true; }, 280);
  }
  window.__openExpenseSheet = openExpenseSheet;
  
  // Debug helper
  window.__getSelectedCategory = () => selectedCategory;
  window.__setSelectedCategory = (cat) => { selectedCategory = cat; console.log('Category set to:', cat); };

  function openTripSettingsSheet() {
    renderParticipantsSheet();
    
    // Populate current trip name
    if (el.tripNameInput) {
      el.tripNameInput.value = state.meta.title || '';
    }
    
    if (participantsSheet.backdrop) participantsSheet.backdrop.hidden = false;
    requestAnimationFrame(() => {
      participantsSheet.backdrop?.classList.add('is-open');
      participantsSheet.panel?.classList.add('is-open');
    });
    participantsSheet.panel?.setAttribute('aria-hidden', 'false');
    
    // Ensure content inside the sheet is interactive after opening
    setTimeout(() => {
      ensureSheetContentInteractive();
    }, 100);
    setTimeout(() => {
      el.tripNameInput && el.tripNameInput.focus();
    }, 80);
  }

  function closeParticipantsSheet() {
    participantsSheet.backdrop?.classList.remove('is-open');
    participantsSheet.panel?.classList.remove('is-open');
    participantsSheet.panel?.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (participantsSheet.backdrop) participantsSheet.backdrop.hidden = true;
    }, 280);
  }
  window.__openParticipantsSheet = openTripSettingsSheet;

  // Hook close events
  sheet.backdrop && sheet.backdrop.addEventListener('click', (e)=>{ if (e.target === sheet.backdrop) closeExpenseSheet(); });
  sheet.closeBtn && sheet.closeBtn.addEventListener('click', closeExpenseSheet);
  sheet.cancelBtn && sheet.cancelBtn.addEventListener('click', closeExpenseSheet);
  participantsSheet.backdrop && participantsSheet.backdrop.addEventListener('click', (e)=>{ if (e.target === participantsSheet.backdrop) closeParticipantsSheet(); });
  participantsSheet.closeBtn && participantsSheet.closeBtn.addEventListener('click', closeParticipantsSheet);
  
  // Payment preferences sheet event listeners
  el.paymentPreferencesSheetBackdrop && el.paymentPreferencesSheetBackdrop.addEventListener('click', (e) => {
    if (e.target === el.paymentPreferencesSheetBackdrop) closePaymentPreferencesSheet();
  });
  el.paymentPreferencesSheetClose && el.paymentPreferencesSheetClose.addEventListener('click', closePaymentPreferencesSheet);
  el.paymentPreferencesCancel && el.paymentPreferencesCancel.addEventListener('click', closePaymentPreferencesSheet);
  el.paymentPreferencesForm && el.paymentPreferencesForm.addEventListener('submit', handlePaymentPreferencesSubmit);
  
  // Payment method change handlers
  el.primaryPaymentMethod && el.primaryPaymentMethod.addEventListener('change', () => updatePaymentDetailsField('primary'));
  el.secondaryPaymentMethod && el.secondaryPaymentMethod.addEventListener('change', () => updatePaymentDetailsField('secondary'));
  
  document.addEventListener('keydown', (e)=>{
    if (e.key !== 'Escape') return;
    if (el.paymentPreferencesSheet?.classList.contains('is-open')) {
      closePaymentPreferencesSheet();
      return;
    }
    if (participantsSheet.panel?.classList.contains('is-open')) {
      closeParticipantsSheet();
      return;
    }
    if (sheet.panel?.classList.contains('is-open')) {
      closeExpenseSheet();
    }
  });

  // Intercept form submit to close sheet after existing logic
  if (sheet.form) {
    sheet.form.addEventListener('submit', () => {
      // Delay the close to allow expense creation to complete first
      setTimeout(() => {
        closeExpenseSheet();
      }, 100);
    });
  }

  // ...rest of existing code remains (grouping, event wiring, etc.)

  // ------------------------------------------------------------
  // Missing Helper Implementations (re-added after refactor)
  // ------------------------------------------------------------
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function formatAmountStrict(minor, currency='EUR') {
    const sign = minor < 0 ? '-' : '';
    const abs = Math.abs(minor);
    return sign + (abs/100).toFixed(2) + ' ' + currency;
  }

  function formatAmountDisplay(minor, currency = activeCurrency()) {
    const code = (currency || DEFAULT_CURRENCY).toUpperCase();
    const raw = formatAmountStrict(minor, code);
    const symbol = currencySymbols[code];
    if (!symbol) return raw;
    return raw.replace(` ${code}`, ` ${symbol}`);
  }

  function groupExpensesForDisplay(items) {
    const sections = [];
    const byDay = new Map();
    items.forEach(e => {
      const d = new Date(e.createdAt || 0);
      const key = d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(e);
    });
    const todayKey = (()=>{ const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');})();
    const yesterdayKey = (()=>{ const d=new Date(Date.now()-86400000);return d.getFullYear()+'-'+(d.getMonth()+1).toString().padStart(2,'0')+'-'+d.getDate().toString().padStart(2,'0');})();
    const keys = Array.from(byDay.keys()).sort((a,b)=> b.localeCompare(a));
    keys.forEach(k => {
      let label;
      if (k === todayKey) label = 'Today'; else if (k === yesterdayKey) label = 'Yesterday'; else label = k;
      sections.push({ label, items: byDay.get(k).sort((a,b)=> b.createdAt - a.createdAt) });
    });
    return sections;
  }

  function expenseCardHTML(exp) {
    const payerName = resolveParticipantName(exp.payer) || exp.payer;
    const you = payerName === state.actorName ? 'you' : payerName;
    const category = exp.category || 'receipt';
    const amountText = escapeHtml(formatAmountDisplay(exp.amountMinor, exp.currency || activeCurrency()));
    const deleteLabel = `Delete expense ${exp.description || ''}`.trim() || 'Delete expense';
    
    // Create a placeholder for the icon that will be filled asynchronously
    const iconId = `expense-icon-${exp.id}`;
    
    // Asynchronously load the icon
    createIcon(category, { size: 20, className: 'expense-category-icon' }).then(iconHtml => {
      const iconElement = document.getElementById(iconId);
      if (iconElement) {
        iconElement.innerHTML = iconHtml;
      }
    });
    
    return `<li class="expense-card" data-expense-id="${escapeHtml(exp.id)}">
      <div class="expense-card-main">
        <span id="${iconId}" class="expense-icon-container"></span>
        <div class="expense-body">
          <p class="expense-title">${escapeHtml(exp.description || '(no title)')}</p>
          <p class="expense-subtitle">Paid by ${escapeHtml(you)}</p>
        </div>
      </div>
      <div class="expense-meta">
        <div class="expense-amount">${amountText}</div>
        <button type="button" class="expense-trash" aria-label="${escapeHtml(deleteLabel)}" data-action="delete" data-id="${escapeHtml(exp.id)}" tabindex="-1">🗑</button>
      </div>
    </li>`;
  }

  function balanceListItemHTML(name, minor) {
    const resolved = resolveParticipantName(name) || name;
    const amt = formatAmountDisplay(minor);
    const display = minor > 0 && !amt.startsWith('+') ? '+' + amt : amt;
    const direction = minor >= 0 ? 'is-positive' : 'is-negative';
    const amountClass = minor >= 0 ? 'balance-amount positive' : 'balance-amount negative';
    return `<li class="balance-item ${direction}"><span class="balance-name">${escapeHtml(resolved)}</span><span class="${amountClass}">${escapeHtml(display)}</span></li>`;
  }

  function settlementListItemHTML(s) {
    const amt = formatAmountDisplay(s.amountMinor);
    const fromName = resolveParticipantName(s.from) || s.from;
    const toName = resolveParticipantName(s.to) || s.to;
    const actionLabel = 'Record';
    
    // Get payment preferences for the recipient
    const toParticipant = state.participants.get(s.to);
    const paymentPreferencesHTML = getPaymentPreferencesHTML(toParticipant);
    
    return `<li class="settlement-item" data-from="${escapeHtml(s.from)}" data-to="${escapeHtml(s.to)}" data-amt="${s.amountMinor}">
      <div class="settlement-main">
        <span class="settlement-route" title="${escapeHtml(fromName)} → ${escapeHtml(toName)}">${escapeHtml(fromName)} → ${escapeHtml(toName)}</span>
        ${paymentPreferencesHTML}
      </div>
      <div class="settlement-meta">
        <span class="settlement-amount">${escapeHtml(amt)}</span>
        <button type="button" class="record-settlement-btn" data-action="record" aria-label="Record settlement">${escapeHtml(actionLabel)}</button>
      </div>
    </li>`;
  }

  function getPaymentPreferencesHTML(participant) {
    if (!participant) return '';
    
    const preferences = [];
    
    if (participant.primaryPaymentMethod) {
      const method = PAYMENT_METHOD_LABELS[participant.primaryPaymentMethod] || participant.primaryPaymentMethod;
      const details = participant.primaryPaymentDetails;
      preferences.push({ method, details, isPrimary: true });
    }
    
    if (participant.secondaryPaymentMethod) {
      const method = PAYMENT_METHOD_LABELS[participant.secondaryPaymentMethod] || participant.secondaryPaymentMethod;
      const details = participant.secondaryPaymentDetails;
      preferences.push({ method, details, isPrimary: false });
    }
    
    if (preferences.length === 0) return '';
    
    const preferenceItems = preferences.map(pref => {
      const copyButton = pref.details && pref.method !== 'Cash' ? 
        `<button type="button" class="payment-copy-btn" data-copy="${escapeHtml(pref.details)}" title="Copy ${escapeHtml(pref.details)}">📋</button>` : '';
      
      const detailsText = pref.details ? `: ${escapeHtml(pref.details)}` : '';
      
      return `<div class="payment-preference-item${pref.isPrimary ? ' primary' : ''}">
        <span class="payment-method-label">${escapeHtml(pref.method)}${detailsText}</span>
        ${copyButton}
      </div>`;
    }).join('');
    
    return `<div class="payment-preferences">${preferenceItems}</div>`;
  }

  function completedSettlementListItemHTML(s) {
    const amt = formatAmountDisplay(s.amountMinor);
    const fromName = resolveParticipantName(s.from) || s.from;
    const toName = resolveParticipantName(s.to) || s.to;
    const d = new Date(s.createdAt || Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return `<li class="completed-settlement-item"><span class="settlement-route">${escapeHtml(fromName)} → ${escapeHtml(toName)}</span><strong class="settlement-amount">${escapeHtml(amt)}</strong><span class="settlement-date" style="margin-left:auto;font-size:11px;color:var(--c-muted);">${escapeHtml(dateStr)}</span></li>`;
  }

  const iconThemeCatalog = [
    { keywords: ['food','meal','dinner','lunch','pizza','restaurant','snack'], glyph: '🍽️', background: 'linear-gradient(135deg,#FFE6B5,#FFBD6F)', color: '#5b3600' },
    { keywords: ['coffee','drink','bar','beer','wine','tea'], glyph: '🍹', background: 'linear-gradient(135deg,#FFD5E5,#FF91C1)', color: '#8f1f49' },
    { keywords: ['travel','flight','train','bus','uber','plane','trip'], glyph: '✈️', background: 'linear-gradient(135deg,#B3E5FF,#4FB9F4)', color: '#0b3a55' },
    { keywords: ['hotel','stay','bnb','room','apartment'], glyph: '🏨', background: 'linear-gradient(135deg,#D2C6FF,#9A8CFF)', color: '#3d2d86' },
    { keywords: ['grocer','market','supermarket','store','shopping'], glyph: '🛒', background: 'linear-gradient(135deg,#C2F5D0,#5BD49A)', color: '#176644' },
    { keywords: ['fuel','gas','petrol','diesel'], glyph: '⛽️', background: 'linear-gradient(135deg,#F6D4B1,#F19F5A)', color: '#8a3d07' },
    { keywords: ['gift','present','birthday','wedding'], glyph: '🎁', background: 'linear-gradient(135deg,#FFD9F2,#FF9DDD)', color: '#7a2a62' },
    { keywords: ['ticket','movie','cinema','concert','show'], glyph: '🎟️', background: 'linear-gradient(135deg,#FBE7C6,#F7C59F)', color: '#6a4720' }
  ];

  function expenseVisualFor(exp) {
    const title = (exp.description || '').toLowerCase();
    const theme = iconThemeCatalog.find(entry => entry.keywords.some(word => title.includes(word)));
    if (theme) {
      return theme;
    }
    const accent = accentFromString(title || exp.id);
    return {
      glyph: initialsFor(exp.description || ''),
      background: accent.background,
      color: accent.color,
    };
  }

  function initialsFor(str) {
    const cleaned = String(str).trim();
    if (!cleaned) return '€';
    const parts = cleaned.split(/\s+/).filter(Boolean).slice(0, 2);
    const letters = parts.map(part => part[0].toUpperCase()).join('');
    return letters || cleaned[0].toUpperCase() || '€';
  }

  function accentFromString(input) {
    const hue = Math.abs(hashString(input || '')) % 360;
    const light = `hsla(${hue}, 70%, 86%, 1)`;
    const dark = `hsla(${hue}, 70%, 66%, 1)`;
    const text = `hsla(${hue}, 55%, 28%, 1)`;
    return {
      background: `linear-gradient(135deg, ${light}, ${dark})`,
      color: text,
    };
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  function renderBalanceChart(entries) {
    if (!el.balanceChart) return;
    if (!entries.length) {
      el.balanceChart.innerHTML = '';
      el.balanceChart.setAttribute('hidden', 'true');
      el.balanceChart.setAttribute('aria-hidden', 'true');
      return;
    }
    el.balanceChart.removeAttribute('hidden');
    el.balanceChart.setAttribute('aria-hidden', 'false');
    const max = entries.reduce((acc, [, minor]) => Math.max(acc, Math.abs(minor)), 0);
    const rows = entries.map(entry => balanceBarHTML(entry[0], entry[1], max)).join('');
    el.balanceChart.innerHTML = rows;
  }

  function balanceBarHTML(name, minor, max) {
  const base = formatAmountDisplay(minor);
  const amountText = minor > 0 && !base.startsWith('+') ? '+' + base : base;
    const dir = minor >= 0 ? 'positive' : 'negative';
    const percent = max === 0 ? 0 : Math.round(Math.abs(minor) / max * 100);
    const width = Math.min(100, Math.max(8, percent));
    return `<div class="balance-bar" data-direction="${dir}">
      <div class="balance-avatar">${escapeHtml(initialsFor(name))}</div>
      <div class="balance-track"><div class="balance-fill is-${dir}" style="width:${width}%;"></div></div>
      <div class="balance-amount ${dir === 'positive' ? 'positive' : 'negative'}">${escapeHtml(amountText)}</div>
    </div>`;
  }

  function balanceRowHTML(id, minor, maxAbs) {
    const name = resolveParticipantName(id) || id;
    const amountTextRaw = formatAmountDisplay(minor);
    const amountText = minor > 0 && !amountTextRaw.startsWith('+') ? '+' + amountTextRaw : amountTextRaw;
    const pct = Math.round(Math.abs(minor)/maxAbs*100);
    const width = Math.min(100, Math.max(4, pct));
    const dir = minor >= 0 ? 'pos' : 'neg';
    return `<li class="balance-row" data-dir="${dir}">
      <span class="balance-row-name">${escapeHtml(name)}</span>
      <span class="balance-row-bar"><span class="balance-row-fill ${dir}" style="width:${width}%;"></span></span>
      <span class="balance-row-amount ${dir}">${escapeHtml(amountText)}</span>
    </li>`;
  }

  function normalizeParticipant(entry) {
    if (!entry || !entry.id) return null;
    const displayName = (entry.displayName || '').trim();
    return {
      id: String(entry.id),
      displayName: displayName || 'Participant',
      origin: entry.origin || 'external',
      archived: entry.archived === true,
      createdAt: entry.createdAt || Date.now(),
      createdBy: entry.createdBy || state.clientId,
      lastModifiedAt: entry.lastModifiedAt || Date.now(),
      lastModifiedBy: entry.lastModifiedBy || state.clientId,
      color: entry.color,
    };
  }

  function upsertParticipantFromEvent(entry) {
    const normalized = normalizeParticipant(entry);
    if (!normalized) return;
    const existing = state.participants.get(normalized.id) || {};
    state.participants.set(normalized.id, { ...existing, ...normalized });
    updateLocalParticipantReference();
    refreshSplitConfigUI();
    syncOnboardingDraftFromState();
    markOnboardingCompletedIfReady();
    removeOnboardingIfCompleted();
  }

  function editParticipantFromEvent(entry) {
    const normalized = normalizeParticipant(entry);
    if (!normalized) return;
    const existing = state.participants.get(normalized.id);
    if (!existing) return;
    if (existing.origin !== 'external') return; // respect rules
    state.participants.set(normalized.id, { ...existing, ...normalized });
    updateLocalParticipantReference();
    refreshSplitConfigUI();
    syncOnboardingDraftFromState();
    markOnboardingCompletedIfReady();
    removeOnboardingIfCompleted();
  }

  function archiveParticipantFromEvent(entry) {
    const normalized = normalizeParticipant(entry);
    if (!normalized) return;
    const existing = state.participants.get(normalized.id);
    if (!existing) return;
    if (existing.origin !== 'external') return;
    state.participants.set(normalized.id, { ...existing, archived: true, lastModifiedAt: normalized.lastModifiedAt, lastModifiedBy: normalized.lastModifiedBy });
    updateLocalParticipantReference();
    refreshSplitConfigUI();
    syncOnboardingDraftFromState();
    markOnboardingCompletedIfReady();
    removeOnboardingIfCompleted();
  }

  function applyMetaPatch(meta) {
    if (!meta || typeof meta !== 'object') return;
    if (typeof meta.title === 'string') {
      state.meta.title = meta.title.trim();
    }
    if (typeof meta.currency === 'string' && meta.currency.trim()) {
      state.meta.currency = meta.currency.trim().toUpperCase();
    }
    if (Array.isArray(meta.participants)) {
      syncParticipantsFromList(meta.participants);
    } else {
      updateLocalParticipantReference();
      refreshSplitConfigUI();
    }
    syncOnboardingDraftFromState();
    markOnboardingCompletedIfReady();
    removeOnboardingIfCompleted();
  }

  function syncParticipantsFromList(list) {
    const map = new Map();
    list.forEach(entry => {
      const normalized = normalizeParticipant(entry);
      if (!normalized) return;
      map.set(normalized.id, normalized);
    });
    state.participants = map;
    updateLocalParticipantReference();
    refreshSplitConfigUI();
    markOnboardingCompletedIfReady();
  }

  function activeParticipants() {
    return Array.from(state.participants.values()).filter(p => !p.archived);
  }

  function updateLocalParticipantReference() {
    const active = activeParticipants();
    if (!active.length) {
      state.localParticipantId = null;
      return;
    }
    if (state.localParticipantId && active.some(p => p.id === state.localParticipantId)) {
      return;
    }
    const matchByActor = active.find(p => p.displayName === state.actorName);
    state.localParticipantId = (matchByActor || active[0]).id;
  }

  function syncOnboardingDraftFromState() {
    state.onboardingDraft.title = state.meta.title || '';
    state.onboardingDraft.currency = activeCurrency();
    state.onboardingDraft.participants = activeParticipants().map(p => ({
      id: p.id,
      displayName: p.displayName,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
    }));
  }

  function markOnboardingCompletedIfReady() {
    if (state.onboardingCompleted) return;
    const hasTitle = Boolean(state.meta.title && state.meta.title.trim());
    const hasParticipants = activeParticipants().length >= 2;
    if (hasTitle && hasParticipants) {
      state.onboardingCompleted = true;
    }
  }

  function removeOnboardingIfCompleted() {
    if (!state.onboardingCompleted) return;
    if (el.onboardingScreen && el.onboardingScreen.parentNode) {
      el.onboardingScreen.parentNode.removeChild(el.onboardingScreen);
      console.debug('[onboarding-sync] removed onboarding screen after replay/meta patch');
      el.onboardingScreen = null;
      document.body.classList.remove('is-onboarding');
    }
  }

  function cleanName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function nameAlreadyExists(name, excludeId = null) {
    const cleaned = cleanName(name);
    if (!cleaned) return false;
    const lower = cleaned.toLowerCase();
    return Array.from(state.participants.values()).some(p => p.id !== excludeId && p.displayName.toLowerCase() === lower);
  }

  function createParticipantPayload(name) {
    const cleaned = cleanName(name) || 'Participant';
    const accent = accentFromString(cleaned);
    return {
      id: randomId(),
      displayName: cleaned,
      origin: 'external',
      archived: false,
      createdAt: Date.now(),
      createdBy: state.clientId,
      lastModifiedAt: Date.now(),
      lastModifiedBy: state.clientId,
      color: accent.background,
      primaryPaymentMethod: null,
      primaryPaymentDetails: null,
      secondaryPaymentMethod: null,
      secondaryPaymentDetails: null,
    };
  }

  function renderParticipantsSheet() {
    if (!el.participantsList) return;
    const participants = Array.from(state.participants.values()).sort((a, b) => {
      // Sort: active first, then archived, alphabetically within each group
      if (a.archived !== b.archived) {
        return a.archived ? 1 : -1;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    el.participantsList.innerHTML = participants.map(p => participantRowHTML(p)).join('');
    
    if (el.participantsSheetEmpty) {
      el.participantsSheetEmpty.style.display = participants.length ? 'none' : 'block';
    }
  }

  function participantRowHTML(participant) {
    const accent = accentFromString(participant.displayName || participant.id);
    const initials = initialsFor(participant.displayName);
    const isYou = participant.id === state.localParticipantId;
    const isArchived = participant.archived === true;
    
    // Check if user has non-zero balance
    const balance = state.balances.get(participant.id) || 0;
    const hasBalance = balance !== 0;
    
    const badge = isArchived ? '<span class="participant-row-badge archived-label">Archived</span>' : '';
    
    const actionButton = isArchived 
      ? `<button type="button" class="participant-action-btn" data-action="restore" data-id="${escapeHtml(participant.id)}">Restore</button>`
      : `<button type="button" class="participant-action-btn danger${hasBalance ? ' disabled' : ''}" data-action="archive" data-id="${escapeHtml(participant.id)}"${hasBalance ? ' disabled title="Cannot archive participant with non-zero balance"' : ''}>Archive</button>`;
    
    return `<li class="participant-row${isArchived ? ' archived' : ''}" data-id="${escapeHtml(participant.id)}">
        <div class="participant-avatar" style="background:${accent.background};color:${accent.color};">${escapeHtml(initials)}</div>
        <div class="participant-row-main">
          <span class="participant-row-name" data-id="${escapeHtml(participant.id)}">${escapeHtml(participant.displayName)}</span>
          <input type="text" class="participant-row-name-input" data-id="${escapeHtml(participant.id)}" value="${escapeHtml(participant.displayName)}" maxlength="60" style="display: none;" />
          ${badge}
        </div>
        <div class="participant-row-actions">
          <button type="button" class="participant-action-btn" data-action="edit" data-id="${escapeHtml(participant.id)}">Edit</button>
          <button type="button" class="participant-action-btn" data-action="payment" data-id="${escapeHtml(participant.id)}">Payment prefs</button>
          ${actionButton}
        </div>
    </li>`;
  }

  function handleTripNameSave() {
    if (!el.tripNameInput) return;
    
    const newTitle = el.tripNameInput.value.trim();
    if (!newTitle) {
      showToast('Enter a trip name', 'warn');
      el.tripNameInput.focus();
      return;
    }
    
    if (newTitle === state.meta.title) {
      showToast('Trip name unchanged', 'warn');
      return;
    }

    const payload = {
      title: newTitle,
      currency: state.meta.currency || DEFAULT_CURRENCY,
    };
    
    applyMetaPatch(payload);
    render();
    broadcastMetaPatch(payload);
    showToast('Trip name updated', 'success');
  }

  function handleAddParticipant() {
    if (!el.participantNameInput) return;
    
    const name = cleanName(el.participantNameInput.value);
    if (!name) {
      showToast('Enter a participant name', 'warn');
      el.participantNameInput.focus();
      return;
    }
    
    if (nameAlreadyExists(name)) {
      showToast('That name is already in use', 'warn');
      el.participantNameInput.focus();
      el.participantNameInput.select();
      return;
    }

    const payload = createParticipantPayload(name);
    upsertParticipantFromEvent(payload);
    render();
    broadcastParticipantAdd(payload);
    showToast('Participant added', 'success');
    
    // Clear input
    el.participantNameInput.value = '';
    el.participantNameInput.focus();
  }

  function handleInlineEdit(participantId, newName) {
    const existing = state.participants.get(participantId);
    if (!existing) {
      showToast('Participant not found', 'error');
      return;
    }
    
    const cleaned = cleanName(newName);
    if (!cleaned) {
      showToast('Enter a participant name', 'warn');
      return;
    }
    
    if (nameAlreadyExists(cleaned, participantId)) {
      showToast('That name is already in use', 'warn');
      return;
    }

    const payload = {
      ...existing,
      displayName: cleaned,
      lastModifiedAt: Date.now(),
      lastModifiedBy: state.clientId,
    };
    
    editParticipantFromEvent(payload);
    render();
    broadcastParticipantEdit(payload);
    showToast('Participant updated', 'success');
  }

  function handleParticipantListAction(event) {
    const btn = event.target && event.target.closest && event.target.closest('[data-action][data-id]');
    if (btn) {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (!action || !id) return;
      
      if (action === 'edit') {
        toggleInlineEdit(id);
      } else if (action === 'archive') {
        archiveParticipant(id);
      } else if (action === 'restore') {
        restoreParticipant(id);
      } else if (action === 'payment') {
        openPaymentPreferencesSheet(id);
      }
      return;
    }
    
    // Handle inline editing input events
    const input = event.target && event.target.closest && event.target.closest('.participant-row-name-input');
    if (input && event.type === 'keydown') {
      if (event.key === 'Enter') {
        event.preventDefault();
        const id = input.getAttribute('data-id');
        const newName = input.value;
        handleInlineEdit(id, newName);
        exitInlineEdit(id);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitInlineEdit(input.getAttribute('data-id'));
      }
    }
  }
  
  function toggleInlineEdit(participantId) {
    const row = document.querySelector(`[data-id="${participantId}"]`);
    if (!row) return;
    
    const nameSpan = row.querySelector('.participant-row-name');
    const nameInput = row.querySelector('.participant-row-name-input');
    
    if (!nameSpan || !nameInput) return;
    
    if (nameInput.style.display === 'none') {
      // Enter edit mode
      nameSpan.style.display = 'none';
      nameInput.style.display = 'block';
      nameInput.focus();
      nameInput.select();
    } else {
      // Exit edit mode
      exitInlineEdit(participantId);
    }
  }
  
  function exitInlineEdit(participantId) {
    const row = document.querySelector(`[data-id="${participantId}"]`);
    if (!row) return;
    
    const nameSpan = row.querySelector('.participant-row-name');
    const nameInput = row.querySelector('.participant-row-name-input');
    
    if (!nameSpan || !nameInput) return;
    
    nameSpan.style.display = 'block';
    nameInput.style.display = 'none';
    
    // Reset input value to original
    const participant = state.participants.get(participantId);
    if (participant) {
      nameInput.value = participant.displayName;
    }
  }

  function archiveParticipant(id) {
    const participant = state.participants.get(id);
    if (!participant || participant.archived) return;
    
    // Check if participant has non-zero balance
    const balance = state.balances.get(id) || 0;
    if (balance !== 0) {
      showToast('Cannot archive participant with non-zero balance', 'warn');
      return;
    }
    
    const active = activeParticipants();
    if (active.length <= 1) {
      showToast('Keep at least one participant active', 'warn');
      return;
    }
    const payload = {
      ...participant,
      archived: true,
      lastModifiedAt: Date.now(),
      lastModifiedBy: state.clientId,
    };
    archiveParticipantFromEvent(payload);
    render();
    broadcastParticipantArchive(payload);
    showToast('Participant archived', 'warn');
  }

  function restoreParticipant(id) {
    const participant = state.participants.get(id);
    if (!participant || !participant.archived) return;
    const payload = {
      ...participant,
      archived: false,
      lastModifiedAt: Date.now(),
      lastModifiedBy: state.clientId,
    };
    editParticipantFromEvent(payload);
    render();
    broadcastParticipantEdit(payload);
    showToast('Participant restored', 'success');
  }

  // ------------------------------
  // Payment Preferences Functions
  // ------------------------------
  let currentEditingParticipantId = null;

  function openPaymentPreferencesSheet(participantId) {
    const participant = state.participants.get(participantId);
    if (!participant) {
      showToast('Participant not found', 'error');
      return;
    }

    currentEditingParticipantId = participantId;
    
    // Update participant info
    if (el.paymentPreferencesParticipantName) {
      el.paymentPreferencesParticipantName.textContent = participant.displayName;
    }
    
    if (el.paymentPreferencesAvatar) {
      const accent = accentFromString(participant.displayName || participant.id);
      const initials = initialsFor(participant.displayName);
      el.paymentPreferencesAvatar.style.background = accent.background;
      el.paymentPreferencesAvatar.style.color = accent.color;
      el.paymentPreferencesAvatar.textContent = initials;
    }

    // Populate existing values
    if (el.primaryPaymentMethod) {
      el.primaryPaymentMethod.value = participant.primaryPaymentMethod || '';
    }
    if (el.primaryPaymentDetails) {
      el.primaryPaymentDetails.value = participant.primaryPaymentDetails || '';
    }
    if (el.secondaryPaymentMethod) {
      el.secondaryPaymentMethod.value = participant.secondaryPaymentMethod || '';
    }
    if (el.secondaryPaymentDetails) {
      el.secondaryPaymentDetails.value = participant.secondaryPaymentDetails || '';
    }

    // Update UI based on selected methods
    updatePaymentDetailsField('primary');
    updatePaymentDetailsField('secondary');

    // Show sheet
    if (el.paymentPreferencesSheetBackdrop) {
      el.paymentPreferencesSheetBackdrop.hidden = false;
    }
    requestAnimationFrame(() => {
      if (el.paymentPreferencesSheet) {
        el.paymentPreferencesSheet.classList.add('is-open');
        el.paymentPreferencesSheet.removeAttribute('aria-hidden');
      }
    });
  }

  function closePaymentPreferencesSheet() {
    if (el.paymentPreferencesSheet) {
      el.paymentPreferencesSheet.classList.remove('is-open');
      el.paymentPreferencesSheet.setAttribute('aria-hidden', 'true');
    }
    setTimeout(() => {
      if (el.paymentPreferencesSheetBackdrop) {
        el.paymentPreferencesSheetBackdrop.hidden = true;
      }
    }, 280);
    currentEditingParticipantId = null;
  }

  function updatePaymentDetailsField(type) {
    const methodElement = type === 'primary' ? el.primaryPaymentMethod : el.secondaryPaymentMethod;
    const detailsElement = type === 'primary' ? el.primaryPaymentDetails : el.secondaryPaymentDetails;
    const fieldElement = type === 'primary' ? el.primaryPaymentDetailsField : el.secondaryPaymentDetailsField;
    const labelElement = type === 'primary' ? el.primaryPaymentDetailsLabel : el.secondaryPaymentDetailsLabel;
    const errorElement = type === 'primary' ? el.primaryPaymentDetailsError : el.secondaryPaymentDetailsError;

    if (!methodElement || !detailsElement || !fieldElement || !labelElement) return;

    const method = methodElement.value;
    const isRequired = type === 'primary' && method;
    const needsDetails = method && method !== PAYMENT_METHODS.CASH;

    if (needsDetails) {
      fieldElement.style.display = 'block';
      detailsElement.placeholder = getPaymentMethodPlaceholder(method);
      detailsElement.disabled = false;
      labelElement.textContent = getPaymentMethodDetailsLabel(method);
      if (method === PAYMENT_METHODS.CASH) {
        detailsElement.value = '';
        detailsElement.disabled = true;
      }
    } else {
      if (!method) {
        fieldElement.style.display = 'none';
      } else {
        fieldElement.style.display = 'block';
        detailsElement.disabled = true;
        detailsElement.value = '';
        detailsElement.placeholder = getPaymentMethodPlaceholder(method);
      }
    }

    // Clear validation error when method changes
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  function getPaymentMethodDetailsLabel(method) {
    switch (method) {
      case PAYMENT_METHODS.PAYPAL:
        return 'Email address';
      case PAYMENT_METHODS.REVOLUT:
        return 'Username';
      case PAYMENT_METHODS.IBAN:
        return 'IBAN';
      case PAYMENT_METHODS.CASH:
        return 'Details';
      case PAYMENT_METHODS.OTHER:
        return 'Details';
      default:
        return 'Details';
    }
  }

  function handlePaymentPreferencesSubmit(event) {
    event.preventDefault();
    
    if (!currentEditingParticipantId) {
      showToast('No participant selected', 'error');
      return;
    }

    const participant = state.participants.get(currentEditingParticipantId);
    if (!participant) {
      showToast('Participant not found', 'error');
      return;
    }

    // Collect form data
    const primaryMethod = el.primaryPaymentMethod ? el.primaryPaymentMethod.value : '';
    const primaryDetails = el.primaryPaymentDetails ? el.primaryPaymentDetails.value.trim() : '';
    const secondaryMethod = el.secondaryPaymentMethod ? el.secondaryPaymentMethod.value : '';
    const secondaryDetails = el.secondaryPaymentDetails ? el.secondaryPaymentDetails.value.trim() : '';

    // Validate
    let hasError = false;

    if (primaryMethod) {
      const validation = validatePaymentDetails(primaryMethod, primaryDetails);
      if (!validation.valid) {
        showPaymentValidationError('primary', validation.message);
        hasError = true;
      }
    }

    if (secondaryMethod) {
      const validation = validatePaymentDetails(secondaryMethod, secondaryDetails);
      if (!validation.valid) {
        showPaymentValidationError('secondary', validation.message);
        hasError = true;
      }
    }

    if (hasError) return;

    // Update participant
    const payload = {
      ...participant,
      primaryPaymentMethod: primaryMethod || null,
      primaryPaymentDetails: primaryDetails || null,
      secondaryPaymentMethod: secondaryMethod || null,
      secondaryPaymentDetails: secondaryDetails || null,
      lastModifiedAt: Date.now(),
      lastModifiedBy: state.clientId,
    };

    editParticipantFromEvent(payload);
    render();
    broadcastParticipantEdit(payload);
    showToast('Payment preferences saved', 'success');
    closePaymentPreferencesSheet();
  }

  function showPaymentValidationError(type, message) {
    const errorElement = type === 'primary' ? el.primaryPaymentDetailsError : el.secondaryPaymentDetailsError;
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(err => {
        console.warn('Failed to copy using Clipboard API:', err);
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  }

  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.warn('Failed to copy using fallback method:', err);
    }
    document.body.removeChild(textArea);
  }

  function ensureCurrencyOption(code) {
    if (!el.onboardingCurrencySelect) return;
    const exists = Array.from(el.onboardingCurrencySelect.options || []).some(opt => opt.value === code);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      el.onboardingCurrencySelect.appendChild(opt);
    }
  }

  function renderOnboarding(isActive) {
    if (!el.onboardingScreen || !isActive) {
      updateOnboardingStartState();
      return;
    }
    if (el.onboardingTitleInput && el.onboardingTitleInput.value !== state.onboardingDraft.title) {
      el.onboardingTitleInput.value = state.onboardingDraft.title;
    }
    const currency = state.onboardingDraft.currency || DEFAULT_CURRENCY;
    ensureCurrencyOption(currency);
    if (el.onboardingCurrencySelect && el.onboardingCurrencySelect.value !== currency) {
      el.onboardingCurrencySelect.value = currency;
    }
    renderOnboardingParticipants();
    updateOnboardingStartState();
  }

  function renderOnboardingParticipants() {
    if (!el.onboardingParticipantChips) return;
    if (!state.onboardingDraft.participants.length) {
      el.onboardingParticipantChips.style.display = 'none';
      return;
    }
    el.onboardingParticipantChips.style.display = 'flex';
    const chips = state.onboardingDraft.participants.map(p => `
      <div class="onboarding-chip" role="listitem">
        <span>${escapeHtml(p.displayName)}</span>
        <button type="button" class="onboarding-chip-remove" data-remove-participant="${escapeHtml(p.id)}" aria-label="Remove ${escapeHtml(p.displayName)}">×</button>
      </div>
    `).join('');
    el.onboardingParticipantChips.innerHTML = chips;
  }

  function onboardingIsValid() {
    return cleanName(state.onboardingDraft.title).length > 0 && state.onboardingDraft.participants.length >= 2;
  }

  function updateOnboardingStartState() {
    if (!el.onboardingStartBtn) return;
    el.onboardingStartBtn.disabled = !onboardingIsValid();
  }

  function handleOnboardingAddParticipant() {
    if (!el.onboardingParticipantInput) return;
    const name = cleanName(el.onboardingParticipantInput.value);
    if (!name) {
      showToast('Enter a participant name','warn');
      return;
    }
    const exists = state.onboardingDraft.participants.some(p => p.displayName.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast('That participant is already added','warn');
      return;
    }
    state.onboardingDraft.participants.push({
      id: randomId(),
      displayName: name,
      createdAt: Date.now(),
      createdBy: state.clientId,
    });
    if (el.onboardingParticipantInput) {
      el.onboardingParticipantInput.value = '';
      el.onboardingParticipantInput.focus();
    }
    renderOnboardingParticipants();
    updateOnboardingStartState();
  }

  function handleOnboardingRemoveParticipant(id) {
    if (!id) return;
    state.onboardingDraft.participants = state.onboardingDraft.participants.filter(p => p.id !== id);
    renderOnboardingParticipants();
    updateOnboardingStartState();
    if (el.onboardingParticipantInput) {
      el.onboardingParticipantInput.focus();
    }
  }

  function buildMetaParticipantsPayload(list) {
    return list.map(p => ({
      id: p.id,
      displayName: p.displayName,
      origin: 'external',
      createdAt: p.createdAt || Date.now(),
      createdBy: p.createdBy || state.clientId,
    }));
  }

  function handleOnboardingStart() {
    console.debug('[onboarding] handleOnboardingStart invoked');
    const title = cleanName(el.onboardingTitleInput ? el.onboardingTitleInput.value : state.onboardingDraft.title);
    state.onboardingDraft.title = title;
    const currency = (el.onboardingCurrencySelect ? el.onboardingCurrencySelect.value : state.onboardingDraft.currency || DEFAULT_CURRENCY) || DEFAULT_CURRENCY;
    state.onboardingDraft.currency = currency;
    if (!onboardingIsValid()) {
      updateOnboardingStartState();
      showToast('Add a title and at least one participant','warn');
      console.debug('[onboarding] invalid: title="'+title+'" participants='+state.onboardingDraft.participants.length);
      return;
    }
    const payload = {
      title,
      currency,
      participants: buildMetaParticipantsPayload(state.onboardingDraft.participants),
    };
    state.onboardingCompleted = true;
  console.debug('[onboarding] start clicked -> marking completed, payload', payload);
    applyMetaPatch(payload);
    recomputeBalances();
    recomputeSettlements();
    render();
    updateSubtitle();
    broadcastMetaPatch(payload);
    // Failsafe second render if race w/ replay
    requestAnimationFrame(()=>{
      if (state.onboardingCompleted) {
        removeOnboardingIfCompleted();
      }
    });
  }

  // Global fallback to ensure button works even if listener missed
  window.__startTracking = function(){
    console.debug('[onboarding] global __startTracking called');
    handleOnboardingStart();
  };

  // Global fallback for ledger (debugging)
  window.__openLedger = function(){
    console.debug('[ledger] global __openLedger called');
    openLedgerSheet();
  };

  // updateReimburseCallout removed (callout deprecated)

  // --- Settlement Sheet Logic ---
  function hydrateSettlementSheetElements(force=false) {
    if (el._settlementHydrated && !force) return;
    const ids = {
      settlementSheetBackdrop: 'settlement-sheet-backdrop',
      settlementSheet: 'settlement-sheet',
      settlementSheetClose: 'settlement-sheet-close',
      settlementForm: 'settlement-form',
      settleFrom: 'settle-from',
      settleTo: 'settle-to',
      settleSwap: 'settle-swap',
      settleAmount: 'settle-amount',
      settleCurrency: 'settle-currency',
      settleCancel: 'settle-cancel',
      settleDate: 'settle-date'
    };
    Object.entries(ids).forEach(([k,id]) => {
      if (!el[k]) {
        el[k] = document.getElementById(id);
      }
    });
    // Attach listeners once elements exist
    if (el.settlementSheet && !el.settlementSheet.dataset.bound) {
      if (el.settlementSheetClose) el.settlementSheetClose.addEventListener('click', closeSettlementSheet);
      if (el.settlementSheetBackdrop) el.settlementSheetBackdrop.addEventListener('click', closeSettlementSheet);
      if (el.settleCancel) el.settleCancel.addEventListener('click', closeSettlementSheet);
      if (el.settlementForm) el.settlementForm.addEventListener('submit', submitSettlementForm);
      if (el.settleSwap) el.settleSwap.addEventListener('click', () => {
        const fromEl = el.settleFrom || el.settlementFromSelect;
        const toEl = el.settleTo || el.settlementToSelect;
        if (!fromEl || !toEl) return;
        const a = fromEl.value; fromEl.value = toEl.value; toEl.value = a;
      });
      el.settlementSheet.dataset.bound = 'true';
    }
    el._settlementHydrated = true;
  }

  // Hydrate late-loaded settlement sheet markup once DOM fully parsed
  document.addEventListener('DOMContentLoaded', () => {
    hydrateSettlementSheetElements();
    hydrateLedgerElements();
  });

  function openSettlementSheet(preset) {
    // preset: { from, to, amountMinor }
    hydrateSettlementSheetElements();
    if (!el.settlementSheet) {
      console.warn('[settlement] sheet element still missing after hydration');
      showToast('Settlement UI not ready','error');
      return;
    }
    // Populate participant selects
    populateSettlementParticipantOptions();
    const parts = activeParticipants();
    const fromSel = el.settleFrom || el.settlementFromSelect;
    const toSel = el.settleTo || el.settlementToSelect;
    if (!fromSel || !toSel) {
      console.warn('[settlement] select elements missing');
      showToast('Cannot open settlement – UI missing','error');
      return;
    }
    if (!parts.length) {
      showToast('Add participants first','warn');
      return;
    }
    if (preset && preset.from && parts.find(p=>p.id===preset.from)) {
      fromSel.value = preset.from;
    } else if (parts.length>=2) {
      fromSel.value = parts[0].id;
    }
    if (preset && preset.to && parts.find(p=>p.id===preset.to)) {
      toSel.value = preset.to;
    } else if (parts.length>=2) {
      toSel.value = parts[1].id === fromSel.value && parts.length>2 ? parts[2].id : parts[1].id;
    }
    // Amount
    if (el.settleAmount || el.settlementAmountInput) {
      const amt = preset && preset.amountMinor ? (preset.amountMinor/100).toFixed(2) : '';
      (el.settleAmount || el.settlementAmountInput).value = amt;
    }
    if (el.settleCurrency || el.settlementCurrencySpan) {
      (el.settleCurrency || el.settlementCurrencySpan).textContent = activeCurrency();
    }
    // Date default (today) if empty or new preset
    if (el.settleDate) {
      if (!el.settleDate.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const dd = String(today.getDate()).padStart(2,'0');
        el.settleDate.value = `${yyyy}-${mm}-${dd}`;
      }
    }
    // Show sheet
    el.settlementSheetBackdrop.hidden = false;
    el.settlementSheet.removeAttribute('aria-hidden');
    el.settlementSheet.classList.add('is-open');
    // Focus amount for quick edit
    if (el.settleAmount || el.settlementAmountInput) {
      requestAnimationFrame(()=> (el.settleAmount || el.settlementAmountInput).focus());
    }
  }

  function closeSettlementSheet() {
    if (!el.settlementSheet) return;
    el.settlementSheet.setAttribute('aria-hidden','true');
    el.settlementSheet.classList.remove('is-open');
    if (el.settlementSheetBackdrop) el.settlementSheetBackdrop.hidden = true;
  }

  function populateSettlementParticipantOptions() {
    const participants = activeParticipants();
    const targetFrom = el.settleFrom || el.settlementFromSelect;
    const targetTo = el.settleTo || el.settlementToSelect;
    if (!targetFrom || !targetTo) {
      console.warn('[settlement] participant select elements missing');
      return;
    }
    const optsHtml = participants.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.displayName)}</option>`).join('');
    targetFrom.innerHTML = optsHtml;
    targetTo.innerHTML = optsHtml;
  }

  function submitSettlementForm(e) {
    if (e) e.preventDefault();
  const fromSel2 = el.settleFrom || el.settlementFromSelect;
  const toSel2 = el.settleTo || el.settlementToSelect;
  const amtEl = el.settleAmount || el.settlementAmountInput;
  if (!fromSel2 || !toSel2 || !amtEl) return;
  const from = fromSel2.value;
  const to = toSel2.value;
    if (!from || !to || from === to) {
      showToast('Choose two different participants','warn');
      return;
    }
  const raw = amtEl.value.trim();
    if (!raw) {
      showToast('Enter an amount','warn');
      return;
    }
    const amountMinor = Math.round(Number(raw)*100);
    if (!(amountMinor > 0)) {
      showToast('Amount must be > 0','warn');
      return;
    }
    // Optional: limit to existing debtor balance (soft)
    const balances = computeBalancesSnapshot();
    const balFrom = balances.get(from) || 0; // positive means owed to them; negative means they owe
    if (balFrom >= 0) {
      // from isn't a debtor in current snapshot
      // Allow anyway but warn
      console.debug('[settlement] from participant not currently debtor (balance='+balFrom+')');
    }
    // Date override
    let createdAtOverride = undefined;
    if (el.settleDate && el.settleDate.value) {
      const parts = el.settleDate.value.split('-');
      if (parts.length === 3) {
        const [y,m,d] = parts.map(Number);
        if (y && m && d) {
          createdAtOverride = new Date(Date.UTC(y, m-1, d, 12,0,0,0)).getTime();
        }
      }
    }
    recordSettlement(from,to,amountMinor,createdAtOverride);
    showToast('Settlement saved','success');
    closeSettlementSheet();
    // render will occur after envelope processed; fallback timer for immediate UX
    setTimeout(()=>{ render(); }, 50);
  }

  function computeBalancesSnapshot() {
    // Lightweight recompute (mirrors recomputeBalances but returns map only)
    const map = new Map();
    state.expenses.forEach(exp => {
      if (exp.deleted) return;
      addBalance(map, exp.payer, exp.amountMinor);
      exp.splits.forEach(s => {
        addBalance(map, s.participantId, -s.amountMinor);
      });
    });
    state.recordedSettlements.forEach(s => {
      addBalance(map, s.from, -s.amountMinor);
      addBalance(map, s.to, s.amountMinor);
    });
    return map;
  }

  // Attach settlement sheet listeners once DOM references exist
  if (el.settlementSheet) {
    if (el.settlementSheetClose) {
      el.settlementSheetClose.addEventListener('click', closeSettlementSheet);
    }
    if (el.settlementSheetBackdrop) {
      el.settlementSheetBackdrop.addEventListener('click', closeSettlementSheet);
    }
    if (el.settlementCancelBtn) {
      el.settlementCancelBtn.addEventListener('click', closeSettlementSheet);
    }
    if (el.settlementForm) {
      el.settlementForm.addEventListener('submit', submitSettlementForm);
    }
    if (el.settleSwap) {
      el.settleSwap.addEventListener('click', () => {
        const fromEl = el.settleFrom || el.settlementFromSelect;
        const toEl = el.settleTo || el.settlementToSelect;
        if (!fromEl || !toEl) return;
        const a = fromEl.value;
        fromEl.value = toEl.value;
        toEl.value = a;
      });
    }
  }

  function resolveParticipantName(idOrName) {
    if (!idOrName) return '';
    // If value matches an existing participant id, return displayName
    const p = state.participants.get(idOrName);
    if (p && p.displayName) return p.displayName;
    // Otherwise it might already be a legacy/migrated name string
    return idOrName;
  }

  function refreshSplitConfigUI() {
    if (!el.splitConfig) return;
    const mode = el.splitModeSelect ? el.splitModeSelect.value : 'even';
    const participants = activeParticipants();
    if (!participants.length) {
      el.splitConfig.innerHTML = '<div style="font-size:.65rem;color:var(--muted);">Add participants to configure splits.</div>';
      return;
    }
    if (mode === 'even') {
      el.splitConfig.innerHTML = `<div style="font-size:.65rem;color:var(--muted);">Evenly split among ${participants.length} participant(s).</div>`;
    } else if (mode === 'weight') {
      // Enhanced weight controls with +/- buttons
      const weightControlsHtml = participants.map(p => `
        <div class="weight-control-item">
          <span class="weight-participant-name">${escapeHtml(p.displayName)}</span>
          <div class="weight-input-group">
            <button type="button" class="weight-btn weight-decrease" data-pid="${p.id}">−</button>
            <input type="number" class="weight-input" data-pid="${p.id}" min="0" step="0.1" value="1" />
            <button type="button" class="weight-btn weight-increase" data-pid="${p.id}">+</button>
          </div>
        </div>
      `).join('');
      
      el.splitConfig.innerHTML = `
        <div class="weight-control-group">
          ${weightControlsHtml}
          <div class="weight-total" id="weight-total">Total weight = ${participants.length}.0</div>
        </div>
      `;
      
      // Add event listeners for weight controls
      setupWeightControls();
    } else if (mode === 'manual' || mode === 'mixed') {
      el.splitConfig.innerHTML = participants.map(p=>`<label style="display:flex;align-items:center;gap:.4rem;font-size:.65rem;">${escapeHtml(p.displayName)}<input type="number" class="manual-input" data-pid="${p.id}" min="0" step="0.01" placeholder="0.00" style="width:70px;padding:.15rem .25rem;font-size:.65rem;"/></label>`).join('');
    }
  }
  
  function setupWeightControls() {
    const weightControls = document.querySelectorAll('.weight-btn');
    const weightInputs = document.querySelectorAll('.weight-input');
    const totalDisplay = document.getElementById('weight-total');
    
    function updateTotal() {
      const total = Array.from(weightInputs).reduce((sum, input) => {
        return sum + (parseFloat(input.value) || 0);
      }, 0);
      if (totalDisplay) {
        totalDisplay.textContent = `Total weight = ${total.toFixed(1)}`;
      }
    }
    
    // Handle +/- button clicks
    weightControls.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pid = btn.getAttribute('data-pid');
        const input = document.querySelector(`.weight-input[data-pid="${pid}"]`);
        if (!input) return;
        
        const currentValue = parseFloat(input.value) || 0;
        
        if (btn.classList.contains('weight-increase')) {
          input.value = Math.min(currentValue + 0.5, 10); // Increment by 0.5, max 10
        } else if (btn.classList.contains('weight-decrease')) {
          input.value = Math.max(currentValue - 0.5, 0); // Decrement by 0.5, min 0
        }
        
        updateTotal();
      });
    });
    
    // Handle direct input changes
    weightInputs.forEach(input => {
      input.addEventListener('input', updateTotal);
      input.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value < 0) {
          e.target.value = 0;
        } else if (value > 10) {
          e.target.value = 10;
        }
        updateTotal();
      });
    });
    
    // Initial total update
    updateTotal();
  }

  function collectSplits(amountMinor) {
    const mode = el.splitModeSelect ? el.splitModeSelect.value : 'even';
    const participants = activeParticipants();
    if (!participants.length) return [];
    if (mode === 'even') {
      return participants.map(p => ({ participantId: p.id, mode: 'even' }));
    } else if (mode === 'weight') {
      const weights = Array.from(el.splitConfig.querySelectorAll('.weight-input'));
      return weights.map(inp => ({ 
        participantId: inp.getAttribute('data-pid'), 
        mode: 'weight', 
        weight: parseFloat(inp.value) || 0
      }));
    } else if (mode === 'manual') {
      const manuals = Array.from(el.splitConfig.querySelectorAll('.manual-input'));
      return manuals.map(inp => ({ 
        participantId: inp.getAttribute('data-pid'), 
        mode: 'manual', 
        amountMinor: Math.round(parseFloat(inp.value||'0')*100) 
      }));
    } else if (mode === 'mixed') {
      // Mixed: treat non-empty manual as manual; others even
      const manuals = Array.from(el.splitConfig.querySelectorAll('.manual-input'));
      const manualSplits = [];
      const remaining = [];
      manuals.forEach(inp => {
        const v = parseFloat(inp.value||'');
        const pid = inp.getAttribute('data-pid');
        if (v>0) manualSplits.push({ participantId: pid, mode:'manual', amountMinor: Math.round(v*100) }); else remaining.push(pid);
      });
      remaining.forEach(pid => manualSplits.push({ participantId: pid, mode:'even' }));
      return manualSplits;
    }
    return [];
  }

  function submitExpenseForm() {
    const title = (el.expenseTitle && el.expenseTitle.value.trim()) || '';
    const amtStr = el.expenseAmount && el.expenseAmount.value.trim();
    const amountMinor = Math.round(parseFloat(amtStr||'0') * 100);
    const payerId = el.payerSelect && el.payerSelect.value;
    const selectedCurrency = document.getElementById('exp-currency')?.value || activeCurrency();
    
    if (!title || !(amountMinor>0)) { showToast('Invalid expense','error'); return; }
    if (!payerId) { showToast('Please select a payer','warn'); return; }
    const splits = collectSplits(amountMinor);
    // Determine createdAt from date input if provided
    let createdAtOverride = null;
    if (el.expenseDate && el.expenseDate.value) {
      // Interpret as local date at 12:00 noon to avoid DST midnight edge causing previous day in UTC grouping
      const parts = el.expenseDate.value.split('-');
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1; // zero-based
        const day = Number(parts[2]);
        const dt = new Date(year, month, day, 12, 0, 0, 0);
        createdAtOverride = dt.getTime();
      }
    }
    const expense = createExpense({ title, amountMinor, splits, category: selectedCategory });
    // Override currency if user selected different one
    expense.currency = selectedCurrency;
    console.log('Creating expense with category:', selectedCategory); // Debug log
    console.log('Full expense object:', expense); // Debug log
    // Use the selected payer
    expense.payer = payerId;
    state.lastSelectedPayerId = payerId;
    if (createdAtOverride) {
      expense.createdAt = createdAtOverride;
    }
    broadcastExpense(expense);
    console.log('Expense broadcasted, current selectedCategory still:', selectedCategory); // Debug log
    // reset form but keep category selection until sheet closes
    if (el.expenseForm) {
      el.expenseForm.reset();
      // Re-initialize components after reset
      setTimeout(() => {
        initializeEnhancedFormComponents();
        // Reset category to default but maintain visual state
        selectedCategory = 'receipt';
        updateTitleCategoryIcon();
      }, 50);
    }
    refreshSplitConfigUI();
  }

  function populatePayerSelect() {
    if (!el.payerSelect) return;
    const was = el.payerSelect.value;
    const participants = activeParticipants();
    const lines = ['<option value=""'+(was===''?' selected':'')+'>Select payer…</option>'];
    participants.forEach(p => {
      const sel = p.id === was ? ' selected' : '';
      lines.push(`<option value="${escapeHtml(p.id)}"${sel}>${escapeHtml(p.displayName)}</option>`);
    });
    const html = lines.join('');
    if (el.payerSelect.innerHTML !== html) {
      el.payerSelect.innerHTML = html;
    }
  }

  // Delegate clicks for expense delete & settlement record
  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest && e.target.closest('.expense-delete, .expense-trash');
    if (delBtn) {
      const id = delBtn.getAttribute('data-id');
      const exp = state.expenses.get(id);
      if (exp) broadcastExpenseDelete(exp);
    }
    const recordBtn = e.target.closest && e.target.closest('.record-settlement-btn');
    if (recordBtn) {
      const item = recordBtn.closest('.settlement-item');
      if (!item) return;
      const from = item.getAttribute('data-from');
      const to = item.getAttribute('data-to');
      const amt = Number(item.getAttribute('data-amt'));
      openSettlementSheet({ from, to, amountMinor: amt });
    }
    
    // Handle payment preference copy button
    const copyBtn = e.target.closest && e.target.closest('.payment-copy-btn');
    if (copyBtn) {
      const textToCopy = copyBtn.getAttribute('data-copy');
      if (textToCopy) {
        copyToClipboard(textToCopy);
        showToast('Copied to clipboard', 'success');
      }
    }
  });

  // Kickstart app (was lost in refactor causing FAB to be inert)
  init();
  
  // ---------------- Ledger Sheet Logic ----------------
  function hydrateLedgerElements() {
    if (!el.ledgerBtn) el.ledgerBtn = document.getElementById('ledger-btn');
    if (!el.ledgerSheet) el.ledgerSheet = document.getElementById('ledger-sheet');
    if (!el.ledgerSheetBackdrop) el.ledgerSheetBackdrop = document.getElementById('ledger-sheet-backdrop');
    if (!el.ledgerSheetClose) el.ledgerSheetClose = document.getElementById('ledger-sheet-close');
    if (!el.ledgerList) el.ledgerList = document.getElementById('ledger-list');
    if (!el.ledgerEmpty) el.ledgerEmpty = document.getElementById('ledger-empty');
    
    // Attach listeners if not already done
    if (el.ledgerBtn && !el.ledgerBtn.dataset.bound) {
      console.debug('[ledger] Attaching click listener to ledger button');
      el.ledgerBtn.addEventListener('click', () => {
        console.debug('[ledger] Button clicked');
        openLedgerSheet();
      });
      el.ledgerBtn.dataset.bound = 'true';
    }
    if (el.ledgerSheetClose && !el.ledgerSheetClose.dataset.bound) {
      el.ledgerSheetClose.addEventListener('click', () => closeLedgerSheet());
      el.ledgerSheetClose.dataset.bound = 'true';
    }
    if (el.ledgerSheetBackdrop && !el.ledgerSheetBackdrop.dataset.bound) {
      el.ledgerSheetBackdrop.addEventListener('click', (e)=> { if (e.target === el.ledgerSheetBackdrop) closeLedgerSheet(); });
      el.ledgerSheetBackdrop.dataset.bound = 'true';
    }
  }

  function openLedgerSheet() {
    console.debug('[ledger] Opening ledger sheet');
    hydrateLedgerElements();
    if (!el.ledgerSheet || !el.ledgerSheetBackdrop) {
      console.warn('[ledger] Missing sheet or backdrop elements after hydration', { sheet: !!el.ledgerSheet, backdrop: !!el.ledgerSheetBackdrop });
      return;
    }
    renderLedger();
    el.ledgerSheetBackdrop.hidden = false;
    requestAnimationFrame(()=>{
      el.ledgerSheet.classList.add('is-open');
      el.ledgerSheet.removeAttribute('aria-hidden');
      console.debug('[ledger] Sheet opened');
    });
  }
  function closeLedgerSheet() {
    console.debug('[ledger] Closing ledger sheet');
    if (!el.ledgerSheet || !el.ledgerSheetBackdrop) return;
    el.ledgerSheet.classList.remove('is-open');
    el.ledgerSheet.setAttribute('aria-hidden','true');
    setTimeout(()=>{ if (el.ledgerSheetBackdrop) el.ledgerSheetBackdrop.hidden = true; },280);
  }
  function ledgerEntries() {
    const expenses = Array.from(state.expenses.values())
      .filter(e=>!e.deleted)
      .map(e=>({ kind:'expense', id:e.id, ts:e.createdAt||0, description:e.description||'(no title)', amountMinor:e.amountMinor, payer:e.payer, currency:e.currency||activeCurrency() }));
    const settlements = state.recordedSettlements.map(s=>({ kind:'settlement', id:s.id, ts:s.createdAt||0, from:s.from, to:s.to, amountMinor:s.amountMinor, currency: activeCurrency() }));
    return expenses.concat(settlements).sort((a,b)=> b.ts - a.ts);
  }
  function renderLedger() {
    console.debug('[ledger] Rendering ledger, list element:', !!el.ledgerList);
    if (!el.ledgerList) return;
    const entries = ledgerEntries();
    console.debug('[ledger] Found', entries.length, 'entries');
    if (!entries.length) {
      el.ledgerList.innerHTML = '';
      if (el.ledgerEmpty) el.ledgerEmpty.style.display = 'block';
      return;
    }
    if (el.ledgerEmpty) el.ledgerEmpty.style.display = 'none';
    el.ledgerList.innerHTML = entries.map(ledgerEntryHTML).join('');
  }
  function ledgerEntryHTML(entry) {
    const d = new Date(entry.ts||0);
    const yyyy=d.getFullYear(); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    if (entry.kind==='expense') {
      const payerName = resolveParticipantName(entry.payer) || entry.payer;
      return `<li class="ledger-entry" data-kind="expense" data-id="${escapeHtml(entry.id)}"><span class="ledger-entry-type">Expense</span><span class="ledger-entry-desc">${escapeHtml(entry.description)}</span><span class="ledger-entry-meta"><span class="ledger-entry-amt">${escapeHtml(formatAmountDisplay(entry.amountMinor, entry.currency))}</span><span class="ledger-entry-sub">${escapeHtml(payerName)} • ${escapeHtml(dateStr)}</span></span></li>`;
    } else if (entry.kind==='settlement') {
      const fromName = resolveParticipantName(entry.from) || entry.from;
      const toName = resolveParticipantName(entry.to) || entry.to;
      return `<li class="ledger-entry" data-kind="settlement" data-id="${escapeHtml(entry.id)}"><span class="ledger-entry-type" style="color:var(--c-success);">Transfer</span><span class="ledger-entry-desc">${escapeHtml(fromName)} → ${escapeHtml(toName)}</span><span class="ledger-entry-meta"><span class="ledger-entry-amt">${escapeHtml(formatAmountDisplay(entry.amountMinor, entry.currency))}</span><span class="ledger-entry-sub">${escapeHtml(dateStr)}</span></span></li>`;
    }
    return '';
  }
})();