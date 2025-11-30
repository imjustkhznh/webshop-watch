(function () {
    const injectAttachmentUI = (container) => {
        const form = container.querySelector('#chatForm');
        if (!form) return;
        const inputField = form.querySelector('#chatInputField');
        if (!inputField) return;
        let actions = form.querySelector('.chat-input-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'chat-input-actions';
            actions.innerHTML = `
                <button type="button" id="chatAttachImageBtn" aria-label="Đính ảnh">
                    <i class="fas fa-image"></i>
                </button>
                <button type="button" id="chatAttachFileBtn" aria-label="Đính tệp">
                    <i class="fas fa-paperclip"></i>
                </button>
            `;
            form.insertBefore(actions, inputField);
        } else {
            actions.querySelector('#chatAttachImageBtn')?.setAttribute('aria-label', 'Đính ảnh');
            actions.querySelector('#chatAttachFileBtn')?.setAttribute('aria-label', 'Đính tệp');
        }

        if (!form.querySelector('#chatWidgetImageInput')) {
            const imageInput = document.createElement('input');
            imageInput.type = 'file';
            imageInput.id = 'chatWidgetImageInput';
            imageInput.accept = 'image/*';
            imageInput.hidden = true;
            form.insertBefore(imageInput, inputField);
        }

        if (!form.querySelector('#chatWidgetFileInput')) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'chatWidgetFileInput';
            fileInput.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip';
            fileInput.hidden = true;
            form.insertBefore(fileInput, inputField);
        }
    };

    const createWidget = () => {
        const existing = document.querySelector('.chat-widget-container');
        if (existing) {
            injectAttachmentUI(existing);
            return existing;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-widget-container';
        wrapper.innerHTML = `
            <div class="chat-panel" id="chatPanel">
                <div class="chat-panel-header">
                    <div>
                        <p class="chat-panel-title">Hỗ trợ TimeLuxe</p>
                        <span class="chat-panel-status"><i class="fas fa-circle"></i> Đang trực tuyến</span>
                    </div>
                    <button class="chat-close-btn" id="chatCloseBtn" aria-label="Đóng chat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-panel-body" id="chatMessages">
                    <div class="chat-bubble incoming">
                        <p>Xin chào! TimeLuxe có thể hỗ trợ gì cho bạn?</p>
                        <span>08:30</span>
                    </div>
                </div>
                <form class="chat-panel-input" id="chatForm">
                    <div class="chat-input-actions">
                        <button type="button" id="chatAttachImageBtn" aria-label="Đính ảnh">
                            <i class="fas fa-image"></i>
                        </button>
                        <button type="button" id="chatAttachFileBtn" aria-label="Đính tệp">
                            <i class="fas fa-paperclip"></i>
                        </button>
                    </div>
                    <input type="file" id="chatWidgetImageInput" accept="image/*" hidden />
                    <input type="file" id="chatWidgetFileInput" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" hidden />
                    <input type="text" id="chatInputField" placeholder="Nhập tin nhắn..." autocomplete="off" />
                    <button type="submit" aria-label="Gửi tin nhắn"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
            <button class="chat-toggle-btn" id="chatToggleButton" aria-label="Mở chat hỗ trợ">
                <i class="fas fa-comments"></i>
                <span class="chat-toggle-label">Chat</span>
            </button>
        `;
        document.body.appendChild(wrapper);
        injectAttachmentUI(wrapper);
        return wrapper;
    };

    const ATTACHMENT_PREFIX = '__ATTACHMENT__:';

    const state = {
        socket: null,
        conversationId: null,
        isOpen: false,
        elements: {}
    };

    const notifyLoginRequired = () => {
        appendSystemMessage('Vui lòng đăng nhập để trò chuyện với admin.');
    };

    const appendSystemMessage = (text) => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble incoming';
        bubble.innerHTML = `<p>${text}</p><span>${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>`;
        state.elements.messages.appendChild(bubble);
        state.elements.messages.scrollTop = state.elements.messages.scrollHeight;
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
        let unitIdx = 0;
        while (size >= 1024 && unitIdx < units.length - 1) {
            size /= 1024;
            unitIdx += 1;
        }
        return `${size.toFixed(unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`;
    };

    const parseAttachmentContent = (content) => {
        if (typeof content !== 'string' || !content.startsWith(ATTACHMENT_PREFIX)) return null;
        try {
            const payload = JSON.parse(content.slice(ATTACHMENT_PREFIX.length));
            if (payload?.url) return payload;
        } catch (error) {
            return null;
        }
        return null;
    };

    const renderAttachmentContent = (attachment) => {
        const safeName = escapeHtml(attachment.name || 'Tập tin đính kèm');
        const sizeLabel = formatFileSize(attachment.size);
        if (attachment.type === 'image') {
            return `
                <div class="chat-attachment chat-attachment--image">
                    <a href="${attachment.url}" target="_blank" rel="noopener">
                        <img src="${attachment.url}" alt="${safeName}">
                    </a>
                    <span class="chat-attachment__caption">${safeName} • ${sizeLabel}</span>
                </div>
            `;
        }
        return `
            <div class="chat-attachment chat-attachment__file">
                <div class="chat-attachment__icon"><i class="fas fa-file-alt"></i></div>
                <div>
                    <p class="chat-attachment__filename">${safeName}</p>
                    <span class="chat-attachment__size">${sizeLabel}</span>
                    <a class="chat-attachment__link" href="${attachment.url}" target="_blank" rel="noopener">Tải xuống</a>
                </div>
            </div>
        `;
    };

    const buildMessageContent = (content) => {
        const attachment = parseAttachmentContent(content);
        if (attachment) {
            return renderAttachmentContent(attachment);
        }
        return `<p>${formatMultiline(content || '')}</p>`;
    };

    const appendMessage = (text, type = 'outgoing', timestamp = new Date()) => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type === 'admin' ? 'incoming' : type}`;
        bubble.innerHTML = `
            ${buildMessageContent(text)}
            <span>${new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })}</span>`;
        state.elements.messages.appendChild(bubble);
        state.elements.messages.scrollTop = state.elements.messages.scrollHeight;
    };

    const renderHistory = (messages = []) => {
        state.elements.messages.innerHTML = '';
        if (!messages.length) {
            appendSystemMessage('Bắt đầu cuộc trò chuyện của bạn với TimeLuxe.');
            return;
        }
        messages.forEach((msg) => {
            appendMessage(msg.content, msg.sender_type === 'admin' ? 'incoming' : 'outgoing', msg.created_at);
        });
    };

    const handlePanelOpen = () => {
        state.isOpen = true;
        state.elements.panel.classList.add('open');
        state.elements.toggle.style.display = 'none';
        const token = localStorage.getItem('token');
        if (!token) {
            notifyLoginRequired();
            return;
        }
        if (state.elements.input) {
            setTimeout(() => state.elements.input.focus(), 200);
        }
        if (!state.socket) {
            initSocket(token);
        }
    };

    const handlePanelClose = () => {
        state.isOpen = false;
        state.elements.panel.classList.remove('open');
        state.elements.toggle.style.display = 'flex';
    };

    const initSocket = (token) => {
        if (typeof io !== 'function') {
            console.warn('Socket.io client chưa được nạp.');
            return;
        }
        state.socket = io('/', { auth: { token } });

        state.socket.on('connect_error', (err) => {
            console.error('Chat socket error:', err);
            appendSystemMessage('Không thể kết nối đến máy chủ chat.');
        });

        state.socket.on('chat:conversation', (conversation) => {
            state.conversationId = conversation.id;
        });

        state.socket.on('chat:history', ({ conversationId, messages }) => {
            state.conversationId = conversationId;
            renderHistory(messages);
            state.socket.emit('chat:mark-read', conversationId);
        });

        state.socket.on('chat:message', (message) => {
            if (message.conversation_id !== state.conversationId) return;
            const type = message.sender_type === 'admin' ? 'incoming' : 'outgoing';
            // Display message from server (only source of truth - prevents duplicates)
            appendMessage(message.content, type, message.created_at);
        });

        state.socket.on('chat:error', (payload) => {
            appendSystemMessage(payload?.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.');
        });
    };

    const ensureReadyForSending = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            notifyLoginRequired();
            return null;
        }
        if (!state.socket) {
            initSocket(token);
            appendSystemMessage('Đang kết nối đến máy chủ chat, vui lòng thử lại sau.');
            return null;
        }
        return token;
    };

    const uploadAttachment = async (token, file) => {
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
            let message = 'Không thể tải file đính kèm.';
            try {
                const data = await res.json();
                if (data?.error) message = data.error;
            } catch (error) {
                /* no-op */
            }
            throw new Error(message);
        }
        const data = await res.json();
        return data.attachment;
    };

    const sendAttachmentMessage = (attachment) => {
        const payload = `${ATTACHMENT_PREFIX}${JSON.stringify(attachment)}`;
        
        // Send to server - message will be displayed when server broadcasts it back
        state.socket.emit('chat:message', {
            conversationId: state.conversationId,
            message: payload
        });
        
        // Don't display optimistically - wait for server confirmation to avoid duplicates
    };

    const handleAttachmentSelection = async (file) => {
        if (!file) return;
        const token = ensureReadyForSending();
        if (!token) return;
        try {
            const attachment = await uploadAttachment(token, file);
            sendAttachmentMessage(attachment);
        } catch (error) {
            console.error('Upload attachment error:', error);
            appendSystemMessage(error.message || 'Không thể tải file. Vui lòng thử lại.');
        }
    };

    const triggerAttachmentPicker = (type) => {
        if (!ensureReadyForSending()) return;
        const input = type === 'image' ? state.elements.imageInput : state.elements.fileInput;
        if (input) {
            input.value = '';
            input.click();
        }
    };

    const sendMessage = (text) => {
        if (!ensureReadyForSending()) return;
        
        // Send to server - message will be displayed when server broadcasts it back
        state.socket.emit('chat:message', {
            conversationId: state.conversationId,
            message: text
        });
        
        // Don't display optimistically - wait for server confirmation to avoid duplicates
    };

    const bindEvents = () => {
        const {
            toggle,
            closeBtn,
            form,
            input,
            attachImageBtn,
            attachFileBtn,
            imageInput,
            fileInput
        } = state.elements;
        toggle?.addEventListener('click', handlePanelOpen);
        closeBtn?.addEventListener('click', handlePanelClose);
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) return;
            if (!localStorage.getItem('token')) {
                notifyLoginRequired();
                return;
            }
            sendMessage(value);
            input.value = '';
        });
        attachImageBtn?.addEventListener('click', () => triggerAttachmentPicker('image'));
        attachFileBtn?.addEventListener('click', () => triggerAttachmentPicker('file'));
        imageInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            handleAttachmentSelection(file);
        });
        fileInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            handleAttachmentSelection(file);
        });
    };

    const init = () => {
        const container = createWidget();
        state.elements = {
            panel: container.querySelector('#chatPanel'),
            toggle: container.querySelector('#chatToggleButton'),
            closeBtn: container.querySelector('#chatCloseBtn'),
            messages: container.querySelector('#chatMessages'),
            form: container.querySelector('#chatForm'),
            input: container.querySelector('#chatInputField'),
            attachImageBtn: container.querySelector('#chatAttachImageBtn'),
            attachFileBtn: container.querySelector('#chatAttachFileBtn'),
            imageInput: container.querySelector('#chatWidgetImageInput'),
            fileInput: container.querySelector('#chatWidgetFileInput')
        };
        bindEvents();
    };

    document.addEventListener('DOMContentLoaded', init);
})();

