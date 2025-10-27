// Injects the global site footer into pages that don't already define one
(function injectFooter() {
  try {
    // Do not inject on admin page
    const href = (location.pathname || '').toLowerCase();
    if (href.endsWith('/admin.html') || href.includes('/admin')) return;

    // Skip if a footer already exists with .clean-footer
    if (document.querySelector('footer.clean-footer')) return;

    // Ensure Font Awesome is available for icons
    const hasFA = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => (l.href || '').includes('font-awesome'));
    if (!hasFA) {
      const fa = document.createElement('link');
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(fa);
    }

    const footerHtml = `
    <footer class="site-footer clean-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h4>TimeLuxe</h4>
            <ul>
              <li><a href="about.html">Giới thiệu</a></li>
              <li><a href="customers.html">Đánh giá khách hàng</a></li>
              <li><a href="guide.html">Hướng dẫn sử dụng</a></li>
              <li><a href="repair.html">Dịch vụ sửa chữa</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Liên hệ</h4>
            <ul class="footer-contact-list">
              <li><i class="fas fa-phone"></i> 0834477085</li>
              <li><i class="fas fa-envelope"></i> timeluxe@gmail.com</li>
              <li><i class="fas fa-map-marker-alt"></i> 68 Nguyễn Chí Thanh, Hà Nội</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Kết nối</h4>
            <div class="footer-social">
              <a href="https://www.facebook.com/profile.php?id=61581613632579" target="_blank" rel="noopener" class="fb" aria-label="Facebook">
                <img src="images/icons/icon-facebook.png" alt="Facebook" loading="lazy" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener" class="ig" aria-label="Instagram">
                <img src="images/icons/icon-instagram.png" alt="Instagram" loading="lazy" />
              </a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-newsletter">
            <form class="newsletter-form" onsubmit="event.preventDefault(); if (window.showNotification) { showNotification('Đã đăng ký nhận tin thành công!', 'success'); } this.reset();">
              <label for="newsletterEmail">Đăng ký nhận tin</label>
              <div class="newsletter-input">
                <input type="email" id="newsletterEmail" placeholder="Nhập email của bạn" required />
                <button type="submit">Đăng ký</button>
              </div>
            </form>
            <div class="payment-logos" aria-label="Phương thức thanh toán">
              <img src="images/icons/icon-shipping.png" alt="COD" title="Thanh toán khi nhận hàng" />
              <img src="images/icons/icon-online.png" alt="Bank" title="Chuyển khoản ngân hàng" />
              <img src="images/icons/icon-warranty.png" alt="Secure" title="Thanh toán an toàn" />
            </div>
          </div>
          <span>&copy; 2023 TimeLuxe. All rights reserved.</span>
        </div>
      </div>
    </footer>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = footerHtml;
    document.body.appendChild(wrapper.firstElementChild);
  } catch (e) {
    console.error('Footer injection error:', e);
  }
})();



