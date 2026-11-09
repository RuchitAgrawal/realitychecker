import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "~/lib/store";

export const meta = () => [
  { title: "RealityChecker — Sign In" },
  { name: "description", content: "Sign in to analyze your resume with AI" },
];

type AuthMode = "signin" | "signup" | "forgot";

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "", color: "#efeee8" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "#cf2d56" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#c08532" };
  if (score <= 3) return { score: 3, label: "Good", color: "#9fbbe0" };
  return { score: 4, label: "Strong", color: "#1f8a65" };
};

const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const { isLoading, isAuthenticated, auth, resumes } = useStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const watchedPassword = watch("password") || "";
  const strength = getPasswordStrength(watchedPassword);

  useEffect(() => {
    let isMounted = true;
    if (!isLoading && isAuthenticated) {
      resumes
        .list()
        .then((list) => {
          if (!isMounted) return;
          if (list.length === 0) {
            navigate("/upload", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        })
        .catch(() => {
          if (isMounted) navigate("/", { replace: true });
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isLoading, isAuthenticated, navigate, resumes]);

  const onSubmit = async (data: AuthFormData) => {
    setServerError("");
    setSuccess("");

    if (mode === "forgot") {
      const err = await auth.resetPassword(data.email);
      if (err) {
        setServerError(err);
      } else {
        setSuccess("Password reset link sent! Check your inbox.");
      }
      return;
    }

    const pwd = data.password ?? "";
    if (pwd.length < 6) {
      setServerError("Password must be at least 6 characters");
      return;
    }

    if (mode === "signin") {
      const err = await auth.signInWithEmail(data.email, pwd);
      if (err) setServerError(err);
    } else {
      const err = await auth.signUpWithEmail(data.email, pwd);
      if (err) {
        setServerError(err);
      } else {
        setConfirmationEmail(data.email);
        reset();
      }
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setServerError("");
    setSuccess("");
  };

  if (confirmationEmail) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e5e0",
            borderRadius: "12px",
            padding: "2.5rem 2rem",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "8px",
              background: "#fafaf7",
              border: "1px solid #e6e5e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1f8a65"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "#26251e",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Check your inbox
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#5a5852",
              lineHeight: 1.5,
              marginBottom: "1.5rem",
            }}
          >
            We sent a verification link to{" "}
            <strong style={{ color: "#26251e", fontWeight: 600 }}>
              {confirmationEmail}
            </strong>
            . Please check your email to activate your account.
          </p>
          {resendStatus && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: resendStatus.startsWith("Failed") ? "#cf2d56" : "#1f8a65",
                marginBottom: "1rem",
              }}
            >
              {resendStatus}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={async () => {
                setResending(true);
                setResendStatus("");
                const err = await auth.resendVerificationEmail(confirmationEmail);
                setResending(false);
                if (err) setResendStatus(`Failed: ${err}`);
                else setResendStatus("Verification email resent!");
              }}
              disabled={resending}
              className="back-button"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {resending ? "Resending…" : "Resend verification email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmationEmail(null);
                switchMode("signin");
              }}
              className="primary-button full"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e6e5e0",
          borderRadius: "12px",
          padding: "2.5rem 2.25rem 2rem",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              width: "2.75rem",
              height: "2.75rem",
              borderRadius: "8px",
              background: "#fafaf7",
              border: "1px solid #e6e5e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#26251e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p
            style={{
              fontSize: "1.35rem",
              fontWeight: 500,
              color: "#26251e",
              letterSpacing: "-0.025em",
              marginBottom: "0.375rem",
            }}
          >
            RealityChecker
          </p>
          <p style={{ fontSize: "0.875rem", color: "#5a5852", lineHeight: 1.5 }}>
            {mode === "signin"
              ? "Sign in to analyze and track your resumes"
              : mode === "signup"
                ? "Create an account to get started"
                : "Enter your email to receive a password reset link"}
          </p>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #efeee8",
            marginBottom: "1.5rem",
          }}
        />

        {/* Google */}
        {mode !== "forgot" && (
          <>
            <button
              className="auth-button"
              style={{
                width: "100%",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.625rem",
                background: "#ffffff",
                border: "1px solid #cfcdc4",
                borderRadius: "8px",
                height: "40px",
                color: "#26251e",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
              onClick={() => auth.signInWithGoogle()}
              disabled={isSubmitting}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid #efeee8" }} />
              <span style={{ fontSize: "0.75rem", color: "#807d72" }}>or</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid #efeee8" }} />
            </div>
          </>
        )}

        {/* Email form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          noValidate
        >
          <div>
            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              {...register("email")}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderColor: errors.email ? "#cf2d56" : undefined,
              }}
            />
            {errors.email && (
              <p
                style={{
                  color: "#cf2d56",
                  fontSize: "0.75rem",
                  textAlign: "left",
                  marginTop: "0.25rem",
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {mode !== "forgot" && (
            <div>
              <input
                type="password"
                placeholder="Password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                {...register("password")}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderColor: errors.password ? "#cf2d56" : undefined,
                }}
              />
              {mode === "signin" && (
                <div style={{ textAlign: "right", marginTop: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#807d72",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {errors.password && (
                <p
                  style={{
                    color: "#cf2d56",
                    fontSize: "0.75rem",
                    textAlign: "left",
                    marginTop: "0.25rem",
                  }}
                >
                  {errors.password.message}
                </p>
              )}
              {mode === "signup" && watchedPassword.length > 0 && (
                <div style={{ marginTop: "0.5rem", textAlign: "left" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      height: "4px",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        style={{
                          flex: 1,
                          borderRadius: "2px",
                          background: strength.score >= step ? strength.color : "#efeee8",
                          transition: "background 0.2s ease",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.7rem",
                    }}
                  >
                    <span style={{ color: "#807d72" }}>Password strength</span>
                    <span style={{ color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {serverError && (
            <p style={{ color: "#cf2d56", fontSize: "0.8125rem", textAlign: "left" }}>
              {serverError}
            </p>
          )}
          {success && (
            <p style={{ color: "#1f8a65", fontSize: "0.8125rem", textAlign: "left" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primary-button full"
            disabled={isSubmitting}
            style={{ marginTop: "0.25rem" }}
          >
            {isSubmitting
              ? "Please wait…"
              : mode === "signin"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: "#5a5852" }}>
          {mode === "forgot" ? (
            <>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f54e00",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: 0,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Back to Sign In
              </button>
            </>
          ) : mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f54e00",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: 0,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f54e00",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: 0,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
};

export default Auth;
