const test = async () => {
  const qrcode = await import('qrcode');
  console.log('qrcode.toDataURL type:', typeof qrcode.toDataURL);
  if (!qrcode.toDataURL) {
    console.log('default.toDataURL type:', typeof (qrcode as any).default?.toDataURL);
  }
}
test();
