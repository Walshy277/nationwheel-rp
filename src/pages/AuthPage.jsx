import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase, SUPABASE_CONFIGURED } from "../lib/supabase";
import { ensureProfile } from "../lib/uiUtils";
import { card, mkBtn, inp } from "../lib/uiUtils";
import { LOGO_SRC, TURNSTILE_SITE_KEY } from "../lib/constants";
import { SetupModal } from "../components/layout/SetupModal";

export const AuthPage = ({ onAuth, setupRequired }) => {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [username,setUsername]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const [showSetup,setShowSetup]=useState(false);
  const [captchaToken,setCaptchaToken]=useState("");
  const turnstileRef = useRef(null);

  const resetCaptcha = () => {
    setCaptchaToken("");
    turnstileRef.current?.reset();
  };

  const getCaptchaToken = async () => {
    if (!TURNSTILE_SITE_KEY) return "";
    return captchaToken || await turnstileRef.current?.getResponsePromise(10000).catch(() => turnstileRef.current?.getResponse()) || "";
  };

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const currentCaptchaToken = await getCaptchaToken();
      if (TURNSTILE_SITE_KEY && !currentCaptchaToken) {
        setErr(`Complete the captcha before ${mode === "login" ? "signing in" : "registering"}.`);
        setLoading(false);
        return;
      }
      if (mode==="login") {
        const {data,error} = await supabase.auth.signInWithPassword({
          email,
          password:pw,
          options: TURNSTILE_SITE_KEY ? { captchaToken: currentCaptchaToken } : undefined,
        });
        if (error) throw error;
        const nextProfile = await ensureProfile(data.user);
        onAuth(data.user, nextProfile);
      } else {
        const {data,error} = await supabase.auth.signUp({
          email,
          password:pw,
          options: TURNSTILE_SITE_KEY ? { captchaToken: currentCaptchaToken } : undefined,
        });
        if (error) throw error;
        if (data.session?.user) {
          const nextProfile = await ensureProfile(data.session.user, username);
          onAuth(data.session.user, nextProfile);
          return;
        }
        setErr("Account created - check your email, then sign in."); setMode("login"); resetCaptcha();
      }
    } catch(e){
      const msg = mode === "login" && /captcha|captcha_token/i.test(e.message || "")
        ? "Captcha verification failed. Complete the captcha and try signing in again."
        : e.message === "email rate limit exceeded"
        ? "Supabase email limit hit. Wait a bit, or disable email confirmations in Supabase Auth settings while testing."
        : e.message;
      setErr(msg);
      resetCaptcha();
    }
    setLoading(false);
  };

  return (
    <>
      {showSetup && <SetupModal onClose={()=>setShowSetup(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@700;900&display=swap');
        :root { --display:'Inter',Arial,sans-serif; --brand:'Cinzel',Georgia,serif; --body:'Inter',Arial,sans-serif; }
        *,*::before,*::after{box-sizing:border-box;}
        body {
          font-family: var(--body);
          background: #030712;
          background-image: linear-gradient(180deg,#07111f 0%,#030712 42%,#02050b 100%);
          color:#f5f8ff; margin:0;
        }
        input::placeholder,textarea::placeholder{color:#7184a5;}
        input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(246,193,50,0.72)!important;box-shadow:0 0 0 3px rgba(20,96,184,0.16);}
        select option{background:#05070b;color:#f5f8ff;}
        button:hover{opacity:0.8;}
        button:active{transform:scale(0.97);}
        button,input,textarea,select{font:inherit;}
        button{min-height:40px;}
        .auth-shell{min-height:100svh!important;}
        @media (max-width: 560px) {
          .auth-shell{align-items:flex-start!important;padding:1.25rem 0.85rem!important;}
          .auth-panel{max-width:none!important;}
          .auth-logo{width:118px!important;height:118px!important;}
        }
      `}</style>
      <div className="auth-shell" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
        <div className="auth-panel" style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <img className="auth-logo" src={LOGO_SRC} alt="Nationwheel" style={{ width:150, height:150, objectFit:"cover", borderRadius:"50%", border:"2px solid rgba(246,193,50,0.38)", boxShadow:"0 0 0 6px rgba(20,96,184,0.14), 0 22px 55px rgba(0,0,0,0.55)" }} />
            <h1 style={{ fontFamily:"var(--brand)", fontSize:"clamp(2rem,6vw,3rem)", color:"#f5f8ff", margin:"0.9rem 0 0", letterSpacing:"0.08em", textShadow:"0 0 34px rgba(246,193,50,0.22)" }}>NATIONWHEEL</h1>
            <p style={{ color:"#f6c132", marginTop:"0.35rem", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase" }}>Geopolitical Roleplay World</p>
          </div>
          <div style={{ ...card, border:"1px solid rgba(246,193,50,0.22)" }}>
            {setupRequired && (
              <div style={{ border:"1px solid rgba(225,29,29,0.45)", background:"rgba(225,29,29,0.12)", color:"#ffd7d7", borderRadius:6, padding:"0.75rem", marginBottom:"1rem", fontSize:12, lineHeight:1.5 }}>
                Database setup is not finished. Open the Supabase setup guide below, run the SQL files from the repo in Supabase, then refresh this page.
              </div>
            )}
            <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.25rem" }}>
              {["login","signup"].map(m=>(
                <button key={m} onClick={()=>{ if (mode !== m) resetCaptcha(); setMode(m); }} style={{ flex:1, padding:"8px", borderRadius:6, cursor:"pointer", fontWeight:800, fontSize:12, letterSpacing:"0.06em", border:mode===m?"none":"1px solid rgba(20,96,184,0.36)", background:mode===m?"#f6c132":"rgba(255,255,255,0.035)", color:mode===m?"#050505":"#f5f8ff", fontFamily:"inherit" }}>
                  {m==="login"?"SIGN IN":"REGISTER"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {mode==="signup" && <input placeholder="Choose a username" value={username} onChange={e=>setUsername(e.target.value)} style={inp} />}
              <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp} />
              <input placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&submit()} />
              {TURNSTILE_SITE_KEY && (
                <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} onError={()=>setCaptchaToken("")} onExpire={()=>setCaptchaToken("")} options={{ theme:"dark" }} />
              )}
              {err && <p style={{ color:err.startsWith("Account created")?"#2ecc71":"#e74c3c", fontSize:12, margin:0 }}>{err}</p>}
              <button onClick={submit} disabled={loading} style={{ ...mkBtn(), marginTop:"0.4rem", padding:"10px", fontSize:13, letterSpacing:"0.08em" }}>
                {loading?"Loading":mode==="login"?"ENTER THE WORLD":"JOIN THE WORLD"}
              </button>
            </div>
          </div>
          <button onClick={()=>setShowSetup(true)} style={{ marginTop:"0.75rem", ...mkBtn("ghost"), width:"100%", fontSize:11 }}>First time? Supabase setup guide</button>
        </div>
      </div>
    </>
  );
};
