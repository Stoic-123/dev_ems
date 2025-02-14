
$(".dob-input").flatpickr({
    enableTime: false,
    dateFormat: "d-F-Y"
});

new TomSelect(".select-gender",{
	create: true,
	sortField: {
		field: "text",
		direction: "asc"
	}
});
new TomSelect(".select-department",{
	create: true,
	sortField: {
		field: "text",
		direction: "asc"
	}
});
new TomSelect("#editEmType",{
	create: true,
	sortField: {
		field: "text",
		direction: "asc"
	}
});


function filterTable() {
    // Get the search input value
    const searchQuery = document.querySelector('.search-box').value.toLowerCase();
    // Get the selected status filter value
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    // Get all table rows
    const rows = document.querySelectorAll('.salaryTable tbody tr');
    
    // Loop through each row and apply the filter
    rows.forEach(rows => {
        const employeeName = rows.querySelector('.name-department-position p').textContent.toLowerCase();
        const dName = rows.querySelector('department-name').textContent.toLowerCase();
        
        // Check if the employee name matches the search query and if the status matches the selected filter
        const matchesSearch = employeeName.includes(searchQuery);
        const matchesStatus = (departmentFilter === 'all' || dName === departmentFilter.toLowerCase());
        
        // If both conditions match, show the row; otherwise, hide it
        if (matchesSearch && matchesStatus) {
            rows.style.display = '';
        } else {
            rows.style.display = 'none';
        }
    });
}

// Event listener for the search input
document.querySelector('.search-box').addEventListener('input', filterTable);

// Event listener for the status filter dropdown
document.getElementById('dName').addEventListener('change', filterTable);

// Initial call to filter the table when the page loads
filterTable();
