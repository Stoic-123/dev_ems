
flatpickr("#flatpickr", {
    dateFormat: "d-M-Y",
});

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
            html += '<a href="#" class="page-link text-primary first-page rounded-circle" aria-label="First">';
            html += '<i class="fa-solid fa-angles-left"></i></a></li>';

            html += '<li class="page-item ' + prevDisabled + '">';
            html += '<a href="#" class="page-link text-primary prev-page" aria-label="Previous">';
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
            html += '<a href="#" class="page-link text-primary next-page" aria-label="Next">';
            html += '<i class="fa-solid fa-angle-right"></i></a></li>';

            html += '<li class="page-item ' + nextDisabled + '">';
            html += '<a href="#" class="page-link text-primary last-page rounded-circle" aria-label="Last">';
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
    setupPagination("leaveTable", "pagination1", 12);
    setupPagination("OtTable", "pagination2", 12);
});
