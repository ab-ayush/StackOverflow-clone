import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import ModerationButton from "./ModerationButton";
import axiosInstance from "@/src/lib/axiosinstance";
import { REPORT_REASONS, ReportReason } from "@/src/lib/reportReasons";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { apiErrorMessage } from "@/src/i18n/runtime";

interface ReportPostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportPostDialog({ postId, open, onOpenChange }: ReportPostDialogProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    if (reason === "other" && !details.trim()) {
      toast.info(t("report.describeProblem"));
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(`/post/report/${postId}`, { reason, details });
      toast.success(t("report.thanks"));
      onOpenChange(false);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, "report.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600">{t("report.question")}</p>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all duration-150 ${
                  reason === r.value
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-red-600"
                />
                {t(r.labelKey)}
              </label>
            ))}
          </div>

          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={300}
            placeholder={
              reason === "other"
                ? t("report.detailsRequiredPlaceholder")
                : t("report.detailsPlaceholder")
            }
            className="min-h-20 resize-none text-sm text-gray-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <ModerationButton variant="neutral" size="md" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </ModerationButton>
          <ModerationButton
            variant="danger"
            size="md"
            icon={<Flag className="w-4 h-4" />}
            loading={submitting}
            disabled={!reason}
            onClick={handleSubmit}
          >
            {t("report.submit")}
          </ModerationButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}