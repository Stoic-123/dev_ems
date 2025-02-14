const months = [ 
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// DOM Elements
const dateInput = document.getElementById('date-input');
const datePopup = document.getElementById('date-popup');
const monthPicker = document.getElementById('month-picker');
const dayPicker = document.getElementById('day-picker');
const cancelButton = document.getElementById('date-cancel');
const setButton = document.getElementById('date-set');

const timeStartInput = document.getElementById('time-input-start');
const timeEndInput = document.getElementById('time-input-end');
const timePopup = document.getElementById('time-popup');
const hourPicker = document.getElementById('hour-picker');
const minutePicker = document.getElementById('minute-picker');
const ampmPicker = document.getElementById('ampm-picker');
const timeCancelButton = document.getElementById('time-cancel');
const timeSetButton = document.getElementById('time-set');

// Function to check if a year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Function to get the number of days in a month
function getDaysInMonth(month, year) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 1 && isLeapYear(year)) { // February
    return 29;
  }
  return daysInMonth[month];
}

// Configuration for different picker types
const pickerConfigs = {
  day: {
    getDynamicMax: (selectedMonth) => {
      const currentYear = new Date().getFullYear();
      const monthIndex = months.indexOf(selectedMonth);
      return getDaysInMonth(monthIndex, currentYear);
    },
    min: 1,
    format: (value) => value.toString().padStart(2, '0')
  },
  hour: {
    min: 1,
    max: 12,
    format: (value) => value.toString().padStart(2, '0')
  },
  minute: {
    min: 0,
    max: 59,
    format: (value) => value.toString().padStart(2, '0')
  },
  month: {
    values: months,
    format: (value) => value
  }
};

function initializeAMPMPicker() {
  ampmPicker.innerHTML = '';
  
  // Add AM and PM options
  ['AM', 'PM'].forEach(value => {
    const item = document.createElement('div');
    item.classList.add('picker-item');
    item.textContent = value;
    ampmPicker.appendChild(item);
  });
}

// Function to create a picker item
function createPickerItem(value, config) {
  const item = document.createElement('div');
  item.classList.add('picker-item');
  item.textContent = config.format(value);
  item.dataset.value = value;
  return item;
}

// Function to update days based on selected month
function updateDays(selectedMonth) {
  const maxDays = pickerConfigs.day.getDynamicMax(selectedMonth);
  pickerConfigs.day.max = maxDays;
  
  // Reinitialize day picker with new max days
  initializeInfiniteScroll(dayPicker, pickerConfigs.day);
  centerScroll(dayPicker);
}

// Function to initialize infinite scroll for a picker
function initializeInfiniteScroll(picker, config) {
  const container = picker.parentElement;
  const itemHeight = 40; // Height of each picker item
  let isScrolling = false;
  
  // Clear existing items
  picker.innerHTML = '';
  
  // Initial population
  if (config.values) {
    // For pickers with predefined values (months)
    const values = config.values;
    for (let i = 0; i < 3; i++) {
      values.forEach(value => {
        picker.appendChild(createPickerItem(value, config));
      });
    }
  } else {
    // For numeric pickers (days, hours, minutes)
    for (let i = 0; i < 3; i++) {
      for (let value = config.min; value <= config.max; value++) {
        picker.appendChild(createPickerItem(value, config));
      }
    }
  }

  // Handle scroll
  picker.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      requestAnimationFrame(() => {
        const scrollTop = picker.scrollTop;
        const containerHeight = container.offsetHeight;
        const scrollHeight = picker.scrollHeight;
        
        // Check if we're near the top or bottom
        if (scrollTop < containerHeight) {
          // Add items to the top
          if (config.values) {
            config.values.forEach(value => {
              const newItem = createPickerItem(value, config);
              picker.insertBefore(newItem, picker.firstChild);
            });
          } else {
            for (let value = config.max; value >= config.min; value--) {
              const newItem = createPickerItem(value, config);
              picker.insertBefore(newItem, picker.firstChild);
            }
          }
          picker.scrollTop = scrollTop + (picker.scrollHeight - scrollHeight);
        } else if (scrollTop + containerHeight > scrollHeight - containerHeight) {
          // Add items to the bottom
          if (config.values) {
            config.values.forEach(value => {
              picker.appendChild(createPickerItem(value, config));
            });
          } else {
            for (let value = config.min; value <= config.max; value++) {
              picker.appendChild(createPickerItem(value, config));
            }
          }
        }
        
        // Remove excess items to prevent memory issues
        while (picker.children.length > 100) {
          if (scrollTop < scrollHeight / 2) {
            picker.removeChild(picker.lastChild);
          } else {
            picker.removeChild(picker.firstChild);
          }
        }
        
        isScrolling = false;
      });
    }
  });

  // For month picker, add change detection
  if (picker === monthPicker) {
    picker.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const selectedMonth = handleScroll(monthPicker)?.textContent;
        if (selectedMonth) {
          updateDays(selectedMonth);
        }
      });
    });
  }
}

// Function to center scroll for a picker
function centerScroll(picker) {
  if (picker === ampmPicker) {
    // For AM/PM picker, always start at the top (AM)
    picker.scrollTop = 0;
  } else {
    const container = picker.parentElement;
    const middlePosition = (picker.scrollHeight - container.offsetHeight) / 2;
    picker.scrollTop = middlePosition;
  }
}

// Handle scroll snapping and selection
function handleScroll(element) {
  const items = element.querySelectorAll('.picker-item');
  const containerRect = element.getBoundingClientRect();
  const containerMiddle = containerRect.top + containerRect.height / 2;

  let closestItem = null;
  let minDistance = Infinity;

  items.forEach(item => {
    if (item.style.visibility !== 'hidden') { // Skip hidden spacer items
      const itemRect = item.getBoundingClientRect();
      const itemMiddle = itemRect.top + itemRect.height / 2;
      const distance = Math.abs(containerMiddle - itemMiddle);

      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    }
  });

  return closestItem;
}

// Initialize all pickers
initializeInfiniteScroll(monthPicker, pickerConfigs.month);
initializeInfiniteScroll(dayPicker, pickerConfigs.day);
initializeInfiniteScroll(hourPicker, pickerConfigs.hour);
initializeInfiniteScroll(minutePicker, pickerConfigs.minute);
initializeAMPMPicker(); // Initialize AM/PM picker without infinite scroll

// Event Listeners for showing popups
dateInput.addEventListener('click', () => {
  datePopup.style.display = 'flex';
  setTimeout(() => {
    centerScroll(dayPicker);
    centerScroll(monthPicker);
  }, 0);
});

timeStartInput.addEventListener('click', () => {
  timePopup.dataset.target = 'start';
  timePopup.style.display = 'flex';
  setTimeout(() => {
    centerScroll(hourPicker);
    centerScroll(minutePicker);
    centerScroll(ampmPicker);
  }, 0);
});

timeEndInput.addEventListener('click', () => {
  timePopup.dataset.target = 'end';
  timePopup.style.display = 'flex';
  setTimeout(() => {
    centerScroll(hourPicker);
    centerScroll(minutePicker);
    centerScroll(ampmPicker);
  }, 0);
});

// Hide popups
cancelButton.addEventListener('click', () => {
  datePopup.style.display = 'none';
});

timeCancelButton.addEventListener('click', () => {
  timePopup.style.display = 'none';
});

// Set date
setButton.addEventListener('click', () => {
  const selectedMonth = handleScroll(monthPicker);
  const selectedDay = handleScroll(dayPicker);
  const currentYear = new Date().getFullYear();

  if (selectedMonth && selectedDay) {
    const month = selectedMonth.textContent;
    const day = selectedDay.textContent;
    dateInput.value = `${day} ${month} ${currentYear}`;
  }

  datePopup.style.display = 'none';
});

// Set time
timeSetButton.addEventListener('click', () => {
  const selectedHour = handleScroll(hourPicker);
  const selectedMinute = handleScroll(minutePicker);
  const selectedAMPM = handleScroll(ampmPicker);

  if (selectedHour && selectedMinute && selectedAMPM) {
    const hour = selectedHour.textContent;
    const minute = selectedMinute.textContent;
    const ampm = selectedAMPM.textContent;
    const targetInput = timePopup.dataset.target === 'start' ? timeStartInput : timeEndInput;
    targetInput.value = `${hour}:${minute} ${ampm}`;
  }

  timePopup.style.display = 'none';
});

// ================ Function to handle search and filter ======================================

document.addEventListener("DOMContentLoaded", function () {
  const searchBox = document.querySelector(".search-box");
  const departmentFilter = document.querySelector("#departmentFilter");
  const salaryTable = document.querySelector("#salaryTable tbody");

  // Function to filter and search
  function filterTable() {
      const searchQuery = searchBox.value.toLowerCase();
      const selectedDepartment = departmentFilter.value;
      
      const rows = salaryTable.querySelectorAll("tr");

      rows.forEach(row => {
          // Get name and department from the correct elements
          const nameElement = row.querySelector(".name-department-position div p.text-gray-600");
          const departmentElement = row.querySelector(".name-department-position div p.text-gray-500");
          
          const name = nameElement?.textContent.toLowerCase() || "";
          const department = departmentElement?.textContent.toLowerCase() || "";

          // Check if the row matches both search query and selected department
          const matchesSearch = name.includes(searchQuery);
          const matchesDepartment = selectedDepartment === "all" || department.includes(selectedDepartment.toLowerCase());

          // Show or hide row based on search and filter
          row.style.display = matchesSearch && matchesDepartment ? "" : "none";
      });
  }

  // Event listeners
  searchBox.addEventListener("input", filterTable);
  departmentFilter.addEventListener("change", filterTable);

  // Initial filter when page loads
  filterTable();
});

// ================= handle after approved success (approved OT)  ======================


document.querySelectorAll('input[name="action"]').forEach(radio => {
  radio.addEventListener('click', function(event) {
    if (this.checked && this.dataset.wasChecked) {
      this.checked = false;
      this.dataset.wasChecked = "";
    } else {
      document.querySelectorAll('input[name="action"]').forEach(el => el.dataset.wasChecked = "");
      this.dataset.wasChecked = "true";
    }
  });
});

document.getElementById('saveButton').addEventListener('click', function () {
  const selectedAction = document.querySelector('input[name="action"]:checked');

  if (selectedAction) {
    if (selectedAction.value === 'reject') {
      Swal.fire({
        title: 'Confirm Rejection?',
        text: 'Are you sure you want to reject this request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!',
      }).then((result) => {
        if (result.isConfirmed) {
          // Close the modal
          const modalElement = document.getElementById('overtimeModal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
          }

          // Show reject toast
          const toast = new bootstrap.Toast(document.getElementById('rejectToast'));
          toast.show();

          // Uncheck all radio buttons
          document.querySelectorAll('input[name="action"]').forEach((radio) => (radio.checked = false));

          // Scroll to the "approved" section
          const approvedSection = document.getElementById('approved');
          approvedSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else if (selectedAction.value === 'approved') {
      Swal.fire({
        title: 'Confirm Approval?',
        text: 'Are you sure you want to approve this request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!',
      }).then((result) => {
        if (result.isConfirmed) {
          // Close the modal
          const modalElement = document.getElementById('overtimeModal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
          }

          // Show approve toast
          const toast = new bootstrap.Toast(document.getElementById('approveToast'));
          toast.show();

          // Uncheck all radio buttons
          document.querySelectorAll('input[name="action"]').forEach((radio) => (radio.checked = false));

          // Scroll to the "approved" section
          const approvedSection = document.getElementById('approved');
          approvedSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
});


// ====================== Fecth API =====================