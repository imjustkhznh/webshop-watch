// Category controller mẫu

exports.getCategories = (req, res) => {
    // Trả về dữ liệu mẫu
    res.json({
        success: true,
        categories: [
            { id: 1, name: 'Đồng hồ nam' },
            { id: 2, name: 'Đồng hồ nữ' },
            { id: 3, name: 'Phụ kiện' }
        ]
    });
};
