const cron = require('node-cron');
const deductLeaveDays = require('../services/deductLeaveDays');

// Schedule the task to run every 3 days
cron.schedule('0 0 */3 * *', async () => {
    console.log('Running scheduled task to update remaining leave days...');
    try {
        await deductLeaveDays.updateRemainingLeaveDays();
        console.log('Remaining leave days updated successfully.');
    } catch (error) {
        console.error('Error updating remaining leave days:', error);
    }
});

console.log('Scheduler started. Waiting for the next scheduled task...');