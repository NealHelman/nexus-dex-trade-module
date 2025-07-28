import QRCode from 'qrcode';

const {
  libraries: {
    React: { useState, useEffect }
  }
} = NEXUS;

const QRCodeDisplay = ({ address, size = 200 }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (address) {
      QRCode.toDataURL(address, { width: size }, (error, url) => {
        if (error) {
          console.error('QR Code generation failed:', error);
        } else {
          setQrDataUrl(url);
        }
      });
    }
  }, [address, size]);

  if (!address) return null;

  return (
    <div style={{ textAlign: 'center', marginTop: '10px' }}>
      {qrDataUrl && (
        <img 
          src={qrDataUrl} 
          alt="QR Code for deposit address" 
          style={{ border: '1px solid #ccc', borderRadius: '4px' }}
        />
      )}
    </div>
  );
};

export default QRCodeDisplay;