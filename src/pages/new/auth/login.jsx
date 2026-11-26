import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api, LOGOUT_REASON_KEY, writeSession } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { requestAccountRefresh } from "@/lib/refresh-account";
import SocialButtons from "@/components/social-buttons";

function UserIcon() {
  return (
    <svg
      className="size-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.5" />
      <path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="size-6 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.62461 5.0275V4.0002C2.62461 2.13623 4.13565 0.625195 5.99961 0.625195C7.86357 0.625195 9.37461 2.13623 9.37461 4.0002V5.0275C9.93199 5.06913 10.295 5.17422 10.5603 5.43954C10.9996 5.87888 10.9996 6.58598 10.9996 8.0002C10.9996 9.41441 10.9996 10.1215 10.5603 10.5609C10.1209 11.0002 9.41382 11.0002 7.99961 11.0002H3.99961C2.5854 11.0002 1.87829 11.0002 1.43895 10.5609C0.999609 10.1215 0.999609 9.41441 0.999609 8.0002C0.999609 6.58598 0.999609 5.87888 1.43895 5.43954C1.70426 5.17422 2.06723 5.06913 2.62461 5.0275ZM3.37461 4.0002C3.37461 2.55045 4.54986 1.3752 5.99961 1.3752C7.44936 1.3752 8.62461 2.55045 8.62461 4.0002V5.00198C8.43311 5.0002 8.22537 5.0002 7.99961 5.0002H3.99961C3.77385 5.0002 3.56612 5.0002 3.37461 5.00198V4.0002ZM5.99961 6.6252C6.20672 6.6252 6.37461 6.79309 6.37461 7.0002V9.0002C6.37461 9.2073 6.20672 9.3752 5.99961 9.3752C5.7925 9.3752 5.62461 9.2073 5.62461 9.0002V7.0002C5.62461 6.79309 5.7925 6.6252 5.99961 6.6252Z"
        fill="white"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="size-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2L4 6v6c0 4.42 3.44 8.57 8 9.92C16.56 20.57 20 16.42 20 12V6l-8-4z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  );
}

function EyeIcon({ visible }) {
  // Password shown → "eye-off" (slashed) icon in gold; hidden → open eye.
  const stroke = visible ? "var(--c-gold)" : "white";
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {visible ? (
        <>

         <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="1.5" />
          
        </>
      ) : (
        <>
         <path
            d="M10.58 10.58A3 3 0 0 0 13.42 13.42M7.37 7.37C5.23 8.74 3.73 10.74 3 12c1.73 3.11 5 6 9 6a9.4 9.4 0 0 0 4.63-1.37M9 5.07A9.2 9.2 0 0 1 12 5c4 0 7.27 2.89 9 6a13.5 13.5 0 0 1-1.67 2.68"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M3 3l18 18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function ChevronDownIcon({ open }) {
  return (
    <svg
      className={`size-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Field({ icon, children, className = "" }) {
  return (
    <div
      className={`flex h-[52px] items-center gap-3 rounded-md border border-gold bg-[#181818] px-4 ${className}`}
    >
      {icon}
      {children}
    </div>
  );
}

function PasswordField({ id, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field icon={<LockIcon />}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="ml-2 shrink-0"
      >
        <EyeIcon visible={visible} />
      </button>
    </Field>
  );
}

function CheckBox({
  checked,
  onChange,
  children,
  className = "",
  boxClassName = "",
}) {
  return (
    <label
      className={`flex cursor-pointer select-none gap-3 font-poppins text-white ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`flex size-[19px] shrink-0 items-center justify-center rounded-[3px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold ${checked ? "border border-gold-dark bg-linear-to-b from-gold-light to-gold-dark text-on-gold" : boxClassName}`}
      >
        {checked && (
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "min-w-0 flex-1 border-0 bg-transparent font-poppins text-[13px] leading-[18px] text-white caret-gold outline-none placeholder:text-ink-muted autofill:shadow-[inset_0_0_0_1000px_#181818] autofill:[-webkit-text-fill-color:#fff] autofill:[transition:background-color_9999s]";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const searchParams = new URLSearchParams(location.search);
  const mode =
    location.pathname.endsWith("/signup") ||
    searchParams.get("mode") === "register"
      ? "register"
      : "login";
  const [form, setForm] = useState(() => ({
    username: "",
    password: "",
    confirm_password: "",
    phone: "",
    first_name: "",
    last_name: "",
    referral_code: searchParams.get("referral") || "",
  }));
  const [remember, setRemember] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showReferral, setShowReferral] = useState(() =>
    Boolean(searchParams.get("referral")),
  );
  const [loading, setLoading] = useState(false);
  // Set when this device was signed out by a login on another device.
  const [error, setError] = useState(() => {
    try {
      return sessionStorage.getItem(LOGOUT_REASON_KEY) || "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
    } catch {
      // Storage blocked: nothing was saved.
    }
  }, []);

  // Every login lands on the home page.
  useEffect(() => {
    if (isLoggedIn) navigate("/", { replace: true });
    else if (location.search && mode === "login") navigate("/login", { replace: true });
  }, [isLoggedIn, location.search, mode, navigate]);

  const update = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }));
  const canSubmit = useMemo(() => {
    if (
      loading ||
      !form.username.trim() ||
      !form.password
    )
      return false;
    if (mode === "login") return true;
    return Boolean(
      form.confirm_password &&
      form.first_name.trim() &&
      form.last_name.trim() &&
      form.phone.trim() &&
      agreed,
    );
  }, [form, loading, mode, agreed]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (mode === "register" && form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? {
              username: form.username.trim(),
              password: form.password,
              remember,
            }
          : {
              username: form.username.trim(),
              password: form.password,
              phone: `+880${form.phone.trim().replace(/^0+/, "")}`,
              full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
              referral_code: form.referral_code.trim() || undefined,
            };
      const response = await api.post(path, payload, { auth: false });
      const session = {
        user: response.data.user,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
      // The login response already carries the wallet, so enter the site
      // right away and let the live balance/exposure refresh in the background.
      writeSession(session);
      dispatch(setSession(session));
      navigate("/", { replace: true });
      requestAccountRefresh();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to continue. Please check your details.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-4">
      <form onSubmit={submit} className="flex flex-col" noValidate>
        <h1 className="mb-4 font-poppins text-[17px] font-bold leading-tight text-white">
          {mode === "login" ? "Sign In" : "Sign Up"}
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 font-poppins text-xs text-red-200"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Field icon={<UserIcon />}>
            <input
              id="username"
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              placeholder="Username"
              required
              className={inputClassName}
            />
          </Field>

          <PasswordField
            id="password"
            value={form.password}
            onChange={update("password")}
            placeholder="Password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />

          {mode === "register" && (
            <>
              <PasswordField
                id="confirm_password"
                value={form.confirm_password}
                onChange={update("confirm_password")}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <Field icon={<UserIcon />}>
                <input
                  id="first_name"
                  value={form.first_name}
                  onChange={update("first_name")}
                  autoComplete="given-name"
                  placeholder="First Name"
                  required
                  className={inputClassName}
                />
              </Field>
              <Field icon={<UserIcon />}>
                <input
                  id="last_name"
                  value={form.last_name}
                  onChange={update("last_name")}
                  autoComplete="family-name"
                  placeholder="Last Name"
                  required
                  className={inputClassName}
                />
              </Field>
              <Field
                icon={
                  <span className="font-poppins text-[13px] font-medium text-white">
                    +880
                  </span>
                }
                className="gap-0"
              >
                <span
                  className="mx-3 h-5 w-px shrink-0 bg-line-strong"
                  aria-hidden="true"
                />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value.replace(/\D/g, "").slice(0, 11),
                    }))
                  }
                  autoComplete="tel-national"
                  placeholder="Contact Number"
                  required
                  className={`${inputClassName} text-[14px]`}
                />
              </Field>
            </>
          )}
        </div>

        {mode === "login" ? (
          <CheckBox
            checked={remember}
            onChange={setRemember}
            className="mt-3 items-center text-[14px] leading-[21px] tracking-[-0.28px]"
            boxClassName="bg-white"
          >
            <span>Remember me</span>
          </CheckBox>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowReferral((current) => !current)}
              aria-expanded={showReferral}
              className="mt-3 flex items-center gap-3 self-start font-poppins text-[14px] font-semibold text-white"
            >
              Enter Referral / Promo Code
              <ChevronDownIcon open={showReferral} />
            </button>
            {showReferral && (
              <Field icon={<ShieldIcon />} className="mt-2.5">
                <input
                  id="referral_code"
                  value={form.referral_code}
                  onChange={update("referral_code")}
                  placeholder="Referral / Promo Code"
                  className={inputClassName}
                />
              </Field>
            )}
            <CheckBox
              checked={agreed}
              onChange={setAgreed}
              className="mt-4 items-start text-[13px] leading-[19px]"
              boxClassName="mt-0.5 bg-white"
            >
              <span>
                I agree to the User Agreement &amp; confirm I am at least 18
                years old
              </span>
            </CheckBox>
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${mode === "login" ? "mt-10" : "mt-6"} flex h-[52px] w-full items-center justify-center rounded-md bg-gold font-poppins text-[14px] font-semibold tracking-[-0.14px] text-on-gold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>

      {mode === "login" ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex w-full items-center gap-4">
            <span className="h-px flex-1 bg-gold/40" />
            <span className="whitespace-nowrap font-poppins text-[15px] font-semibold text-gold">
              Contact Admin
            </span>
            <span className="h-px flex-1 bg-gold/40" />
          </div>
          <SocialButtons />
          <p className="font-poppins text-[13px] text-ink-soft">
            Don&apos;t have an account?{" "}
            <Link to="/login" className="font-semibold text-gold">
              Sign Up
            </Link>
          </p>
        </div>
      ) : (
        <p className="mt-5 text-center font-poppins text-[13px] text-ink-soft">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold">
            Login
          </Link>
        </p>
      )}
    </div>
  );
}
