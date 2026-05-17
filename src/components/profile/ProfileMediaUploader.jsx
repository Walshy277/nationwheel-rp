import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { mkBtn, isMissingProfileMediaBucket, isMissingOptionalProfileSchema } from "../../lib/uiUtils";

export const ProfileMediaUploader = ({ profileId, field, currentUrl, label, onUploaded, ratio = "1 / 1" }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const upload = async (file) => {
    if (!file || !profileId) return;
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${profileId}/${field}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      alert(isMissingProfileMediaBucket(error)
        ? "Profile uploads are not enabled yet. Run supabase-profile-setup.sql in Supabase, then refresh the app."
        : error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    const update = await supabase.from("profiles").update({ [field]: url }).eq("id", profileId).select("*").single();
    if (update.error) alert(isMissingOptionalProfileSchema(update.error)
      ? "The upload worked, but the profile columns are not installed yet. Run supabase-profile-setup.sql in Supabase, then refresh."
      : update.error.message);
    else onUploaded(update.data);
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
      {currentUrl ? (
        <img src={currentUrl} alt={label} style={{ width:"100%", maxWidth:field==="avatar_url"?120:360, aspectRatio:ratio, objectFit:"cover", borderRadius:field==="avatar_url"?"50%":6, border:"1px solid rgba(246,193,50,0.2)" }} />
      ) : (
        <div style={{ width:field==="avatar_url"?120:"100%", maxWidth:field==="avatar_url"?120:360, aspectRatio:ratio, borderRadius:field==="avatar_url"?"50%":6, border:"1px dashed rgba(246,193,50,0.24)", background:"rgba(255,255,255,0.035)", display:"flex", alignItems:"center", justifyContent:"center", color:"#8fa0bd", fontSize:12 }}>{label}</div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} disabled={uploading} style={{ ...mkBtn("ghost"), alignSelf:"flex-start", fontSize:11 }}>
        {uploading ? "Uploading" : `Upload ${label}`}
      </button>
    </div>
  );
};
