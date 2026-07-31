# Real-Time Communication Portal

A production-style real-time messaging application built with **React** and the **WebSocket API**. This project was developed as part of **Sprint 11 – Real-Time Communication Portal**, with a strong focus on connection reliability, automatic reconnection, accessibility, and a clean enterprise-style user interface.

Unlike a basic chat demo, this implementation emphasizes **connection lifecycle management**, **fault tolerance**, and **responsive user experience**, making it a practical front-end engineering project.

## Live Demo

**Live Application:**
https://real-time-communication-portal-tawny.vercel.app

## GitHub Repository

**Repository:**
https://github.com/btwitsnaushad/real-time-communication-portal

## Features

* Real-time WebSocket communication
* Persistent connection management
* Automatic reconnection using exponential backoff
* Connection status indicator (Connecting, Connected, Disconnected)
* Graceful handling of connection failures
* Initial loading state and empty state interface
* Input validation for empty and whitespace messages
* Automatic scrolling to the latest message
* Accessibility support (`role="log"`, `aria-live="polite"`)
* Simulated analytics hook for primary user actions
* Responsive monochromatic UI suitable for desktop and mobile devices

## Tech Stack

* **React 18**
* **JavaScript (ES6+)**
* **Native WebSocket API**
* **Vanilla CSS**

## Project Structure

```text
src/
├── LiveFeedEngine.jsx
├── LiveFeedEngine.css
├── App.js
└── index.js
```

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/btwitsnaushad/real-time-communication-portal.git
cd real-time-communication-portal
npm install
npm start
```

The application will run locally at:

```text
http://localhost:3000
```

## WebSocket Endpoint

This project uses the WebSocket endpoint specified in the Sprint 11 Technical Requirements Document:

```text
wss://echo.websocket.events
```

If the endpoint is temporarily unavailable, the application intentionally displays a **Disconnected** status and a **Connection Lost. Attempting to reconnect...** notification while continuing to retry the connection automatically. This behavior demonstrates the required **error-handling and reconnection workflow**.

## What Was Implemented

* WebSocket initialization and cleanup
* `onopen`, `onmessage`, `onerror`, and `onclose` event handling
* Functional React state updates for incoming messages
* Exponential backoff reconnection logic
* Online and offline network detection
* Accessible live message feed
* Analytics hook for user actions
* Responsive enterprise-style interface

## Project Status

The application has been successfully deployed on **Vercel** and is fully configured for production deployment. The interface remains stable even when the public WebSocket endpoint is unavailable, demonstrating graceful degradation and resilient connection handling.

## Author

**Naushad Ahamad**

Sprint 11 - Real-Time Communication Portal
