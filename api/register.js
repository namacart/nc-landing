// api/register.js — Vercel Serverless Function
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data, whatsappOptIn, timestamp } = req.body;

  // Validate required fields by type
  const requiredFields = {
    customer: ['name', 'phone', 'email', 'area'],
    vendor:   ['name', 'phone', 'shopname', 'shoptype', 'address']
  };

  const missing = requiredFields[type]?.filter(f => !data[f]);
  if (missing?.length) {
    return res.status(400).json({ error: 'Missing fields', missing });
  }

  try {
    // Only attempt to write to sheets if credentials are provided in env vars
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID) {
      await appendToSheet(type, data, whatsappOptIn, timestamp);
    } else {
      console.warn("Missing Google Sheets environment variables. Skipping sheet write.");
    }

    res.status(200).json({ success: true, message: 'Registration saved' });
  } catch (error) {
    console.error("Failed to save to Google Sheets:", error);
    res.status(500).json({ error: 'Failed to process registration' });
  }
}

async function appendToSheet(type, data, optIn, ts) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    // Fix for private key newlines if they are escaped in the environment variable
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
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
  } catch (err) {
    console.error("appendToSheet Error Detail:", err.message);
    throw err;
  }
}
