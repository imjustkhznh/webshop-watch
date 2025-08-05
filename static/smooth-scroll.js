// Scroll mượt đến phần brands khi đang ở index.html, không có hiệu ứng chuyển trang
(function() {
    // Ngăn trình duyệt tự động nhảy đến #brands khi load trang index.html
    if (window.location.hash === '#brands' && (window.location.pathname === '/index.html' || window.location.pathname === '/')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const brandsLink = document.querySelector('a[href="index.html#brands"]');
        if (brandsLink) {
            brandsLink.addEventListener('click', function(e) {
                // Nếu đang ở index.html thì scroll mượt
                if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
                    e.preventDefault();
                    scrollToBrands();
                }
                // Nếu không phải index.html thì để trình duyệt chuyển trang bình thường
            });
        }

        // Nếu có hash #brands khi load index.html, sau khi load xong mới scroll mượt
        if (window.location.hash === '#brands' && (window.location.pathname === '/index.html' || window.location.pathname === '/')) {
            setTimeout(function() {
                scrollToBrands();
            }, 200);
        }
    });

    function scrollToBrands() {
        const brandsSection = document.getElementById('brands');
        if (brandsSection) {
            const header = document.querySelector('.dhda-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = brandsSection.offsetTop - headerHeight - 30;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            const duration = 1000;
            let start = null;
            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }
            function easeInOutCubic(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t * t + b;
                t -= 2;
                return c / 2 * (t * t * t + 2) + b;
            }
            requestAnimationFrame(animation);
        }
    }
})();