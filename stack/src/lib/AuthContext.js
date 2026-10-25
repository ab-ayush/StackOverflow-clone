import { useState } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
import { tr, trFor, apiErrorMessage, apiSuccessMessage } from "../i18n/runtime";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState(null);

  const Signup = async ({ name, email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/signup", {
        name,
        email,
        password,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success(trFor(data.preferredLanguage, "auth.signupSuccess"));
      return true;
    } catch (error) {
      const msg = apiErrorMessage(error, "auth.signupFailed");
      seterror(msg);
      toast.error(msg);
      return false;
    } finally {
      setloading(false);
    }
  };

  const Login = async ({ email, password }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/login", {
        email,
        password,
      });

      if (res.data.requiresOtp) {
        // don't log in yet, the login page shows the code screen
        return { requiresOtp: true, deviceId: res.data.deviceId };
      }

      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success(trFor(data.preferredLanguage, "auth.loginSuccess"));
      return { requiresOtp: false };
    } catch (error) {
      const msg = apiErrorMessage(error, "auth.loginFailed");
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const VerifyDeviceOtp = async ({ email, otp, deviceId }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/verify-device-otp", {
        email,
        otp,
        deviceId,
      });
      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success(trFor(data.preferredLanguage, "auth.deviceVerified"));
    } catch (error) {
      const msg = apiErrorMessage(error, "auth.verificationFailed");
      seterror(msg);
      toast.error(msg);
      throw error;
    } finally {
      setloading(false);
    }
  };

  const ForgotPassword = async ({ email }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.post("/user/forgot-password", {
        email,
      });
      toast.success(apiSuccessMessage(res.data.message, "server.newPasswordSent"));
    } catch (error) {
      const msg = apiErrorMessage(error);
      seterror(msg);
      toast.error(msg);
    } finally {
      setloading(false);
    }
  };

  const ChangePassword = async ({ oldPassword, newPassword }) => {
    setloading(true);
    seterror(null);
    try {
      const res = await axiosInstance.patch(
        "/user/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
          },
        }
      );
      toast.success(apiSuccessMessage(res.data.message, "server.passwordChanged"));
    } catch (error) {
      const msg = apiErrorMessage(error);
      seterror(msg);
      toast.error(msg);
    } finally {
      setloading(false);
    }
  };

  const Logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info(tr("auth.loggedOut"));
  };

  const updateUser = (changes) => {
    setUser((prev) => (prev ? { ...prev, ...changes } : prev));
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      if (stored) {
        localStorage.setItem("user", JSON.stringify({ ...stored, ...changes }));
      }
    } catch (error) {
      // a damaged saved entry is simply left alone
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        Signup,
        Login,
        VerifyDeviceOtp,
        Logout,
        ForgotPassword,
        ChangePassword,
        updateUser,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);