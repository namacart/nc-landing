// api/register.js — Netlify Function
import { google } from 'googleapis';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { type, data, whatsappOptIn, timestamp } = body;

  // Validate required fields by type
  const requiredFields = {
    customer: ['name', 'phone', 'email', 'area'],
    vendor:   ['name', 'phone', 'shopname', 'shoptype', 'address']
  };

  const missing = requiredFields[type]?.filter(f => !data[f]);
  if (missing?.length) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing fields', missing })
    };
  }

  try {
    // Only attempt to write to sheets if credentials are provided in env vars
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID) {
      await appendToSheet(type, data, whatsappOptIn, timestamp);
    } else {
      console.warn("Missing Google Sheets environment variables. Skipping sheet write.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Registration saved' })
    };
  } catch (error) {
    console.error("Failed to save to Google Sheets:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process registration' })
    };
  }
};

async function appendToSheet(type, data, optIn, ts) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const tabMap = { customer: 'Customers', vendor: 'Vendors' };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabMap[type]}!A:Z`,
    valueInputOption: 'RAW',
    resource: { values: [[ts, type, ...Object.values(data), optIn]] }
  });
}
