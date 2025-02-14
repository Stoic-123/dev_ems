
document.addEventListener("DOMContentLoaded", function () {
    function setupPagination(tableId, paginationId, rowsPerPage) {
        let table = document.querySelector(`#${tableId} tbody`);
        let rows = Array.from(table.rows);
        let totalRows = rows.length;
        let totalPages = Math.ceil(totalRows / rowsPerPage);
        let pagination = document.querySelector(`#${paginationId}`);

        function showPage(page) {
            let start = (page - 1) * rowsPerPage;
            let end = start + rowsPerPage;

            rows.forEach((row, index) => {
                row.style.display = index >= start && index < end ? "" : "none";
            });

            updatePagination(page);
        }

        function getPageNumbers(currentPage) {
            let pages = [];
            pages.push(1);

            if (currentPage > 3) pages.push("...");

            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push("...");

            if (totalPages > 1) pages.push(totalPages);

            return pages;
        }

        function updatePagination(currentPage) {
            pagination.innerHTML = "";
            let prevDisabled = currentPage === 1 ? "disabled" : "";
            let nextDisabled = currentPage === totalPages ? "disabled" : "";
            let html = "";

            html += '<li class="page-item ' + prevDisabled + '">';
            html += '<a href="#" class="page-link first-page rounded-circle" aria-label="First">';
            html += '<i class="fa-solid fa-angles-left"></i></a></li>';

            html += '<li class="page-item ' + prevDisabled + '">';
            html += '<a href="#" class="page-link prev-page" aria-label="Previous">';
            html += '<i class="fa-solid fa-angle-left"></i></a></li>';


            // Page numbers
            let pages = getPageNumbers(currentPage);
            pages.forEach(page => {
                if (page === "...") {
                    html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
                } else {
                    let active = currentPage === page ? "active" : "";
                    html += `<li class="page-item ${active}"><a href="#" class="bg-primary border-0 page-link page-number" data-page="${page}">${page}</a></li>`;
                }
            });

            html += '<li class="page-item ' + nextDisabled + '">';
            html += '<a href="#" class="page-link next-page" aria-label="Next">';
            html += '<i class="fa-solid fa-angle-right"></i></a></li>';

            html += '<li class="page-item ' + nextDisabled + '">';
            html += '<a href="#" class="page-link last-page rounded-circle" aria-label="Last">';
            html += '<i class="fa-solid fa-angles-right"></i></a></li>';

    

            pagination.innerHTML = html;
            addPaginationListeners();
        }

        function addPaginationListeners() {
            pagination.querySelectorAll(".page-number").forEach(el => {
                el.addEventListener("click", function (e) {
                    e.preventDefault();
                    let page = parseInt(this.getAttribute("data-page"));
                    showPage(page);
                });
            });

            pagination.querySelector(".first-page")?.addEventListener("click", function (e) {
                e.preventDefault();
                showPage(1);
            });

            pagination.querySelector(".prev-page")?.addEventListener("click", function (e) {
                e.preventDefault();
                let currentPage = parseInt(pagination.querySelector(".pagination .active a")?.dataset.page || 1);
                showPage(Math.max(1, currentPage - 1));
            });

            pagination.querySelector(".next-page")?.addEventListener("click", function (e) {
                e.preventDefault();
                let currentPage = parseInt(pagination.querySelector(".pagination .active a")?.dataset.page || 1);
                showPage(Math.min(totalPages, currentPage + 1));
            });

            pagination.querySelector(".last-page")?.addEventListener("click", function (e) {
                e.preventDefault();
                showPage(totalPages);
            });
        }

        showPage(1);
    }

    // Apply pagination to both tables
    setupPagination("attendanceTable", "paginationAttendance", 12);
    setupPagination("attendanceSheetTable", "paginationAttendanceSheet", 12);
});

$(document).ready(function() {
    // Initialize DataTable for attendanceTable with correct options
    let attendanceTable = $('#attendanceTable').DataTable({
        "paging": false,       // Disable pagination
        "searching": false,    // Disable search box
        "ordering": false,     // Disable sorting
        "info": false,        // Hide info text
    });

    // Row click event for attendanceTable
    let table = $('#attendanceTable').DataTable();
    $('#attendanceTable tbody').on('click', 'tr', function() {
        let rowData = table.row(this).data(); // Get row data

        // Fill modal with row data
        // $('#modalID').text(rowData[0]);
        // $('#modalName').text(rowData[1]);
        // $('#modalEmail').text(rowData[2]);
        // $('#modalSalary').text(rowData[3]);

        // Show the modal
        $('#attendanceDetail').modal('show');
    });
});


document.addEventListener("DOMContentLoaded", function () {
    let selectedDate = new Date(); // Start with today's date

    function updateDisplayedDate() {
        let formattedDate = selectedDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById("displayDate").innerText = formattedDate; // Update the displayed date
    }

    // Initialize Flatpickr (Hidden)
    let datePicker = flatpickr("#datePicker", {
        defaultDate: selectedDate,
        dateFormat: "d-M-Y",
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                selectedDate = selectedDates[0];
                updateDisplayedDate(); // Sync display when manually picked
            }
        }
    });

    // Previous Button Click
    document.getElementById("prevDate").addEventListener("click", function () {
        selectedDate.setDate(selectedDate.getDate() - 1); // Move back 1 day
        updateDisplayedDate();
    });

    // Next Button Click
    document.getElementById("nextDate").addEventListener("click", function () {
        selectedDate.setDate(selectedDate.getDate() + 1); // Move forward 1 day
        updateDisplayedDate();
    });

    // Set initial displayed date
    updateDisplayedDate();
});


// ================ Function to handle search and filter ======================================

    // Function to filter the table rows based on the search input and status filter
    function filterTable() {
        // Get the search input value
        const searchQuery = document.querySelector('.search-box').value.toLowerCase();
        // Get the selected status filter value
        const statusFilter = document.getElementById('statusFilter').value;
        
        // Get all table rows
        const rows = document.querySelectorAll('.salaryTable tbody tr');
        
        // Loop through each row and apply the filter
        rows.forEach(row => {
            const employeeName = row.querySelector('.name-department-position p').textContent.toLowerCase();
            const status = row.querySelector('.status-paid').textContent.toLowerCase();
            
            // Check if the employee name matches the search query and if the status matches the selected filter
            const matchesSearch = employeeName.includes(searchQuery);
            const matchesStatus = (statusFilter === 'all' || status === statusFilter.toLowerCase());
            
            // If both conditions match, show the row; otherwise, hide it
            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
// Event listener for the search input
document.querySelector('.search-box').addEventListener('input', filterTable);

// Event listener for the status filter dropdown
document.getElementById('statusFilter').addEventListener('change', filterTable);

// Initial call to filter the table when the page loads
filterTable();

