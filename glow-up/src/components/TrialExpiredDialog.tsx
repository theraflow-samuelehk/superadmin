import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

export function TrialExpiredDialog() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md" onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-destructive" />
          </div>
          <AlertDialogTitle className="font-serif text-xl">
            {t("pricing.trialExpired")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {t("pricing.trialExpiredMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={() => navigate("/pricing")}
          >
            {t("pricing.choosePlan")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
