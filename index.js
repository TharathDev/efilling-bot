const axios = require('axios');
const fs = require('fs');  // To read the JSON file

// Read data.json file
fs.readFile('./data.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  // Parse the JSON data
  const invoices = JSON.parse(data);

  // Define the function to send POST request
  const savePurchaseSaleTax = async (invoice) => {
    const url = "https://efiling.tax.gov.kh/gdtefilingweb/purchase-sale/savepurchase-saletax-api";
    
    const headers = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json;charset=UTF-8",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "X-Requested-With": "XMLHttpRequest",
      "X-XSRF-TOKEN": "XXXXXXXXXXXXXXXXXXXXXX",
      "Cookie": "XSRF-TOKEN=XXXXXXX; TS01214ff7=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    };
    
    const body = {
      COM_ID: "XXXXXX",
      TAX_BRANCH: 2014030,
      IS_BRANCH: false,
      COMPANY_BRANCH: 0,
      EXCHANGE_RATE: 11,
      MONTH: "10",  // Assuming all invoices are in September
      YEAR: "2024",
      TAXPAYER_TYPE: 2,
      ITEM_ID: "XXXX",
      INV_DATE: invoice.INV_DATE.trim(),    // Use the INV_DATE from the data
      INV_NO: invoice.INV_NO.trim(),        // Use the INV_NO from the data
      TOTAL_AMT: parseFloat(invoice.TOTAL_AMT.replace(/,/g, '').trim()),  // Clean and parse TOTAL_AMT
      TRANSACTION: 2,
      VAT_TYPE: 1,
      CATEGORY: 1,
      NONE_VAT_AMT: 0,
      PLT_AMT: 0,
      SPEC_AMT: 0,
      ACCOM_AMT: 0,
      COM_TYPE: 2,
      PPT_RATE: 1,
      SECTOR_TYPE: 0,
      TREASURY_INV_NO: "",
      INV_REMARK: invoice.INV_REMARK,  // Use the INV_REMARK from the data
      STCS_AMT: 0
    };

    try {
      const response = await axios.post(url, body, { headers });
      console.log(`Response for INV_NO ${invoice.INV_NO}:`, response.data);
    } catch (error) {
      console.error(`Error for INV_NO ${invoice.INV_NO}:`, error.message);
    }
  };

  // Loop through each invoice in the JSON file and send the request
  invoices.forEach((invoice) => {
    savePurchaseSaleTax(invoice);
  });
});
