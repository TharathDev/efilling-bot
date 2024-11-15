const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parse, format } = require('date-fns'); // Ensure date-fns is installed: npm install date-fns

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to validate and reformat date based on user input format
function reformatDate(date, inputFormat) {
    try {
        // Parse the input date using the user's format
        const parsedDate = parse(date, inputFormat, new Date());
        if (isNaN(parsedDate)) {
            throw new Error('Invalid date');
        }
        // Format to desired 'YYYY-MM-DD'
        return format(parsedDate, 'yyyy-mm-dd');
    } catch (err) {
        console.error(`Error parsing date "${date}" with format "${inputFormat}": ${err.message}`);
        return null; // Return null if the format is invalid or parsing fails
    }
}

// Function to process the JSON data
function processJsonData(inputFormat) {
    const inputFilePath = path.join(__dirname, 'data.json');
    const outputFilePath = path.join(__dirname, 'data-formatted.json');

    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            const formattedData = jsonData.map(entry => {
                if (entry.INV_DATE) {
                    const reformattedDate = reformatDate(entry.INV_DATE, inputFormat);
                    entry.INV_DATE = reformattedDate || entry.INV_DATE; // Keep original if invalid
                }
                return entry;
            });

            fs.writeFile(outputFilePath, JSON.stringify(formattedData, null, 2), 'utf8', err => {
                if (err) {
                    console.error('Error writing the file:', err);
                } else {
                    console.log('Formatted data has been saved to data-formatted.json');
                }
            });
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
        }
    });
}

// Prompt user for the input format
rl.question('Enter the original date format (e.g., d-MM-yy, dd-MM-yyyy): ', inputFormat => {
    console.log(`Using input format: ${inputFormat}`);
    processJsonData(inputFormat);
    rl.close();
});
