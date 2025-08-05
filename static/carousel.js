// Banner động (carousel) cho trang chủ WatchShop
let currentSlide = 0;
const track = document.querySelector('.carousel-track');
const slides = document.querySelectorAll('.carousel-slide');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

function showSlide(index) {
    if (!track || !slides.length) return;
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
}

// Tự động chuyển slide mỗi 4 giây
setInterval(() => {
    showSlide(currentSlide + 1);
}, 4000);

// Khởi tạo slide đầu tiên
showSlide(0);
