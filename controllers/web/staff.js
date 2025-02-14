const con = require('../../config/db');

const getStaffIndex = (req, res) => {
    res.render('partials/base', { 
        title: 'Dashboard',
        sidebarActivePage: 'Dashboard',
        contentFile: '../pages/staffDashboard'
    });
};

const getPayrollStaff = (req , res) =>{
    res.render('partials/base', { 
        title: 'Payroll',
        sidebarActivePage: 'Payroll',
        contentFile: '../pages/payroll'
    });
}

const getProfile = (req ,res) =>{
    res.render('partials/base', { 
        title: 'Profile',
        sidebarActivePage: 'Profile',
        contentFile: '../pages/profile'
    });
}

const getStaffAttendance = (req, res) => {
    res.render('partials/base', { 
        title: 'Attendance',
        sidebarActivePage: 'Attendance',
        contentFile: '../pages/staffAttendance'
    });
}

const getStaffRequest = (req, res) => {
    res.render('partials/base', { 
        title: 'Request',
        sidebarActivePage: 'Request',
        contentFile: '../pages/staffRequest'
    });
}

module.exports = { getStaffIndex, getPayrollStaff, getProfile,getStaffAttendance, getStaffRequest };
