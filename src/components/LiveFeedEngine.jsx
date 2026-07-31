import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LiveFeedEngine.css'; 

const TRD_WS_URL = 'wss://echo.websocket.events';

const LiveFeedEngine = () => {
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const maxReconnectDelay = 30000; // Maximum delay of 30 seconds
  const reconnectTimeoutRef = useRef(null);

  // Defined first to avoid the "used before defined" warning
  const handleReconnection = useCallback(() => {
    // Exponential Backoff logic: 1s, 2s, 4s, 8s... up to max 30s
    let delay = Math.pow(2, reconnectAttempt.current) * 1000;
    delay = Math.min(delay, maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    reconnectAttempt.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally omitting connectWebSocket to prevent circular dependency warning

  const connectWebSocket = useCallback(() => {
    // Clear previous timeout if any
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      setConnectionStatus(reconnectAttempt.current > 0 ? 'CONNECTING' : 'CONNECTING');
      wsRef.current = new WebSocket(TRD_WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket Connected');
        setConnectionStatus('CONNECTED');
        reconnectAttempt.current = 0; // Reset backoff on successful connection
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
        wsRef.current.close(); // Trigger onclose
      };
    } catch (error) {
      console.error('Connection setup failed:', error);
      setConnectionStatus('DISCONNECTED');
      handleReconnection();
    }
  }, [handleReconnection]);

  useEffect(() => {
    // OS-level network event listeners
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

    // Initial connection
    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Add local message to UI immediately
      const outgoingMessage = {
        id: Date.now(),
        text: inputMessage,
        type: 'sent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, outgoingMessage]);
      
      // Send to server
      wsRef.current.send(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="communication-portal">
      {/* Error Banner for Disconnected/Connecting States */}
      {connectionStatus !== 'CONNECTED' && (
        <div className="error-banner">
          ⚠️ Connection Lost. Attempting to reconnect...
        </div>
      )}

      <div className="chat-container">
        {/* Header Section */}
        <header className="chat-header">
          <div className="header-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Real-Time Communication Portal
          </div>
          <div className={`status-badge ${connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'}`} aria-live="polite">
            <span className={`status-dot ${connectionStatus === 'CONNECTED' ? 'connected' : 'disconnected'}`}></span>
            {connectionStatus === 'CONNECTED' 
              ? 'Connected' 
              : connectionStatus === 'DISCONNECTED' 
              ? 'Disconnected' 
              : 'Connecting...'}
          </div>
        </header>

        {/* Messages Feed Section */}
        <div className="chat-feed">
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
        </div>

        {/* Input Form Section */}
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