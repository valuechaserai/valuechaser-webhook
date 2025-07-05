export default async function handler(req, res) {
  // Enable CORS for Webflow
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received webhook:', req.body);

    // Extract form data from Webflow
    const formData = req.body;
    
    // Map Webflow form fields to Airtable fields
    const airtableRecord = {
      "Full Name": formData.name || formData['full-name'] || formData.fullName || '',
      "Email": formData.email || '',
      "Phone": formData.phone || '',
      "Company Name": formData.company || formData['company-name'] || formData.companyName || '',
      "Company Website": formData.website || formData['company-website'] || '',
      "Annual Revenue": formData['annual-revenue'] || formData.annualRevenue || '',
      "Industry": formData.industry || '',
      "Sub-Industry": formData['sub-industry'] || formData.subIndustry || '',
      "Product Selected": formData['product-selection'] || formData.productSelection || '',
      "Role": formData.role || '',
      "Role (Other)": formData['role-other'] || formData.roleOther || '',
      "Uploadcare URL": formData['uploadcare-files'] || formData.uploadcareFiles || '',
      "Status": "New Submission",
      "Submission Timestamp": new Date().toISOString()
    };

    // Remove empty fields
    Object.keys(airtableRecord).forEach(key => {
      if (airtableRecord[key] === '' || airtableRecord[key] === null || airtableRecord[key] === undefined) {
        delete airtableRecord[key];
      }
    });

    console.log('Mapped record:', airtableRecord);

    // Send to Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Submissions%20Intake`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{ fields: airtableRecord }]
      })
    });

    const airtableData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error('Airtable error:', airtableData);
      throw new Error(`Airtable API error: ${JSON.stringify(airtableData)}`);
    }

    console.log('Airtable success:', airtableData);

    return res.status(200).json({ 
      success: true, 
      message: 'Record created successfully',
      airtable_record_id: airtableData.records[0].id 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
