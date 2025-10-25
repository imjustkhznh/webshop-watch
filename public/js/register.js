// Custom Notification Function
function showNotification(message, type = 'success', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    // Set icon based on type
    let icon = 'fas fa-check-circle';
    switch(type) {
        case 'error':
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'info':
            icon = 'fas fa-info-circle';
            break;
        default:
            icon = 'fas fa-check-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon} notification-icon"></i>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 400);
        }, duration);
    }
}

// Register page JavaScript
console.log('Register page JavaScript loaded successfully!');
console.log('Current URL:', window.location.href);

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const username = document.getElementById('username');
    const fullName = document.getElementById('full_name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const agree = document.getElementById('agree');

    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

    if (passwordToggle) {
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const icon = this.querySelector('i');
            if (icon) {
                if (password.type === 'password') {
                    password.type = 'text';
                    icon.className = 'fas fa-eye';
                } else {
                    password.type = 'password';
                    icon.className = 'fas fa-eye-slash';
                }
            }
        });
    }

    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const icon = this.querySelector('i');
            if (icon) {
                if (confirmPassword.type === 'password') {
                    confirmPassword.type = 'text';
                    icon.className = 'fas fa-eye';
                } else {
                    confirmPassword.type = 'password';
                    icon.className = 'fas fa-eye-slash';
                }
            }
        });
    }

    // Validation functions
    function showError(wrapper, message) {
        wrapper.classList.add('error');
        wrapper.classList.remove('success');
        
        let errorElement = wrapper.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            wrapper.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    function showSuccess(wrapper) {
        wrapper.classList.remove('error');
        wrapper.classList.add('success');
        
        const errorElement = wrapper.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    function validateUsername() {
        const wrapper = username.parentElement;
        const value = username.value.trim();
        
        if (value.length < 3) {
            showError(wrapper, 'Tên đăng nhập phải có ít nhất 3 ký tự');
            return false;
        }
        
        showSuccess(wrapper);
        return true;
    }

    function validateFullName() {
        const wrapper = fullName.parentElement;
        const value = fullName.value.trim();
        
        if (value.length < 2) {
            showError(wrapper, 'Họ và tên phải có ít nhất 2 ký tự');
            return false;
        }
        
        showSuccess(wrapper);
        return true;
    }

    function validateEmail() {
        const wrapper = email.parentElement;
        const value = email.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(value)) {
            showError(wrapper, 'Email không hợp lệ');
            return false;
        }
        
        showSuccess(wrapper);
        return true;
    }

    function validatePassword() {
        const wrapper = password.parentElement;
        const value = password.value;
        
        if (value.length < 6) {
            showError(wrapper, 'Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        
        if (!/(?=.*[A-Z])(?=.*\d)/.test(value)) {
            showError(wrapper, 'Mật khẩu phải có ít nhất 1 chữ in hoa và 1 số');
            return false;
        }
        
        showSuccess(wrapper);
        return true;
    }

    function validateConfirmPassword() {
        const wrapper = confirmPassword.parentElement;
        const value = confirmPassword.value;
        const passwordValue = password.value;
        
        if (value !== passwordValue) {
            showError(wrapper, 'Mật khẩu xác nhận không khớp');
            return false;
        }
        
        showSuccess(wrapper);
        return true;
    }

    function validateAgree() {
        if (!agree.checked) {
            showNotification('Vui lòng đồng ý với điều khoản sử dụng', 'warning');
            return false;
        }
        return true;
    }

    // Event listeners for real-time validation
    username.addEventListener('blur', validateUsername);
    fullName.addEventListener('blur', validateFullName);
    email.addEventListener('blur', validateEmail);
    password.addEventListener('blur', validatePassword);
    confirmPassword.addEventListener('blur', validateConfirmPassword);

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        const isUsernameValid = validateUsername();
        const isFullNameValid = validateFullName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isAgreeValid = validateAgree();
        
        if (!isUsernameValid || !isFullNameValid || !isEmailValid || 
            !isPasswordValid || !isConfirmPasswordValid || !isAgreeValid) {
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.login-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        submitBtn.classList.add('loading');
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username.value.trim(),
                    full_name: fullName.value.trim(),
                    email: email.value.trim(),
                    password: password.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                window.location.href = 'login.html';
            } else {
                showNotification(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        } finally {
            // Reset loading state
            submitBtn.classList.remove('loading');
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    });

    console.log('Register form with new password toggle attached successfully!');
}); 
