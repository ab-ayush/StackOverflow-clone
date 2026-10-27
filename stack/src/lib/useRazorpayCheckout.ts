import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";
import type { PaidPlanId } from "./plans";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadScript = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export function useRazorpayCheckout(onPaid: () => void | Promise<void>) {
  const [busyPlan, setBusyPlan] = useState<PaidPlanId | null>(null);

  const pay = useCallback(
    async (plan: PaidPlanId, planName: string) => {
      if (busyPlan) return;
      setBusyPlan(plan);

      try {
        const loaded = await loadScript();
        if (!loaded) {
          toast.error(tr("checkout.scriptFailed"));
          setBusyPlan(null);
          return;
        }

        const orderRes = await axiosInstance.post("/subscription/order", { plan });
        const order = orderRes.data.data;

        const razorpay = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "CodeQuest",
          description: tr("checkout.description", { plan: planName }),
          prefill: order.prefill,
          theme: { color: "#2563eb" },
          modal: {
            ondismiss: () => {
              toast.info(tr("checkout.cancelled"));
              setBusyPlan(null);
            },
          },
          handler: async (response: any) => {
            try {
              toast.info(tr("checkout.verifying"));
                            const verifyRes = await axiosInstance.post("/subscription/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success(tr("checkout.success", { plan: planName }));
              const invoiceNumber = verifyRes.data?.data?.invoiceNumber;
              if (invoiceNumber) {
                toast.info(tr("checkout.invoiceSent", { number: invoiceNumber }));
              }
              await onPaid();
            } catch (error) {
              toast.error(apiErrorMessage(error, "checkout.verifyFailed"));
            } finally {
              setBusyPlan(null);
            }
          },
        });

        razorpay.on("payment.failed", () => {
          toast.error(tr("checkout.failed"));
        });
        razorpay.open();
      } catch (error) {
        toast.error(apiErrorMessage(error, "checkout.loadFailed"));
        setBusyPlan(null);
      }
    },
    [busyPlan, onPaid]
  );

  return { pay, busyPlan };
}