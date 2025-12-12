'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatbotResponseSystem, chatbotConfig, type DynamicResponse } from '@/lib/chatbot';
import '../../styles/chatbot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isNew?: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: chatbotConfig.welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const responseConfig: DynamicResponse = ChatbotResponseSystem.getResponse(userMessage);
      
      switch (responseConfig.type) {
        case 'static':
          return responseConfig.response || chatbotConfig.fallbackMessage;
        
        case 'dynamic':
          if (responseConfig.apiCall) {
            try {
              return await responseConfig.apiCall();
            } catch {
              return responseConfig.fallback || chatbotConfig.errorMessage;
            }
          }
          return responseConfig.fallback || chatbotConfig.fallbackMessage;
        
        default:
          return chatbotConfig.fallbackMessage;
      }
    } catch {
      return chatbotConfig.errorMessage;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    const [minDelay, maxDelay] = chatbotConfig.typingDelay;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    
    setTimeout(async () => {
      try {
        const responseText = await getBotResponse(currentInput);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
      } catch {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: chatbotConfig.errorMessage,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    }, delay);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-pulse"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-96 flex flex-col border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-1 rounded-full">
                <Bot size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Kyokushin Assistant</h3>
                <p className="text-xs text-red-100">Osu! How can I help?</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-800 p-1 rounded"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  } items-end space-x-2`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {message.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white border rounded-lg rounded-bl-none px-3 py-2 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about training, dojos, events..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors duration-200"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}