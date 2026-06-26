$(document).ready(function() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let checkoutData = null;

    loadCheckout();

    function loadCheckout() {
        $.ajax({
            url: '/api/checkout',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(data) {
                checkoutData = data;
                $('#checkout-loading').hide();
                $('#checkout-layout').css('display', 'grid');

                renderOrderSummary(data);
                renderSavedAddresses(data.addresses);
            },
            error: function(xhr) {
                $('#checkout-loading').hide();

                if (xhr.status === 400) {
                    // Cart is empty
                    $('#checkout-empty').show();
                } else {
                    alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not load checkout.');
                }
            }
        });
    }

    function renderOrderSummary(data) {
        const $items = $('#checkout-items');
        $items.empty();

        data.cartItems.forEach(item => {
            const variant = item.Variant;
            const product = variant.Product;
            const lineTotal = (parseFloat(product.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });

            $items.append(`
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
                    <span>${product.name} (${variant.colorway}, ${variant.size_type} ${variant.size_value}) × ${item.quantity}</span>
                    <span>₱${lineTotal}</span>
                </div>
            `);
        });

        $('#checkout-subtotal').text('₱' + parseFloat(data.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#checkout-shipping').text(parseFloat(data.shipping_fee) === 0 ? 'Free' : '₱' + parseFloat(data.shipping_fee).toLocaleString('en-US', { minimumFractionDigits: 2 }));
        $('#checkout-total').text('₱' + parseFloat(data.total).toLocaleString('en-US', { minimumFractionDigits: 2 }));
    }

    function renderSavedAddresses(addresses) {
        const $container = $('#saved-addresses');
        $container.empty();

        if (!addresses || addresses.length === 0) return;

        addresses.forEach(addr => {
            $container.append(`
                <div class="saved-address-option" data-address='${JSON.stringify(addr)}'
                     style="border:1.5px solid #ccc; padding:14px; margin-bottom:8px; cursor:pointer;">
                    <div style="font-weight:700; font-size:14px;">${addr.full_name} — ${addr.phone}</div>
                    <div style="font-size:13px; color:#888;">
                        ${addr.address_line}, ${addr.city}${addr.province ? ', ' + addr.province : ''} ${addr.postal_code || ''}
                    </div>
                </div>
            `);
        });
    }

    // Clicking a saved address fills the form
    $(document).on('click', '.saved-address-option', function() {
        $('.saved-address-option').css('border-color', '#ccc');
        $(this).css('border-color', '#000');

        const addr = JSON.parse($(this).attr('data-address'));
        $('#full_name').val(addr.full_name);
        $('#phone').val(addr.phone);
        $('#address_line').val(addr.address_line);
        $('#city').val(addr.city);
        $('#province').val(addr.province || '');
        $('#postal_code').val(addr.postal_code || '');
    });

    // Submit order
    $('#checkoutForm').on('submit', function(e) {
        e.preventDefault();

        const $btn = $('#placeOrderBtn');
        const $error = $('#checkout-error');
        $error.hide();

        const payload = {
            full_name: $('#full_name').val().trim(),
            phone: $('#phone').val().trim(),
            address_line: $('#address_line').val().trim(),
            city: $('#city').val().trim(),
            province: $('#province').val().trim(),
            postal_code: $('#postal_code').val().trim(),
            payment_method: $('input[name="payment_method"]:checked').val(),
            save_address: $('#save_address').is(':checked')
        };

        if (!payload.full_name || !payload.phone || !payload.address_line || !payload.city) {
            $error.text('Please fill in all required shipping fields.').show();
            return;
        }

        $btn.prop('disabled', true).text('Placing Order...');

        $.ajax({
            url: '/api/checkout',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify(payload),
            success: function(response) {
                // Redirect to a confirmation page, passing the new order id
                window.location.href = `order-confirmation.html?id=${response.order.id}`;
            },
            error: function(xhr) {
                $btn.prop('disabled', false).text('Place Order');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Could not place order. Please try again.';
                $error.text(msg).show();
            }
        });
    });
});