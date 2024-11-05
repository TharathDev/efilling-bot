const axios = require('axios');
const fs = require('fs');  // To read the JSON file

// Read data.json file
fs.readFile('./data3.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  // 1. DATA PREPARATION

  // Parse the JSON data
  const invoices = JSON.parse(data);

  const textJsContent = `
    fetch("https://efiling.tax.gov.kh/gdtefilingweb/purchase-sale/savepurchase-saletax-api", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "x-xsrf-token": "4b73d7a0-2e37-4179-8c2a-a125b70b5c26",
        "cookie": "XSRF-TOKEN=4b73d7a0-2e37-4179-8c2a-a125b70b5c26; OWPJSESSIONID=OTZkNTYyMTgtYWRjZS00ZDM0LTk0N2ItZTBhMmY2ZDBkYjM1; TS01214ff7=01bf609f0801c2bc828f2db9c8d74998b92e7cadb40840fda021b85c05aa29faa15fcdd4266c1a77d7f620d087a76513c656f12755; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; __zlcmid=1Oan9BtWl16qg4f; TS01551615=01bf609f08a72ad18f8b76c1ec9236d7b142fe4bfee9ad67e317cec77b2b27a64fc856b0178007f5d9f2b0ca26708462a71f3c5178; TS39867566027=080cb2d710ab2000148e2efbda750726599f431eab6a8c71fe68f60ef0d88cdd14f898c03dbefbfc082699a0eb1130007ced54e790c8681025c493c188bde11edd7492757fd649cd5374a0f11172afa332e72ea5a5e656668004efff925c3081"
      },
      "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/JknEVO53AZQj",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": "{\"COM_ID\":\"JknEVO53AZQj\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"10\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":2,\"ITEM_ID\":\"mObpb5nOMN3L\",\"INV_DATE\":\"2024-10-01\",\"INV_NO\":\"2024-0219\",\"TOTAL_AMT\":2600000,\"TRANSACTION\":2,\"VAT_TYPE\":3,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"លក់អង្ករផ្កាម្លិះ\",\"STCS_AMT\":0}",
      "method": "POST",
      "mode": "cors"
    });
    `;

  const extractInvoiceData = (invoice) => {
    // Define regex patterns for x-xsrf-token, cookie, and body
    const xsrfTokenPattern = /"x-xsrf-token":\s*"([^"]+)"/;
    const cookiePattern = /"cookie":\s*"([^"]+)"/;
    const bodyPattern = /"body":\s*"({.*?})"/s; // 's' flag allows matching multi-line body content

    // Extract x-xsrf-token
    const xsrfTokenMatch = invoice.match(xsrfTokenPattern);
    const xsrfToken = xsrfTokenMatch ? xsrfTokenMatch[1] : "Not found";

    // Extract cookie
    const cookieMatch = invoice.match(cookiePattern);
    const cookie = cookieMatch ? cookieMatch[1] : "Not found";

    // Extract body
    const bodyMatch = invoice.match(bodyPattern);
    const body = bodyMatch ? bodyMatch[1] : "Not found";

    // Parse the body JSON to an object for manipulation
    let bodyObject;
    try {
      bodyObject = JSON.parse(body);
    } catch (error) {
      console.error("Failed to parse body JSON:", error);
      bodyObject = {}; // Set to an empty object if parsing fails
    }

    // Remove INV_DATE, INV_NO, TOTAL_AMT, INV_REMARK from bodyObject
    const { INV_DATE, INV_NO, TOTAL_AMT, INV_REMARK, ...remainingBody } = bodyObject;

    // Return the extracted values in an object, along with remaining body
    return {
      xsrfToken,
      cookie,
      body: remainingBody,
    };
  };


  // 2. REQUEST API FUNCTION

  // Define the function to send POST request
  const savePurchaseSaleTax = async (invoice) => {
    const url = "https://efiling.tax.gov.kh/gdtefilingweb/purchase-sale/savepurchase-saletax-api";

    const result = extractInvoiceData(textJsContent);

    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": result.xsrfToken,
      "cookie": result.cookie,
      "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/PZXAr702MNle",
      "referrerPolicy": "strict-origin-when-cross-origin"
    }

    const body = {
      ...result.body, // Spread extracted body properties here
      INV_DATE: invoice.INV_DATE.trim(),
      INV_NO: invoice.INV_NO.trim(),
      TOTAL_AMT: parseFloat(invoice.TOTAL_AMT.replace(/,/g, '').trim()), // Cleaned and parsed TOTAL_AMT
      INV_REMARK: invoice.INV_REMARK // Dynamic INV_REMARK from JSON
    };

    try {
      const response = await axios.post(url, body, { headers });
      console.log(`Response for INV_NO ${invoice.INV_NO}:`, response.data);
    } catch (error) {
      console.error(`Error for INV_NO ${invoice.INV_NO}:`, error.message);
    }
  };

  // 3. Sequentially send the request

  // Loop through each invoice in the JSON file and send the request
  const processInvoicesSequentially = async () => {
    for (const invoice of invoices) {
      await savePurchaseSaleTax(invoice); // Wait for each request to finish
      // console.log(invoice);
    }
  };

  processInvoicesSequentially();
});
