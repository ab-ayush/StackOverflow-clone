import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface BillingDetails {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstin: string;
}

export const EMPTY_BILLING: BillingDetails = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  gstin: "",
};

export function useBilling(enabled: boolean) {
  const [billing, setBilling] = useState<BillingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const load = async () => {
      try {
        const res = await axiosInstance.get("/subscription/billing");
        setBilling(res.data.data);
      } catch (error) {
        console.log(error);
        toast.error(tr("billing.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enabled]);

  const save = useCallback(async (values: BillingDetails) => {
    setSaving(true);
    try {
      const res = await axiosInstance.put("/subscription/billing", values);
      setBilling(res.data.data);
      toast.success(tr("billing.saved"));
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, "billing.saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { billing, loading, saving, save };
}