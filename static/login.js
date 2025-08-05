// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.querySelector('.login-btn');
const rememberCheckbox = document.getElementById('remember');

// Password Toggle Functionality
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Form Validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(input, message) {
    const wrapper = input.closest('.input-wrapper');
    wrapper.classList.add('error');
    wrapper.classList.remove('success');
    
    // Remove existing error message
    const existingError = wrapper.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        color: #e53e3e;
        font-size: 0.8rem;
        margin-top: 4px;
        margin-left: 16px;
    `;
    errorDiv.textContent = message;
    wrapper.appendChild(errorDiv);
}

function showSuccess(input) {
    const wrapper = input.closest('.input-wrapper');
    wrapper.classList.remove('error');
    wrapper.classList.add('success');
    
    // Remove error message if exists
    const errorMessage = wrapper.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function clearValidation(input) {
    const wrapper = input.closest('.input-wrapper');
    wrapper.classList.remove('error', 'success');
    
    const errorMessage = wrapper.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Real-time validation
emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email === '') {
        showError(this, 'Email không được để trống');
    } else if (!validateEmail(email)) {
        showError(this, 'Email không hợp lệ');
    } else {
        showSuccess(this);
    }
});

passwordInput.addEventListener('blur', function() {
    const password = this.value;
    if (password === '') {
        showError(this, 'Mật khẩu không được để trống');
    } else if (!validatePassword(password)) {
        showError(this, 'Mật khẩu phải có ít nhất 6 ký tự');
    } else {
        showSuccess(this);
    }
});

// Clear validation on input
emailInput.addEventListener('input', function() {
    clearValidation(this);
});

passwordInput.addEventListener('input', function() {
    clearValidation(this);
});

// Loading State Management
function setLoadingState(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// Form Submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox.checked;
    
    // Validate form
    let isValid = true;
    
    if (email === '') {
        showError(emailInput, 'Email không được để trống');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailInput, 'Email không hợp lệ');
        isValid = false;
    } else {
        showSuccess(emailInput);
    }
    
    if (password === '') {
        showError(passwordInput, 'Mật khẩu không được để trống');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    } else {
        showSuccess(passwordInput);
    }
    
    if (!isValid) {
        return;
    }
    
    // API call to backend
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: email, // Using email as username
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user data (luôn lưu vào localStorage để đồng bộ login)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Lưu trạng thái đăng nhập cho index.html
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', data.user.full_name || data.user.username || data.user.email);
            // Show success message
            showSuccessMessage();
            // Redirect after success
            setTimeout(() => {
                if (
                  email.toLowerCase() === 'admin@shop.com' &&
                  password === 'admin123'
                ) {
                  window.location.href = 'admin.html';
                } else {
                  window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            showErrorMessage(data.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showErrorMessage('Lỗi kết nối. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
        setLoadingState(false);
    }
});

// Success Message
function showSuccessMessage(message = 'Đăng nhập thành công!') {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #38a169;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 3000);
}

// Error Message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e53e3e;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, 3000);
}

// Social Login Handlers
document.querySelector('.social-btn.google').addEventListener('click', function() {
    console.log('Google login clicked');
    // Add your Google OAuth logic here
    showErrorMessage('Tính năng đăng nhập Google đang được phát triển');
});

document.querySelector('.social-btn.facebook').addEventListener('click', function() {
    console.log('Facebook login clicked');
    // Add your Facebook OAuth logic here
    showErrorMessage('Tính năng đăng nhập Facebook đang được phát triển');
});

// Forgot Password Handler
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Forgot password clicked');
    showErrorMessage('Tính năng quên mật khẩu đang được phát triển');
});

// Register Link Handler
document.querySelector('.register-btn').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Register clicked');
    // Chuyển đến trang đăng ký
    window.location.href = 'register.html';
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-focus on email input when page loads (only if form is empty)
window.addEventListener('load', function() {
    // Only focus if both email and password are empty
    if (!emailInput.value && !passwordInput.value) {
        emailInput.focus();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        loginForm.reset();
        clearValidation(emailInput);
        clearValidation(passwordInput);
        emailInput.focus();
    }
});

// Remember me functionality
rememberCheckbox.addEventListener('change', function() {
    if (this.checked) {
        console.log('Remember me enabled');
    } else {
        console.log('Remember me disabled');
    }
});

// Add some interactive effects
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add ripple effect to login button
loginBtn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    this.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
});

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Clear form when coming from registration page
function clearLoginForm() {
    loginForm.reset();
    clearValidation(emailInput);
    clearValidation(passwordInput);
    // Remove any saved values from browser
    emailInput.value = '';
    passwordInput.value = '';
    rememberCheckbox.checked = false;
}

// Check if coming from registration page
if (document.referrer && document.referrer.includes('register.html')) {
    clearLoginForm();
    // Show success message
    setTimeout(() => {
        showSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập với tài khoản mới.');
    }, 500);
}

console.log('Login page JavaScript loaded successfully!'); 