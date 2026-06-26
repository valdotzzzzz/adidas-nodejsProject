$(document).ready(function() {
    const token = localStorage.getItem('token');

    // Require login to view cart
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    loadCart();

    function loadCart() {
        $.ajax({
            url: '/api/cart',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(cartItems) {
                $('#cart-loading').hide();

                if (!cartItems || cartItems.length === 0) {
                    $('#cart-empty').show();
                    $('#cart-layout').hide();
                    return;
                }

                renderCartItems(cartItems);
                updateSummary(cartItems);
                $('#cart-layout').css('display', 'grid');
            },
            error: function(xhr) {
                $('#cart-loading').hide();
                console.error('Failed to load cart:', xhr.responseText);
                $('#cart-empty').show();
            }
        });
    }

    function renderCartItems(cartItems) {
        const $container = $('#cart-items');
        $container.empty();

        cartItems.forEach(item => {
            const variant = item.Variant;
            const product = variant ? variant.Product : null;

            if (!product) return; // skip orphaned items defensively

            const images = product.ProductImages || product.product_images;
            const imageSrc = (images && images.length > 0)
                ? images[0].image_path
                : 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';

            const lineTotal = (parseFloat(product.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const rowHtml = `
                <div class="cart-row" data-item-id="${item.id}" style="display:grid; grid-template-columns:100px 1fr auto; gap:16px; padding:20px 0; border-bottom:1px solid #eee; align-items:center;">
                    <div style="width:100px; height:100px; background:#f5f5f5; overflow:hidden;">
                        <img src="${imageSrc}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div>
                        <div style="font-weight:700; font-size:15px; margin-bottom:4px;">${product.name}</div>
                        <div style="font-size:13px; color:#888; margin-bottom:8px;">
                            ${variant.colorway} — ${variant.size_type} ${variant.size_value}
                        </div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button class="btn btn-dark qty-minus-btn" style="padding:6px 12px; font-size:14px;">−</button>
                            <input type="number" class="qty-input" value="${item.quantity}" min="1" readonly style="width:40px; text-align:center; border:1px solid #ccc; padding:6px;">
                            <button class="btn btn-dark qty-plus-btn" style="padding:6px 12px; font-size:14px;">+</button>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800; margin-bottom:12px;">₱${lineTotal}</div>
                        <button class="remove-item-btn" style="color:#c00; font-size:12px; font-weight:700; text-transform:uppercase; background:none; border:none; cursor:pointer;">Remove</button>
                    </div>
                </div>
            `;
            $container.append(rowHtml);
        });
    }

    function updateSummary(cartItems) {
        let subtotal = 0;
        cartItems.forEach(item => {
            if (item.Variant && item.Variant.Product) {
                subtotal += parseFloat(item.Variant.Product.price) * item.quantity;
            }
        });

        const shipping = subtotal >= 3000 ? 0 : 150;
        const total = subtotal + shipping;

        $('#cart-subtotal').text('₱' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#cart-shipping').text(shipping === 0 ? 'Free' : '₱' + shipping.toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#cart-total').text('₱' + total.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    }

    // Quantity +/- buttons
    $(document).on('click', '.qty-plus-btn', function() {
        const $row = $(this).closest('.cart-row');
        const $input = $row.find('.qty-input');
        const newQty = parseInt($input.val()) + 1;
        updateQuantity($row.data('item-id'), newQty);
    });

    $(document).on('click', '.qty-minus-btn', function() {
        const $row = $(this).closest('.cart-row');
        const $input = $row.find('.qty-input');
        const newQty = parseInt($input.val()) - 1;
        if (newQty < 1) return;
        updateQuantity($row.data('item-id'), newQty);
    });

    function updateQuantity(itemId, newQty) {
        $.ajax({
            url: `/api/cart/${itemId}`,
            method: 'PUT',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ quantity: newQty }),
            success: function() {
                loadCart(); // simplest correct approach: just re-fetch and re-render everything
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not update quantity.');
            }
        });
    }

    // Remove item
    $(document).on('click', '.remove-item-btn', function() {
        const itemId = $(this).closest('.cart-row').data('item-id');

        if (!confirm('Remove this item from your cart?')) return;

        $.ajax({
            url: `/api/cart/${itemId}`,
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function() {
                loadCart();
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not remove item.');
            }
        });
    });

    // Checkout button — placeholder until Checkout module is built
    $('#checkoutBtn').on('click', function() {
        window.location.href = 'checkout.html';
    });
});