import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2, Award, ImagePlus, ZoomIn, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface CertificateImagesUploaderProps {
  userId: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export function CertificateImagesUploader({ userId, images, onChange }: CertificateImagesUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Ошибка",
            description: `${file.name} — не является изображением`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Ошибка",
            description: `${file.name} — превышает 5 МБ`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const filePath = `${userId}/certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error("Certificate upload error:", uploadError);
          toast({
            title: "Ошибка загрузки",
            description: uploadError.message,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        newImages.push(`${urlData.publicUrl}?t=${Date.now()}`);
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({
          title: "Загружено",
          description: `${newImages.length} ${newImages.length === 1 ? "файл" : "файлов"}. Не забудьте сохранить.`,
        });
      }
    } catch (error: any) {
      console.error("Certificate upload error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить изображения",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (index: number) => {
    const url = images[index];
    // Try to extract storage path and delete
    try {
      const bucketUrl = supabase.storage.from("avatars").getPublicUrl("").data.publicUrl;
      const path = url.split(bucketUrl.replace("/object/public/avatars/", "/object/public/avatars/"))[1]?.split("?")[0];
      if (path) {
        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        await supabase.storage.from("avatars").remove([cleanPath]);
      }
    } catch {
      // Ignore storage deletion errors
    }

    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    toast({
      title: "Изображение удалено",
      description: "Не забудьте сохранить изменения",
    });
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Award className="h-4 w-4" />
        Фото сертификатов и дипломов
      </Label>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border bg-muted aspect-[4/3]"
            >
              <img
                src={url}
                alt={`Сертификат ${index + 1}`}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setPreviewImage(url)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewImage(url)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {isUploading ? "Загрузка..." : "Добавить изображения"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG или WebP. До 5 МБ на файл. Можно выбрать несколько.
        </p>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Просмотр сертификата</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              alt="Просмотр сертификата"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
