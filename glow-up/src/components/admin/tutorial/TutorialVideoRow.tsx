import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Video, Pencil, Trash2 } from "lucide-react";

interface TutorialVideo {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  vimeo_embed_url: string;
  sort_order: number;
  status: string;
  created_by: string;
  menu_section: string | null;
}

interface Props {
  vid: TutorialVideo;
  vidIdx: number;
  catId: string;
  dragOverVidIdx: number | null;
  dragVidCatId: React.RefObject<string | null>;
  onDragStart: (catId: string, idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent, catId: string, idx: number) => void;
  onDragEnd: () => void;
  onToggleStatus: (vid: TutorialVideo) => void;
  onEdit: (vid: TutorialVideo) => void;
  onDelete: (vid: TutorialVideo) => void;
}

export function TutorialVideoRow({
  vid, vidIdx, catId, dragOverVidIdx, dragVidCatId,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onToggleStatus, onEdit, onDelete,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg bg-background border border-border/30 transition-all group/vid ${dragOverVidIdx === vidIdx && dragVidCatId.current === catId ? "ring-2 ring-primary/40" : ""}`}
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(catId, vidIdx); }}
      onDragOver={(e) => { e.stopPropagation(); onDragOver(e, vidIdx); }}
      onDrop={(e) => { e.stopPropagation(); onDrop(e, catId, vidIdx); }}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 cursor-grab active:cursor-grabbing" />
      <Video className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{vid.title}</p>
          {vid.menu_section && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              ? {vid.menu_section}
            </Badge>
          )}
        </div>
        {vid.description && <p className="text-xs text-muted-foreground truncate">{vid.description}</p>}
      </div>
      <Switch
        checked={vid.status === "published"}
        onCheckedChange={() => onToggleStatus(vid)}
      />
      <div className="flex items-center gap-1 opacity-0 group-hover/vid:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(vid)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(vid)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
