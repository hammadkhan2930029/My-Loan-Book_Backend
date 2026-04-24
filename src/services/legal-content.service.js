const {LegalContent} = require('../models');

const privacyPolicySeed = {
  key: 'privacy_policy',
  title: 'Privacy Policy',
  effectiveDateLabel: 'April 24, 2026',
  intro:
    'This Privacy Policy describes how Digital Loan Tracker ("we", "our", "us") collects, uses, and protects your information when you use our mobile application ("App").',
  contactEmail: 'digiloantracker@gmail.com',
  sections: [
    {
      heading: '1. Information We Collect',
      body: '',
      bullets: [
        'Personal Information: Name, phone number, and optional email address.',
        'User Data: Contacts added by you, transaction records, and attachments such as images or PDF payment slips.',
        'Device Information: Device type, operating system version, and app usage data for performance and analytics.',
      ],
    },
    {
      heading: '2. How We Use Your Information',
      body: 'We use your data to support the app experience and maintain your records.',
      bullets: [
        'Provide and operate the app.',
        'Maintain your transaction records.',
        'Improve user experience.',
        'Send reminders if enabled.',
        'Ensure security and prevent misuse.',
      ],
    },
    {
      heading: '3. Data Storage & Security',
      body: 'We take practical steps to protect your information, while noting that no system can guarantee absolute security.',
      bullets: [
        'Your data may be stored securely on cloud servers.',
        'We implement reasonable security measures to protect your data.',
        'However, no system is 100% secure.',
      ],
    },
    {
      heading: '4. Attachments (Proof Uploads)',
      body: '',
      bullets: [
        'Files uploaded, including images and PDFs, are stored securely.',
        'These files are accessible only to you unless you choose to share them.',
      ],
    },
    {
      heading: '5. Data Sharing',
      body: 'We do not sell your data.',
      bullets: [
        'We may share data with service providers such as hosting or analytics partners.',
        'We may disclose data if required by law.',
      ],
    },
    {
      heading: '6. User Responsibility',
      body: 'You are responsible for the information you submit in the app.',
      bullets: [
        'Accuracy of the data you enter.',
        'Content you upload, including proof documents.',
      ],
    },
    {
      heading: '7. Data Retention',
      body: '',
      bullets: [
        'Data is stored as long as your account is active.',
        'You may request deletion at any time.',
      ],
    },
    {
      heading: '8. Your Rights',
      body: 'You can control and review your account information.',
      bullets: [
        'Access your data.',
        'Update your information.',
        'Request deletion of your account.',
      ],
    },
    {
      heading: '9. Third-Party Services',
      body: 'The app may rely on external providers to operate smoothly.',
      bullets: [
        'Cloud storage providers.',
        'Analytics tools.',
        'These services have their own privacy policies.',
      ],
    },
    {
      heading: '10. Changes to This Policy',
      body: 'We may update this policy from time to time. Changes will be notified within the app.',
      bullets: [],
    },
    {
      heading: '11. Contact Us',
      body: 'For questions, please contact us at digiloantracker@gmail.com.',
      bullets: [],
    },
  ],
};

const termsAndConditionsSeed = {
  key: 'terms_and_conditions',
  title: 'Terms & Conditions',
  effectiveDateLabel: 'April 24, 2026',
  intro:
    'By using Digital Loan Tracker, you agree to the following terms.',
  contactEmail: 'digiloantracker@gmail.com',
  sections: [
    {
      heading: '1. Nature of Service',
      body: 'Digital Loan Tracker helps users maintain records between individuals.',
      bullets: [
        'It is a record-keeping tool.',
        'It is designed to track lending and borrowing between individuals.',
        'It is not a financial institution.',
        'It is not a lending platform.',
        'It is not a legal authority.',
      ],
    },
    {
      heading: '2. User Responsibility',
      body: 'You are responsible for how you use the app and the data you enter.',
      bullets: [
        'All data entered is your responsibility.',
        'You will use the app lawfully.',
        'You will not misuse the platform.',
      ],
    },
    {
      heading: '3. Accuracy of Records',
      body: 'The platform records user input but does not independently verify it.',
      bullets: [
        'The app does not verify transactions.',
        'Entries are user-generated.',
        'We do not guarantee correctness.',
      ],
    },
    {
      heading: '4. No Financial Liability',
      body: 'We do not assume responsibility for financial outcomes or disputes.',
      bullets: [
        'Financial losses.',
        'Disputes between users.',
        'Misuse of records.',
      ],
    },
    {
      heading: '5. Attachments & Content',
      body: 'Users must avoid uploading prohibited material.',
      bullets: [
        'Illegal content.',
        'Fraudulent documents.',
        'Content violating others\' rights.',
      ],
    },
    {
      heading: '6. Account Usage',
      body: 'You are responsible for safeguarding account access.',
      bullets: [
        'You are responsible for maintaining account security.',
        'Unauthorized use must be reported immediately.',
      ],
    },
    {
      heading: '7. Termination',
      body: 'We may restrict access when the platform is misused.',
      bullets: [
        'Accounts that violate terms may be suspended or terminated.',
        'Accounts that misuse the app may be suspended or terminated.',
      ],
    },
    {
      heading: '8. Modifications',
      body: 'We may update features or terms at any time.',
      bullets: [],
    },
    {
      heading: '9. Limitation of Liability',
      body: 'We are not liable for the following outcomes.',
      bullets: [
        'Indirect damages.',
        'Loss of data.',
        'Financial disputes.',
      ],
    },
    {
      heading: '10. Governing Law',
      body: 'These terms are governed by the laws of Pakistan.',
      bullets: [],
    },
    {
      heading: '11. Contact',
      body: 'For questions, please contact us at digiloantracker@gmail.com.',
      bullets: [],
    },
  ],
};

const mapLegalContent = document => ({
  id: document._id.toString(),
  key: document.key,
  title: document.title,
  effectiveDateLabel: document.effectiveDateLabel,
  intro: document.intro,
  sections: Array.isArray(document.sections)
    ? document.sections.map(section => ({
        heading: section.heading,
        body: section.body || '',
        bullets: Array.isArray(section.bullets) ? section.bullets : [],
      }))
    : [],
  contactEmail: document.contactEmail || '',
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const ensurePrivacyPolicy = async () => {
  const document = await LegalContent.findOneAndUpdate(
    {key: privacyPolicySeed.key},
    {
      $setOnInsert: privacyPolicySeed,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return document;
};

const ensureTermsAndConditions = async () => {
  const document = await LegalContent.findOneAndUpdate(
    {key: termsAndConditionsSeed.key},
    {
      $setOnInsert: termsAndConditionsSeed,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return document;
};

const getPrivacyPolicy = async () => {
  const document = await ensurePrivacyPolicy();

  return mapLegalContent(document);
};

const getTermsAndConditions = async () => {
  const document = await ensureTermsAndConditions();

  return mapLegalContent(document);
};

module.exports = {
  getPrivacyPolicy,
  getTermsAndConditions,
};
