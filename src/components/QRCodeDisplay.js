// src/components/QRCodeDisplay.js

import React, { useEffect, useState } from 'react';
import { generateQRCode } from '../utils/qrCodeGenerator';

const QRCodeDisplay = ({ text }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generate = async () => {
      const url = await generateQRCode(text);
      setQrCodeUrl(url);
    };
    generate();
  }, [text]);

  return (
    <div className="qr-code">
      {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" /> : 'Generating QR Code...'}
    </div>
  );
};

export default QRCodeDisplay;
