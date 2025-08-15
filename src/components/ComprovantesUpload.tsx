import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { compressImage, validateImageFile, type CompressedImageResult } from '@/utils/imageCompression';

interface ComprovantesUploadProps {
  onImagesChange: (images: CompressedImageResult[]) => void;
  maxImages?: number;
  className?: string;
}

export const ComprovantesUpload = ({ 
  onImagesChange, 
  maxImages = 5,
  className = '' 
}: ComprovantesUploadProps) => {
  const [images, setImages] = useState<CompressedImageResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite de imagens",
        description: `Máximo ${maxImages} imagens permitidas`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newImages: CompressedImageResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        validateImageFile(file);
        
        // Compress image
        const compressedResult = await compressImage(file);
        newImages.push(compressedResult);
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);

      toast({
        title: "Sucesso",
        description: `${newImages.length} imagem(ns) adicionada(s) com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar imagens",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    
    // Cleanup preview URL
    URL.revokeObjectURL(images[index].preview);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Comprovantes</label>
        <p className="text-xs text-muted-foreground">
          Adicione fotos dos comprovantes de pagamento (máximo {maxImages} imagens)
        </p>
      </div>

      {/* Upload Area */}
      <Card 
        className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileInput}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8">
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground mb-2">
            <span className="font-medium">Clique para selecionar</span> ou arraste imagens aqui
          </p>
          <p className="text-xs text-muted-foreground text-center">
            JPEG, PNG ou WebP (máx. 10MB cada)
          </p>
          {uploading && (
            <p className="text-xs text-primary mt-2">Processando imagens...</p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={image.preview}
                  alt={`Comprovante ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                <FileImage className="h-3 w-3 inline mr-1" />
                {(image.file.size / 1024).toFixed(0)}KB
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length >= maxImages && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} imagens atingido
        </p>
      )}
    </div>
  );
};