# Real-Time Communication Portal

A React-based real-time communication application built for Sprint 11, designed to simulate a production-style messaging environment using WebSockets. The project focuses on connection lifecycle management, automatic reconnection, accessibility, and a clean enterprise interface that remains stable even when the network connection becomes unreliable.

## Overview

The application establishes a persistent WebSocket connection and updates the interface in real time whenever a new message is received. It also handles connection failures gracefully by notifying the user and automatically attempting to reconnect using an exponential backoff strategy.

## Features

* Persistent WebSocket connection using the required TRD endpoint
* Real-time message updates
* Connection status indicator (Connecting, Connected, Disconnected)
* Automatic reconnection with exponential backoff
* Graceful handling of connection failures
* Initial loading state and empty state UI
* Input validation to prevent empty messages
* Automatic scrolling to the latest message
* Keyboard-accessible controls and ARIA support
* Simulated analytics logging for user actions
* Responsive monochromatic interface suitable for desktop and mobile devices

## Tech Stack

* React 18
* JavaScript (ES6+)
* Native WebSocket API
* Vanilla CSS

## Project Structure

src/

* LiveFeedEngine.jsx
* LiveFeedEngine.css
* App.js
* index.js

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/btwitsnaushad/real-time-communication-portal.git
cd real-time-communication-portal
npm install
npm start
```

The application will be available at:

```text
http://localhost:3000
```

## WebSocket Endpoint

This project uses the WebSocket endpoint specified in the Sprint 11 Technical Requirements Document:

```text
wss://echo.websocket.events
```

If the endpoint is temporarily unavailable, the application displays a **Disconnected** status and a **Connection Lost. Attempting to reconnect...** notification while continuing to retry the connection automatically. This behavior is intentional and demonstrates the required error-handling and reconnection workflow.

## What Was Implemented

* WebSocket initialization and cleanup
* `onopen`, `onmessage`, `onerror`, and `onclose` event handling
* Functional state updates for incoming messages
* Exponential backoff reconnection logic
* Online and offline network detection
* Accessible live message feed
* Analytics hook for primary user actions
* Responsive enterprise-style interface

## Notes

This project was developed as a Sprint 11 client deliverable. The implementation prioritizes stability, predictable connection behavior, and clean React architecture. Because it relies on a public WebSocket echo server, connection availability may vary depending on DNS resolution or temporary server availability.

## Author

**Naushad Ahamad**

Sprint 11 - Real-Time Communication Portal
