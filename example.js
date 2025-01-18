const axios = require("axios");
const fs = require("fs"); // To read the JSON file

// Read data.json file
fs.readFile("./data.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  // 1. DATA PREPARATION

  // Parse the JSON data
  const invoices = JSON.parse(data);

  const keys = Object.keys(invoices[0]);

  const textJsContent = `
fetch("https://efiling.tax.gov.kh/gdtefilingweb/api/withholding/save", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json;charset=UTF-8",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    "x-xsrf-token": "77a97f97-ad3c-41ca-bfe6-a33c6c17c031",
    "cookie": "XSRF-TOKEN=77a97f97-ad3c-41ca-bfe6-a33c6c17c031; OWPJSESSIONID=MzE0M2YxNmItZjdhNi00MTViLTgxMzEtODQ1N2EwNDkzZDY4; TS01214ff7=01bf609f08e037c8af554618cd5db8593aaccec1a2bdbeb14f6b541a779bbfc89ca8e57f898fb69898f877627468b5f64a0efe4f59; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; __zlcmid=1PmnKMoPok193jA; TS01551615=01bf609f085575c25dbdd014ca598e8a079e78ffe0198cc309d4651b721acd5723cf1d5b44d66a51654531cd55e6423acb4e00b930; TS39867566027=080cb2d710ab2000f378e876135b577a5a465d7e1cfdbe4b3128fe19fd31afb387c19609aec5d7a508da4dd40a113000a7da3eb30fa425297fcdb72dcfeea5698a0d719d450188ca6caee6ff55b254082958b7f1722b02a893473440c7a536aa"
  },
  "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/withholding/vYVNJj0jlNBq",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "{\"COM_ID\":\"vYVNJj0jlNBq\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"12\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":1,\"RESIDENCE_TYPE\":1,\"WT_RATE\":11,\"ITEM_ID\":\"MZdNW1DR9E2G\",\"INV_DATE\":\"2024-12-07\",\"INV_NO\":\"2412-0026\",\"AMOUNT_KHR\":53325,\"COM_TYPE\":2}",
  "method": "POST",
  "mode": "cors"
});
    `;

  const extractInvoiceData = invoice => {
    // Define regex patterns for x-xsrf-token, cookie, and body
    const urlPattern = /https?:\/\/[^\s",]+/;
    const xsrfTokenPattern = /"x-xsrf-token":\s*"([^"]+)"/;
    const cookiePattern = /"cookie":\s*"([^"]+)"/;
    const bodyPattern = /"body":\s*"({.*?})"/s; // 's' flag allows matching multi-line body content

    const firstUrl = invoice.match(urlPattern)[0];

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

    // Remove Keys which contain in json from bodyObject

    keys.forEach(key => {
      delete bodyObject[key];
    });

    // console.log(bodyObject);

    // Return the extracted values in an object, along with remaining body
    return {
      firstUrl,
      xsrfToken,
      cookie,
      body: bodyObject
    };
  };

  // 2. REQUEST API FUNCTION

  // Define the function to send POST request
  const savePurchaseSaleTax = async invoice => {
    const result = extractInvoiceData(textJsContent);

    const url = result.firstUrl;

    const headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": result.xsrfToken,
      cookie: result.cookie,
      referrer:
        "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/PZXAr702MNle",
      referrerPolicy: "strict-origin-when-cross-origin"
    };

    const body = {
      ...result.body // Spread extracted body properties here
    };

    keys.forEach(key => {
      // Add each key back dynamically based on its corresponding value from the invoice object
      if (key === "AMOUNT_KHR") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else if (key === "ACCOM_AMT") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else {
        body[key] = invoice[key].trim(); // For other keys, just trim
      }
    });

    // console.log(body);

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
