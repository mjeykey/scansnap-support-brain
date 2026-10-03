// Generic device/model handling: no manufacturer or model registry is embedded here.

export function detectModelFromText() {
  return {
    detected: null,
    confidence: 'NONE',
    source: 'manual',
    raw: '',
  };
}

export default detectModelFromText;
