import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LiveFeedEngine.css'; 

// Mandatory WebSocket endpoint as per TRD Phase 1 requirements for final submission.
const TRD_WS_URL = 'wss://echo.websocket.events';

// Custom hook for telemetry simulation as required by Non-Functional Requirements (NFRs)
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
  const maxReconnectDelay = 10000; // Capped at 10 seconds to strictly meet TRD requirements
  const reconnectTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const trackAnalytics = useAnalytics();

  // Auto-scroll logic to keep the newest messages in view
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handles exponential backoff for WebSocket reconnections
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

  // Initializes and manages the WebSocket connection lifecycle
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
        reconnectAttempt.current = 0; // Reset attempts on successful connection
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
        wsRef.current.close(); // Force close to trigger onclose event and start reconnection
      };
    } catch (error) {
      console.error('Connection setup failed:', error);
      setConnectionStatus('DISCONNECTED');
      handleReconnection();
    }
  }, [handleReconnection]);

  // Network listener to handle OS-level online/offline events
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

    // Cleanup function to gracefully close connections and prevent memory leaks
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  // Handles outbound message formatting, validation, and transmission
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
      
      // Trigger analytics tracking for user action
      trackAnalytics('User emitted payload');
    }
  };

  return (
    <div className="communication-portal">
      {connectionStatus !== 'CONNECTED' && (
        <div className="error-banner">
          ⚠️ Connection Lost. Attempting to reconnect...
        </div>
      )}

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Real-Time Communication Portal
          </div>
          <div className="status-badge">
            <span className={`status-dot ${connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'}`}></span>
            {connectionStatus === 'CONNECTED' 
              ? 'Connected' 
              : connectionStatus === 'DISCONNECTED' 
              ? 'Disconnected' 
              : 'Connecting...'}
          </div>
        </header>

        {/* Chat feed container equipped with required accessibility attributes */}
        <div className="chat-feed" role="log" aria-live="polite">
          {messages.length === 0 ? (
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
          {/* Invisible target element for the auto-scroll function */}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={connectionStatus !== 'CONNECTED'}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || connectionStatus !== 'CONNECTED'}
            className="send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveFeedEngine;