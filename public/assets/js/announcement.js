flatpickr("#monthPicker", {
    dateFormat: "M Y",
});

const alertPlaceholder = document.getElementById('liveAlertPlaceholder');

const appendAlert = (message, type = 'success') => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <div class="message fs-18 text-success">
        <i class="ms-3 me-2 fa-sharp-duotone fa-regular fa-circle-check"></i> ${message}
      </div>
    </div>
  `;

  alertPlaceholder.append(wrapper);

  // Auto close after 3 seconds
  setTimeout(() => {
    wrapper.remove();
  }, 2500);
};

const alertTrigger = document.getElementById('liveAlertBtn');
if (alertTrigger) {
  alertTrigger.addEventListener('click', () => {
    appendAlert('Announcement posted successfully.');
  });
}


document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-announcement');
  
    deleteButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
  
        Swal.fire({
          title: "Are you sure?",
          text: "This announcement will be permanently deleted.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#7a7a7a",
          confirmButtonText: "Yes, delete it!"  
        }).then((result) => {
          if (result.isConfirmed) {
            const announcementRow = button.closest(".row.mb-5"); // Find the announcement row
            announcementRow.remove(); // Remove it from DOM
  
            // Show success message
            Swal.fire("Deleted!", "The announcement has been removed.", "success");
          }
        });
      });
    });
  });
  
  