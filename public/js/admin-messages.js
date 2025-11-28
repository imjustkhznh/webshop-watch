(function () {
    const els = {
        list: document.getElementById('conversationList'),
        search: document.getElementById('conversationSearchInput'),
        filters: document.querySelectorAll('.conversation-filters .filter-btn'),
        chatEmpty: document.getElementById('chatEmptyState'),
        chatContainer: document.getElementById('chatContainer'),
        chatHeader: document.getElementById('chatHeader'),
        chatBody: document.getElementById('chatBody'),
        chatInput: document.getElementById('chatInput'),
        sendBtn: document.getElementById('sendMessageBtn'),
        refreshBtn: document.getElementById('refreshConversationsBtn'),
        toggleBtn: document.getElementById('toggleOnlineBtn'),
        imageInput: document.getElementById('chatImageInput'),
        fileInput: document.getElementById('chatFileInput')
    };

    const ATTACHMENT_PREFIX = '__ATTACHMENT__:';

    const state = {
        socket: null,
        conversations: [],
        filtered: [],
        searchKeyword: '',
        activeFilter: 'all',
        selectedConversationId: null,
        messageCache: new Map(),
        isOnline: true,
        currentUser: null
    };

    try {
        state.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
        state.currentUser = null;
    }

    const statusLabels = {
        open: 'Đang mở',
        pending: 'Đang xử lý',
        resolved: 'Đã xử lý'
    };

    const escapeHtml = (unsafe = '') =>
        String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const formatMultiline = (text = '') => escapeHtml(text).replace(/\n/g, '<br>');

    const formatFileSize = (bytes = 0) => {
        if (!bytes) return '0 KB';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    };

    const parseAttachmentContent = (content) => {
        if (typeof content !== 'string' || !content.startsWith(ATTACHMENT_PREFIX)) return null;
        try {
            const payload = JSON.parse(content.slice(ATTACHMENT_PREFIX.length));
            if (payload?.url) {
                return payload;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    const buildAttachmentPayload = (attachment) => `${ATTACHMENT_PREFIX}${JSON.stringify(attachment)}`;

    const renderAttachmentContent = (attachment) => {
        const safeName = escapeHtml(attachment.name || 'Tập tin đính kèm');
        const sizeLabel = formatFileSize(attachment.size);
        if (attachment.type === 'image') {
            return `
                <div class="chat-attachment chat-attachment--image">
                    <a href="${attachment.url}" target="_blank" rel="noopener">
                        <img src="${attachment.url}" alt="${safeName}">
                    </a>
                    <div class="chat-attachment__meta">
                        <p class="chat-attachment__filename">${safeName}</p>
                        <span class="chat-attachment__size">${sizeLabel}</span>
                    </div>
                </div>
            `;
        }
        return `
            <div class="chat-attachment chat-attachment__file">
                <div class="chat-attachment__icon">
                    <i class="fas fa-paperclip"></i>
                </div>
                <div class="chat-attachment__meta">
                    <p class="chat-attachment__filename">${safeName}</p>
                    <span class="chat-attachment__size">${sizeLabel}</span>
                    <div class="chat-attachment__actions">
                        <a href="${attachment.url}" target="_blank" rel="noopener">Tải xuống</a>
                    </div>
                </div>
            </div>
        `;
    };

    const renderMessageBody = (message) => {
        const attachment = parseAttachmentContent(message.content);
        if (attachment) {
            return renderAttachmentContent(attachment);
        }
        return `<p>${formatMultiline(message.content || '')}</p>`;
    };

    const notify = (message, type = 'info') => {
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `chat-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const showChatPanel = () => {
        if (els.chatEmpty) {
            els.chatEmpty.classList.add('hidden');
            els.chatEmpty.style.display = 'none';
            els.chatEmpty.style.visibility = 'hidden';
            els.chatEmpty.style.opacity = '0';
            els.chatEmpty.style.zIndex = '-1';
        }
        if (els.chatContainer) {
            els.chatContainer.classList.add('active');
            els.chatContainer.removeAttribute('style');
            els.chatContainer.style.display = 'flex';
            els.chatContainer.style.visibility = 'visible';
            els.chatContainer.style.opacity = '1';
            els.chatContainer.style.zIndex = '10';
            // Force reflow để đảm bảo CSS được áp dụng
            els.chatContainer.offsetHeight;
        }
    };

    const hideChatPanel = () => {
        if (els.chatContainer) {
            els.chatContainer.classList.remove('active');
        }
        if (els.chatEmpty) {
            els.chatEmpty.classList.remove('hidden');
        }
    };

    hideChatPanel();

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} giờ`;
        return date.toLocaleDateString('vi-VN');
    };

    const upsertConversation = (conversation) => {
        if (!conversation) return;
        const idx = state.conversations.findIndex((c) => c.id === conversation.id);
        if (idx >= 0) {
            state.conversations[idx] = { ...state.conversations[idx], ...conversation };
        } else {
            state.conversations.push(conversation);
        }
        state.conversations.sort((a, b) => {
            const aTime = new Date(a.last_message_at || a.created_at || 0).getTime();
            const bTime = new Date(b.last_message_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
    };

    const renderAccessDenied = () => {
        if (els.list) {
            els.list.innerHTML = `
                <div class="empty-state" style="padding: 24px;">
                    Bạn cần đăng nhập bằng tài khoản <strong>admin</strong> để xem tin nhắn khách hàng.
                </div>
            `;
        }
        if (els.chatEmpty) {
            els.chatEmpty.innerHTML = `
                <i class="fas fa-lock"></i>
                <p>Vui lòng đăng nhập admin để sử dụng tính năng này.</p>
            `;
        }
        hideChatPanel();
        els.chatContainer?.remove();
        els.refreshBtn?.setAttribute('disabled', 'disabled');
        els.toggleBtn?.setAttribute('disabled', 'disabled');
    };

    const renderConversations = () => {
        if (!els.list) return;
        const keyword = state.searchKeyword.trim().toLowerCase();
        state.filtered = state.conversations.filter((conv) => {
            if (state.activeFilter === 'unread' && (!conv.unread_admin || conv.unread_admin === 0)) return false;
            if (state.activeFilter === 'return' && conv.status !== 'pending') return false;
            if (
                keyword &&
                !(
                    (conv.user_name || '').toLowerCase().includes(keyword) ||
                    (conv.user_phone || '').includes(keyword) ||
                    (conv.user_email || '').toLowerCase().includes(keyword)
                )
            ) {
                return false;
            }
            return true;
        });

        if (!state.filtered.length) {
            els.list.innerHTML = '<div class="empty-state">Không có cuộc trò chuyện phù hợp</div>';
            return;
        }

        els.list.innerHTML = state.filtered
            .map((conv) => {
                const convId = Number(conv.id);
                const lastLine = conv.last_message ? conv.last_message : 'Chưa có tin nhắn';
                const active = convId === Number(state.selectedConversationId) ? 'active' : '';
                const unread =
                    conv.unread_admin && conv.unread_admin > 0 ? `<span class="unread-pill">${conv.unread_admin}</span>` : '';
                return `
                    <div class="conversation-item ${active}" data-id="${convId}">
                        <div class="conversation-avatar">
                            <span>${(conv.user_name || 'Khách').split(' ').pop().charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="conversation-info">
                            <div class="conversation-top">
                                <p class="conversation-name">${conv.user_name || 'Khách hàng'}</p>
                                <span class="conversation-time">${formatRelativeTime(conv.last_message_at || conv.created_at)}</span>
                            </div>
                            <div class="conversation-bottom">
                                <p class="conversation-preview">${lastLine}</p>
                                ${unread}
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');
    };

    const renderMessages = (conversationId) => {
        if (!els.chatBody) return;
        const messages = state.messageCache.get(conversationId) || [];

        if (!messages.length) {
            els.chatBody.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;"><p>Chưa có tin nhắn nào</p></div>';
            return;
        }

        els.chatBody.innerHTML = messages
            .map((msg) => {
                const body = renderMessageBody(msg);
                const timeLabel = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                      })
                    : '';
                return `
                    <div class="chat-message ${msg.sender_type === 'admin' ? 'sent' : 'received'}">
                        <div class="bubble">
                            ${body}
                            <span class="time">${timeLabel}</span>
                        </div>
                    </div>
                `;
            })
            .join('');

        // Scroll to bottom
        setTimeout(() => {
            els.chatBody.scrollTop = els.chatBody.scrollHeight;
        }, 100);
    };

    const renderHeader = (conversation) => {
        if (!els.chatHeader || !conversation) return;
        const status = conversation.status || 'open';
        els.chatHeader.innerHTML = `
            <div>
                <h3>${conversation.user_name || 'Khách hàng'}</h3>
                <p class="chat-meta">
                    <span>${conversation.user_phone || 'Không có'}</span>
                    <span>${conversation.user_email || 'Không có'}</span>
                </p>
            </div>
            <div class="chat-header-actions">
                <span class="status-chip ${status}">${statusLabels[status] || status}</span>
                <button class="btn btn-outline" data-action="toggle-status">
                    <i class="fas fa-sync-alt"></i> ${status === 'resolved' ? 'Mở lại' : 'Đánh dấu đã xử lý'}
                </button>
            </div>
        `;

        const toggleBtn = els.chatHeader.querySelector('[data-action="toggle-status"]');
        toggleBtn?.addEventListener('click', () => {
            const nextStatus = conversation.status === 'resolved' ? 'open' : 'resolved';
            updateConversationStatus(conversation.id, nextStatus);
        });
    };

    const selectConversation = (conversationId) => {
        const numericId = Number(conversationId);
        state.selectedConversationId = numericId;
        const conversation = state.conversations.find((c) => Number(c.id) === numericId);
        if (!conversation) {
            console.error('Conversation not found:', conversationId);
            return;
        }

        showChatPanel();

        renderHeader(conversation);
        renderMessages(conversationId);
        renderConversations();

        // Đảm bảo container hiển thị
        if (els.chatContainer) {
            els.chatContainer.classList.add('active');
        }

        if (state.socket) {
            state.socket.emit('chat:join-conversation', conversationId);
        }

        fetchConversationMessages(conversationId);
    };

    const fetchConversationMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Không thể tải tin nhắn');
            const data = await res.json();
            state.messageCache.set(conversationId, data.messages || []);
            renderMessages(conversationId);
            if (state.socket && conversationId === state.selectedConversationId) {
                state.socket.emit('chat:mark-read', conversationId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            notify('Không thể tải tin nhắn', 'error');
        }
    };

    const updateConversationStatus = async (conversationId, status) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return notify('Vui lòng đăng nhập lại', 'error');
            const res = await fetch(`/api/chat/conversations/${conversationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
            const data = await res.json();
            upsertConversation(data.conversation);
            if (conversationId === state.selectedConversationId) {
                renderHeader(data.conversation);
            }
            renderConversations();
            notify('Đã cập nhật trạng thái cuộc trò chuyện', 'success');
        } catch (error) {
            console.error(error);
            notify('Không thể cập nhật trạng thái', 'error');
        }
    };

    const sendMessage = () => {
        const text = els.chatInput.value.trim();
        if (!text) return;
        if (!state.selectedConversationId) {
            notify('Vui lòng chọn cuộc trò chuyện trước', 'warning');
            return;
        }
        if (!state.socket) {
            notify('Chưa kết nối với máy chủ chat', 'error');
            return;
        }
        state.socket.emit('chat:message', {
            conversationId: state.selectedConversationId,
            message: text
        });
        els.chatInput.value = '';
    };

    const ensureConversationSelected = () => {
        if (!state.selectedConversationId) {
            notify('Vui lòng chọn cuộc trò chuyện trước', 'warning');
            return false;
        }
        if (!state.socket) {
            notify('Chưa kết nối với máy chủ chat', 'error');
            return false;
        }
        return true;
    };

    const uploadAttachment = async (file) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Vui lòng đăng nhập lại');

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/chat/attachments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            let message = 'Không thể tải file. Vui lòng thử lại.';
            try {
                const data = await res.json();
                if (data?.error) message = data.error;
            } catch (error) {
                /* ignore */
            }
            throw new Error(message);
        }
        const data = await res.json();
        return data.attachment;
    };

    const sendAttachmentMessage = (attachment) => {
        if (!ensureConversationSelected()) return;
        const payload = buildAttachmentPayload(attachment);
        state.socket.emit('chat:message', {
            conversationId: state.selectedConversationId,
            message: payload
        });
    };

    const handleAttachmentSelection = async (file) => {
        if (!file) return;
        try {
            notify('Đang tải file đính kèm...', 'info');
            const attachment = await uploadAttachment(file);
            sendAttachmentMessage(attachment);
            notify('Đã gửi file đính kèm', 'success');
        } catch (error) {
            console.error('Attachment upload error:', error);
            notify(error.message || 'Không thể tải file', 'error');
        }
    };

    const triggerAttachmentPicker = (type) => {
        if (!ensureConversationSelected()) return;
        const input = type === 'image' ? els.imageInput : els.fileInput;
        if (input) {
            input.value = '';
            input.click();
        }
    };

    const handleMessageEvent = (message) => {
        if (!message || !message.conversation_id) return;
        const convId = message.conversation_id;
        const messages = state.messageCache.get(convId) || [];
        messages.push(message);
        state.messageCache.set(convId, messages);
        if (convId === state.selectedConversationId) {
            renderMessages(convId);
        }
    };

    const initSocket = () => {
        const token = localStorage.getItem('token');
        if (!token || !state.currentUser || state.currentUser.role !== 'admin') {
            notify('Vui lòng đăng nhập bằng tài khoản admin để quản lý chat', 'warning');
            return;
        }

        state.socket = io('/', {
            auth: { token }
        });

        state.socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err);
            notify('Không thể kết nối realtime chat', 'error');
        });

        state.socket.on('chat:conversations', (conversations) => {
            state.conversations = conversations || [];
            renderConversations();
            // Tự động chọn conversation đầu tiên (mới nhất) nếu chưa có conversation nào được chọn
            if (conversations && conversations.length > 0) {
                setTimeout(() => {
                    if (!state.selectedConversationId) {
                        selectConversation(conversations[0].id);
                    }
                }, 100);
            }
        });

        state.socket.on('chat:conversation-updated', (conversation) => {
            upsertConversation(conversation);
            renderConversations();
            if (conversation.id === state.selectedConversationId) {
                renderHeader(conversation);
            }
        });

        state.socket.on('chat:history', ({ conversationId, messages }) => {
            state.messageCache.set(conversationId, messages || []);
            if (conversationId === state.selectedConversationId) {
                renderMessages(conversationId);
            }
        });

        state.socket.on('chat:message', handleMessageEvent);

        state.socket.on('chat:error', (payload) => {
            notify(payload?.message || 'Có lỗi xảy ra', 'error');
        });
    };

    const bindEvents = () => {
        els.list?.addEventListener('click', (event) => {
            const item = event.target.closest('.conversation-item');
            if (!item) return;
            selectConversation(Number(item.dataset.id));
        });

        els.search?.addEventListener('input', (e) => {
            state.searchKeyword = e.target.value || '';
            renderConversations();
        });

        els.filters.forEach((btn) =>
            btn.addEventListener('click', () => {
                els.filters.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeFilter = btn.dataset.filter;
                renderConversations();
            })
        );

        els.sendBtn?.addEventListener('click', sendMessage);
        els.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        document.getElementById('attachImageBtn')?.addEventListener('click', () => {
            triggerAttachmentPicker('image');
        });
        document.getElementById('attachFileBtn')?.addEventListener('click', () => {
            triggerAttachmentPicker('file');
        });
        els.imageInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            handleAttachmentSelection(file);
        });
        els.fileInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            handleAttachmentSelection(file);
        });

        els.refreshBtn?.addEventListener('click', async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    notify('Vui lòng đăng nhập', 'warning');
                    return;
                }
                if (!state.currentUser || state.currentUser.role !== 'admin') {
                    notify('Chỉ admin mới xem được danh sách chat', 'error');
                    renderAccessDenied();
                    return;
                }
                const res = await fetch('/api/chat/conversations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 403) {
                    notify('Bạn không có quyền truy cập. Hãy đăng nhập tài khoản admin.', 'error');
                    renderAccessDenied();
                    return;
                }
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                state.conversations = data.conversations || [];
                renderConversations();
                // Tự động chọn conversation đầu tiên (mới nhất) nếu chưa có conversation nào được chọn
                if (data.conversations && data.conversations.length > 0) {
                    setTimeout(() => {
                        if (!state.selectedConversationId) {
                            selectConversation(data.conversations[0].id);
                        }
                    }, 100);
                }
                notify('Đã làm mới danh sách hội thoại', 'success');
            } catch (error) {
                console.error(error);
                notify('Không thể làm mới danh sách', 'error');
            }
        });

        els.toggleBtn?.addEventListener('click', () => {
            state.isOnline = !state.isOnline;
            if (state.isOnline) {
                els.toggleBtn.innerHTML = '<i class="fas fa-circle"></i> Admin Online';
                els.toggleBtn.classList.remove('btn-danger');
                els.toggleBtn.classList.add('btn-success');
            } else {
                els.toggleBtn.innerHTML = '<i class="fas fa-circle"></i> Admin Offline';
                els.toggleBtn.classList.add('btn-danger');
                els.toggleBtn.classList.remove('btn-success');
            }
        });
    };

    const loadInitialConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                state.conversations = data.conversations || [];
                renderConversations();
                // Tự động chọn conversation đầu tiên (mới nhất) nếu có
                if (data.conversations && data.conversations.length > 0) {
                    // Đợi một chút để đảm bảo DOM đã render xong
                    setTimeout(() => {
                        if (!state.selectedConversationId) {
                            selectConversation(data.conversations[0].id);
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const init = () => {
        if (!els.list) return;
        if (!state.currentUser || state.currentUser.role !== 'admin') {
            renderAccessDenied();
            bindEvents();
            return;
        }
        bindEvents();
        renderConversations();
        initSocket();
        loadInitialConversations();
    };
    document.addEventListener('DOMContentLoaded', init);
})();

