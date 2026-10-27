import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";
import type { PaidPlanId } from "./plans";

export interface PaymentRecord {
  _id: string;
  plan: PaidPlanId;
  amount: number; // paise
  currency: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  invoiceNumber: string | null;
}

export function usePayments(enabled: boolean) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/subscription/payments");
      setPayments(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error(tr("payments.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  const download = useCallback(
    async (payment: PaymentRecord) => {
      setBusyId(payment._id);
      try {
        const res = await axiosInstance.get(`/subscription/invoices/${payment._id}/download`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${payment.invoiceNumber || "invoice"}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        // an older payment may have just received its invoice number
        if (!payment.invoiceNumber) await refresh();
      } catch (error) {
        console.log(error);
        toast.error(tr("payments.downloadFailed"));
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  const emailInvoice = useCallback(
    async (payment: PaymentRecord) => {
      setBusyId(payment._id);
      try {
        await axiosInstance.post(`/subscription/invoices/${payment._id}/resend`);
        toast.success(tr("payments.emailSent"));
        await refresh();
      } catch (error) {
        toast.error(apiErrorMessage(error, "payments.emailFailed"));
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  return { payments, loading, busyId, download, emailInvoice };
}