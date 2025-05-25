// src/services/socket.ts
import { config } from '@/config';
import { io, Socket } from 'socket.io-client';
import { tokenManager } from './api/client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(): void {
    const token = tokenManager.getToken();
    
    if (!token) {
      console.warn('No authentication token found, skipping socket connection');
      return;
    }
    
    // Create socket connection with authentication
    this.socket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      this.reconnectAttempts = 0;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket:', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Messaging methods
  sendMessage(conversationId: string, content: string, callback?: (response: any) => void): void {
    if (!this.socket) return;
    
    this.socket.emit('send_message', {
      conversationId,
      content,
      messageType: 'TEXT',
    }, callback);
  }
  
  joinConversation(conversationId: string, callback?: (response: any) => void): void {
    if (!this.socket) return;
    
    this.socket.emit('join_conversation', conversationId, callback);
  }
  
  startTyping(conversationId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('start_typing', conversationId);
  }
  
  stopTyping(conversationId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('stop_typing', conversationId);
  }
  
  // Subscribe to events
  onNewMessage(callback: (message: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('new_message', callback);
  }
  
  onUserTyping(callback: (data: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('user_typing', callback);
  }
  
  onNotification(callback: (notification: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('notification', callback);
  }
  
  // Clean up specific event listener
  off(event: string): void {
    if (!this.socket) return;
    
    this.socket.off(event);
  }
}

export const socketService = new SocketService();