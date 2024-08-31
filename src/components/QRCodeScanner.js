// src/components/QRCodeScanner.js

import React from 'react';
import { useHistory } from 'react-router-dom';
import QrReader from 'react-qr-reader';

const QRCodeScanner = () => {
  const history = useHistory();

  const handleScan = (data) => {
    if (data) {
      // Redirect to the scanned URL or handle the data as needed
      window.location.href = data;
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div className="qr-code-scanner">
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default QRCodeScanner;
