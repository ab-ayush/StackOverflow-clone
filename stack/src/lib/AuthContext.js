import { useState } from "react";
import { createContext } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { useContext } from "react";
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
      toast.success("Signup Successful");
    } catch (error) {
      const msg = error.response?.data.message || "Signup failed";
      seterror(msg);
      toast.error(msg);
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
        // don't log in yet — caller (login page) needs to show OTP screen
        return { requiresOtp: true, deviceId: res.data.deviceId };
      }

      const { data, token } = res.data;
      localStorage.setItem("user", JSON.stringify({ ...data, token }));
      setUser(data);
      toast.success("Login Successful");
      return { requiresOtp: false };
    } catch (error) {
      const msg = error.response?.data.message || "Login failed";
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
      toast.success("Device verified, logged in.");
    } catch (error) {
      const msg = error.response?.data.message || "Verification failed";
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
      toast.success(res.data.message || "New password sent to your email");
    } catch (error) {
      const msg = error.response?.data.message || "Something went wrong";
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
      toast.success(res.data.message || "Password changed successfully");
    } catch (error) {
      const msg = error.response?.data.message || "Something went wrong";
      seterror(msg);
      toast.error(msg);
    } finally {
      setloading(false);
    }
  };

  const Logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("Logged out");
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
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);