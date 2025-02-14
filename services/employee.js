const moment = require('moment');

const formatEmpResponse = (data) => {
    return {
        data: {
            user_id: data.user_id,
            personal_info: {
                first_name: data.first_name,
                last_name: data.last_name,
                fullname: data.fullname,
                username: data.username,
                employee_code: data.employee_code,
                dob: moment(data.dob).format('YYYY-MM-DD'),
                gender: data.gender,
                avatar: data.avatar
            },
            contact_info: {
                address: data.address,
                phone_number: data.phone_number,
                email: data.email
            },
            employeement_info: {
                hired_date: moment(data.hired_date).format('YYYY-MM-DD'),
                status: {
                    status_id: data.status_id,
                    status_name: data.status_name
                },
                role: {
                    role_id: data.role_id,
                    role_name: data.role_name
                },
                department: {
                    department_id: data.department_id,
                    department_name: data.department_name
                },
                position: {
                    position_id: data.position_id,
                    position_name: data.position_name
                },
                employee_type: {
                    employee_type_id: data.employee_type_id,
                    employee_type: data.employee_type
                }
            }
        }
    };
};

const formatEmployeeSummary = (summary) => {
    return {
        total_employees: summary.total_employees,
        active_employees: summary.total_active,
        inactive_employees: summary.total_inactive,
        female_employees: summary.total_female,
        male_employees: summary.total_male,
        gender_status: {
            male: {
                active: summary.total_male_active,
                inactive: summary.total_male_inactive
            },
            female: {
                active: summary.total_female_active,
                inactive: summary.total_female_inactive
            }
        }
    };
};

module.exports = {
    formatEmpResponse, formatEmployeeSummary
};