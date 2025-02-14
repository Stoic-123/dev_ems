const con = require('../../config/db');

const getAdminIndex = (req, res) => {   
    res.render('partials/base', { 
        title: 'Admin Dashboard',
        sidebarActivePage: 'Admin Dashboard',
        contentFile: '../pages/adminDashboard'
    });
};


const getEmManagement = (req, res) => {
    res.render('partials/base', { 
        title: 'Employee Management',
        sidebarActivePage: 'Employee Management',
        contentFile: '../pages/employeeManagement'
    });
};

const getEmDetail = (req, res) => {
    res.render('partials/base', { 
        title: 'Employee Detail',
        sidebarActivePage: 'Employee Management',
        contentFile: '../pages/employeeDetail'
    });
};

const getAddEmployee = (req, res) => {
    res.render('partials/base', { 
        title: 'Add Employee',
        sidebarActivePage: 'Employee Management',
        contentFile: '../pages/addEmployee'
    });
};

const getPayrollManagement = (req, res) => {
    res.render('partials/base', { 
        title: 'Payroll Management',
        sidebarActivePage: 'Payroll Management',
        contentFile: '../pages/payrollMangement'
    });
}

const getAttendanceForAdmin = (req , res) =>{
    res.render('partials/base', { 
        title: 'Attendance Management',
        sidebarActivePage: 'Attendance Management',
        contentFile: '../pages/getAttendanceForAdmin'
    });
}

// const getRequestManagemment = (req, res) => {
//     res.render('partials/base', { 
//         title: 'Request Management',
//         sidebarActivePage: 'Request Management',
//         contentFile: '../pages/requestManagement'
//     });
// };


const getCompanyDetail = (req, res) => {
    res.render('partials/base', { 
        title: 'Company Management',
        sidebarActivePage: 'Company Management',
        contentFile: '../pages/companyDetail'
    });
}

const getNotification = (req, res) => {
    res.render('partials/base', { 
        title: 'Notification',
        sidebarActivePage: 'Notification',
        contentFile: '../pages/notification'
    });
}

const getAnnouncement = (req, res) => {
    res.render('partials/base', { 
        title: 'Announcement',
        sidebarActivePage: 'Announcement',
        contentFile: '../pages/announcement'
    });
}

const getGenerateQR = (req, res) => {
    res.render('partials/base', { 
        title: 'Generate QR',
        contentFile: '../pages/generateQR'
    });
}

const getRequest = (req, res) => {
    res.render('partials/base', { 
        title: 'Leave Request',
        sidebarActivePage: 'Request Management',
        contentFile: '../pages/getRequest'
    });
}

module.exports = { 
    getAdminIndex, 
    getEmManagement, 
    getEmDetail,
    getAddEmployee,
    getPayrollManagement,
    getAttendanceForAdmin,
    getCompanyDetail,
    getNotification,
    getAnnouncement,
    getGenerateQR,
    getRequest
};

