import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CompressedImageResult } from '@/utils/imageCompression';

interface UploadResult {
  url: string;
  path: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (
    imageResult: CompressedImageResult,
    folder: string = 'comprovantes'
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      
      // Generate unique file name
      const fileExt = imageResult.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, imageResult.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload da imagem",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (
    images: CompressedImageResult[],
    folder: string = 'comprovantes'
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const image of images) {
      const result = await uploadImage(image, folder);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('comprovantes')
        .remove([path]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar imagem",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    uploading
  };
};