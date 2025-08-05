# 📁 Google Drive Extracts Monitor

A full-stack application that monitors changes in Google Drive folders for an accounting firm’s clients. It uses NestJS, Google OAuth, and WebSockets to deliver real-time notifications to a Vue.js frontend.

## 🔧 Tech Stack

- **Backend:** NestJS + Google Drive API (with polling)
- **Auth:** Google OAuth 2.0
- **Real-Time:** WebSocket (Socket.io)
- **Frontend:** Vue 3 + Vite + TailwindCSS
- **Notifications:** Browser Web Notifications
- **Containerized:** Docker + Docker Compose

## 🎯 Purpose

This application helps an accounting firm track **Google Drive folder changes**, specifically **bank/account statements** uploaded by clients. When a change is detected, the system:

1. Emits the update through WebSocket
2. Triggers a **browser notification**
3. Displays the new activity in a grouped timeline (Client > Year > Month)

## 🚀 Features

- Google OAuth login flow
- Google Drive API polling for changes
- Real-time event emission via WebSocket
- Responsive UI with collapsible grouping
- Browser notifications
- Dockerized frontend and backend

