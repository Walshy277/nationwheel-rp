import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { mkBtn } from "../../lib/uiUtils";

export const AllianceFlagUploader = ({ allianceId, currentUrl, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();
  const upload = async (file) => {
    if (!file || !allianceId) return;
    if (!["image/jpeg","image/png"].includes(file.type)) {
      alert("Please upload a JPEG or PNG file.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `alliance-${allianceId}.${ext}`;
    const { error } = await supabase.storage.from("flags").upload(path, file, { upsert:true, contentType:file.type });
    if (error) alert(error.message);
    else {
      const { data } = supabase.storage.from("flags").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      const update = await supabase.from("alliances").update({ flag_url:url }).eq("id", allianceId);
      if (update.error) alert(update.error.message);
      else onUploaded(url);
    }
    setUploading(false);
  };
  return (
    <span>
      <input ref={ref} type="file" accept="image/jpeg,image/png" style={{ display:"none" }} onChange={e=>upload(e.target.files[0])} />
      <button onClick={()=>ref.current.click()} style={{ ...mkBtn("ghost"), minHeight:28, padding:"4px 8px", fontSize:10 }}>{uploading ? "Uploading" : currentUrl ? "Change Flag" : "Upload Flag"}</button>
    </span>
  );
};
