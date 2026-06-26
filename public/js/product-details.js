$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let selectedVariantId = null;

    if (!productId) {
        console.error("Missing product ID parameter inside URL query string.");
        return;
    }

    // ===================== REVIEWS =====================
    const token = localStorage.getItem('token');

    loadReviews();

    if (token) {
        checkCanReview();
    }

    function loadReviews() {
        $.ajax({
            url: `/api/reviews/product/${productId}`,
            method: 'GET',
            success: function(reviews) {
                const $list = $('#reviews-list');
                $list.empty();

                if (!reviews || reviews.length === 0) {
                    $list.html('<p style="color:#888; padding:20px 0;">No reviews yet. Be the first to review this shoe!</p>');
                    return;
                }

                reviews.forEach(review => {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                    $list.append(`
                        <div style="padding:20px 0; border-bottom:1px solid #eee;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                <strong style="font-size:14px;">${review.User ? review.User.name : 'Anonymous'}</strong>
                                <span style="font-size:12px; color:#888;">${date}</span>
                            </div>
                            <div style="color:#fb0; margin-bottom:6px; letter-spacing:2px;">${stars}</div>
                            ${review.comment ? `<p style="font-size:14px; color:#333;">${review.comment}</p>` : ''}
                        </div>
                    `);
                });
            },
            error: function(xhr) {
                console.error('Failed to load reviews:', xhr.responseText);
            }
        });
    }

    function checkCanReview() {
        $.ajax({
            url: `/api/reviews/can-review/${productId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(result) {
                if (result.can_review) {
                    $('#review-form-container').show();
                } else if (result.has_purchased && result.already_reviewed) {
                    // Already reviewed — show neither form nor locked message
                } else {
                    $('#review-locked-message').show();
                }
            },
            error: function(xhr) {
                console.error('Failed to check review eligibility:', xhr.responseText);
            }
        });
    }

    $('#reviewForm').on('submit', function(e) {
        e.preventDefault();

        const rating = $('#review-rating').val();
        const comment = $('#review-comment').val().trim();

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        $.ajax({
            url: `/api/reviews/product/${productId}`,
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({ rating: parseInt(rating), comment }),
            success: function(response) {
                alert(response.message || 'Review submitted!');
                $('#reviewForm')[0].reset();
                $('#review-form-container').hide();
                loadReviews();
            },
            error: function(xhr) {
                alert((xhr.responseJSON && xhr.responseJSON.message) || 'Could not submit review.');
            }
        });
    });
    console.log(`Initializing request to secure API route: /api/products/${productId}`);

    // 1. Fetch Product Record with Associations from Backend
    $.ajax({
        url: `/api/products/${productId}`,
        method: 'GET',
        dataType: 'json',
        success: function(product) {
            console.log("Successfully intercepted backend data payload:", product);

            $('#detail-name').text(product.name || 'Unnamed Product');
            $('#detail-desc').text(product.description || 'No additional specifications provided for this corporate catalog item.');
            $('#detail-style-code').text(product.style_code || 'N/A');
            $('#detail-category').text(`${product.Category ? product.Category.name : 'Adidas'} | ${product.gender || 'unisex'}`);

            if (product.price) {
                $('#detail-price').text(`₱${parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }

            let imageSrc = 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3b06e3a894364ee89faf7808e7e8b3de_9366/ADIZERO_Dropset_Pro_Training_Shoes_White_KK1551_01_00_standard.jpg';
            const images = product.ProductImages || product.product_images;

            if (images && images.length > 0) {
                imageSrc = images[0].image_path;
            }
            $('#detail-image').attr('src', imageSrc).attr('alt', product.name);

            // 2. Map Related Inventory Variants
            const variantContainer = $('#variant-container');
            variantContainer.empty();

            const variants = product.Variants || product.variants;

            if (variants && variants.length > 0) {
                variants.forEach(variant => {
                    // FIXED: correct field names from the Variant model
                    // (size_type + size_value, not "size" / stock_level, not "stock_quantity")
                    const optionBtn = $(`
                        <button class="btn btn-dark variant-opt-btn" data-id="${variant.id}" style="padding: 10px 20px; font-size: 12px;">
                            ${variant.size_type} ${variant.size_value} (${variant.stock_level} left)
                        </button>
                    `);

                    if (variant.stock_level <= 0) {
                        optionBtn.prop('disabled', true).css({ 'opacity': '0.3', 'cursor': 'not-allowed' });
                    }

                    variantContainer.append(optionBtn);
                });
            } else {
                variantContainer.html('<p style="font-size:12px; color:#555;">Standard One-Size Fit Only (No variants linked)</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error("=================== API ERROR LOG ===================");
            console.error("Status Code:", xhr.status);
            console.error("Response Text:", xhr.responseText);
            console.error("Error Thrown:", error);
            console.error("====================================================");

            $('#detail-name').text('Failed to load item components');
            $('#detail-desc').text('The application server encountered an association or routing fault. Check terminal logs for details.');
        }
    });

    // 3. Handle Interactive Button Selection Choice Toggles
    $(document).on('click', '.variant-opt-btn', function() {
        $('.variant-opt-btn').removeClass('btn-primary').addClass('btn-dark');
        $(this).removeClass('btn-dark').addClass('btn-primary');
        selectedVariantId = $(this).data('id');
        $('#variant-error').hide();
    });

    // 4. Quantity Stepper
    $('#qtyMinusBtn').on('click', function() {
        const input = $('#qtyInput');
        let val = parseInt(input.val()) - 1;
        if (val < 1) val = 1;
        input.val(val);
    });

    $('#qtyPlusBtn').on('click', function() {
        const input = $('#qtyInput');
        let val = parseInt(input.val()) + 1;
        input.val(val);
    });

    // 5. Add to Cart — now calls the real backend API instead of localStorage
    $('#addToCartBtn').on('click', function() {
        const hasVariants = $('.variant-opt-btn').length > 0;

        if (hasVariants && !selectedVariantId) {
            $('#variant-error').show();
            return;
        }

        // Require login before adding to cart
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const quantity = parseInt($('#qtyInput').val()) || 1;
        const btn = $(this);
        const $feedback = $('#cart-feedback');

        btn.prop('disabled', true).text('Adding...');

        $.ajax({
            url: '/api/cart',
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Authorization': 'Bearer ' + token },
            data: JSON.stringify({
                variant_id: selectedVariantId,
                quantity: quantity
            }),
            success: function(response) {
                btn.text('Added To Cart!').removeClass('btn-primary').addClass('btn-outline');
                $feedback.css('color', '#9f9').text(response.message || 'Added to cart!').show();

                setTimeout(() => {
                    btn.text('Add to Cart').removeClass('btn-outline').addClass('btn-primary').prop('disabled', false);
                    $feedback.fadeOut();
                }, 1800);
            },
            error: function(xhr) {
                btn.prop('disabled', false).text('Add to Cart');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Could not add item to cart.';
                $feedback.css('color', '#f88').text(msg).show();
            }
        });
    });
});