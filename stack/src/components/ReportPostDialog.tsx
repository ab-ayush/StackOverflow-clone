import { useState } from "react";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import axiosInstance from "@/src/lib/axiosinstance";
import { REPORT_REASONS, ReportReason } from "@/src/lib/reportReasons";

interface ReportPostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportPostDialog({ postId, open, onOpenChange }: ReportPostDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    if (reason === "other" && !details.trim()) {
      toast.info("Please describe the problem");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/post/report/${postId}`, { reason, details });
      toast.success(res.data.message || "Report submitted");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>Report this post</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-600">What's wrong with this post?</p>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  reason === r.value ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>

          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={300}
            placeholder={
              reason === "other" ? "Describe the problem (required)" : "Add details (optional)"
            }
            className="min-h-20 resize-none text-sm text-gray-900"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Sending..." : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}