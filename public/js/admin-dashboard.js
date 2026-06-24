$(document).ready(function() {
    const token = localStorage.getItem('token');

    // Strict Authorization Gateway Verification check
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // Initialize jQuery DataTable Configuration pipeline
    const table = $('#productsSecureTable').DataTable({
        ajax: {
            url: '/api/products',
            method: 'GET',
            dataSrc: '', // Payload is a raw array list structure
            headers: {
                'Authorization': `Bearer ${token}`
            },
            error: function(xhr) {
                if (xhr.status === 401 || xhr.status === 403) {
                    alert("Unauthorized Access. Returning to verification.");
                    localStorage.removeItem('token');
                    window.location.href = '../login.html';
                }
            }
        },
        columns: [
            { data: 'id' },
            { 
                data: 'style_code',
                render: function(data) {
                    return `<strong style="color: #aaaaaa; letter-spacing: 0.5px;">${data}</strong>`;
                }
            },
            { data: 'name' },
            { 
                data: 'Category',
                render: function(data) {
                    return data ? data.name : 'Unassigned';
                }
            },
            { 
                data: 'gender',
                render: function(data) {
                    return `<span style="text-transform: uppercase; font-size: 11px;">${data}</span>`;
                }
            },
            { 
                data: 'price',
                render: function(data) {
                    return `₱${parseFloat(data).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                }
            },
            {
                data: 'id',
                orderable: false,
                render: function(data) {
                    return `
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-dark edit-row-btn" data-id="${data}" style="padding: 6px 12px; font-size: 11px; text-transform: none; letter-spacing: 0;">Edit</button>
                            <button class="btn btn-dark delete-row-btn" data-id="${data}" style="padding: 6px 12px; font-size: 11px; text-transform: none; letter-spacing: 0; color: #ff4444;">Delete</button>
                        </div>
                    `;
                }
            }
        ],
        pageLength: 10,
        responsive: true
    });

    // Handle Active Administrative Sign Out Mechanics
    $('#adminLogoutBtn').on('click', function() {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    });

    // Placeholder handlers for upcoming CRUD modules
    $(document).on('click', '.edit-row-btn', function() {
        const id = $(this).data('id');
        console.log(`Trigger Edit Dialog context for item row reference ID: ${id}`);
    });

    $(document).on('click', '.delete-row-btn', function() {
        const id = $(this).data('id');
        console.log(`Trigger Delete validation sequence context for item row reference ID: ${id}`);
    });
});