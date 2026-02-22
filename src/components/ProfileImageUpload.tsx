import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Trash2, Building2, User } from "lucide-react";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  label?: string;
  isCompany?: boolean;
}

const ProfileImageUpload = ({
  userId,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label = "Imagen de Perfil / Logo",
  isCompany = true,
}: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten imágenes JPG, PNG, WebP o SVG.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/profile.${ext}`;

      // Remove old image if exists
      await supabase.storage.from("images").remove([filePath]);

      const { error } = await supabase.storage
        .from("images")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      // Append timestamp to bust cache
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      onImageUploaded(publicUrl);

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error al subir",
        description: error.message || "No se pudo subir la imagen.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      // List and remove all files in the user's profile folder
      const { data: files } = await supabase.storage
        .from("images")
        .list(userId, { limit: 10 });

      if (files && files.length > 0) {
        const profileFiles = files
          .filter((f) => f.name.startsWith("profile."))
          .map((f) => `${userId}/${f.name}`);
        if (profileFiles.length > 0) {
          await supabase.storage.from("images").remove(profileFiles);
        }
      }

      onImageRemoved();
      toast({ title: "Imagen eliminada" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="md:col-span-2">
      <Label className="font-sans text-sm">{label}</Label>
      <div className="mt-2 flex items-center gap-5">
        <Avatar className="h-20 w-20 border-2 border-muted">
          <AvatarImage src={currentImageUrl || undefined} alt="Perfil" />
          <AvatarFallback className="bg-muted">
            {isCompany ? (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Subiendo..." : "Subir imagen"}
            </Button>
            {currentImageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={removing}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            JPG, PNG, WebP o SVG. Máximo 5MB.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

export default ProfileImageUpload;
