/**
 * 🚨 Error Messages Constants
 * 
 * Multilingual error messages for file uploads and other operations
 */

// 📄 UPLOAD ERROR MESSAGES - Multilingual
export const getUploadErrorMessages = (language) => {
  const messages = {
    'cs': {
      pdfOnly: 'Podporované formáty: PDF, Word, Text, Obrázky (PNG/JPG)',
      fileTooBig: 'Soubor je příliš velký. Maximum je 15MB.',
      dailyLimit: (remainingMB) => `Překročen denní limit 20MB. Zbývá ${remainingMB}MB do půlnoci.`,
      processing: 'Zpracovávám dokument...',
      preparing: 'Připravuji dokument pro AI...',
      success: 'Dokument je připraven pro AI!'
    },
    'en': {
      pdfOnly: 'Supported formats: PDF, Word, Text, Images (PNG/JPG)',
      fileTooBig: 'File is too large. Maximum is 15MB.',
      dailyLimit: (remainingMB) => `Daily limit of 20MB exceeded. ${remainingMB}MB remaining until midnight.`,
      processing: 'Processing document...',
      preparing: 'Preparing document for AI...',
      success: 'Document is ready for AI!'
    },
    'ro': {
      pdfOnly: 'Formate acceptate: PDF, Word, Text, Imagini (PNG/JPG)',
      fileTooBig: 'Fișierul este prea mare. Maximul este 15MB.',
      dailyLimit: (remainingMB) => `Limita zilnică de 20MB a fost depășită. ${remainingMB}MB rămase până la miezul nopții.`,
      processing: 'Procesez documentul...',
      preparing: 'Pregătesc documentul pentru AI...',
      success: 'Documentul este gata pentru AI!'
    }
  };
  return messages[language] || messages['cs'];
};