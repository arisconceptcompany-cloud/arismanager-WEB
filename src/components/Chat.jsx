import { useState, useEffect, useRef } from 'react';
import { FaComments, FaPaperPlane, FaFile, FaDownload, FaTimes, FaUser, FaCog, FaMoon, FaSun, FaPalette, FaReply, FaTrash, FaBell, FaCheck } from 'react-icons/fa';
import { io } from 'socket.io-client';
import './Chat.css';

const SOCKET_URL = window.location.origin;

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return { notifications: true, darkMode: false, theme: 'blue' };
};

function Chat({ userType = 'admin', userId, userName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('chatSettings', JSON.stringify(newSettings));
  };

  const toggleNotifications = () => {
    updateSettings({ ...settings, notifications: !settings.notifications });
  };

  const toggleDarkMode = () => {
    updateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const setTheme = (theme) => {
    updateSettings({ ...settings, theme });
  };

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadMessages();
      initSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, userType, userId]);

  useEffect(() => {
    if (isOpen && selectedUser) {
      loadConversation(selectedUser.id);
    } else if (isOpen && !selectedUser) {
      loadMessages();
    }
  }, [selectedUser, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target) && !e.target.closest('.settings-btn')) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [showSettings]);

  const initSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socketRef.current.on('connect', () => {
      console.log('[Chat] Connected to server');
      socketRef.current.emit('register', {
        userId: parseInt(userId),
        userType,
        userName
      });
    });

    socketRef.current.on('new_message', (message) => {
      if (message.sender_id !== parseInt(userId)) {
        setMessages(prev => [...prev, message]);
        if (settings.notifications) {
          setUnreadCount(prev => prev + 1);
          if (Notification.permission === 'granted') {
            new Notification('Nouveau message de ' + message.sender_name, {
              body: message.content || 'Fichier partage',
              icon: '/logo.png'
            });
          }
        }
        if (selectedUser && message.sender_id === selectedUser.id) {
          markAsRead([message.id]);
        }
      }
    });

    socketRef.current.on('user_online', (data) => {
      setOnlineUsers(prev => {
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socketRef.current.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socketRef.current.on('user_typing', (data) => {
      if (selectedUser && data.userId === selectedUser.id) {
        setTypingUser(data.userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
      }
    });

    socketRef.current.on('message_deleted', (data) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Chat] Disconnected from server');
    });
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`/api/chat/employees`);
      if (!response.ok) throw new Error('Failed');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?userId=${userId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setMessages(data || []);
      const unread = data.filter(m => !m.is_read && m.receiver_id === parseInt(userId) && m.receiver_type === userType);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadConversation = async (empId) => {
    try {
      const response = await fetch(`/api/chat/messages?userId=${empId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed');
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      const conversation = data.filter(m => 
        (m.sender_id === parseInt(empId) && m.sender_type === 'employee') ||
        (m.receiver_id === parseInt(empId) && m.receiver_type === 'employee') ||
        m.receiver_type === 'all'
      );
      setMessages(conversation);
      const unreadIds = conversation.filter(m => !m.is_read && m.receiver_id === parseInt(userId) && m.receiver_type === userType).map(m => m.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
    }
  };

  const markAsRead = async (messageIds) => {
    try {
      await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds })
      });
      setMessages(prev => prev.map(m => messageIds.includes(m.id) ? { ...m, is_read: 1 } : m));
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    const msgContent = newMessage.trim();
    const hasFile = fileInputRef.current?.files[0];
    
    if (!msgContent && !hasFile) return;
    
    try {
      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('senderType', userType);
      formData.append('receiverId', selectedUser?.id || null);
      formData.append('receiverType', selectedUser ? 'employee' : 'all');
      formData.append('content', msgContent || '');
      if (replyTo) {
        formData.append('replyToId', replyTo.id);
        formData.append('replyToContent', replyTo.content);
        formData.append('replyToSender', replyTo.sender_name);
      }
      if (hasFile) {
        formData.append('file', hasFile);
      }
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        setReplyTo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const err = await response.json();
        console.error('Send error:', err);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await fetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (socketRef.current) socketRef.current.emit('delete_message', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const isUserOnline = (uid) => onlineUsers.some(u => u.userId === uid);
  const isOwnMessage = (msg) => msg.sender_id === parseInt(userId) && msg.sender_type === userType;

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  const themes = [
    { id: 'blue', name: 'Bleu', color: '#4da6ff', dark: '#0066cc' },
    { id: 'green', name: 'Vert', color: '#28a745', dark: '#1e7e34' },
    { id: 'purple', name: 'Violet', color: '#6f42c1', dark: '#563d7c' },
    { id: 'orange', name: 'Orange', color: '#fd7e14', dark: '#e85d04' },
    { id: 'pink', name: 'Rose', color: '#e83e8c', dark: '#c8235c' },
    { id: 'teal', name: 'Turquoise', color: '#20c997', dark: '#199d76' }
  ];

  const currentTheme = themes.find(t => t.id === settings.theme) || themes[0];

  if (!isOpen) {
    return (
      <div className="chat-toggle" onClick={() => setIsOpen(true)} style={{ background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.dark} 100%)` }}>
        <FaComments />
        {unreadCount > 0 && <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </div>
    );
  }

  return (
    <div className={`chat-container ${settings.darkMode ? 'chat-dark' : ''}`} style={{ '--chat-color': currentTheme.color, '--chat-dark': currentTheme.dark }}>
      <div className="chat-header" style={{ background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.dark} 100%)` }}>
        <div className="d-flex align-items-center gap-2" onClick={() => setIsOpen(false)}>
          <FaComments />
          <span>Discussion</span>
          {unreadCount > 0 && <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </div>
        <div className="d-flex gap-1 align-items-center">
          <button className="btn btn-sm btn-link text-white p-1 settings-btn" onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} title="Parametres">
            <FaCog />
          </button>
          <button className="btn-close btn-close-white p-1" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></button>
        </div>
      </div>

      {showSettings && (
        <div className="chat-settings-popup" ref={settingsRef}>
          <div className="settings-item" onClick={(e) => e.stopPropagation()}>
            <span onClick={toggleNotifications}>
              {settings.notifications ? <FaBell className="me-2 text-success" /> : <FaBell className="me-2 text-muted" />}
              Notifications
            </span>
            <div className={`toggle-switch ${settings.notifications ? 'active' : ''}`} onClick={toggleNotifications}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          
          <div className="settings-item" onClick={(e) => e.stopPropagation()}>
            <span onClick={toggleDarkMode}>
              {settings.darkMode ? <FaMoon className="me-2" /> : <FaSun className="me-2 text-warning" />}
              Mode sombre
            </span>
            <div className={`toggle-switch ${settings.darkMode ? 'active' : ''}`} onClick={toggleDarkMode}>
              <div className="toggle-slider"></div>
            </div>
          </div>

          <div className="settings-item" onClick={(e) => e.stopPropagation()}>
            <div className="settings-label"><FaPalette className="me-2" />Theme</div>
            <div className="theme-options">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  className={`theme-btn ${settings.theme === theme.id ? 'active' : ''}`}
                  style={{ backgroundColor: theme.color }}
                  onClick={() => setTheme(theme.id)}
                  title={theme.name}
                >
                  {settings.theme === theme.id && <FaCheck />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="chat-body">
        <div className="chat-sidebar">
          <div className="chat-search">
            <input type="text" placeholder="Rechercher..." className="form-control form-control-sm" />
          </div>
          <div className="chat-users">
            <div className={`chat-user-item ${!selectedUser ? 'active' : ''}`} onClick={() => setSelectedUser(null)}>
              <div className="chat-user-avatar" style={{ background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.dark} 100%)` }}>
                <FaComments />
              </div>
              <div className="chat-user-info">
                <span className="chat-user-name">Groupe</span>
                <span className="chat-user-status text-muted small">Tous</span>
              </div>
            </div>
            {employees.map(emp => {
              const initials = `${(emp.prenom || '')[0] || ''}${(emp.nom || '')[0] || ''}`.toUpperCase();
              return (
              <div key={emp.id} className={`chat-user-item ${selectedUser?.id === emp.id ? 'active' : ''}`} onClick={() => setSelectedUser(emp)}>
                <div className="chat-user-avatar">
                  {emp.photo ? (
                    <img src={`/api/photos/${emp.photo}`} alt="" />
                  ) : (
                    <span className="avatar-initials">{initials}</span>
                  )}
                  {isUserOnline(emp.id) && <span className="online-indicator"></span>}
                </div>
                <div className="chat-user-info">
                  <span className="chat-user-name">{emp.prenom} {emp.nom}</span>
                  <span className="chat-user-status text-muted small">{emp.poste || 'Employe'}</span>
                </div>
              </div>
              );
            })}
          </div>
        </div>
        
        <div className="chat-main">
          <div className="chat-messages">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="chat-date-divider"><span>{date}</span></div>
                {msgs.map((msg) => {
                  const senderInitials = msg.sender_name ? msg.sender_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
                  return (
                  <div key={msg.id} className={`chat-message ${isOwnMessage(msg) ? 'sent' : 'received'}`}>
                    <div className="chat-message-wrapper">
                      {!isOwnMessage(msg) && (
                        <div className="message-avatar" style={{ background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.dark} 100%)` }}>
                          {senderInitials}
                        </div>
                      )}
                      <div className="message-body">
                        {msg.reply_to_id && (
                          <div className="message-reply-indicator">
                            <FaReply className="me-1" />
                            <span>{msg.reply_to_sender}: {msg.reply_to_content?.substring(0, 50)}{msg.reply_to_content?.length > 50 ? '...' : ''}</span>
                          </div>
                        )}
                        {!isOwnMessage(msg) && <div className="message-sender">{msg.sender_name}</div>}
                        <div className="message-content">
                          {msg.content}
                          {msg.file_url && (
                            <div className="message-file" onClick={() => downloadFile(msg.file_url, msg.file_name)}>
                              <FaFile /><span>{msg.file_name}</span><FaDownload />
                            </div>
                          )}
                        </div>
                        <div className="message-footer">
                          <div className="message-time">{formatTime(msg.created_at)}</div>
                          <div className="message-actions">
                            <button className="btn btn-sm btn-link p-0 mx-1" onClick={() => setReplyTo(msg)} title="Repondre"><FaReply /></button>
                            {isOwnMessage(msg) && <button className="btn btn-sm btn-link text-danger p-0" onClick={() => deleteMessage(msg.id)} title="Supprimer"><FaTrash /></button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ))}
            {typingUser && <div className="chat-typing">{typingUser} ecrit...</div>}
            <div ref={messagesEndRef} />
          </div>
          
          {replyTo && (
            <div className="chat-reply-banner">
              <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center"><FaReply className="me-2" /><span>Reponse a {replyTo.sender_name}</span></div>
                <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setReplyTo(null)}><FaTimes /></button>
              </div>
              <div className="text-muted small">{replyTo.content?.substring(0, 60)}{replyTo.content?.length > 60 ? '...' : ''}</div>
            </div>
          )}

          <div className="chat-input">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} />
            <button className="btn btn-link" onClick={() => fileInputRef.current?.click()} title="Joindre un fichier"><FaFile /></button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Votre message..."
              className="form-control"
            />
            <button className="btn btn-primary" onClick={sendMessage} style={{ background: `linear-gradient(135deg, ${currentTheme.color} 0%, ${currentTheme.dark} 100%)`, border: 'none' }}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
