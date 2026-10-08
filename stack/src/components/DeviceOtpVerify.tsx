import { useState, FormEvent } from "react";
import { useAuth } from "@/src/lib/AuthContext";

interface DeviceOtpVerifyProps {
  email: string;
  deviceId: string;
  onVerified?: () => void;
}

export default function DeviceOtpVerify({
  email,
  deviceId,
  onVerified,
}: DeviceOtpVerifyProps) {
  const { VerifyDeviceOtp, loading } = useAuth();
  const [otp, setOtp] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await VerifyDeviceOtp({ email, otp, deviceId });
      onVerified?.();
    } catch (error) {
      // error toast already handled inside VerifyDeviceOtp
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow space-y-4"
        >
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">
              Verify this device
            </h2>
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to {email}. It expires in 10 minutes.
            </p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter code"
            autoFocus
            required
            className="w-full border rounded-md px-3 py-2 text-center tracking-widest text-lg text-black font-semibold placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
