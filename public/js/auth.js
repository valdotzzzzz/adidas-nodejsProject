$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();

        const loginData = {
            email: $('#email').val(),
            password: $('#password').val()
        };

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(loginData),
            success: function(response) {
                // Save token to localStorage for later use in API calls (Unit Test 2)
                localStorage.setItem('token', response.token);
                alert('Login successful!');
                window.location.href = '/dashboard.html'; 
            },
            error: function(xhr) {
                alert('Login failed: ' + xhr.responseJSON.message);
            }
        });
    });
});