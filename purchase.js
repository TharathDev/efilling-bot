const axios = require('axios');
const fs = require('fs');  // To read the JSON file

// Read data.json file
fs.readFile('./data1.json', 'utf8', (err, data) => {
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
      "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-kl-ajax-request": "Ajax_Request",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": "63a733ef-5e73-4c39-8611-4dc0f2a41e32",
      "cookie": "XSRF-TOKEN=63a733ef-5e73-4c39-8611-4dc0f2a41e32; OWPJSESSIONID=YjBjNmYzOWQtODIzYy00MGExLTk3ZTctMzBlZDE0MzVlMjRj; TS01214ff7=01bf609f08e382b973052a0798e7c330e37c4f1fbec60c793938739f670a07b4f739a03a15252fdcde6d629c5bebc2ba24ed84b9ef; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; __zlcmid=1Ofn9wlDH47eDJw; TS01551615=01bf609f08f3e32ab8dff9afe1011bd7fa362f902c7993ba6aa7b8961a9e1630fc8fd520e056636e7e1ce3029f994e0e550c8d94b8; TS39867566027=080cb2d710ab2000bfc66a4b7079630c5532370ed7cb345c17381a3818843445ac11c856e6c21c1f086ae04bad1130009c35856c6b9a968899b9c8d6aa771425037136806cb8354b4892122cb6eb45792c09e1b2686e8d6f4f65393cfc263d04",
      "Referer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/RwrNlevgDpL5",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"COM_ID\":\"RwrNlevgDpL5\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"10\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":2,\"ITEM_ID\":\"gGxNBqvKbAQX\",\"INV_DATE\":\"2024-10-01\",\"INV_NO\":\"2024-0275\",\"TOTAL_AMT\":203150,\"TRANSACTION\":2,\"VAT_TYPE\":1,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":3621,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"បន្ទប់ស្នាក់នៅតំលៃ15$  បន្ទប់ស្នាក់នៅតំលៃ20$\",\"STCS_AMT\":0}",
    "method": "POST"
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
    const { INV_DATE, INV_NO, TOTAL_AMT, INV_REMARK, ACCOM_AMT, ...remainingBody } = bodyObject;

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
      ACCOM_AMT: invoice.ACCOM_AMT,
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
