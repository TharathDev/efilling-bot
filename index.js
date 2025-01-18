const axios = require("axios");
const fs = require("fs"); // To read the JSON file

// Read data.json file
fs.readFile("./data12.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }

  // 1. DATA PREPARATION

  // Parse the JSON data
  const invoices = JSON.parse(data);

  const keys = Object.keys(invoices[0]);

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
    "x-xsrf-token": "cc485375-e8e0-4d2c-9b8c-9dcda5865c23",
    "cookie": "XSRF-TOKEN=cc485375-e8e0-4d2c-9b8c-9dcda5865c23; OWPJSESSIONID=NGMwNzQ2NWYtZWIyYS00NTNhLTg5NDItMmViY2I4NTU4NTY2; TS01214ff7=01bf609f080193a2900130eb1f803704e0fe1f890ccb6195a0536b55c8e8c2d5e30230cf31f3c37aa44a617947ee1c79432109eadb; BIGipServerPRO_OWP_WEB_SVR_POOL=372315308.47873.0000; TS01551615=01bf609f080193a2900130eb1f803704e0fe1f890ccb6195a0536b55c8e8c2d5e30230cf31f3c37aa44a617947ee1c79432109eadb; __zlcmid=1PlnKInlXbMW2v8; TS39867566027=080cb2d710ab200017a48bbea7c2fd7b30b1a32dfdd966047a8479c37a75f10edb22a7e1322e9e2608fbcffdeb1130000dddc8763a0464a6f7c9477d78a99dee44a23a9622843ea5569cfeb7e6431e3d820956a1175841818aa18d88ac75dd55"
  },
  "referrer": "https://efiling.tax.gov.kh/gdtefilingweb/entry/purchase-sale/vYVNJj0jlNBq",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "{\"COM_ID\":\"vYVNJj0jlNBq\",\"TAX_BRANCH\":2014018,\"IS_BRANCH\":false,\"COMPANY_BRANCH\":0,\"EXCHANGE_RATE\":11,\"MONTH\":\"12\",\"YEAR\":\"2024\",\"TAXPAYER_TYPE\":2,\"ITEM_ID\":\"xz4Ev2LgdEOZ\",\"INV_DATE\":\"2024-12-01\",\"INV_NO\":\"NA29\",\"TOTAL_AMT\":8050000,\"TRANSACTION\":1,\"VAT_TYPE\":3,\"CATEGORY\":1,\"NONE_VAT_AMT\":0,\"PLT_AMT\":0,\"SPEC_AMT\":0,\"ACCOM_AMT\":0,\"COM_TYPE\":2,\"PPT_RATE\":1,\"SECTOR_TYPE\":0,\"TREASURY_INV_NO\":\"\",\"INV_REMARK\":\"\\\"ចំណាយជួលទីតាំងប្រចាំខែ ធ្នូ    ២០២៤  \\\"\",\"STCS_AMT\":0}",
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

  // get company info id if ITEM_ID does existed

  const fetchCompanyInfo = async (tin, headers) => {
    const type = tin.includes("-") ? 1 : 2;
    const url =
      type === 1
        ? "https://efiling.tax.gov.kh/gdtefilingweb/company/info"
        : "https://efiling.tax.gov.kh/gdtefilingweb/api/nontaxpayer";

    const body = JSON.stringify(
      type === 1 ? { TIN: tin, TYPE: type } : { TIN: tin }
    );

    // console.log("url:", url, "body:",body);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const id = data.DATA.ID;

      console.log(`Response for ${tin}: ${response.data}  ${id}`);
      return { id, type };
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
  };

  const successfulInvoices = [];
  const failedInvoices = [];

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

    if (invoice.ITEM_ID) {
      const newItemId = await fetchCompanyInfo(invoice.ITEM_ID, headers);
      if (!newItemId) {
        console.log(
          `Skipping invoice ${invoice.INV_NO}: Unable to fetch company info for ITEM_ID ${invoice.ITEM_ID}`
        );
        failedInvoices.push(invoice.INV_NO);
        return; // Skip further processing for this invoice
      }

      // Update invoice with new ITEM_ID and TAXPAYER_TYPE
      invoice.ITEM_ID = newItemId.id;
      result.body.TAXPAYER_TYPE = newItemId.type;

      console.log(
        `Fetched company info for ${invoice.ITEM_ID}: New ITEM_ID = ${newItemId.id}, TAXPAYER_TYPE = ${newItemId.type}`
      );
    }

    const body = {
      ...result.body // Spread extracted body properties here
    };

    keys.forEach(key => {
      // Add each key back dynamically based on its corresponding value from the invoice object
      if (key === "TOTAL_AMT") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else if (key === "ACCOM_AMT") {
        body[key] = parseFloat(invoice[key].replace(/,/g, "").trim()); // For TOTAL_AMT, we clean and parse
      } else {
        body[key] = invoice[key].trim(); // For other keys, just trim
      }
    });

    // console.log("last body", body);

    try {
      const response = await axios.post(url, body, { headers });
      // const response = { data: 200 };
      console.log(
        `Successfully processed INV_NO ${invoice.INV_NO}:`,
        response.data
      );
      successfulInvoices.push(invoice.INV_NO);
    } catch (error) {
      console.error(
        `Error processing INV_NO ${invoice.INV_NO}:`,
        error.message
      );
      failedInvoices.push(invoice.INV_NO);
    }
  };

  // 3. Sequentially send the request

  // Loop through each invoice in the JSON file and send the request
  const processInvoicesSequentially = async () => {
    console.log("\n=== Start Processing Invoices ===\n");

    // Define strict regex pattern for validating the INV_DATE format (YYYY-MM-DD)
    const datePattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

    // Variable to store the base YYYY-MM (from the first invoice)
    let baseYearMonth = null;

    for (const [index, invoice] of invoices.entries()) {
      const invoiceNumber = index + 1;

      // Validate INV_DATE format
      if (!datePattern.test(invoice.INV_DATE)) {
        console.log(
          `Skipping Invoice ${invoice.INV_NO}: Invalid date format (${invoice.INV_DATE})`
        );
        failedInvoices.push(invoice.INV_NO); // Optionally track the failed invoice
        continue; // Skip to the next invoice
      }

      // Extract the YYYY-MM from the current invoice's date
      const currentYearMonth = invoice.INV_DATE.substring(0, 7); // Extracts YYYY-MM (first 7 characters)

      // Set the base YYYY-MM from the first invoice
      if (baseYearMonth === null) {
        baseYearMonth = currentYearMonth;
      }

      // Compare the current invoice's YYYY-MM with the base YYYY-MM
      if (currentYearMonth !== baseYearMonth) {
        console.log(
          `Skipping Invoice ${invoice.INV_NO}: Mismatched month/year (${invoice.INV_DATE})`
        );
        failedInvoices.push(invoice.INV_NO); // Optionally track the failed invoice
        continue; // Skip to the next invoice if the month/year does not match
      }

      try {
        // Call `savePurchaseSaleTax` and track success
        await savePurchaseSaleTax(invoice);
      } catch (error) {
        // Track failures and log the error
        console.error(
          `Error processing INV_NO ${invoice.INV_NO}: ${error.message}`
        );
      }
      console.log(
        "_______________________________________________________________\n"
      );
    }

    // Summary after processing all invoices
    
    console.log("\n=== Processing Summary ===\n");
    console.log(`✅ Successfully Processed: ${successfulInvoices.length}`);
    console.log(`❌ Failed Invoices: ${failedInvoices.length}`);

    if (failedInvoices.length > 0) {
      console.log("\n⚠️  Failed Invoice Numbers:");
      failedInvoices.forEach((invNo, idx) =>
        console.log(`${idx + 1}. ${invNo}`)
      );
    }

    console.log("\n=== End of Processing ===");
    process.exit(0);
  };

  processInvoicesSequentially();
});
