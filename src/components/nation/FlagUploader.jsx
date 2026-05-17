import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { mkBtn } from "../../lib/uiUtils";

export const FlagUploader = ({ nationId, currentUrl, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const upload = async (file) => {
    if (!file || !nationId) return;
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${nationId}.${ext}`;
    const { error } = await supabase.storage.from("flags").upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = supabase.storage.from("flags").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("nations").update({ flag_url: url }).eq("id", nationId);
      onUploaded(url);
    }
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
      {currentUrl && <img src={currentUrl} alt="Nation flag" style={{ width:96, height:64, objectFit:"cover", borderRadius:4, border:"1px solid rgba(212,175,55,0.2)" }} />}
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} style={{ ...mkBtn("ghost"), fontSize:11, alignSelf:"flex-start" }}>
        {uploading?"Uploading":"Upload JPEG/PNG Flag"}
      </button>
      <p style={{ margin:0, fontSize:10, color:"#8fa0bd" }}>JPEG or PNG only. Recommended 3:2 ratio.</p>
    </div>
  );
};
