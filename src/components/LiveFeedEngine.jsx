import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LiveFeedEngine.css'; 

const TRD_WS_URL = 'wss://echo.websocket.events';

const useAnalytics = () => {
  return (actionName) => {
    console.log(`[Analytics] ${actionName}`);
  };
};

const LiveFeedEngine = () => {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const maxReconnectDelay = 10000; 
  const reconnectTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const trackAnalytics = useAnalytics();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReconnection = useCallback(() => {
    let delay = Math.pow(2, reconnectAttempt.current) * 1000;
    delay = Math.min(delay, maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    reconnectAttempt.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const connectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      setConnectionStatus('CONNECTING');
      wsRef.current = new WebSocket(TRD_WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket Connected');
        setConnectionStatus('CONNECTED');
        reconnectAttempt.current = 0; 
      };

      wsRef.current.onmessage = (event) => {
        const newMessage = {
          id: Date.now(),
          text: event.data,
          type: 'received',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, newMessage]);
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('DISCONNECTED');
        handleReconnection();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        wsRef.current.close(); 
      };
    } catch (error) {
      console.error('Connection setup failed:', error);
      setConnectionStatus('DISCONNECTED');
      handleReconnection();
    }
  }, [handleReconnection]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online. Forcing reconnection...');
      reconnectAttempt.current = 0;
      connectWebSocket();
    };
    
    const handleOffline = () => {
      console.log('Network offline.');
      setConnectionStatus('DISCONNECTED');
      if (wsRef.current) wsRef.current.close();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    connectWebSocket();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      const outgoingMessage = {
        id: Date.now(),
        text: inputMessage,
        type: 'sent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages((prev) => [...prev, outgoingMessage]);
      wsRef.current.send(inputMessage);
      setInputMessage('');
      
      trackAnalytics('User emitted payload');
    }
  };

  return (
    <div className="communication-portal">
      {/* FIXED: Error banner only shows when actually disconnected */}
      {connectionStatus === 'DISCONNECTED' && (
        <div className="error-banner" role="alert">
          ⚠️ Connection Lost. Attempting to reconnect...
        </div>
      )}

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-title">
            {/* FIXED: Added aria-label and role for accessibility */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Portal Icon">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Real-Time Communication Portal
          </div>
          <div className="status-badge" aria-live="polite">
            {/* FIXED: Status dot color logic corrected */}
            <span className={`status-dot ${connectionStatus === 'CONNECTED' ? 'connected' : connectionStatus === 'DISCONNECTED' ? 'disconnected' : ''}`} aria-hidden="true"></span>
            {connectionStatus === 'CONNECTED' 
              ? 'Connected' 
              : connectionStatus === 'DISCONNECTED' 
              ? 'Disconnected' 
              : 'Connecting...'}
          </div>
        </header>

        <div className="chat-feed" role="log" aria-live="polite">
          {/* FIXED: Added Loading State & Spinner */}
          {connectionStatus === 'CONNECTING' && messages.length === 0 ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Establishing connection...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <span className="timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={sendMessage}>
          {/* FIXED: Input Label properly associated with input via htmlFor/id */}
          <label htmlFor="message-input" className="sr-only">Type your message</label>
          <input
            id="message-input"
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={connectionStatus !== 'CONNECTED'}
            className="chat-input"
          />
          {/* FIXED: aria-label added to button */}
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || connectionStatus !== 'CONNECTED'}
            className="send-button"
            aria-label="Send Message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveFeedEngine;