// Chờ tải xong DOM
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const searchBox = document.querySelector('.search-box');
    const mainContent = document.querySelector('.main-content');
    
    // Tạo overlay cho mobile
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Tạo nút menu nếu chưa có
    if (!menuToggle && searchBox) {
        const menuButton = document.createElement('button');
        menuButton.className = 'menu-toggle';
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        menuButton.setAttribute('aria-label', 'Mở menu điều hướng');
        searchBox.insertBefore(menuButton, searchBox.firstChild);

        // Thêm sự kiện click cho nút menu
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
        
        // Thêm sự kiện click cho overlay
        overlay.addEventListener('click', function() {
            if (!sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        });
        
        // Khởi tạo trạng thái từ localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('menu-collapsed');
        }
    }

    // Hàm bật/tắt sidebar
    function toggleSidebar() {
        const wasCollapsed = sidebar.classList.contains('collapsed');
        
        // Cập nhật class
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('menu-collapsed');
        
        // Lưu trạng thái vào localStorage
        localStorage.setItem('sidebarCollapsed', !wasCollapsed);
        
        // Cập nhật margin cho nội dung chính
        if (mainContent) {
            if (wasCollapsed) {
                mainContent.style.marginLeft = '250px';
            } else {
                mainContent.style.marginLeft = '0';
            }
        }
    }

    // Xử lý khi thay đổi kích thước màn hình
    function handleResize() {
        if (window.innerWidth > 1024) {
            // Trên desktop: hiển thị sidebar
            sidebar.classList.remove('collapsed');
            document.body.classList.remove('menu-collapsed');
            if (mainContent) {
                mainContent.style.marginLeft = '250px';
            }
        } else {
            // Trên mobile: ẩn sidebar nếu đang đóng
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                document.body.classList.add('menu-collapsed');
                if (mainContent) {
                    mainContent.style.marginLeft = '0';
                }
            }
        }
    }

    // Thêm sự kiện resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 250);
    });
    
    // Khởi tạo
    handleResize();
    
    // Đóng menu khi click vào mục menu trên mobile
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                toggleSidebar();
            }
        });
    });
});
