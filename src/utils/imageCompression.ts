import imageCompression from 'browser-image-compression';

export interface CompressedImageResult {
  file: File;
  preview: string;
}

export const compressImage = async (file: File): Promise<CompressedImageResult> => {
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1024, // Maximum width or height
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    quality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const preview = URL.createObjectURL(compressedFile);
    
    return {
      file: compressedFile,
      preview
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Falha ao comprimir imagem');
  }
};

export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB antes da compressão
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato de arquivo não suportado. Use JPEG, PNG ou WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 10MB.');
  }
  
  return true;
};