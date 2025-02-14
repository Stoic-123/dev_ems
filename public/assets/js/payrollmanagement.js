
// ================ Function to handle search and filter ======================================


    document.addEventListener("DOMContentLoaded", function () {
        const searchBox = document.querySelector(".search-box");
        const statusFilter = document.querySelector("#statusFilter");
        const salaryTable = document.querySelector(".salaryTable tbody");

        // Function to filter and search
        function filterTable() {
            const searchQuery = searchBox.value.toLowerCase();
            const selectedStatus = statusFilter.value;
            
            const rows = salaryTable.querySelectorAll("tr");

            rows.forEach(row => {
                const name = row.querySelector(".name-department-position p.text-gray-600")?.textContent.toLowerCase() || "";
                const status = row.querySelector("td:last-child span")?.textContent.toLowerCase() || "";

                // Check if the row matches the search query and the selected status
                const matchesSearch = name.includes(searchQuery);
                const matchesStatus = selectedStatus === "all" || status.includes(selectedStatus.toLowerCase());

                // Show or hide row based on search and filter
                if (matchesSearch && matchesStatus) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        }

    // Event listeners
    searchBox.addEventListener("input", filterTable); // For search
    statusFilter.addEventListener("change", filterTable); // For filter

    // Initial filter when page loads
    filterTable();
});

// ================== select all and deselect to show button start payroll ====================

document.addEventListener("DOMContentLoaded", function () {
    const selectAll = document.getElementById("selectAll");
    const selectRows = document.querySelectorAll(".selectRow");
    const startPayrollBtn = document.querySelector("button[onclick='startPayroll()']");

    function updateSelectAllState() {
        const checkedCount = Array.from(selectRows).filter(checkbox => checkbox.checked).length;
        
        if (checkedCount === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (checkedCount === selectRows.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }
    }

    function updateButtonVisibility() {
        const anyRowChecked = Array.from(selectRows).some(checkbox => checkbox.checked);
        startPayrollBtn.style.display = anyRowChecked ? "inline-block" : "none";
    }

    selectAll.addEventListener("mousedown", function (event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.indeterminate || this.checked) {
            // If indeterminate or checked, uncheck everything
            selectRows.forEach(row => row.checked = false);
            this.indeterminate = false;
            this.checked = false;
        } else {
            // If unchecked, check everything
            selectRows.forEach(row => row.checked = true);
            this.indeterminate = false;
            this.checked = true;
        }
        
        updateButtonVisibility();
    });

    // Prevent the default click behavior completely
    selectAll.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
    });

    selectRows.forEach(row => {
        row.addEventListener("change", function() {
            updateSelectAllState();
            updateButtonVisibility();
        });
    });

    // Initial state setup
    updateSelectAllState();
    updateButtonVisibility();
});


// ============= click in a row to show popup==============

document.querySelectorAll(".clickable-row").forEach(row => {
    row.addEventListener("mouseenter", function () {
        row.style.cursor = "pointer";
    });

    row.addEventListener("click", function (event) {
        // Prevent row click if clicking on the checkbox
        if (event.target.type === "checkbox") return;

        let status = row.querySelector("td:last-child span").textContent.trim();

        if (status === "Pending") {
            new bootstrap.Modal(document.getElementById("updateStatusModal")).show();
        } else {
            new bootstrap.Modal(document.getElementById("viewDetailsModal")).show();
        }
    });
});

document.getElementById("saveStatus").addEventListener("click", function () {
    let selectedStatus = document.querySelector("input[name='status']:checked").value;

    // Simulate updating the status
    if (selectedStatus === "Paid") {
        document.getElementById("detailStatus").textContent = "Paid";
        document.getElementById("detailStatus").classList.remove("bg-warning");
        document.getElementById("detailStatus").classList.add("bg-success");

        // Close the update modal and open the details modal
        bootstrap.Modal.getInstance(document.getElementById("updateStatusModal")).hide();
        setTimeout(() => {
            new bootstrap.Modal(document.getElementById("viewDetailsModal")).show();
        }, 500);
    }
});

// =============== start all payrolll calulating  ======================

let currentStep = 0;
const totalSteps = 5;
let processingInterval;

function startPayroll() {
    // Reset and start
    currentStep = 0;
    clearTimeout(processingInterval);
    
    // Hide all steps
    for (let i = 1; i <= totalSteps; i++) {
        document.getElementById(`step${i}`).classList.remove('active', 'exit');
    }

    // Show first step
    showStep(1);

    // Start the interval
    nextStep();
}

function nextStep() {
    currentStep++;
    
    // Stop at Step 5 and close the modal
    if (currentStep > totalSteps) {
        clearTimeout(processingInterval);
        closeModal(); // Close modal when done
        return;
    }

    showStep(currentStep);

    // Set delay time
    const delay = 1300;
    processingInterval = setTimeout(nextStep, delay);
}

function showStep(stepNumber) {
    for (let i = 1; i <= totalSteps; i++) {
        const step = document.getElementById(`step${i}`);
        if (i === stepNumber) {
            step.classList.remove('exit');
            step.classList.add('active');
        } else if (i === stepNumber - 1) {
            step.classList.remove('active');
            step.classList.add('exit');
        } else {
            step.classList.remove('active', 'exit');
        }
    }
}

function closeModal() {
    // Get modal instance
    const modalElement = document.getElementById('startPayroll');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    
    // Hide modal
    modalInstance.hide();
    
    // Remove backdrop and cleanup body
    document.querySelector('.modal-backdrop').remove();
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// ========== handle close modal and show toast after save status ================


document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener("click", function () {
        if (this.checked && this.dataset.checked === "true") {
            this.checked = false;
            this.dataset.checked = "false";
        } else {
            document.querySelectorAll('input[name="status"]').forEach(r => r.dataset.checked = "false");
            this.dataset.checked = "true";
        }
    });
});


document.getElementById("saveStatus").addEventListener("click", function () {
    const statusPaid = document.getElementById("statusPaid");

    if (statusPaid.checked) {
        Swal.fire({
            title: "Confirm Payment",
            text: "Are you sure you want to mark this as paid?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Confirm",
            cancelButtonText: "Cancel",
            confirmButtonColor: '#3085d6',
        }).then((result) => {
            if (result.isConfirmed) {
                // Show Bootstrap Toast
                let toast = new bootstrap.Toast(document.getElementById("paid_successful"));
                toast.show();

                let modal = document.querySelector(".modal.show"); // Get the active modal
                if (modal) {
                    let modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                }
            }
        });
    }
});

