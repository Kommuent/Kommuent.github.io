// src/utils/qrCodeGenerator.js

import QRCode from 'qrcode';

export const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error(err);
    return null;
  }
};
