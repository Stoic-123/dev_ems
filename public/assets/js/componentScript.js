$(document).ready(function () {
    let table = new DataTable('.salaryTable', {
        responsive: true,
        paging: false,
        searching: false,
        info: false,
        lengthChange: false,
        ordering: false
    });
});


// ============ shorting table by name =========

document.addEventListener("DOMContentLoaded", function () {
    // Initialize variables outside the event handler to maintain state
    let sortDirection = true; // true for ascending, false for descending
    let table = document.querySelector(".salaryTable tbody");
    let isProcessing = false; // Add flag to prevent multiple rapid clicks

    function sortTable() {
        // If already processing a sort, return
        if (isProcessing) return;
        
        // Set processing flag
        isProcessing = true;

        // Get all rows 
        let rows = Array.from(table.querySelectorAll("tr"));
        
        // Sort the rows
        rows.sort((a, b) => {
            let textA = a.cells[1].querySelector("p.text-gray-600")?.innerText.trim().toLowerCase() || "";
            let textB = b.cells[1].querySelector("p.text-gray-600")?.innerText.trim().toLowerCase() || "";
            return sortDirection ? textA.localeCompare(textB) : textB.localeCompare(textA);
        });

        // Toggle sort direction for next click
        sortDirection = !sortDirection;

        // Clear existing rows and append sorted rows
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }
        table.append(...rows);

        // Add visual indicator of sort direction (optional)
        const header = document.querySelector(".employees-name");
        header.setAttribute('data-sort', sortDirection ? 'asc' : 'desc');
        
        // Reset processing flag after a short delay
        setTimeout(() => {
            isProcessing = false;
        }, 200); // 200ms delay to prevent rapid double clicks
    }

    // Add click event listener to the header
    document.querySelector(".employees-name").addEventListener("click", sortTable, false);
});

// ================== month years selection ========================

document.addEventListener("DOMContentLoaded", function () {
    const datePickerBtn = document.getElementById("datePickerBtn");
    const modal = new bootstrap.Modal(document.getElementById("monthYearModal"));
    const yearSelect = document.getElementById("yearSelect");
    const monthButtons = document.querySelectorAll(".month-btn");
    const saveDateBtn = document.getElementById("saveDateBtn");

    let selectedMonth = "October";
    let selectedYear = 2025;

    // Populate year dropdown (Range: 1970 - 2025)
    for (let year = 2000; year <= 2025; year++) {
        let option = new Option(year, year);
        yearSelect.appendChild(option);
    }
    yearSelect.value = selectedYear;

    // Show modal when clicking the button
    datePickerBtn.addEventListener("click", function () {
        modal.show();
    });

    // Highlight selected month
    monthButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            monthButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            selectedMonth = this.getAttribute("data-month");
        });
    });

    // Save selected month and year
    saveDateBtn.addEventListener("click", function () {
        selectedYear = yearSelect.value;
        datePickerBtn.textContent = selectedMonth + " " + selectedYear;
        modal.hide();
    });
});

// ================= pagination ==========================

document.addEventListener("DOMContentLoaded", function () {
    let table = document.querySelector(".salaryTable tbody");
    let rows = Array.from(table.rows);
    let rowsPerPage = 12;   	
    let totalRows = rows.length;
    let totalPages = Math.ceil(totalRows / rowsPerPage);
    let pagination = document.querySelector(".pagination");

    function showPage(page) {
        let start = (page - 1) * rowsPerPage;
        let end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display = index >= start && index < end ? "" : "none";
        });

        updatePagination(page);
    }

    function getPageNumbers(currentPage, totalPages) {
        let pages = [];
        
        // Always show first page
        pages.push(1);
        
        if (currentPage > 3) {
            pages.push('...');
        }
        
        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        
        if (currentPage < totalPages - 2) {
            pages.push('...');
        }
        
        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    }

    function updatePagination(currentPage) {
        // Hide pagination if only one page
        if (totalPages <= 1) {
            pagination.style.display = "none";
            return;
        } else {
            pagination.style.display = "flex";
        }

        pagination.innerHTML = "";
        let prevDisabled = currentPage === 1 ? "disabled" : "";
        let nextDisabled = currentPage === totalPages ? "disabled" : "";
        
        let html = '';
        
        // First and Previous buttons
        html += '<li class="page-item ' + prevDisabled + '">';
        html += '<a href="#" class="page-link first-page rounded-8" aria-label="First">';
        html += '<i class="fa-solid fa-angles-left"></i></a></li>';
        
        html += '<li class="page-item ' + prevDisabled + '">';
        html += '<a href="#" class="page-link prev-page" aria-label="Previous">';
        html += '<i class="fa-solid fa-angle-left"></i></a></li>';

        // Page numbers with ellipsis
        let pages = getPageNumbers(currentPage, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                html += '<li class="page-item disabled">';
                html += '<span class="page-link">...</span></li>';
            } else {
                let active = currentPage === page ? "active" : "";
                html += '<li class="page-item ' + active + '">';
                html += '<a href="#" class="page-link page-number" data-page="' + page + '">' + page + '</a></li>';
            }
        });

        // Next and Last buttons (Move one page forward and to the last page)
        html += '<li class="page-item ' + nextDisabled + '">';
        html += `<a href="#" class="page-link next-page" aria-label="Next">`;
        html += '<i class="fa-solid fa-angle-right"></i></a></li>';
        
        html += '<li class="page-item ' + nextDisabled + '">';
        html += `<a href="#" class="page-link last-page rounded-8" aria-label="Last">`;
        html += '<i class="fa-solid fa-angles-right"></i></a></li>';

        pagination.innerHTML = html;
        addPaginationListeners();
    }

    function addPaginationListeners() {
        document.querySelectorAll(".page-number").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                let page = parseInt(this.getAttribute("data-page"));
                showPage(page);
            });
        });

        document.querySelector(".first-page")?.addEventListener("click", function (e) {
            e.preventDefault();
            showPage(1);
        });

        document.querySelector(".prev-page")?.addEventListener("click", function (e) {
            e.preventDefault();
            let currentPage = parseInt(document.querySelector(".pagination .active a").dataset.page);
            showPage(Math.max(1, currentPage - 1));
        });

        document.querySelector(".next-page")?.addEventListener("click", function (e) {
            e.preventDefault();
            let currentPage = parseInt(document.querySelector(".pagination .active a").dataset.page);
            showPage(Math.min(totalPages, currentPage + 1)); // Move only one page forward
        });

        document.querySelector(".last-page")?.addEventListener("click", function (e) {
            e.preventDefault();
            showPage(totalPages); // Go directly to last page
        });
    }

    showPage(1);
});
