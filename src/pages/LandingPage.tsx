import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      const current = containerRef.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rx = (y - 0.5) * -10;
      const ry = (x - 0.5) * 10;

      current.style.setProperty("--rx", `${rx}deg`);
      current.style.setProperty("--ry", `${ry}deg`);
      current.style.setProperty("--shadow-x", `${(x - 0.5) * 25}px`);
      current.style.setProperty("--shadow-y", `${(y - 0.5) * 25}px`);
    }

    function onLeave() {
      const current = containerRef.current;
      if (!current) return;
      current.style.setProperty("--rx", `0deg`);
      current.style.setProperty("--ry", `0deg`);
      current.style.setProperty("--shadow-x", `0px`);
      current.style.setProperty("--shadow-y", `12px`);
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="lp-root">
      <div className="lp-card" ref={containerRef}>
        <div className="lp-logo-wrap" aria-hidden>
          <div className="lp-logo-float">
            <img
              src={`/LLogo_light.png`}
              alt="h&h logo"
              className="w-40 h-40 rounded-xl"
            />
          </div>
        </div>

        <div className="lp-content">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <h1 className="lp-welcome">Bienvenue sur E-Varotra</h1>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <button className="lp-cta" onClick={() => navigate("/auth")}>
              Je me connecte
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          .lp-root {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(180deg, #f9fafb 0%, #eef2ff 100%);
              color: #1e293b;
              padding: 32px;
              font-family: Inter, system-ui, sans-serif;
          }

          .lp-card {
              width: 100%;
              max-width: 880px;
              background: rgba(255, 255, 255, 0.68);
              border-radius: 22px;
              padding: 48px;
              display: flex;
              gap: 32px;
              align-items: center;
              backdrop-filter: blur(22px);
              box-shadow:
                calc(var(--shadow-x, 0px)) calc(var(--shadow-y, 12px)) 60px rgba(0, 0, 0, 0.14),
                inset 0 0 0 1px rgba(255, 255, 255, 0.6);
              transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
              transition: box-shadow 200ms ease, transform 200ms ease;
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
              0% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
              100% { transform: translateY(0); }
          }

          .lp-content {
              flex: 1;
          }

          .lp-welcome {
              font-size: 32px;
              margin: 0 0 8px 0;
              letter-spacing: -0.03em;
              color: #1e293b;
              font-weight: 700;
          }

          .lp-cta {
              background: linear-gradient(90deg, #3b82f6, #10b981);
              border: none;
              color: white;
              padding: 14px 22px;
              border-radius: 14px;
              cursor: pointer;
              font-weight: 600;
              box-shadow: 0 8px 22px rgba(16, 185, 129, 0.25);
              transition: transform 160ms ease, box-shadow 160ms ease;
          }

          .lp-cta:hover {
              transform: translateY(-4px) scale(1.02);
              box-shadow: 0 14px 32px rgba(16, 185, 129, 0.35);
          }

          @media (max-width: 720px) {
              .lp-card {
                  flex-direction: column;
                  padding: 32px;
                  gap: 24px;
              }
              .lp-welcome {
                  font-size: 24px;
                  text-align: center;
              }
              .lp-content { text-align: center; }
          }
        `}
      </style>
    </div>
  );
};
