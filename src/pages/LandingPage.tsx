import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRoles } from "../hooks/useRoles";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rolesRes = useRoles();
  const role = typeof rolesRes === "string" ? rolesRes : rolesRes?.role ?? null;

  // Interactive tilt: set CSS variables on container based on mouse position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      const rect = el?.getBoundingClientRect();
      const x = (e.clientX - rect?.left) / rect?.width;
      const y = (e.clientY - rect?.top) / rect?.height;
      // range -1 .. 1
      const rx = (y - 0.5) * -12;
      const ry = (x - 0.5) * 12;
      el?.style.setProperty("--rx", `${rx}deg`);
      el?.style.setProperty("--ry", `${ry}deg`);
      el?.style.setProperty("--shadow-x", `${(x - 0.5) * 20}px`);
      el?.style.setProperty("--shadow-y", `${(y - 0.5) * 20}px`);
    }
    function onLeave() {
      el?.style.setProperty("--rx", `0deg`);
      el?.style.setProperty("--ry", `0deg`);
      el?.style.setProperty("--shadow-x", `0px`);
      el?.style.setProperty("--shadow-y", `6px`);
    }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
	}, []);

	function goToOwnPage() {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "liver":
        navigate("/seller");
        break;
      case "deliver":
        navigate("/delivery");
        break;
      default: {
        navigate(`/auth`);
        break;
      }
    }
  }

  return (
    <div className="lp-root">
      <div className="lp-card" ref={containerRef}>
        <div className="lp-logo-wrap" aria-hidden>
          <div className="lp-logo-float">
            <img
              src={`/LLogo_dark.png`}
              alt="h&h logo"
              className={`w-40 h-40 rounded-lg`}
            />
          </div>
        </div>

        <div className="lp-content">
          <h1 className="lp-welcome">Bienvenue sur Lamody H&H</h1>
          <p className="lp-role">
            Rôle: <strong>{role}</strong>
          </p>

          {role === "visitor" ? (
            <p className="lp-wait">
              Attendez que l'administrateur vous assigne une role
            </p>
          ) : (
            <button className="lp-cta" onClick={goToOwnPage}>
              Aller à ma page
            </button>
          )}
        </div>
      </div>

      <style>{`
                .lp-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(180deg, #0f172a 0%, #07102a 60%);
                    color: #e6eef8;
                    padding: 32px;
                    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
                }

                .lp-card {
                    width: 100%;
                    max-width: 880px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
                    border-radius: 20px;
                    padding: 40px;
                    display: flex;
                    gap: 28px;
                    align-items: center;
                    box-shadow: calc(var(--shadow-x, 0px)) calc(var(--shadow-y, 6px)) 40px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.02);
                    transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
                    transition: box-shadow 180ms ease, transform 180ms ease;
                }

                .lp-logo-wrap {
                    flex: 0 0 160px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .lp-logo-float {
                    animation: float 4s ease-in-out infinite;
                    will-change: transform;
                }

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }

                .lp-content {
                    flex: 1;
                }

                .lp-welcome {
                    font-size: 28px;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                    color: #f8fafc;
                }

                .lp-role {
                    margin: 0 0 6px 0;
                    color: #cfe8ff;
                    opacity: 0.95;
                }

                .lp-specs {
                    margin: 0 0 18px 0;
                    color: #a9d0ff;
                }

                .lp-wait {
                    margin-top: 12px;
                    color: #ffd6a5;
                    font-weight: 600;
                }

                .lp-cta {
                    background: linear-gradient(90deg, #10b981, #3b82f6);
                    border: none;
                    color: white;
                    padding: 12px 18px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    box-shadow: 0 6px 18px rgba(59,130,246,0.24);
                    transition: transform 160ms ease, box-shadow 160ms ease;
                }

                .lp-cta:hover {
                    transform: translateY(-4px) scale(1.01);
                    box-shadow: 0 16px 28px rgba(59,130,246,0.28);
                }

                @media (max-width: 720px) {
                    .lp-card {
                        flex-direction: column;
                        padding: 28px;
                        gap: 18px;
                    }
                    .lp-logo-wrap {
                        margin-top: 4px;
                    }
                    .lp-welcome {
                        font-size: 22px;
                        text-align: center;
                    }
                    .lp-content { text-align: center; }
                }
            `}</style>
    </div>
  );
};
