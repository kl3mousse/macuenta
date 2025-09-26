// laCuenta - webxdc app
// Author: you

(function () {
  'use strict';

  // ------------------------------
  // Elements
  // ------------------------------
  const el = {
    demoBtn: document.getElementById('demo-btn'),
    content: document.getElementById('content'),
  };

  // ------------------------------
  // App State
  // ------------------------------
  const state = {
    // Add your app state here
    initialized: false,
  };

  // ------------------------------
  // webxdc Integration
  // ------------------------------
  function sendUpdate(payload, info) {
    try {
      if (!window.webxdc || typeof window.webxdc.sendUpdate !== 'function') {
        console.log('webxdc not available, running in browser mode');
        return;
      }
      
      window.webxdc.sendUpdate({
        payload,
        info,
        summary: info
      });
    } catch (error) {
      console.error('Error sending update:', error);
    }
  }

  function handleIncomingUpdate(update) {
    try {
      if (!update || !update.payload) return;
      
      console.log('Received update:', update);
      // Handle incoming updates from other participants
      
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  function initWebxdc() {
    try {
      if (window.webxdc && typeof window.webxdc.setUpdateListener === 'function') {
        window.webxdc.setUpdateListener(handleIncomingUpdate);
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
    
    console.log('Initializing laCuenta...');
    
    // Initialize webxdc
    initWebxdc();
    
    // Set up event listeners
    setupEventListeners();
    
    state.initialized = true;
    
    // Add initial content
    updateContent('laCuenta is ready! Start building your app here.');
  }

  function setupEventListeners() {
    if (el.demoBtn) {
      el.demoBtn.addEventListener('click', handleDemoButtonClick);
    }
  }

  function handleDemoButtonClick() {
    console.log('Demo button clicked');
    
    // Send a demo update
    sendUpdate({ 
      action: 'demo_click',
      timestamp: Date.now()
    }, 'User clicked the demo button');
    
    // Update content
    updateContent('Demo button was clicked! Check the console for webxdc integration.');
  }

  function updateContent(message) {
    if (el.content) {
      el.content.innerHTML = `<p>${message}</p>`;
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