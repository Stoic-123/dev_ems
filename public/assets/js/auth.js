document.getElementById('hidePw').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    }
});

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageErrorUsername = document.getElementById('message-error-username');
const messageErrorPassword = document.getElementById('message-error-password');

// Add event listener to the login button
document.getElementById('loginbtn').addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    // Get input values
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('https://www.copebeta.site/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        const response_data = data.data.data;
        if (data.result) {
            console.log('Login successful:', data);

            // Save the token to localStorage
            localStorage.setItem('token', data.data.token);

            // Alert the username if the role is 2
            if (response_data.role.role_id === 1) {
                alert(`Hello, ${response_data.username}`);
            }
            if (response_data.role.role_id === 2) {
                alert(`Hello, ${response_data.username}`);
            }
        } else {
            console.log('Login failed:', data);

            // Handle specific error messages
            if (data.msg === 'Invalid username') {
                messageErrorUsername.innerHTML = data.msg; // Show username error
            }
            if (data.msg === 'Invalid password') {
                messageErrorPassword.innerHTML = data.msg; // Show password error
            }

            // Handle validation errors
            if (data.errors && Array.isArray(data.errors)) {
                data.errors.forEach((error) => {
                    if (error.includes('username')) {
                        messageErrorUsername.innerHTML = error;
                    }
                    if (error.includes('password')) {
                        messageErrorPassword.innerHTML = error;
                    }
                });
            }
        }
    } catch (error) {
        // Handle network or other errors
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
});


// Clear error messages in real-time as the user types
usernameInput.addEventListener('keyup', function () {
    if (usernameInput.value.trim()) {
        messageErrorUsername.innerHTML = '';
    }
});

passwordInput.addEventListener('keyup', function () {
    if (passwordInput.value.trim()) {
        messageErrorPassword.innerHTML = '';
    }
});