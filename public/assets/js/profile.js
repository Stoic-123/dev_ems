
// =============================== eye hid and show  ==========================================

 // Toggle password visibility
 document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.closest('.password-input-group').querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            button.innerHTML = '<i class="fa-regular fa-eye"></i>';
        } else {
            input.type = 'password';
            button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        }
    });
});

document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent accidental form submission

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to undo this action!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: {
                title: 'custom-swal-title',
                confirmButton: 'custom-confirm-btn',
                cancelButton: 'custom-cancel-btn'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Perform the delete action here
                Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "The item has been deleted.",
                    confirmButtonColor: "#024C72"
                });

                // Example: Remove the element (optional)
                // button.closest('tr').remove(); // If inside a table row
            }
        });
    });
});



// Handle password change form
document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Passwords do not match',
            text: 'Please make sure your passwords match'
        });
        return;
    }

    // Simulate password change success
    Swal.fire({
        icon: 'success',
        title: 'Password Changed Successfully',
        showConfirmButton: false,
        timer: 1500
    });
});

// Handle reset request form
document.getElementById('resetRequestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Close the modal
    const modalElement = document.getElementById('resetRequestModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();

    // Ensure modal backdrop is removed
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open'); // Remove the class that prevents scrolling

    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Password Reset Request Submission',
        html: 'Your request form for the old password has been submitted to HR.<br>This step is necessary to ensure the security of your account.',
        showConfirmButton: true,
        confirmButtonColor: '#024C72',
        customClass: {
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-text'
        }
    });    
    
});

