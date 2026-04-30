import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface TreatmentPhoto {
  id: string;
  user_id: string;
  client_id: string;
  appointment_id: string | null;
  photo_url: string;
  photo_type: string;
  notes: string | null;
  taken_at: string;
  gdpr_consent: boolean;
  deleted_at: string | null;
  created_at: string;
}

export function useTreatmentPhotos(clientId: string | null) {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["treatment_photos", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_photos")
        .select("*")
        .eq("client_id", clientId!)
        .is("deleted_at", null)
        .order("taken_at", { ascending: false });
      if (error) throw error;
      return data as TreatmentPhoto[];
    },
    enabled: !!user && !!clientId,
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ clientId, file, photoType, notes, gdprConsent, takenAt }: {
      clientId: string;
      file: File;
      photoType: string;
      notes?: string;
      gdprConsent: boolean;
      takenAt?: string;
    }) => {
      const ext = file.name.split(".").pop();
      const path = `${tenantUserId!}/${clientId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("treatment-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("treatment-photos")
        .getPublicUrl(path);

      // Since bucket is private, use signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("treatment-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signedError) throw signedError;

      const { data, error } = await supabase
        .from("treatment_photos")
        .insert({
          user_id: tenantUserId!,
          client_id: clientId,
          photo_url: path,
          photo_type: photoType,
          notes: notes || null,
          gdpr_consent: gdprConsent,
          taken_at: takenAt || new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment_photos"] });
      toast.success(t("photos.uploaded"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photo: TreatmentPhoto) => {
      // Soft delete
      const { error } = await supabase
        .from("treatment_photos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment_photos"] });
      toast.success(t("photos.deleted"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Generate signed URLs for photos
  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("treatment-photos")
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error) return "";
    return data.signedUrl;
  };

  return {
    photos: query.data ?? [],
    isLoading: query.isLoading,
    uploadPhoto,
    deletePhoto,
    getSignedUrl,
  };
}
